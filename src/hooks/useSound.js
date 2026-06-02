import { useState, useEffect, useCallback, useRef } from 'react';

// Clave para guardar preferencia de sonido
const SOUND_ENABLED_KEY = 'maxi_sound_enabled';

/**
 * Hook de sonidos sintéticos usando Web Audio API.
 * No depende de archivos externos, funciona 100% offline.
 */
export default function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(SOUND_ENABLED_KEY);
    return saved !== 'false'; // por defecto activado
  });

  const audioContextRef = useRef(null);

  // Persistir preferencia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled));
    }
  }, [soundEnabled]);

  // Obtener o crear el AudioContext (debe ser después de una interacción del usuario)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Generar un tono simple con frecuencia y duración dadas
  const playTone = useCallback((frequency, duration, type = 'sine', volume = 0.3) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silenciar errores si el audio no está disponible
    }
  }, [soundEnabled, getAudioContext]);

  // Reproducir una secuencia de tonos (melodía simple)
  const playMelody = useCallback((notes) => {
    if (!soundEnabled) return;
    notes.forEach(([freq, dur, delay], index) => {
      setTimeout(() => playTone(freq, dur), delay * 1000);
    });
  }, [soundEnabled, playTone]);

  // Banco de sonidos predefinidos
  const playSound = useCallback((soundName) => {
    if (!soundEnabled) return;

    switch (soundName) {
      case 'cash_register':
        // Sonido de caja registradora: dos tonos agudos
        playTone(800, 0.1, 'square', 0.2);
        setTimeout(() => playTone(1200, 0.15, 'square', 0.2), 100);
        break;

      case 'coin_drop':
        // Moneda cayendo: tono descendente
        playTone(1200, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(800, 0.15, 'sine', 0.2), 80);
        break;

      case 'kitchen_bell':
        // Campana de cocina: ding-ding
        playTone(880, 0.3, 'triangle', 0.2);
        setTimeout(() => playTone(1100, 0.4, 'triangle', 0.2), 300);
        break;

      case 'pencil_write':
        // Escribir: tono suave y corto
        playTone(600, 0.05, 'sine', 0.1);
        break;

      case 'celebration':
        // Celebración: melodía ascendente
        playMelody([
          [523, 0.15, 0],    // Do
          [659, 0.15, 0.15], // Mi
          [784, 0.15, 0.3],  // Sol
          [1047, 0.3, 0.45], // Do agudo
        ]);
        break;

      case 'alert':
        // Alerta: tono grave repetido
        playTone(400, 0.1, 'sawtooth', 0.15);
        setTimeout(() => playTone(400, 0.1, 'sawtooth', 0.15), 150);
        break;

      default:
        // Sonido genérico: click
        playTone(1000, 0.05, 'sine', 0.1);
    }
  }, [soundEnabled, playTone, playMelody]);

  // Toggle de sonido
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return {
    playSound,
    soundEnabled,
    toggleSound,
  };
}