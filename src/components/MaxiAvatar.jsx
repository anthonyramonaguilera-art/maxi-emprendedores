import { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  maxiVisible,
  maxiUltimoEvento,
  limpiarEvento
} from '../store/maxiStore';
import { eventosMensajes, consejosDia } from '../lib/maxiData';

const accesoriosPorTab = {
  alacena: '🌾',
  cocina: '👨🏻‍🍳',
  nevera: '💰',
  cuentas: '👓',
  configuracion: '🔧',
};

export default function MaxiAvatar({ activeTab = 'cocina' }) {
  const visible = useStore(maxiVisible);
  const ultimoEvento = useStore(maxiUltimoEvento);
  const [mensaje, setMensaje] = useState({ texto: '', versiculo: '' });
  const [animacion, setAnimacion] = useState('');
  const [mostrarBurbuja, setMostrarBurbuja] = useState(false);
  const [confeti, setConfeti] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!visible || !ultimoEvento) return;

    const { tipo, data } = ultimoEvento;
    const evento = eventosMensajes[tipo];
    if (!evento) {
      const consejo = consejosDia[Math.floor(Math.random() * consejosDia.length)];
      setMensaje({
        texto: consejo.texto,
        versiculo: consejo.versiculo,
      });
      setAnimacion('');
    } else {
      setMensaje({
        texto: typeof evento.mensaje === 'function' ? evento.mensaje(data) : evento.mensaje,
        versiculo: evento.versiculo,
      });
      switch (tipo) {
        case 'receta_guardada': setAnimacion('animate-stir'); break;
        case 'venta_realizada':
        case 'producto_estrella': setAnimacion('animate-count-money'); break;
        case 'racha_alcanzada': setAnimacion('animate-celebrate'); setConfeti(true); break;
        case 'stock_bajo': setAnimacion('animate-shake'); break;
        case 'fiado_cobrado': setAnimacion('animate-coin'); break;
        case 'primera_venta_dia': setAnimacion('animate-cheer'); break;
        default: setAnimacion('');
      }
    }

    setMostrarBurbuja(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setMostrarBurbuja(false);
      setAnimacion('');
      setConfeti(false);
      limpiarEvento();
    }, 4000);

    return () => clearTimeout(timerRef.current);
  }, [ultimoEvento, visible]);

  if (!visible) return null;

  const accesorio = accesoriosPorTab[activeTab] || '💼';
  const [imgError, setImgError] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center">
      {confeti && (
        <>
          <span className="confeti" style={{ left: '-15px', animationDelay: '0s' }}>🎉</span>
          <span className="confeti" style={{ left: '15px', animationDelay: '0.3s' }}>✨</span>
          <span className="confeti" style={{ left: '0px', animationDelay: '0.6s' }}>🎊</span>
        </>
      )}
      {mostrarBurbuja && (
        <div className="mensaje-burbuja">
          <p className="font-medium mb-1">{mensaje.texto}</p>
          <p className="text-xs italic text-gray-600">{mensaje.versiculo}</p>
        </div>
      )}
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
        <span className="absolute -top-1 -right-1 text-2xl drop-shadow-md">
          {accesorio}
        </span>
        {activeTab === 'cocina' && (
          <span className="absolute -top-3 -right-4 text-xl">🥄</span>
        )}
      </div>
    </div>
  );
}