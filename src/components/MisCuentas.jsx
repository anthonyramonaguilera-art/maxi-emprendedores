import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, BookOpen, Plus, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MisCuentas({ usuario, tasaBcv }) {
  const [pestaña, setPestaña] = useState('caja');
  const [cargando, setCargando] = useState(false);
  
  const [ventas, setVentas] = useState([]);
  const [fiados, setFiados] = useState([]);
  const [productosNevera, setProductosNevera] = useState([]);

  const [mostrarFormFiado, setMostrarFormFiado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [clienteFiado, setClienteFiado] = useState('');
  const [montoFiadoUsd, setMontoFiadoUsd] = useState('');
  const [descripcionFiado, setDescripcionFiado] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [usuario, pestaña]);

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
        if (data) {
          const ventasOrdenadas = data.sort((a, b) => {
            const fechaA = new Date(a.created_at || a.fecha_creacion || 0);
            const fechaB = new Date(b.created_at || b.fecha_creacion || 0);
            return fechaB - fechaA;
          });
          setVentas(ventasOrdenadas);
        }
      } else {
        const { data: dataFiados, error: errorFiados } = await supabase.from('fiados').select('*').eq('user_id', currentUserId);
        if (errorFiados) throw errorFiados;

        if (dataFiados) {
          const fiadosOrdenados = dataFiados.sort((a, b) => {
            const fechaA = new Date(a.created_at || a.fecha_creacion || 0);
            const fechaB = new Date(b.created_at || b.fecha_creacion || 0);
            return fechaB - fechaA;
          });
          setFiados(fiadosOrdenados);
        }
        
        const { data: dataProds } = await supabase.from('productos').select('*').eq('user_id', currentUserId).gt('stock_actual', 0);
        if (dataProds) setProductosNevera(dataProds);
      }
    } catch (error) {
      console.error("Error cargando cuentas:", error);
    } finally {
      setCargando(false);
    }
  };

  const totalCajaUsd = ventas.reduce((acc, v) => acc + (parseFloat(v.total_usd) || 0), 0);
  const totalCajaBs = totalCajaUsd * (tasaBcv || 1);

  const totalPorCobrarUsd = fiados.filter(f => f.estado === 'Pendiente').reduce((acc, f) => acc + (parseFloat(f.monto_usd) || 0), 0);
  const totalPorCobrarBs = totalPorCobrarUsd * (tasaBcv || 1);

  const agregarBurbuja = (producto) => {
    const costoProd = parseFloat(producto.precio_venta_usd) || 0;
    const montoActualLimpio = parseFloat(montoFiadoUsd.toString().replace(',', '.')) || 0;
    setMontoFiadoUsd((montoActualLimpio + costoProd).toFixed(2));
    
    const desc = descripcionFiado ? `${descripcionFiado}, 1x ${producto.nombre}` : `1x ${producto.nombre}`;
    setDescripcionFiado(desc);
  };

  const guardarFiado = async (e) => {
    e.preventDefault();
    if (!clienteFiado || !montoFiadoUsd) return;
    setGuardando(true);

    try {
      let currentUserId = usuario?.id;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session.user.id;
      }

      const montoLimpio = parseFloat(montoFiadoUsd.toString().replace(',', '.'));
      if (isNaN(montoLimpio)) throw new Error("Monto inválido. Usa números.");

      // CREACIÓN DE FECHA POR DEFECTO Y MANTENIMIENTO DE TODOS LOS CAMPOS REQUERIDOS POR LA BD
      const fechaVencimientoDefault = new Date();
      fechaVencimientoDefault.setDate(fechaVencimientoDefault.getDate() + 7);

      const { error: insertError } = await supabase.from('fiados').insert([{
        user_id: currentUserId,
        cliente: clienteFiado.trim(),
        monto_usd: montoLimpio,
        monto_total: montoLimpio, // Protege contra error de BD
        fecha_vencimiento: fechaVencimientoDefault.toISOString(), // Protege contra error de BD
        descripcion: descripcionFiado || 'Anotación manual'
      }]);

      if (insertError) throw insertError;

      setClienteFiado(''); setMontoFiadoUsd(''); setDescripcionFiado('');
      setMostrarFormFiado(false);
      await cargarDatos();
    } catch (error) {
      alert("Error al anotar: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const marcarPagado = async (id) => {
    await supabase.from('fiados').update({ estado: 'Pagado' }).eq('id', id);
    cargarDatos();
  };

  if (cargando && ventas.length === 0 && fiados.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-4 font-sans pb-24">
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

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">🛒 Historial de Despachos</h3>
            {ventas.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-4 italic">Aún no hay ventas registradas.</p>
            ) : (
              <div className="space-y-3">
                {ventas.slice(0, 10).map(v => {
                  const rawDate = v.created_at || v.fecha_creacion;
                  const fechaFormateada = rawDate 
                    ? new Date(rawDate).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' }) 
                    : 'Fecha no registrada';

                  return (
                    <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-700 text-sm">Venta #{v.id.substring(0,4)}</p>
                        <p className="text-[10px] text-slate-400">{fechaFormateada}</p>
                      </div>
                      <span className="font-black text-emerald-600">+${(parseFloat(v.total_usd) || 0).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ================= FIADOS ================= */}
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
                const monto = parseFloat(f.monto_usd) || 0;
                return (
                  <div key={f.id} className={`p-4 rounded-2xl border flex flex-col gap-3 ${f.estado === 'Pendiente' ? 'bg-white border-rose-100 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-slate-800">{f.cliente}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{f.descripcion}</p>
                      </div>
                      <div className="text-right">
                        <span className={`block font-black text-lg leading-none ${f.estado === 'Pendiente' ? 'text-rose-600' : 'text-slate-500'}`}>${monto.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-400">{(monto * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                      </div>
                    </div>
                    
                    {f.estado === 'Pendiente' && (
                      <button onClick={() => marcarPagado(f.id)} className="w-full bg-emerald-50 text-emerald-600 font-black text-sm py-2.5 rounded-xl border border-emerald-200 active:scale-95 transition-all flex justify-center items-center gap-2">
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

      {/* ================= MODAL FIADOS ================= */}
      <AnimatePresence>
        {mostrarFormFiado && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarFormFiado(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8 max-h-[90vh] overflow-y-auto flex flex-col">
              
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><BookOpen className="text-rose-500"/> Anotar Fiado</h3>
                <button onClick={() => setMostrarFormFiado(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 active:scale-90"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={guardarFiado} className="space-y-5 shrink-0">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">¿A quién le fiaste?</label>
                  <input type="text" required placeholder="Ej: La vecina María" value={clienteFiado} onChange={e => setClienteFiado(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl outline-none focus:border-rose-500 font-black mt-1" />
                </div>

                {productosNevera.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Selección Rápida de Nevera</label>
                    <div className="flex flex-wrap gap-2">
                      {productosNevera.map(p => (
                        <button key={p.id} type="button" onClick={() => agregarBurbuja(p)} className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-black px-3 py-2 rounded-xl active:scale-95 transition-all">
                          + {p.nombre} (${p.precio_venta_usd.toFixed(2)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-rose-50 border border-rose-100 p-4 rounded-3xl">
                  <label className="text-xs font-black text-rose-500 uppercase ml-1 block mb-1">Monto Total a Deber ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-rose-400 font-black text-xl">$</span>
                    <input type="text" inputMode="decimal" required placeholder="0.00" value={montoFiadoUsd} onChange={e => setMontoFiadoUsd(e.target.value)} className="w-full bg-white border-2 border-rose-200 text-rose-600 pl-9 pr-4 py-3 rounded-2xl outline-none focus:border-rose-500 font-black text-2xl" />
                  </div>
                  
                  <input type="text" placeholder="Nota opcional (Ej: Me paga el viernes)" value={descripcionFiado} onChange={e => setDescripcionFiado(e.target.value)} className="w-full bg-white/50 border border-rose-200 text-slate-600 px-4 py-2 rounded-xl outline-none focus:border-rose-400 font-medium text-sm mt-3" />
                </div>

                <button type="submit" disabled={guardando} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-rose-200 active:scale-[0.98] transition-all flex justify-center mt-2">
                  {guardando ? <Loader2 className="w-6 h-6 animate-spin" /> : "ANOTAR EN EL CUADERNO"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}