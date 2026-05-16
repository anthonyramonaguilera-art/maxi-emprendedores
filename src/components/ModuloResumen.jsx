import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, DollarSign, Package, Activity, Loader2, Calendar, TrendingDown, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ModuloResumen({ usuario }) {
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [productosMap, setProductosMap] = useState({});
  const [cargando, setCargando] = useState(true);
  const [tasaBcv, setTasaBcv] = useState(null);

  useEffect(() => {
    const inicializar = async () => {
      try {
        const resTasa = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const dataTasa = await resTasa.json();
        setTasaBcv(dataTasa.promedio);
      } catch (e) { setTasaBcv(500); }

      if (usuario?.id) cargarEstadisticas();
    };
    inicializar();
  }, [usuario]);

  const cargarEstadisticas = async () => {
    setCargando(true);
    
    // Traemos Ventas, Productos y Gastos al mismo tiempo
    const [resVentas, resProductos, resGastos] = await Promise.all([
      supabase.from('ventas').select('*').eq('user_id', usuario.id).order('fecha', { ascending: false }),
      supabase.from('productos').select('id, nombre').eq('user_id', usuario.id),
      supabase.from('gastos').select('*').eq('user_id', usuario.id)
    ]);

    const mapa = {};
    if (resProductos.data) {
      resProductos.data.forEach(p => mapa[p.id] = p.nombre);
    }
    
    setProductosMap(mapa);
    if (resVentas.data) setVentas(resVentas.data);
    if (resGastos.data) setGastos(resGastos.data);
    
    setCargando(false);
  };

  // --- MATEMÁTICAS DE NEGOCIO (EL CORAZÓN DEL ERP) ---
  const ingresosTotalesUsd = ventas.reduce((acc, v) => acc + parseFloat(v.total_usd), 0);
  const gastosTotalesUsd = gastos.reduce((acc, g) => acc + parseFloat(g.monto_usd), 0);
  
  // LA GANANCIA REAL
  const gananciaNetaUsd = ingresosTotalesUsd - gastosTotalesUsd;
  
  const productosVendidos = ventas.reduce((acc, v) => acc + parseInt(v.cantidad), 0);
  const ventasRecientes = ventas.slice(0, 5);

  if (cargando) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-blue-600"/></div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-600"/> Rendimiento del Negocio
          </h2>
          <p className="text-slate-500">Análisis financiero en tiempo real de tus ingresos y egresos.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 font-bold text-slate-700">
          BCV: {tasaBcv || '...'} Bs
        </div>
      </header>

      {/* TARJETAS DE MÉTRICAS (KPIs FINANCIEROS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* INGRESOS BRUTOS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-green-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-24 h-24 text-green-500"/></div>
          <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500"/> Ingresos Brutos</h3>
          <p className="text-4xl font-black text-slate-800">${ingresosTotalesUsd.toFixed(2)}</p>
          <p className="text-sm font-bold text-slate-400 mt-1">{tasaBcv ? (ingresosTotalesUsd * tasaBcv).toLocaleString('es-VE', {minimumFractionDigits: 2}) : '...'} Bs</p>
        </motion.div>

        {/* GASTOS OPERATIVOS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-red-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingDown className="w-24 h-24 text-red-500"/></div>
          <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500"/> Gastos Operativos</h3>
          <p className="text-4xl font-black text-slate-800">${gastosTotalesUsd.toFixed(2)}</p>
          <p className="text-sm font-bold text-slate-400 mt-1">{tasaBcv ? (gastosTotalesUsd * tasaBcv).toLocaleString('es-VE', {minimumFractionDigits: 2}) : '...'} Bs</p>
        </motion.div>

        {/* GANANCIA NETA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-blue-600 p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-24 h-24 text-white"/></div>
          <h3 className="text-sm font-bold text-blue-200 mb-2 uppercase tracking-wider flex items-center gap-2"><Wallet className="w-4 h-4"/> Ganancia Neta</h3>
          <p className="text-4xl font-black text-white">${gananciaNetaUsd.toFixed(2)}</p>
          <p className="text-sm font-bold text-blue-300 mt-1">{tasaBcv ? (gananciaNetaUsd * tasaBcv).toLocaleString('es-VE', {minimumFractionDigits: 2}) : '...'} Bs</p>
        </motion.div>

      </div>

      {/* HISTORIAL RECIENTE DE VENTAS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500"/> Últimas Ventas ({productosVendidos} postres despachados)
          </h3>
        </div>
        
        {ventas.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            Aún no has registrado ninguna venta. ¡Ve al Punto de Venta para empezar!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-slate-400 bg-white border-b border-slate-100">
                  <th className="px-6 py-4 font-bold">Fecha y Hora</th>
                  <th className="px-6 py-4 font-bold">Producto</th>
                  <th className="px-6 py-4 font-bold text-center">Cant.</th>
                  <th className="px-6 py-4 font-bold text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ventasRecientes.map((v) => {
                  const fecha = new Date(v.fecha).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
                  return (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">{fecha}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{productosMap[v.producto_id] || 'Producto Desconocido'}</td>
                      <td className="px-6 py-4 text-sm font-black text-blue-600 text-center bg-blue-50/50">{v.cantidad}</td>
                      <td className="px-6 py-4 font-black text-green-600 text-right">${parseFloat(v.total_usd).toFixed(2)}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}