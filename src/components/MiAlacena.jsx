import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Archive, Plus, Trash2, X, Loader2, PackageOpen, ChevronDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MiAlacena({ usuario, tasaBcv }) {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(false); 
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [costoUsd, setCostoUsd] = useState('');
  const [costoBs, setCostoBs] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Bolsas/Paquetes');

  const unidadesSugeridas = ['Bolsas/Paquetes', 'Kilos', 'Litros', 'Unidades (Vasos/Tapas)', 'Cucharadas'];

  useEffect(() => {
    if (usuario?.id) cargarAlacena();
  }, [usuario]);

  const cargarAlacena = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .eq('user_id', usuario.id)
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      if (data) setInsumos(data);
    } catch (error) {
      console.error("Error cargando alacena:", error);
    } finally {
      setCargando(false);
    }
  };

  // --- LÓGICA DE INPUTS SINCRONIZADOS (Dólares <-> Bolívares) ---
  const handleUsdChange = (valor) => {
    setCostoUsd(valor);
    if (valor && tasaBcv) {
      setCostoBs((parseFloat(valor) * tasaBcv).toFixed(2));
    } else {
      setCostoBs('');
    }
  };

  const handleBsChange = (valor) => {
    setCostoBs(valor);
    if (valor && tasaBcv) {
      setCostoUsd((parseFloat(valor) / tasaBcv).toFixed(2));
    } else {
      setCostoUsd('');
    }
  };

  const guardarInsumo = async (e) => {
    e.preventDefault();
    if (!nombre || !costoUsd || !cantidad) return;
    setGuardando(true);

    try {
      await supabase.from('insumos').insert([{
        user_id: usuario.id,
        nombre: nombre,
        costo_usd: parseFloat(costoUsd),
        cantidad_actual: parseFloat(cantidad),
        unidad_medida: unidadMedida
      }]);
      
      setNombre(''); setCostoUsd(''); setCostoBs(''); setCantidad('');
      setMostrarFormulario(false);
      await cargarAlacena();
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarInsumo = async (id) => {
    if(window.confirm("¿Sacar este material de la alacena?")) {
      await supabase.from('insumos').delete().eq('id', id);
      cargarAlacena();
    }
  };

  if (cargando) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-4 font-sans pb-24">
      <div className="bg-emerald-50 rounded-3xl p-4 shadow-sm flex items-center gap-3 border border-emerald-100 relative">
        <div className="text-3xl animate-pulse">👷🏻‍♂️</div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Maxi Inventario</p>
          <p className="text-sm font-bold text-slate-700 leading-tight mt-0.5">
            {insumos.length === 0 
              ? "¡Alacena limpia! Añade lo que compraste en el súper tocando el botón verde." 
              : "Aquí está tu materia prima. Todo listo para ir a La Cocina."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {insumos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 font-bold text-sm">No hay ingredientes registrados</p>
          </div>
        ) : (
          insumos.map((item) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id} 
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center"
            >
              <div className="flex-1">
                <h3 className="font-black text-slate-800">{item.nombre}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-md">
                    {item.cantidad_actual} {item.unidad_medida}
                  </span>
                </div>
              </div>
              
              <div className="text-right mr-3">
                <span className="block font-black text-emerald-600 leading-none">${item.costo_usd.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-slate-400">{(item.costo_usd * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
              </div>

              <button 
                onClick={() => eliminarInsumo(item.id)}
                className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      <button 
        onClick={() => setMostrarFormulario(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AnimatePresence>
        {mostrarFormulario && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 z-40 max-w-md mx-auto"
              onClick={() => setMostrarFormulario(false)}
            />
            {/* CORRECCIÓN: Agregado max-h-[85vh] y overflow-y-auto para que el botón no se esconda */}
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-50 p-6 pb-10 max-h-[85vh] overflow-y-auto flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-black text-xl text-slate-800">Nueva Compra</h3>
                <button onClick={() => setMostrarFormulario(false)} className="bg-slate-100 p-2 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={guardarInsumo} className="space-y-4 shrink-0">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">¿Qué compraste?</label>
                  <input type="text" required placeholder="Ej: Leche Upaca, Vasos 67..." value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl outline-none focus:border-emerald-500 font-bold mt-1" />
                </div>
                
                {/* BLOQUE SINCRONIZADO DE MONEDAS */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl">
                  <label className="text-xs font-black text-emerald-600 uppercase mb-2 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Costo Total (Llena solo uno)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-400 font-black">$</span>
                      <input type="number" step="0.01" required placeholder="0.00" value={costoUsd} onChange={e => handleUsdChange(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 pl-8 pr-3 py-3 rounded-xl outline-none focus:border-emerald-500 font-black" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-400 font-black">Bs</span>
                      <input type="number" step="0.01" required placeholder="0.00" value={costoBs} onChange={e => handleBsChange(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 pl-9 pr-3 py-3 rounded-xl outline-none focus:border-emerald-500 font-black" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">¿Cuánto trae?</label>
                    <input type="number" step="0.01" required placeholder="Ej: 1, 900, 50" value={cantidad} onChange={e => setCantidad(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl outline-none focus:border-emerald-500 font-black mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">¿En qué se mide?</label>
                    <div className="relative mt-1">
                      <select value={unidadMedida} onChange={e => setUnidadMedida(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl outline-none focus:border-emerald-500 font-bold appearance-none">
                        {unidadesSugeridas.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={guardando} className="w-full bg-emerald-500 text-white font-black text-lg py-4 rounded-2xl mt-2 shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex justify-center">
                  {guardando ? <Loader2 className="w-6 h-6 animate-spin" /> : "GUARDAR EN ALACENA"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}