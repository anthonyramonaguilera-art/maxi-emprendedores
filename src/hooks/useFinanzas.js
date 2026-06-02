import { useState, useEffect, useCallback } from 'react';
import {
  fetchVentas,
  fetchVentasUltimos7Dias,
  fetchFiados,
  fetchProductosConStock,
  crearFiado,
  marcarFiadoPagado,
  registrarVentaFiado,
  descontarStockProducto,
} from '../services/finanzasService';
import { addToast } from '../store/toastStore';
import { notificarFiadoCobrado } from '../lib/maxiEventEmitter';

export default function useFinanzas(userId, tasaBcv, playSound) {
  // Datos principales
  const [ventas, setVentas] = useState([]);
  const [fiados, setFiados] = useState([]);
  const [productosNevera, setProductosNevera] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Gráfico
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [cargandoGrafico, setCargandoGrafico] = useState(false);

  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    try {
      const [ventasData, fiadosData, productosData] = await Promise.all([
        fetchVentas(userId),
        fetchFiados(userId),
        fetchProductosConStock(userId),
      ]);
      setVentas(ventasData);
      setFiados(fiadosData);
      setProductosNevera(productosData);
    } catch (error) {
      addToast('Error al cargar datos financieros', 'error');
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cargar datos del gráfico
  const cargarDatosGrafico = useCallback(async () => {
    if (!userId) return;
    setCargandoGrafico(true);
    try {
      const data = await fetchVentasUltimos7Dias(userId);

      // Generar las fechas de los últimos 7 días
      const fechasUltimos7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        fechasUltimos7.push(`${year}-${month}-${day}`);
      }

      // Agrupar por día
      const ventasPorDia = {};
      data.forEach(v => {
        const fecha = new Date(v.created_at);
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const clave = `${year}-${month}-${day}`;
        ventasPorDia[clave] = (ventasPorDia[clave] || 0) + parseFloat(v.total_usd);
      });

      const datos = fechasUltimos7.map(dia => ({
        dia: dia.slice(5), // "MM-DD"
        total: parseFloat((ventasPorDia[dia] || 0).toFixed(2)),
        totalBs: parseFloat(((ventasPorDia[dia] || 0) * (tasaBcv || 1)).toFixed(2)),
      }));

      setDatosGrafico(datos);
    } catch (error) {
      addToast('No se pudieron cargar los datos del gráfico', 'error');
    } finally {
      setCargandoGrafico(false);
    }
  }, [userId, tasaBcv]);

  // Cargar gráfico cuando sea necesario
  useEffect(() => {
    cargarDatosGrafico();
  }, [cargarDatosGrafico]);

  // Totales calculados
  const totalCajaUsd = ventas.reduce((acc, v) => acc + (parseFloat(v.total_usd) || 0), 0);
  const totalCajaBs = totalCajaUsd * (tasaBcv || 1);

  const totalPorCobrarUsd = fiados
    .filter(f => f.estado === 'Pendiente')
    .reduce((acc, f) => acc + ((parseFloat(f.monto_total || f.monto_usd) - (parseFloat(f.monto_abonado) || 0))), 0);
  const totalPorCobrarBs = totalPorCobrarUsd * (tasaBcv || 1);

  // Operación: guardar un nuevo fiado
  const guardarFiado = async (datos) => {
    const {
      cliente, descripcion, fechaVencimiento, productosSeleccionados, montoAdicionalManual,
    } = datos;

    if (!cliente) {
      addToast('Ingresa el nombre del cliente', 'error');
      return false;
    }

    const totalProductosUsd = productosSeleccionados.reduce((acc, p) => acc + (p.precio_venta_usd * p.cantidad), 0);
    const montoManual = parseFloat(montoAdicionalManual.toString().replace(',', '.')) || 0;
    const totalFiadoUsd = totalProductosUsd + montoManual;

    if (totalFiadoUsd <= 0) {
      addToast('Debes seleccionar al menos un producto o agregar un monto manual', 'error');
      return false;
    }

    try {
      const fechaVenc = fechaVencimiento
        ? new Date(fechaVencimiento).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString();

      // 1. Crear el fiado
      const fiado = await crearFiado({
        user_id: userId,
        cliente: cliente.trim(),
        monto_total: totalFiadoUsd,
        monto_usd: totalFiadoUsd,
        monto_abonado: 0,
        fecha_vencimiento: fechaVenc,
        descripcion: descripcion || 'Venta a crédito',
        estado: 'Pendiente',
      });

      // 2. Por cada producto, descontar stock y registrar venta asociada
      for (const item of productosSeleccionados) {
        const nuevoStock = item.stock_actual - item.cantidad;
        if (nuevoStock < 0) throw new Error(`Stock insuficiente para ${item.nombre}`);
        await descontarStockProducto(item.id, nuevoStock);

        await registrarVentaFiado({
          user_id: userId,
          producto_id: item.id,
          cantidad: item.cantidad,
          total_usd: item.precio_venta_usd * item.cantidad,
          total_bs: (item.precio_venta_usd * item.cantidad) * (tasaBcv || 1),
          tasa_bcv_momento: tasaBcv || 1,
          fiado_id: fiado.id,
        });
      }

      await cargarDatos();
      addToast(`Fiado registrado por $${totalFiadoUsd.toFixed(2)}`, 'success');
      if (playSound) playSound('pencil_write');
      return true;
    } catch (error) {
      addToast('Error al registrar fiado: ' + error.message, 'error');
      if (playSound) playSound('alert');
      return false;
    }
  };

  // Operación: marcar como pagado
  const pagarFiado = async (fiado) => {
    try {
      await marcarFiadoPagado(fiado.id);
      await cargarDatos();
      const saldo = (parseFloat(fiado.monto_total || fiado.monto_usd) - (parseFloat(fiado.monto_abonado) || 0));
      addToast('Deuda liquidada', 'success');
      if (playSound) playSound('coin_drop');
      notificarFiadoCobrado({ monto: saldo });
    } catch (error) {
      addToast('Error al liquidar deuda', 'error');
    }
  };

  return {
    ventas,
    fiados,
    productosNevera,
    cargando,
    datosGrafico,
    cargandoGrafico,
    totalCajaUsd,
    totalCajaBs,
    totalPorCobrarUsd,
    totalPorCobrarBs,
    guardarFiado,
    pagarFiado,
    recargar: cargarDatos,
  };
}