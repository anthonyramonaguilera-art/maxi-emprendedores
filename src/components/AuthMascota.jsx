import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthMascota() {
  const [cargando, setCargando] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modoRegistro, setModoRegistro] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const manejarAuth = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      if (modoRegistro) {
        // Registrar nuevo usuario
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMensaje({ tipo: 'exito', texto: '¡Registro exitoso! Revisa tu correo para confirmar.' });
      } else {
        // Iniciar sesión
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Si hay éxito, el navegador guarda la sesión automáticamente
        window.location.href = '/dashboard'; // Redirigimos al panel avanzado (Inventario)
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Ocurrió un error. Intenta de nuevo.' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md relative z-20"
      >
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Maxi" className="w-24 h-24 mx-auto drop-shadow-md mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">
            {modoRegistro ? 'Únete a Maxi' : 'Bienvenido de vuelta'}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {modoRegistro ? 'Empieza a controlar tus ganancias hoy.' : 'Tu asistente financiero te espera.'}
          </p>
        </div>

        <form onSubmit={manejarAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="email" required placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <AnimatePresence>
            {mensaje.texto && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
              >
                <AlertCircle size={16} /> <p>{mensaje.texto}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button disabled={cargando} type="submit"
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {cargando ? 'Procesando...' : (modoRegistro ? <><UserPlus size={18}/> Registrarme</> : <><LogIn size={18}/> Entrar</>)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setModoRegistro(!modoRegistro); setMensaje({ tipo: '', texto: '' }); }} type="button"
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}