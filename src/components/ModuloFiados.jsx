import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookMarked, User, Calendar, Bell, Loader2, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ModuloFiados({ usuario }) {
  const [deudas, setDeudas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [montoAbono, setMontoAbono] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(null);

  useEffect(() => {
    if (usuario?.id) {
      solicitarPermisoNotificaciones();
      cargarLibroFiados();
    }
  }, [usuario]);

  const solicitarPermisoNotificaciones = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const cargarLibroFiados = async () => {
    setCargando(true);
    const { data } = await supabase.from('fiados').select('*').eq('user_id', usuario.id).order('fecha_vencimiento', { ascending: true });
    
    if (data) {
      setDeudas(data);
      verificarFechasYAlentar(data); // Ejecuta el detector de vencimientos
    }
    setCargando(false);
  };

  // --- MOTOR DE ALERTAS / NOTIFICACIONES NATIVAS ---
  const verificarFechasYAlentar = (listaDeudas) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    listaDeudas.forEach(deuda => {
      if (deuda.estado === 'pendiente') {
        const fechaVence = new Date(deuda.fecha_vencimiento + 'T00:00:00');
        const diferenciaTiempo = fechaVence.getTime() - hoy.getTime();
        const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));

        // Lógica de disparo de alertas: si vence hoy, mañana o pasado mañana
        if (diasRestantes <= 2 && diasRestantes >= 0) {
          new Notification("⚠️ Maxi POS: Alerta de Cobro", {
            body: `El crédito de ${deuda.cliente} por $${(deuda.monto_total - deuda.monto_abonado).toFixed(2)} vence en ${diasRestantes === 0 ? 'HOY' : diasRestantes + ' días'}. ¡Recuerda cobrar!`,
            icon: '/logo.png' // Ruta a tu logo local
          });
        } else if (diasRestantes < 0) {
          // Cuenta vencida
          new Notification("🚨 Cuentas Vencidas Recurrentes", {
            body: `¡Atención! La cuenta de ${deuda.cliente} está vencida por ${Math.abs(diasRestantes)} días.`,
            icon: '/logo.png'
          });
        }
      }
    });
  };

  const registrarAbono = async (id, total, abonadoPrevio) => {
    if (!montoAbono || parseFloat(montoAbono) <= 0) return;
    
    const nuevoAbonado = parseFloat(abonadoPrevio) + parseFloat(montoAbono);
    const nuevoEstado = nuevoAbonado >= total ? 'pagado' : 'pendiente';

    await supabase.from('fiados').update({
      monto_abonado: nuevoAbonado,
      estado: nuevoEstado
    }).eq('id', id);

    setMontoAbono('');
    setSeleccionadoId(null);
    alert("¡Abono cargado con éxito!");
    cargarLibroFiados();
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <BookMarked className="text-blue-600 w-7 h-7"/> Cuaderno de Fiados
        </h2>
        <p className="text-slate-500">Cuentas por cobrar, fechas de vencimiento y alertas automáticas al dispositivo.</p>
      </header>

      {cargando ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {deudas.map((d) => {
            const saldoPendiente = d.monto_total - d.monto_abonado;
            const hoy = new Date(); hoy.setHours(0,0,0,0);
            const vencimiento = new Date(d.fecha_vencimiento + 'T00:00:00');
            const diasParaVencer = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

            return (
              <div key={d.id} className={`bg-white p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all ${d.estado === 'pagado' ? 'border-green-100 bg-green-50/20' : diasParaVencer < 0 ? 'border-red-200 bg-red-50/10' : 'border-slate-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-2xl ${d.estado === 'pagado' ? 'bg-green-100 text-green-600' : diasParaVencer < 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    <User />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">{d.cliente}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-400 mt-1 uppercase">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Vence: {new Date(d.fecha_vencimiento).toLocaleDateString('es-VE')}</span>
                      
                      {d.estado === 'pendiente' && (
                        diasParaVencer === 0 ? (
                          <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1"><Bell className="w-3 h-3 animate-bounce"/> VENCE HOY</span>
                        ) : diasParaVencer < 0 ? (
                          <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> VENCIDO POR {Math.abs(diasParaVencer)} DÍAS</span>
                        ) : (
                          <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">Quedan {diasParaVencer} días</span>
                        )
                      )}
                      
                      {d.estado === 'pagado' && <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> COMPLETADO</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-none pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase">Saldo Deuda</p>
                    <p className={`text-xl font-black ${d.estado === 'pagado' ? 'text-green-600' : 'text-slate-800'}`}>${saldoPendiente.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 font-medium">Total original: ${parseFloat(d.monto_total).toFixed(2)}</p>
                  </div>

                  {d.estado === 'pendiente' && (
                    <div className="flex items-center gap-2">
                      {seleccionadoId === d.id ? (
                        <div className="flex gap-1">
                          <input type="number" step="0.01" placeholder="Monto $" value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)} className="w-24 px-3 py-1.5 border rounded-xl outline-none text-sm font-bold" />
                          <button onClick={() => registrarAbono(d.id, d.monto_total, d.monto_abonado)} className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs">Ok</button>
                          <button onClick={() => setSeleccionadoId(null)} className="bg-slate-200 text-slate-600 px-2 py-1.5 rounded-xl text-xs">X</button>
                        </div>
                      ) : (
                        <button onClick={() => setSeleccionadoId(d.id)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-1"><DollarSign className="w-4 h-4"/> Abonar</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {deudas.length === 0 && (
            <p className="text-center text-slate-400 py-10 italic">No tienes ningún crédito activo en tu libreta.</p>
          )}
        </div>
      )}
    </div>
  );
}