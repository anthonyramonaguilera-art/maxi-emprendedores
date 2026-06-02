import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, VolumeX, Trash2 } from 'lucide-react';
import {
  chatAbierto, historial, eventosPendientes, noMolestar, escribiendo,
  toggleChat, cerrarChat, agregarMensaje, limpiarHistorial, setNoMolestar,
  limpiarEventos, setEscribiendo
} from '../store/maxiStore';
import { generarRespuesta, generarMensajeEvento } from '../lib/maxiResponses';

export default function MaxiAssistant({ usuario }) {
  const abierto = useStore(chatAbierto);
  const mensajes = useStore(historial);
  const eventos = useStore(eventosPendientes);
  const noMolestarActivo = useStore(noMolestar);
  const escribiendoEstado = useStore(escribiendo);

  const [input, setInput] = useState('');
  const finalRef = useRef(null);

  // Procesar eventos pendientes al abrir el chat
  useEffect(() => {
    if (abierto && eventos.length > 0) {
      eventos.forEach(evento => {
        const msg = generarMensajeEvento(evento);
        if (msg) agregarMensaje('maxi', msg);
      });
      limpiarEventos();
    }
  }, [abierto, eventos]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, escribiendoEstado]);

  const handleEnviar = async () => {
    const texto = input.trim();
    if (!texto) return;

    agregarMensaje('user', texto);
    setInput('');
    setEscribiendo(true);

    try {
      const respuesta = await generarRespuesta(texto, usuario?.id);
      agregarMensaje('maxi', respuesta);
    } catch (error) {
      agregarMensaje('maxi', '🙏 Perdón, hubo un problemita. ¿Podrías intentar de nuevo?');
    } finally {
      setEscribiendo(false);
    }
  };

  const sugerencias = [
    'Dame un resumen',
    'Dame un consejo',
    '¿Cómo agrego un insumo?',
    '¿Cómo vendo un producto?',
    '¿Qué es una racha?'
  ];

  const handleSugerencia = (text) => {
    agregarMensaje('user', text);
    setEscribiendo(true);
    generarRespuesta(text, usuario?.id)
      .then(res => agregarMensaje('maxi', res))
      .catch(() => agregarMensaje('maxi', '¡Ups! Algo falló 😔'))
      .finally(() => setEscribiendo(false));
  };

  const mensajesNoLeidos = eventos.length;

  if (noMolestarActivo) return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={toggleChat}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-xl shadow-purple-200 flex items-center justify-center active:scale-90 transition-transform"
        title="Hablar con Maxi"
      >
        {abierto ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {mensajesNoLeidos > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-black">
                {mensajesNoLeidos}
              </span>
            )}
          </>
        )}
      </button>

      {/* Modal del chat */}
      <AnimatePresence>
        {abierto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-[65] max-w-md mx-auto backdrop-blur-sm"
              onClick={cerrarChat}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] flex flex-col overflow-hidden"
              style={{ maxHeight: '85vh' }}
            >
              {/* Encabezado */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-inner">
                    👦🏻
                  </div>
                  <div>
                    <h3 className="font-black text-lg">Maxi</h3>
                    <p className="text-xs text-blue-100">Tu asistente y amigo</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNoMolestar(true)}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                    title="No molestar (oculta a Maxi)"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cerrarChat}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Cuerpo del chat */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
                {mensajes.length === 0 && (
                  <div className="text-center text-slate-400 mt-10">
                    <p className="font-black text-2xl">👋 ¡Hola!</p>
                    <p className="text-sm mt-2">Soy Maxi, tu asistente. Pregúntame lo que necesites.</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {sugerencias.map(s => (
                        <button
                          key={s}
                          onClick={() => handleSugerencia(s)}
                          className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-50 active:scale-95 transition"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mensajes.map((msg, i) => (
                  <div key={i} className={`flex ${msg.tipo === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm font-medium ${msg.tipo === 'user' ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'}`}>
                      {msg.texto.split('\n').map((line, j) => (
                        <span key={j}>{line}<br /></span>
                      ))}
                    </div>
                  </div>
                ))}

                {escribiendoEstado && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                      <span className="text-sm text-slate-400 animate-pulse">Maxi está escribiendo...</span>
                    </div>
                  </div>
                )}
                <div ref={finalRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-indigo-400 text-sm"
                  />
                  <button
                    onClick={handleEnviar}
                    disabled={!input.trim() || escribiendoEstado}
                    className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 transition active:scale-90"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={limpiarHistorial}
                  className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 mx-auto"
                >
                  <Trash2 className="w-3 h-3" /> Limpiar conversación
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}