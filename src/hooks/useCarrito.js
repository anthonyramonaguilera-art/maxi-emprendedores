import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { addToast } from '../store/toastStore';
import { incrementarRacha } from '../store/rachaStore';
import { notificarVenta, notificarPrimeraVentaDelDia } from '../lib/maxiEventEmitter';
import { desbloquearLogro, verificarLogrosRacha } from '../store/logrosStore';
import { updateProducto, crearVenta } from '../services/productosService';

export default function useCarrito(userId, tasaBcv, playSound) {
  const [carrito, setCarrito] = useState([]);
  const [despachando, setDespachando] = useState(false);
  const [exitoVisual, setExitoVisual] = useState(false);

  const agregarAlCarrito = useCallback((producto) => {
    if (producto.stock_actual <= 0) return;
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        if (existe.cantidadSeleccionada >= producto.stock_actual) return prev;
        return prev.map(i => i.id === producto.id ? { ...i, cantidadSeleccionada: i.cantidadSeleccionada + 1 } : i);
      }
      return [...prev, { ...producto, cantidadSeleccionada: 1 }];
    });
  }, []);

  const modificarCantidad = (id, delta) => {
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

  const finalizarDespacho = async () => {
    setDespachando(true);
    try {
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
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
        await updateProducto(item.id, { stock_actual: item.stock_actual - item.cantidadSeleccionada });
      }

      // Logros y notificaciones
      const { count: totalVentasGlobal } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (totalVentasGlobal === 1) desbloquearLogro('primera_venta');

      incrementarRacha('ventas');
      const rachas = (await import('../store/rachaStore')).rachasStore.get();
      const rachaVentas = rachas.ventas?.racha || 0;
      verificarLogrosRacha(rachaVentas);
      if ([3, 7, 14, 30].includes(rachaVentas)) {
        import('../lib/maxiEventEmitter').then(({ notificarRachaAlcanzada }) => notificarRachaAlcanzada(rachaVentas));
      }
      if (!ventasHoyCount || ventasHoyCount === 0) {
        notificarPrimeraVentaDelDia();
      }

      const totalUsd = carrito.reduce((acc, i) => acc + (i.precio_venta_usd * i.cantidadSeleccionada), 0);
      notificarVenta({ totalUsd });
      if (playSound) playSound('cash_register');
      addToast(`💰 Venta realizada: $${totalUsd.toFixed(2)}`, 'success');

      setCarrito([]);
      setExitoVisual(true);
      setTimeout(() => setExitoVisual(false), 2000);
      return true;
    } catch (e) {
      addToast('Error al despachar: ' + e.message, 'error');
      if (playSound) playSound('alert');
      return false;
    } finally {
      setDespachando(false);
    }
  };

  const totalUsd = carrito.reduce((acc, i) => acc + (i.precio_venta_usd * i.cantidadSeleccionada), 0);
  const totalBs = totalUsd * (tasaBcv || 1);

  return {
    carrito,
    despachando,
    exitoVisual,
    totalUsd,
    totalBs,
    agregarAlCarrito,
    modificarCantidad,
    vaciarCarrito,
    finalizarDespacho,
  };
}