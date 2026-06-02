// src/hooks/useSound.js
import { useCallback, useEffect, useRef } from 'react';

const sounds = {
  cash_register: '/sounds/cash_register.mp3',
  kitchen_bell: '/sounds/kitchen_bell.mp3',
  pencil_write: '/sounds/pencil_write.mp3',
  coin_drop: '/sounds/coin_drop.mp3',
  celebration: '/sounds/celebration.mp3',
  alert: '/sounds/alert.mp3',
};

export default function useSound() {
  const audioCache = useRef({});
  const isEnabled = useRef(true); // Podrías conectar esto a una configuración del usuario

  const playSound = useCallback((soundName) => {
    if (!isEnabled.current) return;
    if (!soundName || !sounds[soundName]) return;
    
    try {
      let audio = audioCache.current[soundName];
      if (!audio) {
        audio = new Audio(sounds[soundName]);
        audio.preload = 'auto';
        audioCache.current[soundName] = audio;
      }
      // Clonar para permitir solapamiento
      const clone = audio.cloneNode();
      clone.volume = 0.5;
      clone.play().catch(e => {
        // Fallo silencioso si el archivo no existe
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Sonido no encontrado: ${sounds[soundName]}`);
        }
      });
    } catch (e) {
      // Fallo silencioso por si el audio no es soportado
    }
  }, []);

  // Precargar sonidos solo si existen (intentando evitar 404)
  useEffect(() => {
    Object.values(sounds).forEach(src => {
      // Solo precargamos si el archivo existe; el navegador mostrará un 404 silencioso en consola
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      audioCache.current[src] = audio;
    });
  }, []);

  return { playSound };
}