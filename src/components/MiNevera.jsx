import React, { useState } from 'react';
import { Plus, Minus, Edit2, Trash2, IceCream, ThermometerSnowflake, Store, Move, Package, CheckSquare, Square, Loader2, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useNevera from '../hooks/useNevera';
import { agregarProducto as agregarAlCarritoGlobal } from '../store/carritoStore';
import { addToast } from '../store/toastStore';

export default function MiNevera({ usuario, tasaBcv, playSound }) {
  const {
    cargando,
    modoSeleccionMultiple,
    setModoSeleccionMultiple,
    seleccionados,
    toggleSeleccion,
    actualizarCantidadSeleccion,
    añadirSeleccionadosAlCarrito,
    cancelarSeleccionMultiple,
    guardarEdicionProducto,
    eliminarProducto,
    moverCategoria,
    getProductosPorCategoria,
  } = useNevera(usuario?.id, tasaBcv, playSound);

  const [categoriaActiva, setCategoriaActiva] = useState('general');
  const [mostrarMoverModal, setMostrarMoverModal] = useState(false);
  const [productoAMover, setProductoAMover] = useState(null);
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  const [mostrarEditarModal, setMostrarEditarModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPrecioUsd, setEditPrecioUsd] = useState('');
  const [editPrecioBs, setEditPrecioBs] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategoria, setEditCategoria] = useState('');
  const [editImagen, setEditImagen] = useState(null);
  const [editImagenPreview, setEditImagenPreview] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const productosFiltrados = getProductosPorCategoria(categoriaActiva);

  const abrirEditar = (p) => {
    setProductoEditando(p);
    setEditNombre(p.nombre);
    const usd = p.precio_venta_usd.toString();
    setEditPrecioUsd(usd);
    setEditPrecioBs((parseFloat(usd) * (tasaBcv || 1)).toFixed(2));
    setEditStock(p.stock_actual.toString());
    setEditCategoria(p.categoria || 'general');
    setEditImagenPreview(p.imagen_url || '');
    setEditImagen(null);
    setMostrarEditarModal(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setGuardandoEdicion(true);
    const updates = {
      nombre: editNombre.trim(),
      precio_venta_usd: parseFloat(editPrecioUsd.replace(',', '.')),
      stock_actual: parseInt(editStock, 10),
      categoria: editCategoria === 'general' ? null : editCategoria,
    };
    const ok = await guardarEdicionProducto(productoEditando.id, updates, editImagen);
    if (ok) setMostrarEditarModal(false);
    setGuardandoEdicion(false);
  };

  // Al tocar un producto normalmente, se agrega al carrito global directamente
  const handleTocarProducto = (producto) => {
    if (producto.stock_actual <= 0) {
      addToast('Producto agotado', 'error');
      return;
    }
    agregarAlCarritoGlobal(producto);
    addToast(`${producto.nombre} añadido al carrito 🛒`, 'success');
  };

  if (cargando) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-4 font-sans pb-12">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-4 text-white shadow-md flex items-center gap-3 relative overflow-hidden">
        <div className="text-3xl animate-bounce">👦🏻</div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-blue-200">Maxi Despachador</p>
          <p className="text-sm font-bold leading-tight mt-0.5">
            {productosFiltrados.length === 0 ? "¡La nevera está vacía! Ve a 'La Cocina' para preparar dulces." : "¡Toca un producto para añadirlo al carrito!"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap justify-center gap-1 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex-1">
          {[
            { key: 'congelador', icon: IceCream, label: 'Congelador' },
            { key: 'frio', icon: ThermometerSnowflake, label: 'Frío' },
            { key: 'mostrador', icon: Store, label: 'Mostrador' },
            { key: 'general', icon: Package, label: 'General' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setCategoriaActiva(key)}
              className={`px-3 py-2 rounded-xl font-black text-sm flex items-center gap-1 transition-all ${categoriaActiva === key ? 'bg-blue-100 text-blue-700' : 'text-slate-400 bg-slate-50'}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            if (modoSeleccionMultiple) cancelarSeleccionMultiple();
            else setModoSeleccionMultiple(true);
          }}
          className={`px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1 ${modoSeleccionMultiple ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          {modoSeleccionMultiple ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
          {modoSeleccionMultiple ? 'Cancelar' : 'Múltiple'}
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-3 shadow-sm min-h-[400px] relative">
        <div className="w-full h-2 bg-slate-300 rounded-full mb-4 opacity-40" />
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">❄️</div>
            <p className="text-slate-400 font-medium">Esta vitrina está vacía</p>
            <p className="text-xs text-slate-400 mt-1">Prepara algo delicioso o compra productos para vender.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {productosFiltrados.map((p) => {
              const agotado = p.stock_actual <= 0;
              const seleccionado = modoSeleccionMultiple && seleccionados[p.id];
              return (
                <div key={p.id} className="relative group">
                  <div
                    onClick={() => modoSeleccionMultiple ? toggleSeleccion(p) : handleTocarProducto(p)}
                    className={`bg-slate-50 p-3 rounded-2xl border flex flex-col justify-between relative overflow-hidden active:scale-95 transition-all min-h-[140px] w-full cursor-pointer ${agotado ? 'opacity-40 border-slate-200 grayscale' : 'border-slate-100 shadow-sm bg-white'} ${seleccionado ? 'ring-2 ring-green-500' : ''}`}
                  >
                    {modoSeleccionMultiple && (
                      <div className="absolute top-2 left-2">
                        {seleccionado ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                      </div>
                    )}
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-12 h-12 rounded-full object-cover mb-2 self-center" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-2 self-center text-slate-500 text-xs">Sin img</div>
                    )}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full w-fit mt-1 ${p.stock_actual <= 3 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {agotado ? 'Agotado' : `Disp: ${p.stock_actual}`}
                    </span>
                    <h3 className="font-black text-slate-700 text-sm mt-2 leading-tight line-clamp-2">{p.nombre}</h3>
                    <div className="mt-2 pt-2 border-t border-slate-100 w-full">
                      <p className="text-base font-black text-emerald-600 leading-none">${p.precio_venta_usd.toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-none">{(p.precio_venta_usd * (tasaBcv || 1)).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</p>
                    </div>
                  </div>

                  {!modoSeleccionMultiple && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setProductoAMover(p); setNuevaCategoria(p.categoria || 'general'); setMostrarMoverModal(true); }} className="p-1.5 bg-white border border-slate-200 rounded-lg text-purple-500 hover:bg-purple-50 active:scale-90 shadow-sm" title="Mover categoría"><Move className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); abrirEditar(p); }} className="p-1.5 bg-white border border-slate-200 rounded-lg text-blue-500 hover:bg-blue-50 active:scale-90 shadow-sm" title="Editar"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); eliminarProducto(p.id); }} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-90 shadow-sm" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modoSeleccionMultiple && Object.keys(seleccionados).length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
            <h4 className="font-black text-slate-800 mb-2">Productos seleccionados</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(seleccionados).map(([id, cant]) => {
                const prod = productosFiltrados.find(p => p.id === id);
                if (!prod) return null;
                return (
                  <div key={id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                    <span className="font-bold text-sm truncate w-1/2">{prod.nombre}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => actualizarCantidadSeleccion(id, cant - 1)} className="p-1 bg-white rounded-full shadow"><Minus className="w-4 h-4" /></button>
                      <input type="number" value={cant} onChange={(e) => actualizarCantidadSeleccion(id, parseInt(e.target.value) || 0)} className="w-12 text-center border rounded-lg py-1" min="0" max={prod.stock_actual} />
                      <button onClick={() => actualizarCantidadSeleccion(id, cant + 1)} className="p-1 bg-white rounded-full shadow"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={añadirSeleccionadosAlCarrito} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-black">Añadir al carrito</button>
              <button onClick={cancelarSeleccionMultiple} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-xl font-black">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarMoverModal && productoAMover && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarMoverModal(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8">
              <div className="flex justify-between items-center mb-4"><h3 className="font-black text-xl text-slate-800">Mover producto</h3><button onClick={() => setMostrarMoverModal(false)} className="bg-slate-100 p-2 rounded-full"><X className="w-5 h-5" /></button></div>
              <p className="text-slate-600 mb-3">Mover "{productoAMover.nombre}" a:</p>
              <select value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 font-bold mb-4">
                <option value="congelador">Congelador</option>
                <option value="frio">Frío</option>
                <option value="mostrador">Mostrador</option>
                <option value="general">General</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => { moverCategoria(productoAMover, nuevaCategoria); setMostrarMoverModal(false); }} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-black">Mover</button>
                <button onClick={() => setMostrarMoverModal(false)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-black">Cancelar</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarEditarModal && productoEditando && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarEditarModal(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8">
              <div className="flex justify-between items-center mb-4"><h3 className="font-black text-xl text-slate-800">✏️ Editar Producto</h3><button onClick={() => setMostrarEditarModal(false)} className="bg-slate-100 p-2 rounded-full"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleGuardarEdicion} className="space-y-4">
                <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" required />
                <select value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold">
                  <option value="congelador">Congelador</option>
                  <option value="frio">Frío</option>
                  <option value="mostrador">Mostrador</option>
                  <option value="general">General</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative"><span className="absolute left-3 top-3 text-emerald-600 font-bold text-sm">$</span><input type="text" inputMode="decimal" value={editPrecioUsd} onChange={(e) => { setEditPrecioUsd(e.target.value); const num = parseFloat(e.target.value.replace(',', '.')); if (!isNaN(num)) setEditPrecioBs((num * (tasaBcv || 1)).toFixed(2)); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-blue-500 font-bold" required /></div>
                  <div className="relative"><span className="absolute left-3 top-3 text-amber-600 font-bold text-sm">Bs</span><input type="text" inputMode="decimal" value={editPrecioBs} onChange={(e) => { setEditPrecioBs(e.target.value); const num = parseFloat(e.target.value.replace(',', '.')); if (!isNaN(num) && tasaBcv) setEditPrecioUsd((num / tasaBcv).toFixed(2)); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-blue-500 font-bold" /></div>
                </div>
                <input type="number" min="0" step="1" value={editStock} onChange={(e) => setEditStock(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" required />
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-2 text-center">
                  <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setEditImagen(file); setEditImagenPreview(URL.createObjectURL(file)); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {editImagenPreview ? <img src={editImagenPreview} alt="preview" className="w-16 h-16 rounded-full object-cover mx-auto" /> : <p className="text-xs text-slate-400">Toca para subir imagen</p>}
                </div>
                <button type="submit" disabled={guardandoEdicion} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center">
                  {guardandoEdicion ? <Loader2 className="w-6 h-6 animate-spin" /> : 'GUARDAR CAMBIOS'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}