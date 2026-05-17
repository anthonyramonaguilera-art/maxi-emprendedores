import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Soup, CakeSlice, Plus, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LaCocina({ usuario, tasaBcv }) {
  const [alacena, setAlacena] = useState([]);
  const [cargando, setCargando] = useState(false); // Blindado
  
  const [tipoPreparacion, setTipoPreparacion] = useState('olla'); 
  const [ingredientesOlla, setIngredientesOlla] = useState([]);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [rendimiento, setRendimiento] = useState('');

  useEffect(() => {
    if (usuario?.id) cargarAlacena();
  }, [usuario]);

  const cargarAlacena = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase.from('insumos').select('*').eq('user_id', usuario.id).gt('cantidad_actual', 0);
      if (error) throw error;
      if (data) setAlacena(data);
    } catch (error) {
      console.error(error);
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

  // MATEMÁTICAS BIMONETARIAS
  const costoTotalUsd = ingredientesOlla.reduce((acc, item) => {
    const cant = parseFloat(item.cantidadUsada) || 0;
    const costoUnitario = item.insumo.costo_usd / item.insumo.cantidad_actual;
    return acc + (costoUnitario * cant);
  }, 0);
  const costoTotalBs = costoTotalUsd * (tasaBcv || 1);

  const costoPorPorcionUsd = rendimiento > 0 ? (costoTotalUsd / parseInt(rendimiento)) : 0;
  const costoPorPorcionBs = costoPorPorcionUsd * (tasaBcv || 1);
  
  const precioSugeridoUsd = costoPorPorcionUsd * 1.30; 
  const precioSugeridoBs = precioSugeridoUsd * (tasaBcv || 1);

  if (cargando) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-4 font-sans pb-24">
      <div className="bg-amber-50 rounded-3xl p-4 shadow-sm flex items-center gap-3 border border-amber-100">
        <div className="text-3xl animate-bounce">👨🏻‍🍳</div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-amber-600">Maxi Chef</p>
          <p className="text-sm font-bold text-slate-700 leading-tight mt-0.5">
            ¡Manos a la obra! Echa los ingredientes a la olla y te diré cuánto te cuesta cada dulce.
          </p>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl flex gap-2 shadow-sm border border-slate-100">
        <button onClick={() => setTipoPreparacion('olla')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${tipoPreparacion === 'olla' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 bg-slate-50'}`}>
          <Soup className="w-5 h-5"/> Mezcla / Líquidos
        </button>
        <button onClick={() => setTipoPreparacion('bandeja')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${tipoPreparacion === 'bandeja' ? 'bg-orange-100 text-orange-700' : 'text-slate-400 bg-slate-50'}`}>
          <CakeSlice className="w-5 h-5"/> Masas / Horneado
        </button>
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 min-h-[150px]">
        <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4">
          {tipoPreparacion === 'olla' ? '🥣 Dentro de la Olla' : '🥮 En la Bandeja'}
        </h3>
        
        <div className="space-y-3">
          {ingredientesOlla.map((item) => {
            const costoPielUsd = ((item.insumo.costo_usd / item.insumo.cantidad_actual) * (parseFloat(item.cantidadUsada) || 0));
            const costoPielBs = costoPielUsd * (tasaBcv || 1);
            return (
              <div key={item.insumo.id} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-bold text-slate-700 text-sm">{item.insumo.nombre}</p>
                  <div className="flex gap-2 mt-1">
                    <input type="number" placeholder="Cant" value={item.cantidadUsada} onChange={(e) => actualizarCantidadUsada(item.insumo.id, e.target.value)} className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-amber-500" />
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

      <AnimatePresence>
        {ingredientesOlla.length > 0 && costoTotalUsd > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-3xl p-5 shadow-xl text-white">
            <h3 className="font-black text-amber-400 mb-3 flex items-center gap-2">✨ Resultados del Lote</h3>
            
            <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-3">
              <span className="text-slate-300 font-bold text-sm">Costo total de receta:</span>
              <div className="text-right">
                <span className="block text-xl font-black leading-none">${costoTotalUsd.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 font-bold">{costoTotalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">¿Cuántos salieron de aquí? (Rendimiento)</label>
                <input type="number" placeholder="Ej: 47 tinitas, 10 porciones" value={rendimiento} onChange={(e) => setRendimiento(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-amber-500 font-black mt-1" />
              </div>

              {rendimiento > 0 && (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-800 p-4 rounded-2xl border border-emerald-500/30 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-emerald-400 uppercase">Costo unidad</p>
                    <span className="block text-2xl font-black text-white leading-none">${costoPorPorcionUsd.toFixed(2)}</span>
                    <span className="text-xs font-bold text-emerald-300/50">{costoPorPorcionBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Sugerido (30%+)</p>
                    <span className="block text-lg font-black text-amber-400 leading-none">${precioSugeridoUsd.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-amber-200/50">{precioSugeridoBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarSelector && (
          <>
            <div className="fixed inset-0 bg-slate-900/40 z-40 max-w-md mx-auto" onClick={() => setMostrarSelector(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-50 p-6 pb-8 h-[60vh] flex flex-col">
              <h3 className="font-black text-xl text-slate-800 mb-4">Tu Alacena</h3>
              <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                {alacena.length === 0 ? (
                  <p className="text-slate-400 text-center mt-10 font-bold text-sm">No tienes nada en la alacena.</p>
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