import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Soup, CakeSlice, Plus, ArrowRight, ArrowLeft, Loader2, Trash2, Store, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LaCocina({ usuario, tasaBcv }) {
  const [alacena, setAlacena] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const [paso, setPaso] = useState(1); 
  const [tipoPreparacion, setTipoPreparacion] = useState('olla'); 
  const [ingredientesOlla, setIngredientesOlla] = useState([]);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  
  const [rendimiento, setRendimiento] = useState('');
  const [nombreProducto, setNombreProducto] = useState('');
  const [precioVentaFinal, setPrecioVentaFinal] = useState('');

  // NUEVOS ESTADOS: Costos Operativos (Gas, Luz, Agua)
  const [porcentajeOperativo, setPorcentajeOperativo] = useState(15); // 15% por defecto
  const [modoAvanzadoOperativo, setModoAvanzadoOperativo] = useState(false);

  useEffect(() => {
    cargarAlacena();
  }, [usuario]);

  const cargarAlacena = async () => {
    let currentUserId = usuario?.id;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }
    if (!currentUserId) return;

    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .eq('user_id', currentUserId)
        .gt('cantidad_actual', 0)
        .order('nombre', { ascending: true });

      if (error) throw error;
      if (data) setAlacena(data);
    } catch (error) {
      console.error("Error en La Cocina:", error);
    } finally {
      setCargando(false);
    }
  };

  const agregarALaOlla = (insumo) => {
    const existe = ingredientesOlla.find(i => i.insumo.id === insumo.id);
    if (!existe) setIngredientesOlla([...ingredientesOlla, { insumo, cantidadUsada: '' }]);
    setMostrarSelector(false);
  };

  const actualizarCantidadUsada = (id, cantidad) => {
    setIngredientesOlla(ingredientesOlla.map(item => 
      item.insumo.id === id ? { ...item, cantidadUsada: cantidad } : item
    ));
  };

  const sacarDeLaOlla = (id) => {
    setIngredientesOlla(ingredientesOlla.filter(item => item.insumo.id !== id));
  };

  // MATEMÁTICAS BIMONETARIAS CON COSTOS OCULTOS
  const costoIngredientesUsd = ingredientesOlla.reduce((acc, item) => {
    const cant = parseFloat(item.cantidadUsada.toString().replace(',', '.')) || 0;
    const costoUnitario = item.insumo.costo_usd / item.insumo.cantidad_actual;
    return acc + (costoUnitario * cant);
  }, 0);

  // Calculamos el extra por gas, luz, etc.
  const montoOperativoUsd = costoIngredientesUsd * (porcentajeOperativo / 100);
  const costoTotalOllaUsd = costoIngredientesUsd + montoOperativoUsd;
  const costoTotalOllaBs = costoTotalOllaUsd * (tasaBcv || 1);

  const costoPorPorcionUsd = rendimiento > 0 ? (costoTotalOllaUsd / parseInt(rendimiento)) : 0;
  const costoPorPorcionBs = costoPorPorcionUsd * (tasaBcv || 1);
  
  const precioSugeridoUsd = costoPorPorcionUsd * 1.30; // 30% Ganancia sobre el costo REAL

  useEffect(() => {
    if (rendimiento > 0 && !precioVentaFinal) {
      setPrecioVentaFinal(precioSugeridoUsd.toFixed(2));
    }
  }, [rendimiento, porcentajeOperativo]); // Se recalcula si cambian el % avanzado

  const enviarANevera = async () => {
    if (!nombreProducto || !rendimiento || !precioVentaFinal) {
      alert("Por favor ponle nombre, cuántos salieron y el precio de venta.");
      return;
    }
    
    setGuardando(true);
    try {
      let currentUserId = usuario?.id;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session.user.id;
      }

      const { error: insertError } = await supabase.from('productos').insert([{
        user_id: currentUserId,
        nombre: nombreProducto,
        precio_venta_usd: parseFloat(precioVentaFinal.toString().replace(',', '.')),
        stock_actual: parseInt(rendimiento)
      }]);
      if (insertError) throw insertError;

      for (const item of ingredientesOlla) {
        const cantUsada = parseFloat(item.cantidadUsada.toString().replace(',', '.')) || 0;
        const stockRestante = item.insumo.cantidad_actual - cantUsada;
        await supabase.from('insumos')
          .update({ cantidad_actual: stockRestante > 0 ? stockRestante : 0 })
          .eq('id', item.insumo.id);
      }

      setIngredientesOlla([]); setRendimiento(''); setNombreProducto(''); setPrecioVentaFinal(''); setPaso(1);
      setPorcentajeOperativo(15); setModoAvanzadoOperativo(false);
      await cargarAlacena();
      
      alert("¡Éxito! Postres guardados en Mi Nevera y materiales descontados de la Alacena.");
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-4 font-sans pb-24">
      <div className="bg-amber-50 rounded-3xl p-4 shadow-sm flex items-center gap-3 border border-amber-100">
        <div className="text-3xl animate-bounce">👨🏻‍🍳</div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-amber-600">Maxi Chef</p>
          <p className="text-sm font-bold text-slate-700 leading-tight mt-0.5">
            {paso === 1 
              ? "Echa los ingredientes a la olla y cuando termines dale a Siguiente."
              : "¡Huele divino! Dime cuántos salieron para etiquetarlos y meterlos a la nevera."}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ================= PASO 1 ================= */}
        {paso === 1 && (
          <motion.div key="paso1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            
            <div className="bg-white p-2 rounded-2xl flex gap-2 shadow-sm border border-slate-100">
              <button onClick={() => setTipoPreparacion('olla')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${tipoPreparacion === 'olla' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 bg-slate-50'}`}>
                <Soup className="w-5 h-5"/> Mezcla / Olla
              </button>
              <button onClick={() => setTipoPreparacion('bandeja')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${tipoPreparacion === 'bandeja' ? 'bg-orange-100 text-orange-700' : 'text-slate-400 bg-slate-50'}`}>
                <CakeSlice className="w-5 h-5"/> Masas / Horno
              </button>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 min-h-[200px] flex flex-col">
              <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                {tipoPreparacion === 'olla' ? '🥣 Dentro de la Olla' : '🥮 En la Bandeja'}
              </h3>
              
              <div className="space-y-3 flex-1">
                {ingredientesOlla.length === 0 && (
                  <div className="text-center py-8 opacity-50">
                    <Soup className="w-12 h-12 mx-auto mb-2 text-slate-300"/>
                    <p className="text-sm font-bold text-slate-400">La preparación está vacía</p>
                  </div>
                )}
                
                {ingredientesOlla.map((item) => {
                  const cant = parseFloat(item.cantidadUsada.toString().replace(',', '.')) || 0;
                  const costoPielUsd = ((item.insumo.costo_usd / item.insumo.cantidad_actual) * cant);
                  const costoPielBs = costoPielUsd * (tasaBcv || 1);
                  return (
                    <div key={item.insumo.id} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-slate-700 text-sm truncate">{item.insumo.nombre}</p>
                        <div className="flex gap-2 mt-1">
                          <input type="text" inputMode="decimal" placeholder="Cant" value={item.cantidadUsada} onChange={(e) => actualizarCantidadUsada(item.insumo.id, e.target.value)} className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-amber-500" />
                          <span className="text-[10px] font-bold text-slate-400 self-center uppercase truncate">{item.insumo.unidad_medida}</span>
                        </div>
                      </div>
                      <div className="text-right pr-2">
                        <span className="block font-black text-emerald-600 text-sm leading-none">${costoPielUsd.toFixed(2)}</span>
                        <span className="text-[9px] font-bold text-slate-400">{costoPielBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                      </div>
                      <button onClick={() => sacarDeLaOlla(item.insumo.id)} className="text-slate-400 active:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setMostrarSelector(true)} className="w-full mt-4 border-2 border-dashed border-amber-200 text-amber-600 bg-amber-50 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <Plus className="w-5 h-5"/> AÑADIR INGREDIENTE
              </button>
            </div>

            {ingredientesOlla.length > 0 && costoIngredientesUsd > 0 && (
              <motion.button 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                onClick={() => setPaso(2)}
                className="w-full bg-slate-900 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                SIGUIENTE PASO <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ================= PASO 2 ================= */}
        {paso === 2 && (
          <motion.div key="paso2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            
            <button onClick={() => setPaso(1)} className="flex items-center gap-2 text-sm font-black text-slate-400 mb-2 active:text-slate-600">
              <ArrowLeft className="w-4 h-4"/> Volver a la Olla
            </button>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">¿Qué postre preparaste?</label>
                <input type="text" placeholder="Ej: Yogurt de Fresa 8oz" value={nombreProducto} onChange={e => setNombreProducto(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl outline-none focus:border-amber-500 font-black mt-1" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">¿Cuántas unidades te salieron?</label>
                <input type="number" placeholder="Ej: 47" value={rendimiento} onChange={e => setRendimiento(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-amber-600 px-4 py-3 rounded-2xl outline-none focus:border-amber-500 font-black text-xl mt-1" />
              </div>

              {/* SECCIÓN DE COSTOS OPERATIVOS (SMART DEFAULTS) */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-black text-blue-800 uppercase flex items-center gap-1"><Zap className="w-3 h-3"/> Costos Ocultos (Gas, Luz, Agua)</label>
                  <button onClick={() => setModoAvanzadoOperativo(!modoAvanzadoOperativo)} className="text-[10px] font-black text-blue-500 uppercase underline active:text-blue-700">
                    {modoAvanzadoOperativo ? 'Usar Recomendado' : 'Ajuste Avanzado'}
                  </button>
                </div>
                
                {!modoAvanzadoOperativo ? (
                  <div className="flex justify-between items-center bg-white border border-blue-200 p-2.5 rounded-xl shadow-sm">
                    <span className="text-xs font-bold text-slate-500">Porcentaje Sugerido</span>
                    <span className="bg-blue-100 text-blue-700 font-black text-xs px-2 py-1 rounded-md">15%</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type="number" value={porcentajeOperativo} onChange={(e) => setPorcentajeOperativo(e.target.value)} className="w-full bg-white border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 font-black text-sm" />
                      <span className="absolute right-3 top-3 text-slate-400 font-black text-sm">%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {rendimiento > 0 && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 rounded-3xl p-5 shadow-xl text-white space-y-4">
                
                {/* DESGLOSE TRANSPARENTE */}
                <div className="space-y-2 border-b border-slate-700 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-xs">Materia Prima:</span>
                    <span className="text-slate-300 font-bold text-sm">${costoIngredientesUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-xs">Extras (Gas, Luz, etc):</span>
                    <span className="text-slate-300 font-bold text-sm">+ ${montoOperativoUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-800">
                    <span className="text-slate-200 font-black text-sm">COSTO TOTAL RECETA:</span>
                    <span className="text-amber-400 font-black text-lg">${costoTotalOllaUsd.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-bold text-sm">Costo Real por Unidad:</span>
                  <div className="text-right">
                    <span className="block text-3xl font-black text-white leading-none">${costoPorPorcionUsd.toFixed(2)}</span>
                    <span className="text-xs font-bold text-emerald-300/50">{costoPorPorcionBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mt-2">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Sugerido (30%+)</span>
                    <span className="text-base font-black text-slate-300">${precioSugeridoUsd.toFixed(2)}</span>
                  </div>
                  <label className="text-xs font-black text-amber-400 uppercase block mb-1">Tu precio final de VENTA ($):</label>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={precioVentaFinal} onChange={e => setPrecioVentaFinal(e.target.value)} className="w-full bg-slate-900 border-2 border-amber-500/50 text-amber-400 px-4 py-3 rounded-xl outline-none focus:border-amber-400 font-black text-2xl text-center" />
                </div>

                <button onClick={enviarANevera} disabled={guardando} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex justify-center items-center gap-2 mt-4">
                  {guardando ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Store className="w-6 h-6" /> GUARDAR EN MI NEVERA</>}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarSelector && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarSelector(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-[70] p-6 pb-8 h-[70vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-black text-xl text-slate-800">Tu Alacena</h3>
                <button onClick={() => setMostrarSelector(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 active:scale-90"><X className="w-5 h-5"/></button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                {alacena.length === 0 ? (
                  <div className="text-center mt-10">
                    <p className="text-slate-400 font-bold text-sm">Tu alacena está vacía.</p>
                  </div>
                ) : (
                  alacena.map(item => (
                    <button key={item.id} onClick={() => agregarALaOlla(item)} className="w-full text-left bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center active:bg-amber-50">
                      <span className="font-bold text-slate-700">{item.nombre}</span>
                      <span className="text-xs font-black text-slate-400 bg-white px-2 py-1 rounded-md">{item.cantidad_actual} {item.unidad_medida} disp.</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}