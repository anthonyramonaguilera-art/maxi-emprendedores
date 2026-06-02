import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Package, Loader2, X, UploadCloud, Image as ImageIcon, AlertTriangle, Archive, ArchiveRestore, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useInsumos from '../hooks/useInsumos';

const avatarColors = [
  'bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
  'bg-lime-100 text-lime-700', 'bg-indigo-100 text-indigo-700',
];

function getColorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function MiAlacena({ usuario, tasaBcv, playSound }) {
  const {
    insumos,
    archivados,
    cargando,
    guardarInsumo,
    eliminarInsumo,
    agregarCantidad,
    archivarInsumo,
    restaurarInsumo,
  } = useInsumos(usuario?.id, playSound);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);

  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('kg');
  const [costoTotalUsd, setCostoTotalUsd] = useState('');
  const [costoTotalBs, setCostoTotalBs] = useState('');
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState('');

  const [sortKey, setSortKey] = useState('nombre-asc');

  const obtenerPrecioUnitario = (insumo) =>
    insumo.cantidad_actual === 0 ? null : insumo.costo_usd / insumo.cantidad_actual;

  const insumosOrdenados = useMemo(() => {
    const copy = [...insumos];
    switch (sortKey) {
      case 'nombre-asc': return copy.sort((a, b) => a.nombre.localeCompare(b.nombre));
      case 'nombre-desc': return copy.sort((a, b) => b.nombre.localeCompare(a.nombre));
      case 'precio-asc': return copy.sort((a, b) => (obtenerPrecioUnitario(a) || Infinity) - (obtenerPrecioUnitario(b) || Infinity));
      case 'precio-desc': return copy.sort((a, b) => (obtenerPrecioUnitario(b) || -Infinity) - (obtenerPrecioUnitario(a) || -Infinity));
      case 'cantidad-asc': return copy.sort((a, b) => a.cantidad_actual - b.cantidad_actual);
      case 'cantidad-desc': return copy.sort((a, b) => b.cantidad_actual - a.cantidad_actual);
      case 'fecha-asc': return copy.sort((a, b) => new Date(a.fecha_ingreso || 0) - new Date(b.fecha_ingreso || 0));
      case 'fecha-desc': return copy.sort((a, b) => new Date(b.fecha_ingreso || 0) - new Date(a.fecha_ingreso || 0));
      default: return copy;
    }
  }, [insumos, sortKey]);

  const abrirModalNuevo = () => {
    setModoEdicion(null);
    setNombre(''); setCantidad(''); setUnidad('kg');
    setCostoTotalUsd(''); setCostoTotalBs('');
    setImagenArchivo(null); setImagenPreview('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (insumo) => {
    setModoEdicion({
      id: insumo.id,
      nombre: insumo.nombre,
      cantidad: insumo.cantidad_actual.toString(),
      unidad: insumo.unidad_medida,
      costo_usd: insumo.costo_usd.toString(),
      imagen_url: insumo.imagen_url,
    });
    setNombre(insumo.nombre);
    setCantidad(insumo.cantidad_actual.toString());
    setUnidad(insumo.unidad_medida);
    setCostoTotalUsd(insumo.costo_usd.toString());
    setCostoTotalBs((parseFloat(insumo.costo_usd) * (tasaBcv || 1)).toFixed(2));
    setImagenArchivo(null);
    setImagenPreview(insumo.imagen_url || '');
    setMostrarModal(true);
  };

  const handleUsdChange = (value) => {
    setCostoTotalUsd(value);
    const num = parseFloat(value.replace(',', '.'));
    setCostoTotalBs(!isNaN(num) ? (num * (tasaBcv || 1)).toFixed(2) : '');
  };

  const handleBsChange = (value) => {
    setCostoTotalBs(value);
    const num = parseFloat(value.replace(',', '.'));
    setCostoTotalUsd(!isNaN(num) && tasaBcv ? (num / tasaBcv).toFixed(2) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const data = {
      nombre: nombre.trim(),
      cantidad_actual: parseFloat(cantidad.replace(',', '.')),
      unidad_medida: unidad,
      costo_usd: parseFloat(costoTotalUsd.replace(',', '.')),
    };
    const ok = await guardarInsumo(data, imagenArchivo, modoEdicion);
    if (ok) {
      setNombre(''); setCantidad(''); setUnidad('kg');
      setCostoTotalUsd(''); setCostoTotalBs('');
      setImagenArchivo(null); setImagenPreview('');
      setMostrarModal(false);
      setModoEdicion(null);
    }
    setGuardando(false);
  };

  if (cargando) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-4 font-sans pb-24">
      <div className="bg-emerald-50 rounded-3xl p-4 shadow-sm flex items-center gap-3 border border-emerald-100">
        <Package className="w-8 h-8 text-emerald-600" />
        <div><h2 className="font-black text-slate-800">Mi Alacena</h2><p className="text-xs text-slate-500">Materia prima disponible</p></div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordenar:</label>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-sm">
            <option value="nombre-asc">Nombre (A-Z)</option>
            <option value="nombre-desc">Nombre (Z-A)</option>
            <option value="precio-asc">Precio / unidad (Menor a Mayor)</option>
            <option value="precio-desc">Precio / unidad (Mayor a Menor)</option>
            <option value="cantidad-desc">Cantidad (Mayor a Menor)</option>
            <option value="cantidad-asc">Cantidad (Menor a Mayor)</option>
            <option value="fecha-desc">Más reciente primero</option>
            <option value="fecha-asc">Más antiguo primero</option>
          </select>
        </div>
        <button onClick={() => setMostrarArchivados(!mostrarArchivados)} className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
          <Archive className="w-3 h-3" /> {mostrarArchivados ? 'Ocultar archivados' : 'Ver archivados'}
        </button>
      </div>

      <div className="space-y-3">
        {insumosOrdenados.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200">
            <div className="text-5xl mb-3">🌾</div>
            <p className="text-slate-500 font-bold text-lg mb-1">¡Tu alacena está vacía!</p>
            <p className="text-slate-400 text-sm">Agrega tu primer insumo para empezar a cocinar.</p>
            <button onClick={abrirModalNuevo} className="mt-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm active:scale-95 transition-transform">+ Agregar insumo</button>
          </div>
        ) : (
          insumosOrdenados.map((insumo) => {
            const costoUnitarioUsd = obtenerPrecioUnitario(insumo);
            const isLowStock = insumo.cantidad_actual <= 5;
            return (
              <div key={insumo.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                {insumo.imagen_url ? (
                  <img src={insumo.imagen_url} alt={insumo.nombre} className="w-10 h-10 rounded-full object-cover border flex-shrink-0" />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getColorFromName(insumo.nombre)}`}>
                    {insumo.nombre.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800">{insumo.nombre}</h3>
                    {isLowStock && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Stock bajo
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">{insumo.cantidad_actual} {insumo.unidad_medida}</span>
                    {costoUnitarioUsd !== null ? (
                      <>
                        <span className="text-xs font-bold text-emerald-600">${costoUnitarioUsd.toFixed(2)} / unidad</span>
                        <span className="text-[10px] font-bold text-slate-400">{(costoUnitarioUsd * (tasaBcv || 1)).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-red-500">Agotado</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => {
                    const extra = prompt(`¿Cuántos ${insumo.unidad_medida} de ${insumo.nombre} quieres agregar?`, '0');
                    if (extra) {
                      const val = parseFloat(extra.replace(',', '.'));
                      if (!isNaN(val) && val > 0) agregarCantidad(insumo, val);
                    }
                  }} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl active:scale-90" title="Agregar cantidad"><PlusCircle className="w-5 h-5" /></button>
                  <button onClick={() => archivarInsumo(insumo)} className="p-2 text-slate-400 hover:text-amber-600 rounded-xl active:scale-90" title="Archivar"><Archive className="w-5 h-5" /></button>
                  <button onClick={() => abrirModalEditar(insumo)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl active:scale-90" title="Editar"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => eliminarInsumo(insumo.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl active:scale-90" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {mostrarArchivados && archivados.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-black text-slate-500 mb-3 uppercase tracking-wider">Archivados</h3>
          <div className="space-y-2">
            {archivados.map((insumo) => (
              <div key={insumo.id} className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between">
                <div><p className="font-bold text-slate-600">{insumo.nombre}</p><p className="text-xs text-slate-400">{insumo.cantidad_actual} {insumo.unidad_medida}</p></div>
                <button onClick={() => restaurarInsumo(insumo)} className="text-blue-500 bg-white p-2 rounded-xl shadow-sm flex items-center gap-1 text-xs font-bold"><ArchiveRestore className="w-4 h-4" /> Restaurar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={abrirModalNuevo} className="fixed bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30" style={{ left: 'calc(50% + 120px)' }}>
        <Plus className="w-8 h-8" />
      </button>

      <AnimatePresence>
        {mostrarModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarModal(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-xl text-slate-800">{modoEdicion ? '✏️ Editar Insumo' : '➕ Nuevo Insumo'}</h3>
                <button onClick={() => setMostrarModal(false)} className="bg-slate-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Nombre (ej: Harina Pan)" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" required />
                <div className="flex gap-3">
                  <input type="text" inputMode="decimal" placeholder="Cantidad" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" required />
                  <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-emerald-500 font-bold">
                    <option value="kg">kg</option><option value="g">g</option><option value="l">l</option><option value="ml">ml</option><option value="unidad">unidad</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Costo total</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative"><span className="absolute left-3 top-3 text-emerald-600 font-bold text-sm">$</span><input type="text" inputMode="decimal" placeholder="USD" value={costoTotalUsd} onChange={(e) => handleUsdChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-emerald-500 font-bold" required /></div>
                    <div className="relative"><span className="absolute left-3 top-3 text-amber-600 font-bold text-sm">Bs</span><input type="text" inputMode="decimal" placeholder="Bolívares" value={costoTotalBs} onChange={(e) => handleBsChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-amber-500 font-bold" /></div>
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1">Tasa actual: {tasaBcv?.toFixed(2) || '---'} Bs/$</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1 mb-1"><ImageIcon className="w-4 h-4" /> Imagen del insumo</label>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-emerald-400 transition-colors">
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImagenArchivo(file);
                        setImagenPreview(URL.createObjectURL(file));
                      }
                    }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {imagenPreview ? (
                      <div className="flex items-center gap-3"><img src={imagenPreview} alt="vista previa" className="w-12 h-12 rounded-full object-cover border" /><span className="text-sm font-bold text-slate-600 truncate">{imagenArchivo ? imagenArchivo.name : 'Imagen actual'}</span></div>
                    ) : (
                      <div className="text-slate-400"><UploadCloud className="w-8 h-8 mx-auto mb-1" /><p className="text-xs font-bold">Toca para subir imagen</p></div>
                    )}
                  </div>
                </div>
                <button type="submit" disabled={guardando} className="w-full bg-emerald-500 text-white font-black py-4 rounded-xl active:scale-95 transition-all">
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