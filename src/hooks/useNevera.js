import { useState, useEffect, useCallback } from 'react';
import {
  fetchProductos,
  updateProducto,
  deleteProducto,
  uploadProductoImage,
  crearVenta,
} from '../services/productosService';
import { supabase } from '../lib/supabase';
import { addToast } from '../store/toastStore';
import { incrementarRacha } from '../store/rachaStore';
import { notificarVenta } from '../lib/maxiEventEmitter';
import { desbloquearLogro, verificarLogrosRacha } from '../store/logrosStore';

export default function useNevera(userId, tasaBcv, playSound) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [carrito, setCarrito] = useState([]);
  const [despachando, setDespachando] = useState(false);
  const [exitoVisual, setExitoVisual] = useState(false);

  const [modoSeleccionMultiple, setModoSeleccionMultiple] = useState(false);
  const [seleccionados, setSeleccionados] = useState({});

  const cargarProductos = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    try {
      const data = await fetchProductos(userId);
      setProductos(data);
    } catch (err) {
      addToast('Error al cargar productos', 'error');
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // Carrito normal
  const agregarAlCarrito = (producto) => {
    if (producto.stock_actual <= 0) return;
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        if (existe.cantidadSeleccionada >= producto.stock_actual) return prev;
        return prev.map(i => i.id === producto.id ? { ...i, cantidadSeleccionada: i.cantidadSeleccionada + 1 } : i);
      }
      return [...prev, { ...producto, cantidadSeleccionada: 1 }];
    });
  };

  const modificarCantidadCarrito = (id, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.id === id) {
        const nuevaCant = item.cantidadSeleccionada + delta;
        if (nuevaCant <= 0) return null;
        if (nuevaCant > item.stock_actual) return item;
        return { ...item, cantidadSeleccionada: nuevaCant };
      }
      return item;
    }).filter(Boolean));
  };

  const vaciarCarrito = () => setCarrito([]);

  // Selección múltiple
  const toggleSeleccion = (producto) => {
    setSeleccionados(prev => {
      const newState = { ...prev };
      if (newState[producto.id]) {
        delete newState[producto.id];
      } else {
        newState[producto.id] = 1;
      }
      return newState;
    });
  };

  const actualizarCantidadSeleccion = (id, cantidad) => {
    const cant = parseInt(cantidad) || 0;
    if (cant <= 0) {
      setSeleccionados(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } else {
      setSeleccionados(prev => ({ ...prev, [id]: cant }));
    }
  };

  const añadirSeleccionadosAlCarrito = () => {
    let agregados = 0;
    for (const [id, cantidad] of Object.entries(seleccionados)) {
      const producto = productos.find(p => p.id === id);
      if (producto && cantidad > 0 && cantidad <= producto.stock_actual) {
        setCarrito(prev => {
          const existe = prev.find(i => i.id === id);
          if (existe) {
            return prev.map(i => i.id === id ? { ...i, cantidadSeleccionada: i.cantidadSeleccionada + cantidad } : i);
          }
          return [...prev, { ...producto, cantidadSeleccionada: cantidad }];
        });
        agregados++;
      }
    }
    if (agregados > 0) {
      addToast(`${agregados} producto(s) añadido(s) al carrito`, 'success');
    }
    setSeleccionados({});
    setModoSeleccionMultiple(false);
  };

  const cancelarSeleccionMultiple = () => {
    setSeleccionados({});
    setModoSeleccionMultiple(false);
  };

  // Checkout con detección de eventos importantes y logros
  const finalizarDespacho = async () => {
    setDespachando(true);
    try {
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();

      // Verificar si es la primera venta del día
      const { count: ventasHoyCount } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', inicioHoy);

      for (const item of carrito) {
        const venta = {
          user_id: userId,
          producto_id: item.id,
          cantidad: item.cantidadSeleccionada,
          total_usd: item.precio_venta_usd * item.cantidadSeleccionada,
          total_bs: (item.precio_venta_usd * item.cantidadSeleccionada) * (tasaBcv || 1),
          tasa_bcv_momento: tasaBcv || 1,
        };
        await crearVenta(venta);
        const nuevoStock = item.stock_actual - item.cantidadSeleccionada;
        await updateProducto(item.id, { stock_actual: nuevoStock });

        // Verificar producto estrella (más de 5 ventas hoy)
        const { count: countProducto } = await supabase
          .from('ventas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('producto_id', item.id)
          .gte('created_at', inicioHoy);
        const totalVentasProducto = (countProducto || 0) + 1; // contar la actual
        if (totalVentasProducto === 6) { // justo al superar 5
          import('../lib/maxiEventEmitter').then(({ notificarProductoEstrella }) =>
            notificarProductoEstrella(item.nombre)
          );
        }
      }

      // 🏆 LOGRO: Primera venta (global)
      const { count: totalVentasGlobal } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (totalVentasGlobal === 1) {
        desbloquearLogro('primera_venta');
      }

      setCarrito([]);
      setExitoVisual(true);
      setTimeout(() => setExitoVisual(false), 2000);
      await cargarProductos();

      // Actualizar racha de ventas
      incrementarRacha('ventas');
      const rachas = (await import('../store/rachaStore')).rachasStore.get();
      const rachaVentas = rachas.ventas?.racha || 0;

      // 🏆 LOGRO: Rachas
      verificarLogrosRacha(rachaVentas);

      // Notificar eventos a Maxi
      if ([3, 7, 14, 30].includes(rachaVentas)) {
        import('../lib/maxiEventEmitter').then(({ notificarRachaAlcanzada }) =>
          notificarRachaAlcanzada(rachaVentas)
        );
      }

      // Primera venta del día
      if (!ventasHoyCount || ventasHoyCount === 0) {
        import('../lib/maxiEventEmitter').then(({ notificarPrimeraVentaDelDia }) =>
          notificarPrimeraVentaDelDia()
        );
      }

      const totalUsd = carrito.reduce((acc, i) => acc + (i.precio_venta_usd * i.cantidadSeleccionada), 0);
      notificarVenta({ totalUsd });
      if (playSound) playSound('cash_register');
      addToast(`💰 Venta realizada: $${totalUsd.toFixed(2)}`, 'success');
    } catch (e) {
      addToast('Error al despachar: ' + e.message, 'error');
      if (playSound) playSound('alert');
    } finally {
      setDespachando(false);
    }
  };

  // Operaciones CRUD
  const guardarEdicionProducto = async (id, updates, imagenArchivo) => {
    try {
      if (imagenArchivo) {
        updates.imagen_url = await uploadProductoImage(userId, imagenArchivo);
      }
      await updateProducto(id, updates);
      addToast('Producto actualizado', 'success');
      await cargarProductos();
      return true;
    } catch (err) {
      addToast('Error al actualizar: ' + err.message, 'error');
      return false;
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProducto(id);
      addToast('Producto eliminado', 'success');
      await cargarProductos();
    } catch (err) {
      addToast('Error al eliminar: ' + err.message, 'error');
    }
  };

  const moverCategoria = async (producto, nuevaCategoria) => {
    try {
      await updateProducto(producto.id, { categoria: nuevaCategoria === 'general' ? null : nuevaCategoria });
      addToast(`✅ ${producto.nombre} movido a ${nuevaCategoria}`, 'success');
      await cargarProductos();
      if (playSound) playSound('coin_drop');
    } catch (err) {
      addToast('Error al mover: ' + err.message, 'error');
    }
  };

  const totalUsd = carrito.reduce((acc, i) => acc + (i.precio_venta_usd * i.cantidadSeleccionada), 0);
  const totalBs = totalUsd * (tasaBcv || 1);

  const getProductosPorCategoria = (categoria) => {
    return productos.filter(p => (p.categoria || 'general') === categoria);
  };

  return {
    productos,
    cargando,
    carrito,
    despachando,
    exitoVisual,
    modoSeleccionMultiple,
    setModoSeleccionMultiple,
    seleccionados,
    totalUsd,
    totalBs,
    agregarAlCarrito,
    modificarCantidadCarrito,
    vaciarCarrito,
    toggleSeleccion,
    actualizarCantidadSeleccion,
    añadirSeleccionadosAlCarrito,
    cancelarSeleccionMultiple,
    finalizarDespacho,
    guardarEdicionProducto,
    eliminarProducto,
    moverCategoria,
    getProductosPorCategoria,
    recargar: cargarProductos,
  };
}