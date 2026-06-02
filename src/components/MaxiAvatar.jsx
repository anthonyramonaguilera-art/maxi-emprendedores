import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { maxiVisible, eventosPendientes, limpiarEventos } from '../store/maxiStore';
import { eventosMensajes, consejosDia } from '../lib/maxiData';
import { VolumeX, Volume2 } from 'lucide-react';

// Accesorios según pestaña activa
const accesoriosPorTab = {
  alacena: '🌾',
  cocina: '👨🏻‍🍳',
  nevera: '💰',
  cuentas: '👓',
  configuracion: '🔧',
};

// Mapa de animaciones CSS por tipo de evento
const animacionPorEvento = {
  receta_guardada: 'animate-stir',
  venta_realizada: 'animate-count-money',
  racha_alcanzada: 'animate-celebrate',
  stock_bajo: 'animate-shake',
  fiado_cobrado: 'animate-coin',
  primera_venta_dia: 'animate-cheer',
};

export default function MaxiAvatar({ tabActiva = 'cocina', onSoundToggle, soundEnabled = true }) {
  const [mensajeActual, setMensajeActual] = useState(null);
  const [mostrarBurbuja, setMostrarBurbuja] = useState(false);
  const [animacion, setAnimacion] = useState('');
  const [confeti, setConfeti] = useState(false);
  const visible = useStore(maxiVisible);
  const eventos = useStore(eventosPendientes);
  const timeoutRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  // Procesar eventos entrantes
  useEffect(() => {
    if (!visible) return;
    if (eventos.length === 0) return;

    // Tomar el evento más reciente
    const evento = eventos[eventos.length - 1];
    const { tipo, datos } = evento;
    
    let mensajeObj = eventosMensajes[tipo];
    if (!mensajeObj) {
      // Si no hay mensaje específico, mostrar consejo aleatorio
      const consejo = consejosDia[Math.floor(Math.random() * consejosDia.length)];
      mensajeObj = { mensaje: () => consejo.texto, versiculo: consejo.versiculo };
    }

    const textoMensaje = typeof mensajeObj.mensaje === 'function' ? mensajeObj.mensaje(datos) : mensajeObj.mensaje;
    setMensajeActual({ texto: textoMensaje, versiculo: mensajeObj.versiculo });
    setMostrarBurbuja(true);
    
    // Animación correspondiente
    const anim = animacionPorEvento[tipo] || '';
    setAnimacion(anim);
    if (tipo === 'racha_alcanzada') setConfeti(true);

    // Limpiar después de 4 segundos
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setMostrarBurbuja(false);
      setAnimacion('');
      setConfeti(false);
      limpiarEventos(); // eliminar el evento procesado
    }, 4000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [eventos, visible]);

  if (!visible) return null;

  const accesorio = accesoriosPorTab[tabActiva] || '💼';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center">
      {/* Confeti */}
      {confeti && (
        <>
          <span className="confeti" style={{ left: '-15px', animationDelay: '0s' }}>🎉</span>
          <span className="confeti" style={{ left: '15px', animationDelay: '0.3s' }}>✨</span>
          <span className="confeti" style={{ left: '0px', animationDelay: '0.6s' }}>🎊</span>
        </>
      )}

      {/* Burbuja de mensaje */}
      {mostrarBurbuja && mensajeActual && (
        <div className="mensaje-burbuja">
          <p className="font-medium mb-1">{mensajeActual.texto}</p>
          <p className="text-xs italic text-gray-600">{mensajeActual.versiculo}</p>
        </div>
      )}

      {/* Avatar con animación */}
      <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-1 shadow-lg ${animacion}`}>
        {!imgError ? (
          <img
            src="/images/maxi-base.png"
            alt="Maxi"
            className="w-full h-full object-cover rounded-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-bold text-orange-600">
            M
          </div>
        )}
        {/* Accesorio principal */}
        <span className="absolute -top-1 -right-1 text-2xl drop-shadow-md">
          {accesorio}
        </span>
        {/* Accesorio adicional para cocina: cuchara animada */}
        {tabActiva === 'cocina' && (
          <span className="absolute -top-3 -right-4 text-xl">🥄</span>
        )}
      </div>

      {/* Botón de silencio/volumen (opcional, si se pasa onSoundToggle) */}
      {onSoundToggle && (
        <button
          onClick={onSoundToggle}
          className="mt-2 p-1 bg-white rounded-full shadow-md text-xs flex items-center gap-1"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}