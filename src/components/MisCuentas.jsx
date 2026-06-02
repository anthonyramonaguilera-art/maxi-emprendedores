import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, BookOpen, Plus, CheckCircle2, Loader2, X, AlertCircle, BarChart3, Minus, Plus as PlusIcon, ShoppingCart, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addToast } from '../store/toastStore';
import { notificarFiadoCobrado } from '../lib/maxiEventEmitter';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function MisCuentas({ usuario, tasaBcv, playSound }) {
  const [pestaña, setPestaña] = useState('caja');
  const [cargando, setCargando] = useState(false);

  const [ventas, setVentas] = useState([]);
  const [fiados, setFiados] = useState([]);
  const [productosNevera, setProductosNevera] = useState([]);

  const [datosGrafico, setDatosGrafico] = useState([]);
  const [cargandoGrafico, setCargandoGrafico] = useState(false);

  const [mostrarFormFiado, setMostrarFormFiado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [clienteFiado, setClienteFiado] = useState('');
  const [descripcionFiado, setDescripcionFiado] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  
  // Nuevo estado para productos seleccionados en el fiado
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [montoAdicionalManual, setMontoAdicionalManual] = useState('');

  useEffect(() => {
    cargarDatos();
    cargarProductos();
  }, [usuario, pestaña]);

  useEffect(() => {
    if (pestaña === 'caja' && usuario?.id) {
      cargarDatosGrafico();
    }
  }, [pestaña, usuario]);

  const cargarProductos = async () => {
    let currentUserId = usuario?.id;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }
    if (!currentUserId) return;
    const { data } = await supabase.from('productos').select('*').eq('user_id', currentUserId).gt('stock_actual', 0);
    if (data) setProductosNevera(data);
  };

  const cargarDatos = async () => {
    let currentUserId = usuario?.id;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }
    if (!currentUserId) return;

    setCargando(true);
    try {
      if (pestaña === 'caja') {
        const { data, error } = await supabase.from('ventas').select('*').eq('user_id', currentUserId);
        if (error) throw error;
        setVentas(data?.sort((a,b) => new Date(b.created_at || b.fecha_creacion) - new Date(a.created_at || a.fecha_creacion)) || []);
      } else {
        const { data: dataFiados, error: errorFiados } = await supabase.from('fiados').select('*').eq('user_id', currentUserId);
        if (errorFiados) throw errorFiados;
        setFiados(dataFiados?.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const cargarDatosGrafico = async () => {
    let currentUserId = usuario?.id;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }
    if (!currentUserId) return;

    setCargandoGrafico(true);
    try {
      const fechasUltimos7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        fechasUltimos7.push(`${year}-${month}-${day}`);
      }

      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 7);
      fechaInicio.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('ventas')
        .select('total_usd, created_at')
        .eq('user_id', currentUserId)
        .gte('created_at', fechaInicio.toISOString());

      if (error) throw error;

      const ventasPorDia = {};
      if (data) {
        data.forEach(v => {
          const fecha = new Date(v.created_at);
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          const clave = `${year}-${month}-${day}`;
          ventasPorDia[clave] = (ventasPorDia[clave] || 0) + parseFloat(v.total_usd);
        });
      }

      const datos = fechasUltimos7.map(dia => ({
        dia: dia.slice(5),
        total: parseFloat((ventasPorDia[dia] || 0).toFixed(2)),
        totalBs: parseFloat(((ventasPorDia[dia] || 0) * (tasaBcv || 1)).toFixed(2)),
      }));

      setDatosGrafico(datos);
    } catch (error) {
      console.error(error);
      addToast("No se pudieron cargar los datos del gráfico", "error");
    } finally {
      setCargandoGrafico(false);
    }
  };

  const totalCajaUsd = ventas.reduce((acc, v) => acc + (parseFloat(v.total_usd) || 0), 0);
  const totalCajaBs = totalCajaUsd * (tasaBcv || 1);

  const totalPorCobrarUsd = fiados.filter(f => f.estado === 'Pendiente').reduce((acc, f) => acc + ((parseFloat(f.monto_total || f.monto_usd) - (parseFloat(f.monto_abonado) || 0))), 0);
  const totalPorCobrarBs = totalPorCobrarUsd * (tasaBcv || 1);

  // Funciones para manejar productos seleccionados en el fiado
  const agregarProductoFiado = (producto) => {
    const existe = productosSeleccionados.find(p => p.id === producto.id);
    if (existe) {
      setProductosSeleccionados(productosSeleccionados.map(p =>
        p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
      ));
    } else {
      setProductosSeleccionados([...productosSeleccionados, { ...producto, cantidad: 1 }]);
    }
  };

  const quitarProductoFiado = (id) => {
    setProductosSeleccionados(productosSeleccionados.filter(p => p.id !== id));
  };

  const actualizarCantidadProductoFiado = (id, delta) => {
    setProductosSeleccionados(productosSeleccionados.map(p => {
      if (p.id === id) {
        const nuevaCant = p.cantidad + delta;
        if (nuevaCant <= 0) return null;
        return { ...p, cantidad: nuevaCant };
      }
      return p;
    }).filter(Boolean));
  };

  const calcularTotalProductosUsd = () => {
    return productosSeleccionados.reduce((acc, p) => acc + (p.precio_venta_usd * p.cantidad), 0);
  };

  const montoManual = parseFloat(montoAdicionalManual.toString().replace(',', '.')) || 0;
  const totalFiadoUsd = calcularTotalProductosUsd() + montoManual;

  const guardarFiado = async (e) => {
    e.preventDefault();
    if (!clienteFiado) {
      addToast('Ingresa el nombre del cliente', 'error');
      return;
    }
    if (totalFiadoUsd <= 0) {
      addToast('Debes seleccionar al menos un producto o agregar un monto manual', 'error');
      return;
    }

    setGuardando(true);
    try {
      let currentUserId = usuario?.id;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session.user.id;
      }

      // 1. Registrar el fiado principal
      const fechaVenc = fechaVencimiento ? new Date(fechaVencimiento).toISOString() : new Date(Date.now() + 7*86400000).toISOString();
      const { data: fiado, error: fiadoError } = await supabase
        .from('fiados')
        .insert({
          user_id: currentUserId,
          cliente: clienteFiado.trim(),
          monto_total: totalFiadoUsd,
          monto_usd: totalFiadoUsd,
          monto_abonado: 0,
          fecha_vencimiento: fechaVenc,
          descripcion: descripcionFiado || 'Venta a crédito',
          estado: 'Pendiente'
        })
        .select()
        .single();
      if (fiadoError) throw fiadoError;

      // 2. Por cada producto, descontar stock y registrar venta asociada al fiado
      for (const item of productosSeleccionados) {
        // Descontar stock
        const { data: prodActual } = await supabase
          .from('productos')
          .select('stock_actual')
          .eq('id', item.id)
          .single();
        const nuevoStock = (prodActual?.stock_actual || 0) - item.cantidad;
        if (nuevoStock < 0) throw new Error(`Stock insuficiente para ${item.nombre}`);
        await supabase
          .from('productos')
          .update({ stock_actual: nuevoStock })
          .eq('id', item.id);

        // Registrar venta (con referencia al fiado)
        await supabase.from('ventas').insert({
          user_id: currentUserId,
          producto_id: item.id,
          cantidad: item.cantidad,
          total_usd: item.precio_venta_usd * item.cantidad,
          total_bs: (item.precio_venta_usd * item.cantidad) * (tasaBcv || 1),
          tasa_bcv_momento: tasaBcv || 1,
          fiado_id: fiado.id  // Asegúrate de tener esta columna en la tabla ventas
        });
      }

      // Limpiar formulario
      setProductosSeleccionados([]);
      setMontoAdicionalManual('');
      setClienteFiado('');
      setDescripcionFiado('');
      setFechaVencimiento('');
      setMostrarFormFiado(false);
      await cargarDatos();
      await cargarProductos();
      addToast(`Fiado registrado por $${totalFiadoUsd.toFixed(2)}`, 'success');
      if (playSound) playSound('pencil_write');
    } catch (error) {
      addToast('Error: ' + error.message, 'error');
      if (playSound) playSound('alert');
    } finally {
      setGuardando(false);
    }
  };

  const marcarPagado = async (id, montoTotal) => {
    await supabase.from('fiados').update({ estado: 'Pagado' }).eq('id', id);
    await cargarDatos();
    addToast('Deuda liquidada', 'success');
    if (playSound) playSound('coin_drop');
    notificarFiadoCobrado({ monto: montoTotal });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-indigo-200 p-2 rounded-xl shadow-lg">
          <p className="text-xs font-bold text-slate-600">{`${label}`}</p>
          <p className="text-sm font-black text-indigo-600">${payload[0].value.toFixed(2)}</p>
          <p className="text-[10px] font-bold text-slate-400">{(payload[0].payload.totalBs).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</p>
        </div>
      );
    }
    return null;
  };

  if (cargando && ventas.length === 0 && fiados.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-4 font-sans pb-24">
      {/* Pestañas principales */}
      <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 shadow-inner">
        <button onClick={() => setPestaña('caja')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${pestaña === 'caja' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
          <Wallet className="w-5 h-5"/> Mi Caja
        </button>
        <button onClick={() => setPestaña('fiados')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${pestaña === 'fiados' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>
          <BookOpen className="w-5 h-5"/> Fiados
        </button>
      </div>

      {/* ================= MI CAJA ================= */}
      {pestaña === 'caja' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Wallet className="w-32 h-32"/></div>
            <p className="text-indigo-100 font-bold text-sm uppercase tracking-wider mb-1">Total Entradas (Ventas)</p>
            <h2 className="text-4xl font-black">${totalCajaUsd.toFixed(2)}</h2>
            <p className="text-indigo-200 font-bold mt-1">{totalCajaBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</p>
          </div>

          {/* GRÁFICO */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Últimos 7 días
            </h3>
            {cargandoGrafico ? (
              <div className="flex justify-center items-center h-[200px]"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
            ) : datosGrafico.length > 0 && datosGrafico.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={datosGrafico} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} width={40} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
                  <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-400">No hay datos suficientes</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">🛒 Historial de Despachos</h3>
            {ventas.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-4 italic">Aún no hay ventas registradas.</p>
            ) : (
              <div className="space-y-3">
                {ventas.slice(0, 10).map(v => (
                  <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Venta #{v.id.substring(0,4)}</p>
                      <p className="text-[10px] text-slate-400">{new Date(v.created_at || v.fecha_creacion).toLocaleDateString()}</p>
                    </div>
                    <span className="font-black text-emerald-600">+${(parseFloat(v.total_usd) || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ================= FIADOS (nuevo con selección de productos) ================= */}
      {pestaña === 'fiados' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-rose-50 rounded-3xl p-5 border border-rose-100 flex justify-between items-center">
            <div>
              <p className="text-rose-600 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Dinero en la calle</p>
              <h2 className="text-2xl font-black text-rose-700">${totalPorCobrarUsd.toFixed(2)}</h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-rose-400 block">{totalPorCobrarBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
            </div>
          </div>
          <div className="space-y-3">
            {fiados.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8 italic border-2 border-dashed border-slate-200 rounded-3xl">El cuaderno está limpio. ¡Nadie te debe!</p>
            ) : (
              fiados.map(f => {
                const montoTotal = parseFloat(f.monto_total || f.monto_usd || 0);
                const abonado = parseFloat(f.monto_abonado) || 0;
                const saldo = montoTotal - abonado;
                return (
                  <div key={f.id} className={`p-4 rounded-2xl border flex flex-col gap-3 ${f.estado === 'Pendiente' ? 'bg-white border-rose-100 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-slate-800">{f.cliente}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{f.descripcion}</p>
                        {f.fecha_vencimiento && <p className="text-[10px] text-slate-400 mt-1">Vence: {new Date(f.fecha_vencimiento).toLocaleDateString()}</p>}
                      </div>
                      <div className="text-right">
                        <span className={`block font-black text-lg leading-none ${f.estado === 'Pendiente' ? 'text-rose-600' : 'text-slate-500'}`}>${saldo.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-400">{(saldo * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                      </div>
                    </div>
                    {f.estado === 'Pendiente' && (
                      <button onClick={() => marcarPagado(f.id, saldo)} className="w-full bg-emerald-50 text-emerald-600 font-black text-sm py-2.5 rounded-xl border border-emerald-200 active:scale-95 transition-all flex justify-center items-center gap-2">
                        <CheckCircle2 className="w-4 h-4"/> LIQUIDAR DEUDA
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <button onClick={() => setMostrarFormFiado(true)} className="fixed bottom-20 right-4 w-14 h-14 bg-rose-500 text-white rounded-full shadow-lg shadow-rose-200 flex items-center justify-center active:scale-95 transition-transform z-30">
            <Plus className="w-8 h-8" />
          </button>
        </motion.div>
      )}

      {/* MODAL FIADO MEJORADO */}
      <AnimatePresence>
        {mostrarFormFiado && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarFormFiado(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8 max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><BookOpen className="text-rose-500"/> Registrar Fiado</h3>
                <button onClick={() => setMostrarFormFiado(false)} className="bg-slate-100 p-2 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={guardarFiado} className="space-y-4 overflow-y-auto">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Cliente</label>
                  <input type="text" required value={clienteFiado} onChange={e => setClienteFiado(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 font-black" placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Fecha de vencimiento</label>
                  <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Productos (descuentan stock)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {productosNevera.map(p => (
                      <button key={p.id} type="button" onClick={() => agregarProductoFiado(p)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black px-3 py-2 rounded-xl">
                        + {p.nombre} (${p.precio_venta_usd.toFixed(2)})
                      </button>
                    ))}
                  </div>
                  {productosSeleccionados.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                      {productosSeleccionados.map(p => (
                        <div key={p.id} className="flex justify-between items-center">
                          <span className="text-sm font-bold">{p.nombre}</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => actualizarCantidadProductoFiado(p.id, -1)} className="p-1 bg-white rounded-full shadow"><Minus className="w-4 h-4"/></button>
                            <span className="w-8 text-center font-black">{p.cantidad}</span>
                            <button type="button" onClick={() => actualizarCantidadProductoFiado(p.id, 1)} className="p-1 bg-white rounded-full shadow"><PlusIcon className="w-4 h-4"/></button>
                            <button type="button" onClick={() => quitarProductoFiado(p.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right text-emerald-600 font-black">Subtotal: ${calcularTotalProductosUsd().toFixed(2)}</div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Monto adicional (manual)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-rose-400 font-bold">$</span>
                    <input type="text" inputMode="decimal" value={montoAdicionalManual} onChange={e => setMontoAdicionalManual(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-rose-500 font-black" placeholder="0.00" />
                  </div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl text-center">
                  <p className="text-xs font-bold text-rose-600 uppercase">Total a deber</p>
                  <p className="text-2xl font-black text-rose-700">${totalFiadoUsd.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{(totalFiadoUsd * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nota opcional</label>
                  <input type="text" value={descripcionFiado} onChange={e => setDescripcionFiado(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" placeholder="Ej: Pagará en dos quincenas" />
                </div>
                <button type="submit" disabled={guardando} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2">
                  {guardando ? <Loader2 className="animate-spin w-6 h-6"/> : <ShoppingCart className="w-5 h-5"/>}
                  REGISTRAR FIADO
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}