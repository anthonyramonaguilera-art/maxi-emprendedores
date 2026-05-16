import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChefHat, Plus, Save, RefreshCw, Trash2, ArrowDown, Package, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CentroPreparacion({ usuario }) {
  const [materialesBd, setMaterialesBd] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [tasaBcv, setTasaBcv] = useState(null);

  // Mesa de entrada (Insumos Brutos)
  const [materialesUsados, setMaterialesUsados] = useState([]);
  const [selMaterial, setSelMaterial] = useState('');
  const [cantMaterial, setCantMaterial] = useState('');

  // Resultado (Insumo Preparado / Sub-receta)
  const [nombreSalida, setNombreSalida] = useState('');
  const [cantSalida, setCantSalida] = useState('');
  const [unidadSalida, setUnidadSalida] = useState('Kg');

  useEffect(() => {
    const inicializar = async () => {
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await res.json();
        setTasaBcv(data.promedio);
      } catch (e) { setTasaBcv(500); }
      if (usuario?.id) cargarMateriales();
    };
    inicializar();
  }, [usuario]);

  const cargarMateriales = async () => {
    setCargando(true);
    const { data } = await supabase.from('materiales').select('*').eq('user_id', usuario.id).gt('cantidad_actual', 0).order('nombre', { ascending: true });
    if (data) setMaterialesBd(data);
    setCargando(false);
  };

  const agregarInsumo = () => {
    if (!selMaterial || !cantMaterial) return;
    const base = materialesBd.find(m => m.id === selMaterial);
    const cant = parseFloat(cantMaterial);
    
    if (cant > base.cantidad_actual) return alert(`Solo tienes ${base.cantidad_actual} ${base.unidad_medida} de ${base.nombre}.`);

    setMaterialesUsados([...materialesUsados, {
      id: base.id,
      nombre: base.nombre,
      unidad: base.unidad_medida,
      cantidad: cant,
      costoTotalUsd: cant * base.costo_promedio_usd,
      stockPrevio: base.cantidad_actual
    }]);
    setSelMaterial(''); setCantMaterial('');
  };

  const eliminarInsumo = (index) => setMaterialesUsados(materialesUsados.filter((_, i) => i !== index));

  // Cálculos de la mezcla
  const costoTotalOllaUsd = materialesUsados.reduce((acc, curr) => acc + curr.costoTotalUsd, 0);
  const cantidadGenerada = parseFloat(cantSalida) || 0;
  const costoUnitarioSalidaUsd = cantidadGenerada > 0 ? costoTotalOllaUsd / cantidadGenerada : 0;

  const procesarSubReceta = async () => {
    if (procesando) return;
    setProcesando(true);

    try {
      // 1. Descontar ingredientes brutos del inventario
      for (const mat of materialesUsados) {
        await supabase.from('materiales')
          .update({ cantidad_actual: mat.stockPrevio - mat.cantidad })
          .eq('id', mat.id);
      }

      // 2. Buscar si la "Mermelada" (o producto preparado) ya existe en inventario
      const { data: existeMat } = await supabase.from('materiales')
        .select('*')
        .ilike('nombre', nombreSalida) // Busca sin importar mayúsculas
        .eq('user_id', usuario.id)
        .single();

      if (existeMat) {
        // Cálculo de Promedio Ponderado para el nuevo costo
        const valorViejo = existeMat.cantidad_actual * existeMat.costo_promedio_usd;
        const valorNuevo = costoTotalOllaUsd;
        const nuevaCantidad = existeMat.cantidad_actual + cantidadGenerada;
        const nuevoCostoPromedio = (valorViejo + valorNuevo) / nuevaCantidad;

        await supabase.from('materiales')
          .update({
            cantidad_actual: nuevaCantidad,
            costo_promedio_usd: nuevoCostoPromedio
          }).eq('id', existeMat.id);
      } else {
        // Si no existe, lo crea como un nuevo material en el almacén
        await supabase.from('materiales').insert([{
          user_id: usuario.id,
          nombre: nombreSalida,
          cantidad_actual: cantidadGenerada,
          unidad_medida: unidadSalida,
          costo_promedio_usd: costoUnitarioSalidaUsd
        }]);
      }

      alert(`¡${nombreSalida} preparada y enviada al inventario! 🍓`);
      setMaterialesUsados([]); setNombreSalida(''); setCantSalida('');
      cargarMateriales();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ChefHat className="text-amber-500 w-7 h-7"/> Centro de Preparación
          </h2>
          <p className="text-slate-500">Transforma ingredientes crudos en preparaciones (Ej: Fresas + Azúcar = Mermelada).</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 font-bold text-slate-700">
          BCV: {tasaBcv || '...'} Bs
        </div>
      </header>

      {cargando ? ( <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-500 w-10 h-10"/></div> ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* PASO 1: LA OLLA (Ingredientes Crudos) */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
              1. Ingredientes a usar
            </h3>
            <div className="flex gap-2 mb-6">
              <select value={selMaterial} onChange={(e) => setSelMaterial(e.target.value)} className="flex-1 px-3 py-2 border rounded-xl outline-none bg-slate-50">
                <option value="">Selecciona ingrediente...</option>
                {materialesBd.map(m => <option key={m.id} value={m.id}>{m.nombre} (Hay {m.cantidad_actual} {m.unidad_medida})</option>)}
              </select>
              <input type="number" placeholder="Cant." value={cantMaterial} onChange={(e) => setCantMaterial(e.target.value)} className="w-24 px-3 py-2 border rounded-xl outline-none" />
              <button onClick={agregarInsumo} className="bg-amber-500 text-white p-2 rounded-xl hover:bg-amber-600"><Plus/></button>
            </div>

            <div className="space-y-2 min-h-[150px]">
              <AnimatePresence>
                {materialesUsados.map((m, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">{m.nombre}</p>
                      <p className="text-xs text-slate-400">{m.cantidad} {m.unidad} gastados • ${m.costoTotalUsd.toFixed(2)}</p>
                    </div>
                    <button onClick={() => eliminarInsumo(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {materialesUsados.length === 0 && <p className="text-center text-slate-300 py-10">La olla está vacía.</p>}
            </div>

            <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center">
              <span className="font-bold text-slate-500">Costo Base:</span>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-800">${costoTotalOllaUsd.toFixed(2)}</p>
                <p className="text-sm font-bold text-slate-400">{tasaBcv ? (costoTotalOllaUsd * tasaBcv).toFixed(2) : '...'} Bs</p>
              </div>
            </div>
          </section>

          {/* PASO 2: EL RESULTADO (Sub-Receta) */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-amber-100/50">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-amber-500"/> 2. ¿Qué preparaste?
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nombre del Resultado</label>
                <input type="text" placeholder="Ej: Mermelada de Fresa Casera" value={nombreSalida} onChange={(e) => setNombreSalida(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
                <p className="text-xs text-slate-400 mt-1">Si ya existe en tu inventario, Maxi sumará esta nueva cantidad al anterior.</p>
              </div>
              
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Cantidad Obtenida</label>
                  <input type="number" step="0.01" placeholder="Ej: 2.5" value={cantSalida} onChange={(e) => setCantSalida(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Medida</label>
                  <select value={unidadSalida} onChange={(e) => setUnidadSalida(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none bg-white focus:ring-2 focus:ring-amber-500">
                    <option value="Kg">Kg</option>
                    <option value="Litros">Litros</option>
                    <option value="Gramos">Gramos</option>
                    <option value="Unidades">Unidades</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed bg-amber-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Tu nuevo costo será:</p>
                  <p className="text-2xl font-black text-amber-600">${costoUnitarioSalidaUsd.toFixed(2)} <span className="text-sm font-medium">/ {unidadSalida}</span></p>
                </div>
                <button 
                  onClick={procesarSubReceta}
                  disabled={procesando || materialesUsados.length === 0 || !nombreSalida || !cantSalida}
                  className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-amber-200 hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {procesando ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>}
                  GUARDAR MEZCLA
                </button>
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}