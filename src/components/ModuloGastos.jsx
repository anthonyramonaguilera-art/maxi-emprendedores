import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Receipt, Plus, Save, Trash2, Loader2, DollarSign, Banknote, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ModuloGastos({ usuario }) {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [tasaBcv, setTasaBcv] = useState(null);

  const [descripcion, setDescripcion] = useState('');
  const [montoUsd, setMontoUsd] = useState('');
  const [montoBs, setMontoBs] = useState('');

  useEffect(() => {
    const inicializar = async () => {
      try {
        const resTasa = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const dataTasa = await resTasa.json();
        setTasaBcv(dataTasa.promedio);
      } catch (e) { setTasaBcv(500); }

      if (usuario?.id) cargarGastos();
    };
    inicializar();
  }, [usuario]);

  const cargarGastos = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('gastos')
      .select('*')
      .eq('user_id', usuario.id)
      .order('fecha', { ascending: false });
    
    if (data) setGastos(data);
    setCargando(false);
  };

  const handleMontoUsd = (val) => {
    setMontoUsd(val);
    setMontoBs(val && tasaBcv ? (parseFloat(val) * tasaBcv).toFixed(2) : '');
  };

  const handleMontoBs = (val) => {
    setMontoBs(val);
    setMontoUsd(val && tasaBcv ? (parseFloat(val) / tasaBcv).toFixed(2) : '');
  };

  const guardarGasto = async (e) => {
    e.preventDefault();
    setProcesando(true);
    
    try {
      const { error } = await supabase.from('gastos').insert([{
        user_id: usuario.id,
        descripcion: descripcion,
        monto_usd: parseFloat(montoUsd)
      }]);

      if (error) throw error;

      setDescripcion(''); setMontoUsd(''); setMontoBs('');
      cargarGastos();
    } catch (error) {
      alert("Error al registrar gasto: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const eliminarGasto = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este gasto?")) return;
    await supabase.from('gastos').delete().eq('id', id);
    cargarGastos();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* FORMULARIO DE GASTOS */}
      <div className="lg:col-span-1 space-y-4">
        <header>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="text-red-500 w-7 h-7"/> Egresos
          </h2>
          <p className="text-slate-500 text-sm mt-1">Registra envases, pasajes, alquiler o cualquier gasto operativo.</p>
        </header>

        <form onSubmit={guardarGasto} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 sticky top-6">
          <h3 className="text-lg font-bold text-slate-700 mb-2 flex items-center gap-2"><Plus className="w-5 h-5 text-red-500"/> Nuevo Gasto</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Descripción</label>
            <input type="text" required placeholder="Ej: Paquete de 50 envases plásticos" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Monto Pagado</label>
            <div className="flex gap-2">
              <div className="relative w-1/2">
                <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-green-600" />
                <input type="number" step="0.01" required placeholder="USD" value={montoUsd} onChange={(e) => handleMontoUsd(e.target.value)} className="w-full pl-7 pr-2 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="relative w-1/2">
                <Banknote className="absolute left-2 top-2.5 w-4 h-4 text-blue-600" />
                <input type="number" step="0.01" placeholder="Bs" value={montoBs} onChange={(e) => handleMontoBs(e.target.value)} className="w-full pl-7 pr-2 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <button disabled={procesando} type="submit" className="w-full bg-red-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {procesando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Registrar Salida de Dinero
          </button>
        </form>
      </div>

      {/* HISTORIAL DE GASTOS */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2"><Calendar className="w-5 h-5 text-slate-400"/> Historial de Gastos</h3>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">BCV: {tasaBcv || '...'} Bs</span>
          </div>
          
          {cargando ? (
            <p className="text-slate-500 animate-pulse text-center py-10">Cargando recibos...</p>
          ) : gastos.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium">Sin gastos registrados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gastos.map((gasto) => {
                const fechaStr = new Date(gasto.fecha).toLocaleDateString('es-VE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={gasto.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-sm transition-shadow group">
                    <div>
                      <p className="font-bold text-slate-800">{gasto.descripcion}</p>
                      <p className="text-xs text-slate-400 font-medium">{fechaStr}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-red-500">-${parseFloat(gasto.monto_usd).toFixed(2)}</p>
                        <p className="text-xs font-bold text-slate-400">{tasaBcv ? (gasto.monto_usd * tasaBcv).toFixed(2) : '...'} Bs</p>
                      </div>
                      <button onClick={() => eliminarGasto(gasto.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}