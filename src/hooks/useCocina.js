import { useState, useEffect, useCallback } from 'react';
import {
  fetchInsumosDisponibles,
  descontarInsumo,
  crearProducto,
  crearReceta,
  agregarIngredienteReceta,
  fetchRecetas,
  fetchIngredientesReceta,
  eliminarReceta,
} from '../services/cocinaService';
import { addToast } from '../store/toastStore';
import { incrementarRacha } from '../store/rachaStore';
import { notificarCocina } from '../lib/maxiEventEmitter';
import { desbloquearLogro } from '../store/logrosStore';
import { supabase } from '../lib/supabase';
import { obtenerLimite } from '../store/suscripcionStore';

export default function useCocina(userId, tasaBcv, playSound) {
  const [alacena, setAlacena] = useState([]);
  const [cargandoAlacena, setCargandoAlacena] = useState(true);

  const [recetas, setRecetas] = useState([]);
  const [cargandoRecetas, setCargandoRecetas] = useState(false);

  const [ingredientesOlla, setIngredientesOlla] = useState([]);

  const cargarAlacena = useCallback(async () => {
    if (!userId) return;
    setCargandoAlacena(true);
    try {
      const data = await fetchInsumosDisponibles(userId);
      setAlacena(data);
    } catch (error) {
      addToast('No se pudieron cargar los insumos', 'error');
    } finally {
      setCargandoAlacena(false);
    }
  }, [userId]);

  const cargarRecetas = useCallback(async () => {
    if (!userId) return;
    setCargandoRecetas(true);
    try {
      const data = await fetchRecetas(userId);
      setRecetas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoRecetas(false);
    }
  }, [userId]);

  useEffect(() => {
    cargarAlacena();
    cargarRecetas();
  }, [cargarAlacena, cargarRecetas]);

  const agregarALaOlla = (insumo) => {
    if (insumo.cantidad_actual <= 0) {
      addToast(`❌ No tienes suficiente ${insumo.nombre}`, 'error');
      if (playSound) playSound('alert');
      return;
    }
    const existe = ingredientesOlla.find(i => i.insumo.id === insumo.id);
    if (existe) {
      addToast(`⚠️ ${insumo.nombre} ya está en la olla`, 'info');
    } else {
      setIngredientesOlla([...ingredientesOlla, { insumo, cantidadUsada: '' }]);
    }
  };

  const actualizarCantidadUsada = (id, cantidad) => {
    const item = ingredientesOlla.find(i => i.insumo.id === id);
    if (item) {
      const maximo = item.insumo.cantidad_actual;
      let nuevaCantidad = parseFloat(cantidad.toString().replace(',', '.'));
      if (isNaN(nuevaCantidad)) nuevaCantidad = 0;
      if (nuevaCantidad > maximo) {
        addToast(`⚠️ Solo tienes ${maximo} ${item.insumo.unidad_medida} de ${item.insumo.nombre}.`, 'error');
        if (playSound) playSound('alert');
        return;
      }
    }
    setIngredientesOlla(prev => prev.map(item =>
      item.insumo.id === id ? { ...item, cantidadUsada: cantidad } : item
    ));
  };

  const sacarDeLaOlla = (id) => {
    setIngredientesOlla(prev => prev.filter(item => item.insumo.id !== id));
  };

  const costoIngredientesUsd = ingredientesOlla.reduce((acc, item) => {
    const cant = parseFloat(item.cantidadUsada.toString().replace(',', '.')) || 0;
    const costoUnitario = item.insumo.costo_usd / item.insumo.cantidad_actual;
    return acc + (costoUnitario * cant);
  }, 0);

  const enviarANevera = async (datos) => {
    const {
      nombreProducto, rendimiento, precioVentaUsd, tipoPreparacion,
      tempCongelado, tiempoCongelado, requierePalito, guardarComoReceta, nombreReceta,
    } = datos;

    if (!nombreProducto || !rendimiento || !precioVentaUsd) {
      addToast("Faltan datos: nombre, rendimiento y precio", 'error');
      return false;
    }

    try {
      for (const item of ingredientesOlla) {
        const cantUsada = parseFloat(item.cantidadUsada.toString().replace(',', '.')) || 0;
        const stockRestante = item.insumo.cantidad_actual - cantUsada;
        await descontarInsumo(item.insumo.id, stockRestante > 0 ? stockRestante : 0);
      }

      const categoria = tipoPreparacion === 'congelador' ? 'congelador' : (tipoPreparacion === 'olla' ? 'frio' : 'mostrador');
      const productoData = {
        user_id: userId,
        nombre: nombreProducto,
        precio_venta_usd: parseFloat(precioVentaUsd.toString().replace(',', '.')),
        stock_actual: parseInt(rendimiento),
        categoria,
      };
      if (tipoPreparacion === 'congelador') {
        productoData.temp_congelado = tempCongelado || null;
        productoData.tiempo_congelado = tiempoCongelado || null;
      
      
        productoData.requiere_palito = requierePalito;
      }
      const { count: totalProductos } = await supabase
  .from('productos')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);
const limiteProductos = obtenerLimite('productos');
if (totalProductos >= limiteProductos) {
  addToast(`Has alcanzado el límite de ${limiteProductos} productos del plan gratuito. Considera actualizar a Maxi Pro.`, 'error');
  return false;
}


      
      await crearProducto(productoData);

      // Guardar receta si se marcó la opción
      if (guardarComoReceta && nombreReceta.trim()) {
        const receta = await crearReceta({ user_id: userId, nombre: nombreReceta.trim(), rendimiento: parseInt(rendimiento) });
        for (const item of ingredientesOlla) {
          const cantUsada = parseFloat(item.cantidadUsada.toString().replace(',', '.')) || 0;
          await agregarIngredienteReceta(receta.id, item.insumo.id, cantUsada, item.insumo.unidad_medida);
        }
        addToast(`📖 Receta "${nombreReceta}" guardada.`, 'success');
        cargarRecetas();
      }

      // 🏆 LOGRO: Primera receta (global)
      const { count: totalRecetas } = await supabase
        .from('recetas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (totalRecetas === 1) {
        desbloquearLogro('primera_receta');
      }

      setIngredientesOlla([]);
      await cargarAlacena();

      incrementarRacha('cocina');
      // Notificar racha de cocina si alcanza hitos
      const rachas = (await import('../store/rachaStore')).rachasStore.get();
      const rachaCocina = rachas.cocina?.racha || 0;
      if ([3, 7, 14, 30].includes(rachaCocina)) {
        import('../lib/maxiEventEmitter').then(({ notificarRachaAlcanzada }) =>
          notificarRachaAlcanzada(rachaCocina)
        );
      }
      notificarCocina({ nombre: nombreProducto });
      if (playSound) playSound('kitchen_bell');
      addToast("¡Éxito! Producto guardado en Mi Nevera.", 'success');
      return true;
    } catch (error) {
      addToast("Error al guardar: " + error.message, 'error');
      if (playSound) playSound('alert');
      return false;
    }
  };

  const cargarRecetaCompleta = async (recetaId) => {
    try {
      const ingredientesData = await fetchIngredientesReceta(recetaId);
      const nuevosIngredientes = [];
      for (const ing of ingredientesData) {
        const insumo = alacena.find(i => i.id === ing.insumo_id);
        if (!insumo) {
          addToast(`El insumo necesario ya no existe en tu alacena.`, 'error');
          continue;
        }
        nuevosIngredientes.push({
          insumo,
          cantidadUsada: ing.cantidad_necesaria.toString()
        });
      }
      setIngredientesOlla(nuevosIngredientes);
      addToast(`Receta cargada. Revisa los ingredientes.`, 'success');
    } catch (error) {
      addToast("Error al cargar receta: " + error.message, 'error');
    }
  };

  const handleEliminarReceta = async (recetaId) => {
    if (!window.confirm('¿Eliminar esta receta?')) return;
    try {
      await eliminarReceta(recetaId);
      addToast('Receta eliminada', 'success');
      cargarRecetas();
    } catch (error) {
      addToast('Error al eliminar receta', 'error');
    }
  };

  return {
    alacena,
    cargandoAlacena,
    recetas,
    cargandoRecetas,
    ingredientesOlla,
    costoIngredientesUsd,
    agregarALaOlla,
    actualizarCantidadUsada,
    sacarDeLaOlla,
    enviarANevera,
    cargarRecetaCompleta,
    handleEliminarReceta,
    recargarAlacena: cargarAlacena,
  };
}