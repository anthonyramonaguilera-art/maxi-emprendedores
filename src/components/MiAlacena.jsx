import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Package, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MiAlacena({ usuario, tasaBcv }) {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(null); // { id, nombre, cantidad, unidad, costo_total }
  const [guardando, setGuardando] = useState(false);

  // Formulario (nuevo o edición)
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('kg');
  const [costoTotal, setCostoTotal] = useState('');

  useEffect(() => {
    cargarInsumos();
  }, [usuario]);

  const cargarInsumos = async () => {
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
        .order('nombre', { ascending: true });
      if (error) throw error;
      setInsumos(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalNuevo = () => {
    setModoEdicion(null);
    setNombre('');
    setCantidad('');
    setUnidad('kg');
    setCostoTotal('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (insumo) => {
    setModoEdicion({
      id: insumo.id,
      nombre: insumo.nombre,
      cantidad: insumo.cantidad_actual.toString(),
      unidad: insumo.unidad_medida,
      costo_total: insumo.costo_usd.toString()
    });
    setNombre(insumo.nombre);
    setCantidad(insumo.cantidad_actual.toString());
    setUnidad(insumo.unidad_medida);
    setCostoTotal(insumo.costo_usd.toString());
    setMostrarModal(true);
  };

  const guardarInsumo = async (e) => {
    e.preventDefault();
    if (!nombre || !cantidad || !costoTotal) return;

    setGuardando(true);
    try {
      let currentUserId = usuario?.id;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session.user.id;
      }

      const cantidadNum = parseFloat(cantidad.toString().replace(',', '.'));
      const costoNum = parseFloat(costoTotal.toString().replace(',', '.'));

      if (modoEdicion) {
        // Actualizar
        const { error } = await supabase
          .from('insumos')
          .update({
            nombre: nombre.trim(),
            cantidad_actual: cantidadNum,
            unidad_medida: unidad,
            costo_usd: costoNum
          })
          .eq('id', modoEdicion.id);
        if (error) throw error;
      } else {
        // Insertar nuevo
        const { error } = await supabase.from('insumos').insert([{
          user_id: currentUserId,
          nombre: nombre.trim(),
          cantidad_actual: cantidadNum,
          unidad_medida: unidad,
          costo_usd: costoNum
        }]);
        if (error) throw error;
      }

      setNombre('');
      setCantidad('');
      setUnidad('kg');
      setCostoTotal('');
      setMostrarModal(false);
      setModoEdicion(null);
      await cargarInsumos();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarInsumo = async (id) => {
    if (window.confirm('¿Eliminar este insumo?')) {
      await supabase.from('insumos').delete().eq('id', id);
      await cargarInsumos();
    }
  };

  if (cargando) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-4 font-sans pb-24">
      {/* Header */}
      <div className="bg-emerald-50 rounded-3xl p-4 shadow-sm flex items-center gap-3 border border-emerald-100">
        <Package className="w-8 h-8 text-emerald-600" />
        <div>
          <h2 className="font-black text-slate-800">Mi Alacena</h2>
          <p className="text-xs text-slate-500">Materia prima disponible</p>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {insumos.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400 font-medium">Tu alacena está vacía</p>
            <p className="text-xs text-slate-400 mt-1">Toca el botón + para agregar insumos</p>
          </div>
        ) : (
          insumos.map((insumo) => {
            const costoUnitarioUsd = insumo.costo_usd / insumo.cantidad_actual;
            const costoUnitarioBs = costoUnitarioUsd * (tasaBcv || 1);
            return (
              <div key={insumo.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-black text-slate-800">{insumo.nombre}</h3>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">{insumo.cantidad_actual} {insumo.unidad_medida}</span>
                    <span className="text-xs font-bold text-emerald-600">${costoUnitarioUsd.toFixed(2)} / unidad</span>
                    <span className="text-[10px] font-bold text-slate-400">{costoUnitarioBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => abrirModalEditar(insumo)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl active:scale-90 transition-all"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => eliminarInsumo(insumo.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl active:scale-90 transition-all"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Botón flotante + (corregido) */}
      <button
        onClick={abrirModalNuevo}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center active:scale-95 transition-transform z-30"
        style={{ left: 'calc(50% + 120px)' }}
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Modal (crear o editar) */}
      <AnimatePresence>
        {mostrarModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm"
              onClick={() => setMostrarModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-xl text-slate-800">
                  {modoEdicion ? '✏️ Editar Insumo' : '➕ Nuevo Insumo'}
                </h3>
                <button onClick={() => setMostrarModal(false)} className="bg-slate-100 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={guardarInsumo} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre (ej: Harina Pan)"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                  required
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                    required
                  />
                  <select
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="unidad">unidad</option>
                  </select>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Costo total que pagaste"
                    value={costoTotal}
                    onChange={(e) => setCostoTotal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full bg-emerald-500 text-white font-black py-4 rounded-xl active:scale-95 transition-all"
                >
                  {guardando ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (modoEdicion ? 'ACTUALIZAR' : 'AGREGAR')}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}