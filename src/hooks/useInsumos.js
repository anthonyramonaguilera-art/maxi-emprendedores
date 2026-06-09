import { useState, useEffect, useCallback } from 'react';
import {
  fetchInsumosActivos,
  fetchInsumosArchivados,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  uploadInsumoImage,
} from '../services/insumosService';
import { addToast } from '../store/toastStore';
import { notificarStockBajo } from '../lib/maxiEventEmitter';
import { obtenerLimite } from '../store/suscripcionStore';

export default function useInsumos(userId, playSound) {
  const [insumos, setInsumos] = useState([]);
  const [archivados, setArchivados] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarInsumos = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    try {
      const [activos, arch] = await Promise.all([
        fetchInsumosActivos(userId),
        fetchInsumosArchivados(userId),
      ]);
      setInsumos(activos);
      setArchivados(arch);
    } catch (error) {
      addToast('Error al cargar insumos', 'error');
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    cargarInsumos();
  }, [cargarInsumos]);

  useEffect(() => {
    insumos.forEach((insumo) => {
      if (insumo.cantidad_actual <= 5) {
        notificarStockBajo(insumo.nombre);
      }
    });
  }, [insumos]);

  const guardarInsumo = async (data, imagenArchivo, modoEdicion) => {
    if (!data.nombre || !data.cantidad_actual || !data.costo_usd) {
      addToast('Completa todos los campos', 'error');
      return false;
    }

    // Verificar límite de insumos para plan gratuito
    if (!modoEdicion) {
      const limite = obtenerLimite('insumos');
      if (insumos.length >= limite) {
        addToast(`Has alcanzado el límite de ${limite} insumos del plan gratuito. Considera actualizar a Maxi Pro.`, 'error');
        return false;
      }
    }

    try {
      let imagenUrl = modoEdicion?.imagen_url || null;
      if (imagenArchivo) {
        imagenUrl = await uploadInsumoImage(userId, imagenArchivo);
      }

      const insumoData = { ...data, imagen_url: imagenUrl };

      if (modoEdicion) {
        await updateInsumo(modoEdicion.id, insumoData);
        addToast('Insumo actualizado', 'success');
      } else {
        await createInsumo({ ...insumoData, user_id: userId, archivado: false });
        addToast('Insumo creado', 'success');
        if (playSound) playSound('coin_drop');
      }
      await cargarInsumos();
      return true;
    } catch (error) {
      addToast('Error al guardar: ' + error.message, 'error');
      if (playSound) playSound('alert');
      return false;
    }
  };

  const eliminarInsumo = async (id) => {
    if (!window.confirm('¿Eliminar este insumo permanentemente?')) return;
    try {
      await deleteInsumo(id);
      await cargarInsumos();
      addToast('Insumo eliminado', 'info');
    } catch (error) {
      addToast('Error al eliminar', 'error');
    }
  };

  const agregarCantidad = async (insumo, cantidadExtra) => {
    const nuevaCantidad = insumo.cantidad_actual + cantidadExtra;
    await updateInsumo(insumo.id, { cantidad_actual: nuevaCantidad });
    addToast(`✅ Se agregaron ${cantidadExtra} ${insumo.unidad_medida} a ${insumo.nombre}`, 'success');
    if (playSound) playSound('coin_drop');
    await cargarInsumos();
  };

  const archivarInsumo = async (insumo) => {
    if (!window.confirm(`¿Archivar ${insumo.nombre}?`)) return;
    await updateInsumo(insumo.id, { archivado: true });
    addToast(`📦 ${insumo.nombre} archivado`, 'info');
    await cargarInsumos();
  };

  const restaurarInsumo = async (insumo) => {
    await updateInsumo(insumo.id, { archivado: false });
    addToast(`♻️ ${insumo.nombre} restaurado a la alacena`, 'success');
    await cargarInsumos();
    const toggleFavorito = async (insumo) => {
  const nuevoValor = !insumo.es_favorito;
  await toggleFavorito(insumo.id, nuevoValor);
  await cargarInsumos();
  addToast(nuevoValor ? '⭐ Favorito' : 'Favorito quitado', 'info');
};

const toggleFijado = async (insumo) => {
  const nuevoValor = !insumo.fijado;
  await toggleFijado(insumo.id, nuevoValor);
  await cargarInsumos();
  addToast(nuevoValor ? '📌 Fijado' : 'Fijado quitado', 'info');
};
  };

  return {
    insumos,
    archivados,
    cargando,
    guardarInsumo,
    eliminarInsumo,
    agregarCantidad,
    archivarInsumo,
    restaurarInsumo,
    recargar: cargarInsumos,
  
  
  
  
  }



  
  ;
}