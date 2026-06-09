import { ShoppingBag, Plus, Minus, CheckCircle2, Loader2, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { carritoStore, modificarCantidadCarrito, vaciarCarritoStore } from '../store/carritoStore';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { addToast } from '../store/toastStore';
import { incrementarRacha } from '../store/rachaStore';
import { notificarVenta, notificarPrimeraVentaDelDia } from '../lib/maxiEventEmitter';
import { desbloquearLogro, verificarLogrosRacha } from '../store/logrosStore';
import { updateProducto, crearVenta } from '../services/productosService';

export default function Carrito({ usuario, tasaBcv, playSound }) {
  const carrito = useStore(carritoStore);
  const [despachando, setDespachando] = useState(false);
  const [exitoVisual, setExitoVisual] = useState(false);
  const [mostrarFormFiado, setMostrarFormFiado] = useState(false);
  const [clienteFiado, setClienteFiado] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  // Venta al contado
  const finalizarDespacho = async () => {
    if (carrito.length === 0) return;
    setDespachando(true);
    try {
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
      const { count: ventasHoyCount } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .gte('created_at', inicioHoy);

      for (const item of carrito) {
        await crearVenta({
          user_id: usuario.id,
          producto_id: item.id,
          cantidad: item.cantidadSeleccionada,
          total_usd: item.precio_venta_usd * item.cantidadSeleccionada,
          total_bs: (item.precio_venta_usd * item.cantidadSeleccionada) * (tasaBcv || 1),
          tasa_bcv_momento: tasaBcv || 1,
        });
        await updateProducto(item.id, { stock_actual: item.stock_actual - item.cantidadSeleccionada });
      }

      const { count: totalVentasGlobal } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id);
      if (totalVentasGlobal === 1) desbloquearLogro('primera_venta');

      incrementarRacha('ventas');
      const rachas = (await import('../store/rachaStore')).rachasStore.get();
      const rachaVentas = rachas.ventas?.racha || 0;
      verificarLogrosRacha(rachaVentas);
      if ([3, 7, 14, 30].includes(rachaVentas)) {
        import('../lib/maxiEventEmitter').then(({ notificarRachaAlcanzada }) =>
          notificarRachaAlcanzada(rachaVentas)
        );
      }
      if (!ventasHoyCount || ventasHoyCount === 0) {
        notificarPrimeraVentaDelDia();
      }

      const totalUsd = carrito.reduce((acc, i) => acc + (i.precio_venta_usd * i.cantidadSeleccionada), 0);
      notificarVenta({ totalUsd });
      if (playSound) playSound('cash_register');
      addToast(`💰 Venta realizada: $${totalUsd.toFixed(2)}`, 'success');

      vaciarCarritoStore();
      setExitoVisual(true);
      setTimeout(() => setExitoVisual(false), 2000);
    } catch (e) {
      addToast('Error al despachar: ' + e.message, 'error');
      if (playSound) playSound('alert');
    } finally {
      setDespachando(false);
    }
  };

  // Venta a crédito (fiado)
  const finalizarCredito = async (e) => {
    e.preventDefault();
    if (!clienteFiado.trim()) {
      addToast('Ingresa el nombre del cliente', 'error');
      return;
    }
    setDespachando(true);
    try {
      const totalUsd = carrito.reduce((acc, i) => acc + (i.precio_venta_usd * i.cantidadSeleccionada), 0);
      const fechaVenc = fechaVencimiento
        ? new Date(fechaVencimiento).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString();

      // 1. Crear el fiado
      const { data: fiado, error: fiadoError } = await supabase
        .from('fiados')
        .insert({
          user_id: usuario.id,
          cliente: clienteFiado.trim(),
          monto_total: totalUsd,
          monto_usd: totalUsd,
          monto_abonado: 0,
          fecha_vencimiento: fechaVenc,
          descripcion: 'Venta a crédito desde carrito',
          estado: 'Pendiente'
        })
        .select()
        .single();
      if (fiadoError) throw fiadoError;

      // 2. Descontar stock y registrar ventas asociadas al fiado
      for (const item of carrito) {
        await crearVenta({
          user_id: usuario.id,
          producto_id: item.id,
          cantidad: item.cantidadSeleccionada,
          total_usd: item.precio_venta_usd * item.cantidadSeleccionada,
          total_bs: (item.precio_venta_usd * item.cantidadSeleccionada) * (tasaBcv || 1),
          tasa_bcv_momento: tasaBcv || 1,
          fiado_id: fiado.id
        });
        await updateProducto(item.id, { stock_actual: item.stock_actual - item.cantidadSeleccionada });
      }

      addToast(`📒 Fiado registrado para ${clienteFiado.trim()} por $${totalUsd.toFixed(2)}`, 'success');
      if (playSound) playSound('pencil_write');

      vaciarCarritoStore();
      setMostrarFormFiado(false);
      setClienteFiado('');
      setFechaVencimiento('');
      setExitoVisual(true);
      setTimeout(() => setExitoVisual(false), 2000);
    } catch (e) {
      addToast('Error al registrar fiado: ' + e.message, 'error');
      if (playSound) playSound('alert');
    } finally {
      setDespachando(false);
    }
  };

  const totalUsd = carrito.reduce((acc, i) => acc + (i.precio_venta_usd * i.cantidadSeleccionada), 0);
  const totalBs = totalUsd * (tasaBcv || 1);

  return (
    <div className="space-y-4 font-sans pb-24">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-4 text-white shadow-md flex items-center gap-3">
        <ShoppingBag className="w-8 h-8" />
        <div>
          <h2 className="font-black text-xl">Tu Carrito</h2>
          <p className="text-blue-100 text-sm">{carrito.length} producto(s)</p>
        </div>
      </div>

      {carrito.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-slate-400 font-medium text-lg">Tu carrito está vacío</p>
          <p className="text-slate-400 text-sm mt-1">Ve a Mi Nevera para añadir productos.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
            {carrito.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700 text-sm truncate">{item.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-emerald-600">
                      ${(item.precio_venta_usd * item.cantidadSeleccionada).toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {(item.precio_venta_usd * item.cantidadSeleccionada * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button onClick={() => modificarCantidadCarrito(item.id, -1)} className="p-1 text-slate-500 active:bg-slate-100 rounded-lg"><Minus className="w-4 h-4"/></button>
                  <span className="font-black text-slate-800 text-sm px-1 w-4 text-center">{item.cantidadSeleccionada}</span>
                  <button onClick={() => modificarCantidadCarrito(item.id, 1)} className="p-1 text-slate-500 active:bg-slate-100 rounded-lg"><Plus className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-bold text-sm">Total a cobrar</span>
              <div className="text-right">
                <p className="text-2xl font-black text-emerald-600">${totalUsd.toFixed(2)}</p>
                <p className="text-xs font-bold text-slate-400">{totalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={finalizarDespacho}
                disabled={despachando}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
              >
                {despachando ? <Loader2 className="w-6 h-6 animate-spin" /> : <>💰 Contado</>}
              </button>
              <button
                onClick={() => setMostrarFormFiado(true)}
                disabled={despachando}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
              >
                <BookOpen className="w-5 h-5" /> Crédito
              </button>
            </div>
            <button
              onClick={() => vaciarCarritoStore()}
              className="w-full mt-2 text-slate-400 text-sm font-bold"
            >
              Vaciar carrito
            </button>
          </div>
        </>
      )}

      {/* Modal de venta a crédito */}
      <AnimatePresence>
        {mostrarFormFiado && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarFormFiado(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><BookOpen className="text-rose-500" /> Vender a crédito</h3>
                <button onClick={() => setMostrarFormFiado(false)} className="bg-slate-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={finalizarCredito} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Cliente</label>
                  <input
                    type="text"
                    required
                    value={clienteFiado}
                    onChange={e => setClienteFiado(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 font-black"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Fecha de vencimiento (opcional)</label>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={e => setFechaVencimiento(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500"
                  />
                </div>
                <p className="text-sm text-slate-600">Total a deber: <span className="font-black text-rose-600">${totalUsd.toFixed(2)}</span></p>
                <button type="submit" disabled={despachando} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2">
                  {despachando ? <Loader2 className="animate-spin w-6 h-6" /> : <BookOpen className="w-5 h-5" />} REGISTRAR FIADO
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exitoVisual && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-x-4 top-1/3 mx-auto max-w-xs bg-emerald-500 text-white p-4 rounded-3xl shadow-2xl flex flex-col items-center text-center z-[80] border-4 border-white">
            <CheckCircle2 className="w-12 h-12 animate-pulse mb-1" />
            <h4 className="font-black text-lg">¡Operación Exitosa!</h4>
            <p className="text-xs font-medium text-emerald-100">El stock se ha actualizado.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}