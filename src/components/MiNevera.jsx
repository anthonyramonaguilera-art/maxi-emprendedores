import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Plus, Minus, CheckCircle2, Loader2, X, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addToast } from '../store/toastStore';
import { incrementarRacha } from '../store/rachaStore'; // ✅ NUEVO
import { notificarVenta } from '../lib/maxiEventEmitter';

export default function MiNevera({ usuario, tasaBcv }) {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [despachando, setDespachando] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [exitoVisual, setExitoVisual] = useState(false);

  // --- Estado para Edición ---
  const [mostrarEditarModal, setMostrarEditarModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPrecioUsd, setEditPrecioUsd] = useState('');
  const [editPrecioBs, setEditPrecioBs] = useState('');
  const [editStock, setEditStock] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    cargarNevera();
  }, [usuario]);

  const cargarNevera = async () => {
    let currentUserId = usuario?.id;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }
    if (!currentUserId) return;

    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('user_id', currentUserId)
        .order('nombre', { ascending: true });
      if (error) throw error;
      if (data) setProductos(data);
    } catch (error) {
      console.error("Error cargando la nevera:", error);
    } finally {
      setCargando(false);
    }
  };

  // --- ABRIR MODAL DE EDICIÓN (cargar valores en ambos campos) ---
  const abrirEditar = (producto) => {
    setProductoEditando(producto);
    setEditNombre(producto.nombre);
    const usd = producto.precio_venta_usd.toString();
    setEditPrecioUsd(usd);
    const tasa = tasaBcv || 1;
    setEditPrecioBs((parseFloat(usd.replace(',', '.')) * tasa).toFixed(2));
    setEditStock(producto.stock_actual.toString());
    setMostrarEditarModal(true);
  };

  // --- MANEJADORES DE CONVERSIÓN USD <-> Bs ---
  const handleEditUsdChange = (value) => {
    const raw = value.replace(',', '.');
    setEditPrecioUsd(value);
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      const tasa = tasaBcv || 1;
      setEditPrecioBs((num * tasa).toFixed(2));
    } else {
      setEditPrecioBs('');
    }
  };

  const handleEditBsChange = (value) => {
    const raw = value.replace(',', '.');
    setEditPrecioBs(value);
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      const tasa = tasaBcv || 1;
      if (tasa > 0) {
        setEditPrecioUsd((num / tasa).toFixed(2));
      } else {
        setEditPrecioUsd('');
      }
    } else {
      setEditPrecioUsd('');
    }
  };

  // --- GUARDAR EDICIÓN ---
  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!editNombre || !editPrecioUsd || !editStock) {
      addToast('Completa todos los campos', 'error');
      return;
    }

    const precio = parseFloat(editPrecioUsd.toString().replace(',', '.'));
    const stock = parseInt(editStock, 10);

    if (isNaN(precio) || precio <= 0) {
      addToast('Precio inválido', 'error');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      addToast('Stock no puede ser negativo', 'error');
      return;
    }

    setGuardandoEdicion(true);
    try {
      const { error } = await supabase
        .from('productos')
        .update({
          nombre: editNombre.trim(),
          precio_venta_usd: precio,
          stock_actual: stock,
        })
        .eq('id', productoEditando.id);

      if (error) throw error;

      setMostrarEditarModal(false);
      addToast('Producto actualizado', 'success');
      await cargarNevera();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // --- ELIMINAR PRODUCTO ---
  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto de la nevera?')) return;
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
      addToast('Producto eliminado', 'success');
      await cargarNevera();
    } catch (err) {
      addToast('Error al eliminar: ' + err.message, 'error');
    }
  };

  const tocarProducto = (producto) => {
    if (producto.stock_actual <= 0) return;
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      if (existe.cantidadSeleccionada >= producto.stock_actual) return;
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidadSeleccionada: item.cantidadSeleccionada + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidadSeleccionada: 1 }]);
    }
    setMostrarCheckout(true);
  };

  const modificarCantidad = (id, incremento) => {
    setCarrito(
      carrito.map(item => {
        if (item.id === id) {
          const nuevaCant = item.cantidadSeleccionada + incremento;
          if (nuevaCant <= 0) return null;
          if (nuevaCant > item.stock_actual) return item;
          return { ...item, cantidadSeleccionada: nuevaCant };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const totalUsd = carrito.reduce((acc, item) => acc + (item.precio_venta_usd * item.cantidadSeleccionada), 0);
  const totalBs = totalUsd * (tasaBcv || 1);

  const finalizarDespacho = async () => {
    setDespachando(true);
    try {
      let currentUserId = usuario?.id;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session.user.id;
      }

      for (const item of carrito) {
        await supabase.from('ventas').insert([{
          user_id: currentUserId,
          producto_id: item.id,
          cantidad: item.cantidadSeleccionada,
          total_usd: item.precio_venta_usd * item.cantidadSeleccionada,
          total_bs: (item.precio_venta_usd * item.cantidadSeleccionada) * (tasaBcv || 1),
          tasa_bcv_momento: tasaBcv || 1
        }]);
        await supabase.from('productos').update({ stock_actual: item.stock_actual - item.cantidadSeleccionada }).eq('id', item.id);
      }
      setCarrito([]); setMostrarCheckout(false); setExitoVisual(true);
      await cargarNevera();
      setTimeout(() => setExitoVisual(false), 2000);

      // ✅ Actualizar racha de ventas
      incrementarRacha('ventas');
      notificarVenta({ totalUsd });
    } catch (e) {
      addToast("Error al despachar: " + e.message, 'error');
    } finally {
      setDespachando(false);
    }
  };

  if (cargando) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-4 font-sans pb-12">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-4 text-white shadow-md flex items-center gap-3 relative overflow-hidden">
        <div className="text-3xl animate-bounce">👦🏻</div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-blue-200">Maxi Despachador</p>
          <p className="text-sm font-bold leading-tight mt-0.5">
            {productos.length === 0 ? "¡La nevera está vacía! Ve a 'La Cocina' para preparar dulces." : "¡Mostrador listo! Toca la vitrina para armar el pedido."}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-3 shadow-sm min-h-[400px] relative">
        <div className="w-full h-2 bg-slate-300 rounded-full mb-4 opacity-40" />
        {productos.length === 0 ? (
          <div className="text-center py-20 text-slate-400 italic text-sm">No tienes postres en exhibición.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {productos.map((p) => {
              const agotado = p.stock_actual <= 0;
              return (
                <div key={p.id} className="relative group">
                  <button
                    onClick={() => tocarProducto(p)}
                    disabled={agotado}
                    className={`bg-slate-50 p-3 rounded-2xl border text-left flex flex-col justify-between relative overflow-hidden active:scale-95 transition-all min-h-[140px] w-full ${agotado ? 'opacity-40 border-slate-200 grayscale' : 'border-slate-100 shadow-sm bg-white'}`}
                  >
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full w-fit ${p.stock_actual <= 3 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {agotado ? 'Agotado' : `Disp: ${p.stock_actual}`}
                    </span>
                    <h3 className="font-black text-slate-700 text-sm mt-3 leading-tight line-clamp-2">{p.nombre}</h3>
                    <div className="mt-4 pt-2 border-t border-slate-100 w-full">
                      <p className="text-base font-black text-emerald-600 leading-none">${p.precio_venta_usd.toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-none">{(p.precio_venta_usd * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</p>
                    </div>
                  </button>

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEditar(p);
                      }}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-blue-500 hover:bg-blue-50 active:scale-90 shadow-sm"
                      title="Editar producto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarProducto(p.id);
                      }}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-90 shadow-sm"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      <AnimatePresence>
        {mostrarEditarModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm"
              onClick={() => setMostrarEditarModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-xl text-slate-800">✏️ Editar Producto</h3>
                <button
                  onClick={() => setMostrarEditarModal(false)}
                  className="bg-slate-100 p-2 rounded-full text-slate-500 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={guardarEdicion} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>

                {/* Doble moneda para precio de venta */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Precio de venta</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-emerald-600 font-bold text-sm">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editPrecioUsd}
                        onChange={(e) => handleEditUsdChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-blue-500 font-bold"
                        required
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-amber-600 font-bold text-sm">Bs</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editPrecioBs}
                        onChange={(e) => handleEditBsChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-blue-500 font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1 mt-1">
                    Tasa: {tasaBcv?.toFixed(2) || '---'} Bs/$
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Stock actual</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center"
                >
                  {guardandoEdicion ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    'GUARDAR CAMBIOS'
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CHECKOUT (SIN CAMBIOS) */}
      <AnimatePresence>
        {exitoVisual && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-x-4 top-1/3 mx-auto max-w-xs bg-emerald-500 text-white p-4 rounded-3xl shadow-2xl flex flex-col items-center text-center z-[80] border-4 border-white">
            <CheckCircle2 className="w-12 h-12 animate-pulse mb-1" />
            <h4 className="font-black text-lg">¡Venta Despachada!</h4>
            <p className="text-xs font-medium text-emerald-100">Dinero en caja y stock actualizado.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarCheckout && carrito.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarCheckout(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-[70] p-6 pb-8 border-t border-slate-100 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-blue-500 w-6 h-6" /> 
                  <h3 className="font-black text-slate-800 text-xl">Tu Venta</h3>
                </div>
                <button onClick={() => setMostrarCheckout(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 active:scale-90"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-2 overflow-y-auto pr-1 mb-4 flex-1">
                {carrito.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-700 text-sm truncate">{item.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-black text-emerald-600">${(item.precio_venta_usd * item.cantidadSeleccionada).toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-400">{(item.precio_venta_usd * item.cantidadSeleccionada * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
                      <button onClick={() => modificarCantidad(item.id, -1)} className="p-1 text-slate-500 active:bg-slate-100 rounded-lg"><Minus className="w-4 h-4" /></button>
                      <span className="font-black text-slate-800 text-sm px-1 w-4 text-center">{item.cantidadSeleccionada}</span>
                      <button onClick={() => modificarCantidad(item.id, 1)} className="p-1 text-slate-500 active:bg-slate-100 rounded-lg"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-slate-200 pt-4 pb-4 flex justify-between items-center shrink-0">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Total a Cobrar</p>
                  <p className="text-3xl font-black text-emerald-600 leading-none mt-1">${totalUsd.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="bg-amber-100 text-amber-800 font-black text-sm px-3 py-1.5 rounded-xl shadow-sm block">
                    {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                  </span>
                </div>
              </div>
              <button onClick={finalizarDespacho} disabled={despachando} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 shrink-0">
                {despachando ? <Loader2 className="w-6 h-6 animate-spin" /> : <>💰 CONFIRMAR Y RECIBIR PAGO</>}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}