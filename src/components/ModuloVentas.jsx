import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Tag, CheckCircle, Loader2, Send, Store, RefreshCcw, Notebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModuloVentas({ usuario }) {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [tasaBcv, setTasaBcv] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  
  const [perfil, setPerfil] = useState(null);
  const [ticketGenerado, setTicketGenerado] = useState(null);

  // Estados para la opción de Fiar
  const [modoFiado, setModoFiado] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  useEffect(() => {
    const inicializar = async () => {
      try {
        const resTasa = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const dataTasa = await resTasa.json();
        setTasaBcv(dataTasa.promedio);
      } catch (e) { setTasaBcv(500); }

      if (usuario?.id) {
        cargarCatalogo();
        const { data: perfilData } = await supabase.from('perfiles').select('*').eq('user_id', usuario.id).single();
        if (perfilData) setPerfil(perfilData);
      }
    };
    inicializar();
  }, [usuario]);

  const cargarCatalogo = async () => {
    setCargando(true);
    const { data } = await supabase.from('productos').select('*').eq('user_id', usuario.id).gt('stock_actual', 0);
    if (data) setProductos(data);
    setCargando(false);
  };

  const agregarAlCarrito = (producto) => {
    if (ticketGenerado) return; 
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      if (existe.cantidadSeleccionada >= producto.stock_actual) return alert("¡Stock máximo alcanzado!");
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidadSeleccionada: item.cantidadSeleccionada + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidadSeleccionada: 1 }]);
    }
  };

  const totalUsd = carrito.reduce((acc, item) => acc + (item.precio_venta_usd * item.cantidadSeleccionada), 0);
  const totalBs = totalUsd * (tasaBcv || 0);

  const procesarTransaccion = async (esFiado) => {
    if (esFiado && (!nombreCliente || !fechaVencimiento)) {
      return alert("Por favor ingresa el nombre del cliente y la fecha de vencimiento del cobro.");
    }

    setProcesando(true);
    try {
      // 1. Descontar inventario de postres y registrar movimientos
      for (const item of carrito) {
        if (!esFiado) {
          // Venta normal al contado
          await supabase.from('ventas').insert([{
            user_id: usuario.id,
            producto_id: item.id,
            cantidad: item.cantidadSeleccionada,
            total_usd: item.precio_venta_usd * item.cantidadSeleccionada,
            total_bs: (item.precio_venta_usd * item.cantidadSeleccionada) * tasaBcv,
            tasa_bcv_momento: tasaBcv
          }]);
        }

        await supabase.from('productos')
          .update({ stock_actual: item.stock_actual - item.cantidadSeleccionada })
          .eq('id', item.id);
      }

      // 2. Si es fiado, abrir cuenta por cobrar
      if (esFiado) {
        await supabase.from('fiados').insert([{
          user_id: usuario.id,
          cliente: nombreCliente,
          monto_total: totalUsd,
          monto_abonado: 0,
          fecha_vencimiento: fechaVencimiento,
          estado: 'pendiente'
        }]);
      }
      
      // 3. Generar Ticket Visual de confirmación
      setTicketGenerado({
        fecha: new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }),
        items: [...carrito],
        totalUsd: totalUsd,
        totalBs: totalBs,
        tasaBcv: tasaBcv,
        tipo: esFiado ? 'CRÉDITO PENDIENTE' : 'PAGADO',
        cliente: esFiado ? nombreCliente : null,
        vence: esFiado ? fechaVencimiento : null
      });
      
      // Limpieza
      setCarrito([]); 
      setNombreCliente('');
      setFechaVencimiento('');
      setModoFiado(false);
      cargarCatalogo(); 
    } catch (e) { 
      alert("Error: " + e.message); 
    } finally {
      setProcesando(false);
    }
  };

  const enviarPorWhatsApp = () => {
    const nombreNegocio = perfil?.nombre_negocio || 'Maxi POS';
    const mensajeAgradecimiento = perfil?.mensaje_recibo || '¡Gracias por su compra!';
    
    let texto = `🧾 *${ticketGenerado.tipo}* - ${nombreNegocio}\n`;
    texto += `Fecha: ${ticketGenerado.fecha}\n`;
    if (ticketGenerado.cliente) texto += `Cliente: ${ticketGenerado.cliente}\n`;
    if (ticketGenerado.vence) texto += `📅 *Vence el: ${ticketGenerado.vence}*\n`;
    texto += `-----------------------------------\n`;
    
    ticketGenerado.items.forEach(item => {
      texto += `▪ ${item.cantidadSeleccionada}x ${item.nombre} - $${(item.precio_venta_usd * item.cantidadSeleccionada).toFixed(2)}\n`;
    });
    
    texto += `-----------------------------------\n`;
    texto += `💰 *TOTAL: $${ticketGenerado.totalUsd.toFixed(2)}*\n`;
    texto += `💵 *Ref (Bs): ${ticketGenerado.totalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}*\n`;
    
    if (!ticketGenerado.cliente && (perfil?.banco || perfil?.telefono_pago || perfil?.cedula_rif)) {
      texto += `-----------------------------------\n`;
      texto += `📱 *DATOS PAGO MÓVIL*\n`;
      if (perfil.banco) texto += `Banco: ${perfil.banco}\n`;
      if (perfil.telefono_pago) texto += `Teléfono: ${perfil.telefono_pago}\n`;
      if (perfil.cedula_rif) texto += `CI/RIF: ${perfil.cedula_rif}\n`;
    }

    texto += `-----------------------------------\n`;
    texto += `_${mensajeAgradecimiento}_`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* MOSTRADOR */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="text-blue-600"/> Terminal de Venta</h2>
        {cargando ? <p className="text-slate-500 animate-pulse mt-4">Cargando nevera...</p> : productos.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200 mt-4">
            <p className="text-slate-500 font-medium">No hay productos con stock.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4" style={{ opacity: ticketGenerado ? 0.5 : 1 }}>
            {productos.map(p => (
              <button key={p.id} onClick={() => agregarAlCarrito(p)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md text-left flex flex-col justify-between group">
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md mb-2 w-fit">Disp: {p.stock_actual}</span>
                <h4 className="font-bold text-slate-800 mb-2 leading-tight">{p.nombre}</h4>
                <p className="text-xl font-black text-green-600">${p.precio_venta_usd.toFixed(2)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CAJA REGISTRADORA */}
      <div className="lg:col-span-1">
        <AnimatePresence mode="wait">
          {ticketGenerado ? (
            <motion.div key="ticket" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Store className="w-8 h-8"/></div>
              <h3 className="font-black text-xl text-slate-800">{ticketGenerado.tipo}</h3>
              <p className="text-xs text-slate-400 font-bold mb-4">Monto: ${ticketGenerado.totalUsd.toFixed(2)}</p>
              {ticketGenerado.vence && <p className="text-xs font-bold text-red-500 mb-4 bg-red-50 py-2 rounded-xl">📅 Límite de cobro: {ticketGenerado.vence}</p>}
              
              <button onClick={enviarPorWhatsApp} className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold mb-2 flex items-center justify-center gap-2 shadow-md"><Send className="w-5 h-5"/> Enviar Comprobante</button>
              <button onClick={() => setTicketGenerado(null)} className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><RefreshCcw className="w-5 h-5"/> Entendido</button>
            </motion.div>
          ) : (
            <motion.div key="carrito" className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl sticky top-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="text-blue-400"/> Cuenta</h3>
              
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                {carrito.map((item, idx) => (
                  <div key={idx} className="flex justify-between bg-slate-800/50 p-3 rounded-xl text-sm">
                    <span>{item.cantidadSeleccionada}x {item.nombre}</span>
                    <span className="font-bold text-green-400">${(item.precio_venta_usd * item.cantidadSeleccionada).toFixed(2)}</span>
                  </div>
                ))}
                {carrito.length === 0 && <p className="text-slate-500 text-center text-sm py-6">Selecciona productos</p>}
              </div>

              {/* INTERFAZ DINÁMICA DE FIADO */}
              {modoFiado ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-slate-800 p-4 rounded-2xl space-y-3 border border-blue-500/30">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">📝 Registrar en Libro de Fiados</p>
                  <input type="text" placeholder="Nombre del deudor (Ej: Pedro Pérez)" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} className="w-full bg-slate-900 px-3 py-2 rounded-xl outline-none border border-slate-700 text-sm focus:border-blue-500" />
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha de vencimiento (Fecha Fin)</label>
                    <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className="w-full bg-slate-900 px-3 py-2 rounded-xl outline-none border border-slate-700 text-sm text-slate-300 focus:border-blue-500" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => procesarTransaccion(true)} disabled={procesando} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold text-xs shadow-md">CONFIRMAR CRÉDITO</button>
                    <button type="button" onClick={() => setModoFiado(false)} className="px-3 bg-slate-700 text-slate-300 py-2 rounded-xl text-xs">Atrás</button>
                  </div>
                </motion.div>
              ) : (
                <div className="border-t border-slate-700 pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total</span>
                    <span className="text-2xl font-black text-green-400">${totalUsd.toFixed(2)}</span>
                  </div>
                  <p className="text-right text-sm font-bold text-blue-400">{totalBs.toLocaleString('es-VE')} Bs</p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => procesarTransaccion(false)} disabled={procesando || carrito.length === 0} className="w-full bg-green-600 text-white py-3 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2">COBRAR CONTADO</button>
                    <button onClick={() => setModoFiado(true)} disabled={carrito.length === 0} className="w-full bg-slate-800 text-blue-400 border border-blue-500/20 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"><Notebook className="w-4 h-4"/> DEJAR FIADO (A CRÉDITO)</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}