import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Plus, Minus, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MiNevera({ usuario, tasaBcv }) {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(false); // Blindado
  const [despachando, setDespachando] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [exitoVisual, setExitoVisual] = useState(false);

  useEffect(() => {
    if (usuario?.id) cargarNevera();
  }, [usuario]);

  const cargarNevera = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase.from('productos').select('*').eq('user_id', usuario.id).order('nombre', { ascending: true });
      if (error) throw error;
      if (data) setProductos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
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
      for (const item of carrito) {
        await supabase.from('ventas').insert([{
          user_id: usuario.id,
          producto_id: item.id,
          cantidad: item.cantidadSeleccionada,
          total_usd: item.precio_venta_usd * item.cantidadSeleccionada,
          total_bs: (item.precio_venta_usd * item.cantidadSeleccionada) * tasaBcv,
          tasa_bcv_momento: tasaBcv
        }]);
        await supabase.from('productos').update({ stock_actual: item.stock_actual - item.cantidadSeleccionada }).eq('id', item.id);
      }
      setCarrito([]); setMostrarCheckout(false); setExitoVisual(true);
      await cargarNevera();
      setTimeout(() => setExitoVisual(false), 2000);
    } catch (e) {
      alert("Error al despachar: " + e.message);
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
                <button key={p.id} onClick={() => tocarProducto(p)} disabled={agotado} className={`bg-slate-50 p-3 rounded-2xl border text-left flex flex-col justify-between relative overflow-hidden active:scale-95 transition-all min-h-[140px] ${agotado ? 'opacity-40 border-slate-200 grayscale' : 'border-slate-100 shadow-sm bg-white'}`}>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full w-fit ${p.stock_actual <= 3 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {agotado ? 'Agotado' : `Disp: ${p.stock_actual}`}
                  </span>
                  <h3 className="font-black text-slate-700 text-sm mt-3 leading-tight line-clamp-2">{p.nombre}</h3>
                  <div className="mt-4 pt-2 border-t border-slate-100 w-full">
                    <p className="text-base font-black text-emerald-600 leading-none">${p.precio_venta_usd.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-none">{(p.precio_venta_usd * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {exitoVisual && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-x-4 top-1/3 mx-auto max-w-xs bg-emerald-500 text-white p-4 rounded-3xl shadow-2xl flex flex-col items-center text-center z-50 border-4 border-white">
            <CheckCircle2 className="w-12 h-12 animate-pulse mb-1" />
            <h4 className="font-black text-lg">¡Venta Despachada!</h4>
            <p className="text-xs font-medium text-emerald-100">Dinero en caja y stock actualizado.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarCheckout && carrito.length > 0 && (
          <>
            <div className="fixed inset-0 bg-slate-900/40 z-40 max-w-md mx-auto" onClick={() => setMostrarCheckout(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] z-50 p-5 pb-8 border-t border-slate-100">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><ShoppingBag className="text-blue-500 w-5 h-5" /> Bolsa de Cobro</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{carrito.length} rubros</span>
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 mb-4">
                {carrito.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-700 text-sm truncate">{item.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-black text-emerald-600">${(item.precio_venta_usd * item.cantidadSeleccionada).toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-400">{(item.precio_venta_usd * item.cantidadSeleccionada * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button onClick={() => modificarCantidad(item.id, -1)} className="p-1 text-slate-500 active:bg-slate-100 rounded-lg"><Minus className="w-3 h-3" /></button>
                      <span className="font-black text-slate-800 text-sm px-1">{item.cantidadSeleccionada}</span>
                      <button onClick={() => modificarCantidad(item.id, 1)} className="p-1 text-slate-500 active:bg-slate-100 rounded-lg"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-slate-200 pt-4 pb-4 flex justify-between items-center">
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
              <button onClick={finalizarDespacho} disabled={despachando} className="w-full bg-blue-600 text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.98] active:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300">
                {despachando ? <Loader2 className="w-5 h-5 animate-spin" /> : <>💰 CONFIRMAR Y RECIBIR PAGO</>}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}