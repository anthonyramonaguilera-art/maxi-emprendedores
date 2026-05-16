import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, BookOpen, Save, RefreshCw, Tag, DollarSign, Banknote, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MisRecetas({ usuario }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  
  const [tasaBcv, setTasaBcv] = useState(null);
  const [cargandoTasa, setCargandoTasa] = useState(true);

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Yogurt Firme');
  const [precioUsd, setPrecioUsd] = useState('');
  const [precioBs, setPrecioBs] = useState('');

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
    if (usuario?.id) cargarProductos();
  }, [usuario]);

  const cargarProductos = async () => {
    setCargando(true);
    const { data, error } = await supabase.from('productos').select('*').eq('user_id', usuario.id).order('categoria', { ascending: true });
    if (!error && data) setProductos(data);
    setCargando(false);
  };

  const handlePrecioUsd = (val) => {
    setPrecioUsd(val);
    setPrecioBs(val && tasaBcv ? (parseFloat(val) * tasaBcv).toFixed(2) : '');
  };

  const handlePrecioBs = (val) => {
    setPrecioBs(val);
    setPrecioUsd(val && tasaBcv ? (parseFloat(val) / tasaBcv).toFixed(2) : '');
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!usuario?.id) return;
    setProcesando(true);
    const { error } = await supabase.from('productos').insert([{
      user_id: usuario.id,
      nombre,
      categoria,
      precio_venta_usd: parseFloat(precioUsd),
      stock_actual: 0
    }]);
    if (!error) {
      setNombre(''); setPrecioUsd(''); setPrecioBs('');
      cargarProductos();
    }
    setProcesando(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Catálogo de Productos</h2>
          <p className="text-slate-500">Define tus precios de venta. Maxi los mantendrá actualizados al BCV.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
          {cargandoTasa ? <Loader2 className="w-4 h-4 animate-spin text-blue-600"/> : <span className="text-sm font-bold text-slate-700">BCV: {tasaBcv} Bs</span>}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600"/> Nuevo Producto</h3>
          <form onSubmit={guardarProducto} className="space-y-4">
            <input type="text" required placeholder="Nombre (Ej: Yogurt Griego 250ml)" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none bg-white">
              <option value="Yogurt Firme">Yogurt Firme</option>
              <option value="Yogurt Griego">Yogurt Griego</option>
              <option value="Tetas de Yogurt">Tetas de Yogurt</option>
              <option value="Postres/Tortas">Postres / Tortas</option>
            </select>

            <div className="flex gap-2">
              <div className="relative w-1/2">
                <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-green-600" />
                <input type="number" step="0.01" placeholder="USD" value={precioUsd} onChange={(e) => handlePrecioUsd(e.target.value)} className="w-full pl-7 pr-2 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="relative w-1/2">
                <Banknote className="absolute left-2 top-2.5 w-4 h-4 text-blue-600" />
                <input type="number" step="0.01" placeholder="Bs" value={precioBs} onChange={(e) => handlePrecioBs(e.target.value)} className="w-full pl-7 pr-2 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <button disabled={procesando} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors">
              {procesando ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Añadir Producto
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {cargando ? <p className="animate-pulse">Cargando catálogo...</p> : productos.map((item) => (
            <motion.div layout key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Tag className="w-6 h-6"/></div>
                <div>
                  <h4 className="font-bold text-slate-800">{item.nombre}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase">{item.categoria} • Stock: {item.stock_actual}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-green-600">${item.precio_venta_usd.toFixed(2)}</p>
                <p className="text-sm font-bold text-slate-400">{tasaBcv ? (item.precio_venta_usd * tasaBcv).toFixed(2) : '...'} Bs</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}