import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Beaker, Plus, Save, RefreshCw, Trash2, ArrowDown, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModuloProduccion({ usuario }) {
  const [materialesBd, setMaterialesBd] = useState([]);
  const [productosBd, setProductosBd] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  
  // Tasa BCV
  const [tasaBcv, setTasaBcv] = useState(null);
  const [cargandoTasa, setCargandoTasa] = useState(true);

  // Estados de la Mesa de Trabajo
  const [materialesUsados, setMaterialesUsados] = useState([]);
  const [productosGenerados, setProductosGenerados] = useState([]);

  // Estados de selección temporal
  const [selMaterial, setSelMaterial] = useState('');
  const [cantMaterial, setCantMaterial] = useState('');
  const [selProducto, setSelProducto] = useState('');
  const [cantProducto, setCantProducto] = useState('');

  useEffect(() => {
    const obtenerTasa = async () => {
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await res.json();
        setTasaBcv(data.promedio);
      } catch (e) { setTasaBcv(500); }
      finally { setCargandoTasa(false); }
    };
    obtenerTasa();
    if (usuario?.id) cargarDatos();
  }, [usuario]);

  const cargarDatos = async () => {
    setCargando(true);
    const [resMat, resProd] = await Promise.all([
      supabase.from('materiales').select('*').eq('user_id', usuario.id).gt('cantidad_actual', 0),
      supabase.from('productos').select('*').eq('user_id', usuario.id)
    ]);
    if (resMat.data) setMaterialesBd(resMat.data);
    if (resProd.data) setProductosBd(resProd.data);
    setCargando(false);
  };

  // --- LÓGICA DE INSUMOS ---
  const agregarInsumo = () => {
    if (!selMaterial || !cantMaterial) return;
    const base = materialesBd.find(m => m.id === selMaterial);
    const cant = parseFloat(cantMaterial);
    
    if (cant > base.cantidad_actual) return alert("No tienes suficiente stock en almacén.");

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

  const eliminarInsumo = (index) => {
    setMaterialesUsados(materialesUsados.filter((_, i) => i !== index));
  };

  // --- LÓGICA DE SALIDA (PRODUCTOS) ---
  const agregarSalida = () => {
    if (!selProducto || !cantProducto) return;
    const base = productosBd.find(p => p.id === selProducto);
    setProductosGenerados([...productosGenerados, {
      id: base.id,
      nombre: base.nombre,
      cantidad: parseInt(cantProducto),
      stockPrevio: base.stock_actual
    }]);
    setSelProducto(''); setCantProducto('');
  };

  const eliminarSalida = (index) => {
    setProductosGenerados(productosGenerados.filter((_, i) => i !== index));
  };

  // --- CÁLCULOS MAESTROS ---
  const costoTotalOllaUsd = materialesUsados.reduce((acc, curr) => acc + curr.costoTotalUsd, 0);
  const totalUnidadesProducidas = productosGenerados.reduce((acc, curr) => acc + curr.cantidad, 0);
  const costoSugeridoPorUnidadUsd = totalUnidadesProducidas > 0 ? costoTotalOllaUsd / totalUnidadesProducidas : 0;

  const procesarProduccion = async () => {
    if (procesando) return;
    setProcesando(true);

    try {
      const { data: prodHeader, error: errH } = await supabase.from('producciones').insert([{
        user_id: usuario.id,
        costo_total_usd: costoTotalOllaUsd,
        notas: "Producción combinada"
      }]).select().single();
      if (errH) throw errH;

      for (const mat of materialesUsados) {
        await supabase.from('materiales')
          .update({ cantidad_actual: mat.stockPrevio - mat.cantidad })
          .eq('id', mat.id);
      }

      for (const item of productosGenerados) {
        await supabase.from('produccion_detalle').insert([{
          produccion_id: prodHeader.id,
          producto_id: item.id,
          cantidad_producida: item.cantidad
        }]);

        await supabase.from('productos')
          .update({ stock_actual: item.stockPrevio + item.cantidad })
          .eq('id', item.id);
      }

      alert("¡Producción completada! Almacén y Catálogo actualizados.");
      setMaterialesUsados([]); setProductosGenerados([]);
      cargarDatos();
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
            <Beaker className="text-blue-600 w-7 h-7"/> Mesa de Trabajo
          </h2>
          <p className="text-slate-500">Combina insumos y obtén productos finales con costos automáticos.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 font-bold text-slate-700">
          BCV: {tasaBcv} Bs
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* LADO A */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500"/> Insumos Utilizados
          </h3>
          <div className="flex gap-2 mb-6">
            <select value={selMaterial} onChange={(e) => setSelMaterial(e.target.value)} className="flex-1 px-3 py-2 border rounded-xl outline-none bg-slate-50">
              <option value="">Elegir material...</option>
              {materialesBd.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.cantidad_actual} {m.unidad_medida})</option>)}
            </select>
            <input type="number" placeholder="Cant." value={cantMaterial} onChange={(e) => setCantMaterial(e.target.value)} className="w-24 px-3 py-2 border rounded-xl outline-none" />
            <button onClick={agregarInsumo} className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-900"><Plus/></button>
          </div>

          <div className="space-y-2 min-h-[150px]">
            <AnimatePresence>
              {materialesUsados.map((m, i) => (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-700">{m.nombre}</p>
                    <p className="text-xs text-slate-400">{m.cantidad} {m.unidad} • ${m.costoTotalUsd.toFixed(2)}</p>
                  </div>
                  <button onClick={() => eliminarInsumo(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center">
            <span className="font-bold text-slate-500">Costo de la Olla:</span>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-800">${costoTotalOllaUsd.toFixed(2)}</p>
              <p className="text-sm font-bold text-slate-400">{tasaBcv ? (costoTotalOllaUsd * tasaBcv).toFixed(2) : '...'} Bs</p>
            </div>
          </div>
        </section>

        {/* LADO B */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-green-500"/> Productos Finalizados
          </h3>
          <div className="flex gap-2 mb-6">
            <select value={selProducto} onChange={(e) => setSelProducto(e.target.value)} className="flex-1 px-3 py-2 border rounded-xl outline-none bg-slate-50">
              <option value="">Elegir producto...</option>
              {productosBd.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <input type="number" placeholder="Unds." value={cantProducto} onChange={(e) => setCantProducto(e.target.value)} className="w-24 px-3 py-2 border rounded-xl outline-none" />
            <button onClick={agregarSalida} className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-900"><Plus/></button>
          </div>

          <div className="space-y-2 min-h-[150px]">
            {productosGenerados.map((p, i) => (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100">
                <div>
                  <p className="font-bold text-green-800">{p.nombre}</p>
                  <p className="text-xs text-green-600">{p.cantidad} unidades producidas</p>
                </div>
                <button onClick={() => eliminarSalida(i)} className="text-green-400 hover:text-green-600"><Trash2 className="w-4 h-4"/></button>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-dashed bg-blue-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Costo Prorrateado</p>
                <p className="text-2xl font-black text-blue-800">${costoSugeridoPorUnidadUsd.toFixed(2)} <span className="text-sm font-medium">/ unidad</span></p>
              </div>
              <button 
                onClick={procesarProduccion}
                disabled={procesando || materialesUsados.length === 0 || productosGenerados.length === 0}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {procesando ? <RefreshCw className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>}
                FINALIZAR
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}