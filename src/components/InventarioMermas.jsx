import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Package, Save, RefreshCw, DollarSign, Banknote, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InventarioMermas({ usuario }) {
  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  
  // Tasa BCV
  const [tasaBcv, setTasaBcv] = useState(null);
  const [cargandoTasa, setCargandoTasa] = useState(true);

  // Estados del formulario bimonetario
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('Litros');
  const [costoUsd, setCostoUsd] = useState('');
  const [costoBs, setCostoBs] = useState('');

  useEffect(() => {
    const obtenerTasaBCV = async () => {
      try {
        const respuesta = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await respuesta.json();
        setTasaBcv(data.promedio);
      } catch (error) {
        setTasaBcv(500.00); // Respaldo
      } finally {
        setCargandoTasa(false);
      }
    };
    obtenerTasaBCV();

    if (usuario?.id) cargarMateriales();
  }, [usuario]);

  const cargarMateriales = async () => {
    setCargando(true);
    const { data, error } = await supabase.from('materiales').select('*').eq('user_id', usuario.id).order('created_at', { ascending: false });
    if (!error && data) setMateriales(data);
    setCargando(false);
  };

  // Manejadores de Moneda Dual
  const handleCostoUsd = (val) => {
    setCostoUsd(val);
    setCostoBs(val && tasaBcv ? (parseFloat(val) * tasaBcv).toFixed(2) : '');
  };
  const handleCostoBs = (val) => {
    setCostoBs(val);
    setCostoUsd(val && tasaBcv ? (parseFloat(val) / tasaBcv).toFixed(2) : '');
  };

  const guardarMaterial = async (e) => {
    e.preventDefault();
    if (!usuario?.id) return alert("Cargando usuario...");

    setProcesando(true);
    const costoTotalDolares = parseFloat(costoUsd);
    const costoPromedio = costoTotalDolares / parseFloat(cantidad);

    const { error } = await supabase.from('materiales').insert([{
        user_id: usuario.id,
        nombre: nombre,
        cantidad_actual: parseFloat(cantidad),
        unidad_medida: unidad,
        costo_promedio_usd: costoPromedio
    }]);

    if (!error) {
      setNombre(''); setCantidad(''); setCostoUsd(''); setCostoBs('');
      cargarMateriales(); 
    } else {
      alert("Error al guardar: " + error.message);
    }
    setProcesando(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Inventario y Mermas</h2>
          <p className="text-slate-500">Registra tus compras. Todo se calcula en ambas monedas al instante.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
          {cargandoTasa ? <Loader2 className="w-4 h-4 animate-spin text-blue-600"/> : <span className="text-sm font-bold text-slate-700">🇻🇪 BCV: {tasaBcv} Bs</span>}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULARIO BIMONETARIO */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600"/> Nueva Compra</h3>
          
          <form onSubmit={guardarMaterial} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Material (Ej: Leche, Azúcar)</label>
              <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Compraste</label>
                <input type="number" step="0.01" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Medida</label>
                <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="Litros">Litros</option>
                  <option value="Kg">Kg</option>
                  <option value="Gramos">Gramos</option>
                  <option value="Unidades">Unidades</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Costo Total Pagado</label>
              <div className="flex gap-2">
                <div className="relative w-1/2">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-green-600" />
                  <input type="number" step="0.01" placeholder="USD" value={costoUsd} onChange={(e) => handleCostoUsd(e.target.value)} disabled={cargandoTasa} className="w-full pl-8 pr-2 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none disabled:bg-slate-50" />
                </div>
                <div className="relative w-1/2">
                  <Banknote className="absolute left-3 top-2.5 w-4 h-4 text-blue-600" />
                  <input type="number" step="0.01" placeholder="Bs" value={costoBs} onChange={(e) => handleCostoBs(e.target.value)} disabled={cargandoTasa} className="w-full pl-8 pr-2 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50" />
                </div>
              </div>
            </div>

            <button disabled={procesando || cargandoTasa} type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 mt-2">
              {procesando ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Añadir a existencias
            </button>
          </form>
        </div>

        {/* TABLA DE ALMACÉN INTELIGENTE */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-slate-500"/> Almacén</h3>
          
          {cargando ? ( <p className="text-slate-500 animate-pulse">Cargando...</p> ) : materiales.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium">Tu almacén está vacío.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-sm text-slate-500">
                    <th className="pb-3 font-medium">Material</th>
                    <th className="pb-3 font-medium">Disponible</th>
                    <th className="pb-3 font-medium">Costo por Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.map((item) => (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-4 font-bold text-slate-700">{item.nombre}</td>
                      <td className="py-4"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{item.cantidad_actual} {item.unidad_medida}</span></td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-green-600 font-black">${item.costo_promedio_usd?.toFixed(2)}</span>
                          <span className="text-xs font-bold text-slate-400">{tasaBcv ? (item.costo_promedio_usd * tasaBcv).toFixed(2) : '...'} Bs</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}