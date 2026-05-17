import React, { useState, useEffect } from 'react';
import { Soup, Plus, ArrowRight, Sparkles, ChefHat, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MesaTrabajoLibre() {
  const [ingredientes, setIngredientes] = useState([]);
  const [nombreTmp, setNombreTmp] = useState('');
  const [costoTmp, setCostoTmp] = useState('');
  const [rendimiento, setRendimiento] = useState('');
  const [tasaBcv, setTasaBcv] = useState(null);

  // 1. Buscamos la tasa BCV apenas la persona entra a la página
  useEffect(() => {
    const obtenerTasa = async () => {
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await res.json();
        setTasaBcv(data.promedio);
      } catch (e) {
        setTasaBcv(51.20); // Respaldo por si el internet falla
      }
    };
    obtenerTasa();
  }, []);

  const agregarIngrediente = (e) => {
    e.preventDefault();
    if (!nombreTmp || !costoTmp) return;
    setIngredientes([...ingredientes, { id: Date.now(), nombre: nombreTmp, costo: parseFloat(costoTmp) }]);
    setNombreTmp('');
    setCostoTmp('');
  };

  const eliminarIngrediente = (id) => {
    setIngredientes(ingredientes.filter(i => i.id !== id));
  };

  // MATEMÁTICAS BIMONETARIAS
  const costoTotalUsd = ingredientes.reduce((acc, curr) => acc + curr.costo, 0);
  const costoTotalBs = costoTotalUsd * (tasaBcv || 1);
  
  const costoUnitarioUsd = rendimiento > 0 ? (costoTotalUsd / parseInt(rendimiento)) : 0;
  const costoUnitarioBs = costoUnitarioUsd * (tasaBcv || 1);
  
  const precioSugeridoUsd = costoUnitarioUsd * 1.30; 
  const precioSugeridoBs = precioSugeridoUsd * (tasaBcv || 1);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex justify-center pb-20">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* HEADER DE LA LANDING PAGE */}
        <header className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 pt-10 rounded-b-[2.5rem] shadow-lg text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><ChefHat className="w-32 h-32"/></div>
          
          {/* EL AVATAR DE MAXI (Con truco de fallback por si no existe la imagen aún) */}
          <div className="relative mx-auto w-20 h-20 mb-3">
            <img 
              src="/maxi-avatar.png" 
              alt="Maxi Emprendedor" 
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-xl bg-white"
              onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='white'/%3E%3Ctext x='50' y='65' font-size='40' text-anchor='middle'%3E👦🏻%3C/text%3E%3C/svg%3E" }}
            />
            {tasaBcv && (
              <span className="absolute -bottom-2 -right-4 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-1 rounded-full shadow-md">
                BCV: {tasaBcv.toFixed(2)}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-white leading-tight">Calculadora<br/>Maxi Emprendedores</h1>
          <p className="text-blue-100 text-sm mt-2 font-medium">Descubre tu ganancia real en 10 segundos. ¡Gratis!</p>
        </header>

        <main className="flex-1 p-5 -mt-4 z-10 space-y-6">
          {/* OLLA VIRTUAL */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h2 className="font-black text-slate-800 flex items-center gap-2 mb-4"><Soup className="text-amber-500"/> ¿Qué lleva tu receta?</h2>
            
            <form onSubmit={agregarIngrediente} className="flex gap-2 mb-4">
              <input type="text" placeholder="Ej: Leche Upaca" value={nombreTmp} onChange={e => setNombreTmp(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" />
              <input type="number" step="0.01" placeholder="Costo $" value={costoTmp} onChange={e => setCostoTmp(e.target.value)} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-blue-500" />
              <button type="submit" className="bg-amber-500 text-white p-2 rounded-xl active:scale-95 transition-transform"><Plus /></button>
            </form>

            <div className="space-y-2">
              {ingredientes.map(ing => (
                <div key={ing.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-600 text-sm pl-2">{ing.nombre}</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block font-black text-emerald-600 leading-none">${ing.costo.toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-slate-400">{(ing.costo * tasaBcv).toFixed(2)} Bs</span>
                    </div>
                    <button onClick={() => eliminarIngrediente(ing.id)} className="text-slate-400 active:text-red-500 bg-white p-1.5 rounded-lg shadow-sm"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
              {ingredientes.length === 0 && <p className="text-center text-xs text-slate-400 italic py-4">La olla está vacía...</p>}
            </div>
          </div>

          {/* RENDIMIENTO Y RESULTADO MÁGICO */}
          <AnimatePresence>
            {ingredientes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <label className="block font-black text-slate-800 mb-2">¿Cuántos dulces te salieron? (Rendimiento)</label>
                  <input type="number" placeholder="Ej: 47 tinitas..." value={rendimiento} onChange={e => setRendimiento(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-lg font-black outline-none focus:border-blue-500 text-center text-blue-700" />
                </div>

                {rendimiento > 0 && (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles className="w-32 h-32 text-amber-400"/></div>
                    <h3 className="font-black text-amber-400 mb-4 flex items-center gap-2">✨ Tu Bualá Financiero</h3>
                    
                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                        <span className="text-slate-400 font-bold text-sm leading-tight">Costo de<br/>toda la olla:</span>
                        <div className="text-right">
                          <span className="block text-xl font-black leading-none">${costoTotalUsd.toFixed(2)}</span>
                          <span className="text-xs font-bold text-slate-400">{costoTotalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold text-sm leading-tight">Costo por<br/>cada unidad:</span>
                        <div className="text-right">
                          <span className="block text-3xl font-black text-white leading-none">${costoUnitarioUsd.toFixed(2)}</span>
                          <span className="text-sm font-bold text-emerald-300">{costoUnitarioBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                        </div>
                      </div>

                      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mt-4 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase w-1/2">Precio sugerido de venta (Margen 30%)</span>
                        <div className="text-right">
                          <span className="block text-2xl font-black text-amber-400 leading-none">${precioSugeridoUsd.toFixed(2)}</span>
                          <span className="text-sm font-bold text-amber-200/50">{precioSugeridoBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                        </div>
                      </div>
                    </div>

                    <a href="/login" className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
                      GUARDAR RECETA EN MI NEVERA <ArrowRight className="w-5 h-5"/>
                    </a>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}