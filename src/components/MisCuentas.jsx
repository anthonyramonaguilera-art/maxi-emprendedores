import React, { useState } from 'react';
import { Wallet, BookOpen, Plus, CheckCircle2, Loader2, X, AlertCircle, BarChart3, Minus, Plus as PlusIcon, ShoppingCart, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useFinanzas from '../hooks/useFinanzas';
import { supabase } from '../lib/supabase';
import { addToast } from '../store/toastStore';
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
  const {
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
  } = useFinanzas(usuario?.id, tasaBcv, playSound);

  const [pestaña, setPestaña] = useState('caja');
  const [mostrarFormFiado, setMostrarFormFiado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [clienteFiado, setClienteFiado] = useState('');
  const [descripcionFiado, setDescripcionFiado] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [montoAdicionalManual, setMontoAdicionalManual] = useState('');

  // Abonos parciales
  const [abonoInput, setAbonoInput] = useState({});

  const agregarProductoFiado = (producto) => {
    const existe = productosSeleccionados.find(p => p.id === producto.id);
    if (existe) {
      setProductosSeleccionados(prev => prev.map(p =>
        p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
      ));
    } else {
      setProductosSeleccionados(prev => [...prev, { ...producto, cantidad: 1 }]);
    }
  };

  const quitarProductoFiado = (id) => {
    setProductosSeleccionados(prev => prev.filter(p => p.id !== id));
  };

  const actualizarCantidadProductoFiado = (id, delta) => {
    setProductosSeleccionados(prev => prev.map(p => {
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

  const handleGuardarFiado = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const ok = await guardarFiado({
      cliente: clienteFiado,
      descripcion: descripcionFiado,
      fechaVencimiento,
      productosSeleccionados,
      montoAdicionalManual,
    });
    if (ok) {
      setClienteFiado('');
      setDescripcionFiado('');
      setFechaVencimiento('');
      setProductosSeleccionados([]);
      setMontoAdicionalManual('');
      setMostrarFormFiado(false);
    }
    setGuardando(false);
  };

  const handleAbonar = async (fiadoId, monto) => {
    if (!monto || isNaN(monto) || monto <= 0) {
      addToast('Ingresa un monto válido', 'error');
      return;
    }
    const fiado = fiados.find(f => f.id === fiadoId);
    const montoTotal = parseFloat(fiado.monto_total || fiado.monto_usd || 0);
    const abonadoActual = parseFloat(fiado.monto_abonado) || 0;
    const nuevoAbono = abonadoActual + monto;
    if (nuevoAbono > montoTotal) {
      addToast('El abono supera la deuda total', 'error');
      return;
    }
    try {
      const { error } = await supabase
        .from('fiados')
        .update({ monto_abonado: nuevoAbono, estado: nuevoAbono >= montoTotal ? 'Pagado' : 'Pendiente' })
        .eq('id', fiadoId);
      if (error) throw error;
      addToast(`Abono de $${monto.toFixed(2)} registrado`, 'success');
      setAbonoInput(prev => ({ ...prev, [fiadoId]: '' }));
      if (playSound) playSound('coin_drop');
      // Recargar datos
      const { data } = await supabase.from('fiados').select('*').eq('user_id', usuario.id).order('created_at', { ascending: false });
      // Necesitamos una forma de refrescar fiados... asumimos que useFinanzas tiene un recargar
      window.location.reload(); // Solución rápida, mejor usar recargar del hook
    } catch (err) {
      addToast('Error al registrar abono: ' + err.message, 'error');
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-indigo-200 p-2 rounded-xl shadow-lg">
          <p className="text-xs font-bold text-slate-600">{label}</p>
          <p className="text-sm font-black text-indigo-600">${payload[0].value.toFixed(2)}</p>
          <p className="text-[10px] font-bold text-slate-400">{(payload[0].payload.totalBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</p>
        </div>
      );
    }
    return null;
  };

  if (cargando && ventas.length === 0 && fiados.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans pb-24">
      <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 shadow-inner">
        <button onClick={() => setPestaña('caja')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${pestaña === 'caja' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
          <Wallet className="w-5 h-5" /> Mi Caja
        </button>
        <button onClick={() => setPestaña('fiados')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${pestaña === 'fiados' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>
          <BookOpen className="w-5 h-5" /> Fiados
        </button>
      </div>

      {pestaña === 'caja' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Wallet className="w-32 h-32" /></div>
            <p className="text-indigo-100 font-bold text-sm uppercase tracking-wider mb-1">Total Entradas (Ventas)</p>
            <h2 className="text-4xl font-black">${totalCajaUsd.toFixed(2)}</h2>
            <p className="text-indigo-200 font-bold mt-1">{totalCajaBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500" /> Últimos 7 días</h3>
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
              <div className="text-center py-10">
                <div className="text-5xl mb-3">💰</div>
                <p className="text-slate-400 font-medium">Aún no hay ventas registradas</p>
                <p className="text-xs text-slate-400 mt-1">Ve a Mi Nevera y despacha tu primer producto.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ventas.slice(0, 10).map(v => (
                  <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Venta #{v.id.substring(0, 4)}</p>
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

      {pestaña === 'fiados' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-rose-50 rounded-3xl p-5 border border-rose-100 flex justify-between items-center">
            <div>
              <p className="text-rose-600 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Dinero en la calle</p>
              <h2 className="text-2xl font-black text-rose-700">${totalPorCobrarUsd.toFixed(2)}</h2>
            </div>
            <div className="text-right"><span className="text-sm font-bold text-rose-400 block">{totalPorCobrarBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span></div>
          </div>
          <div className="space-y-3">
            {fiados.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">📒</div>
                <p className="text-slate-400 font-medium">Nadie te debe nada</p>
                <p className="text-xs text-slate-400 mt-1">Puedes anotar un fiado con el botón +</p>
              </div>
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
                        <span className="text-[10px] font-bold text-slate-400">{(saldo * (tasaBcv || 1)).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span>
                      </div>
                    </div>
                    {f.estado === 'Pendiente' && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Abono $"
                          value={abonoInput[f.id] || ''}
                          onChange={(e) => setAbonoInput(prev => ({ ...prev, [f.id]: e.target.value }))}
                          className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => handleAbonar(f.id, parseFloat(abonoInput[f.id]))}
                          disabled={!abonoInput[f.id] || isNaN(parseFloat(abonoInput[f.id])) || parseFloat(abonoInput[f.id]) <= 0}
                          className="bg-emerald-600 text-white font-bold text-sm px-3 py-1 rounded-lg active:scale-95 disabled:opacity-50"
                        >
                          Abonar
                        </button>
                        <button
                          onClick={() => pagarFiado(f)}
                          className="bg-rose-100 text-rose-700 font-bold text-sm px-3 py-1 rounded-lg active:scale-95"
                        >
                          Liquidar todo
                        </button>
                      </div>
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

      <AnimatePresence>
        {mostrarFormFiado && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarFormFiado(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8 max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><BookOpen className="text-rose-500" /> Registrar Fiado</h3>
                <button onClick={() => setMostrarFormFiado(false)} className="bg-slate-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleGuardarFiado} className="space-y-4 overflow-y-auto">
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
                      <button key={p.id} type="button" onClick={() => agregarProductoFiado(p)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black px-3 py-2 rounded-xl">+ {p.nombre} (${p.precio_venta_usd.toFixed(2)})</button>
                    ))}
                  </div>
                  {productosSeleccionados.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                      {productosSeleccionados.map(p => (
                        <div key={p.id} className="flex justify-between items-center">
                          <span className="text-sm font-bold">{p.nombre}</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => actualizarCantidadProductoFiado(p.id, -1)} className="p-1 bg-white rounded-full shadow"><Minus className="w-4 h-4" /></button>
                            <span className="w-8 text-center font-black">{p.cantidad}</span>
                            <button type="button" onClick={() => actualizarCantidadProductoFiado(p.id, 1)} className="p-1 bg-white rounded-full shadow"><PlusIcon className="w-4 h-4" /></button>
                            <button type="button" onClick={() => quitarProductoFiado(p.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right text-emerald-600 font-black">Subtotal: ${calcularTotalProductosUsd().toFixed(2)}</div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Monto adicional (manual)</label>
                  <div className="relative"><span className="absolute left-3 top-3 text-rose-400 font-bold">$</span><input type="text" inputMode="decimal" value={montoAdicionalManual} onChange={e => setMontoAdicionalManual(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-rose-500 font-black" placeholder="0.00" /></div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl text-center">
                  <p className="text-xs font-bold text-rose-600 uppercase">Total a deber</p>
                  <p className="text-2xl font-black text-rose-700">${totalFiadoUsd.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{(totalFiadoUsd * (tasaBcv || 1)).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nota opcional</label>
                  <input type="text" value={descripcionFiado} onChange={e => setDescripcionFiado(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" placeholder="Ej: Pagará en dos quincenas" />
                </div>
                <button type="submit" disabled={guardando} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2">
                  {guardando ? <Loader2 className="animate-spin w-6 h-6" /> : <ShoppingCart className="w-5 h-5" />} REGISTRAR FIADO
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}