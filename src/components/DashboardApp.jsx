import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Archive, 
  Soup, 
  Store, 
  Layers, 
  LogOut, 
  Coins,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Nota: Crearemos estos componentes en los siguientes pasos
import MiAlacena from './MiAlacena';
import LaCocina from './LaCocina';
import MiNevera from './MiNevera';
import MisCuentas from './MisCuentas';

export default function DashboardApp({ usuario }) {
  const [tabActiva, setTabActiva] = useState('nevera'); // Iniciamos directo en la nevera/mostrador
  const [tasaBcv, setTasaBcv] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Cargar datos iniciales de la tasa y el negocio
  useEffect(() => {
    const inicializarApp = async () => {
      try {
        const resTasa = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const dataTasa = await resTasa.json();
        setTasaBcv(dataTasa.promedio);
      } catch (e) { 
        setTasaBcv(51.20); // Tasa de respaldo por si falla la API
      }

      if (usuario?.id) {
        const { data } = await supabase
          .from('perfiles')
          .select('*')
          .eq('user_id', usuario.id)
          .single();
        if (data) setPerfil(data);
      }
      setCargando(false);
    };
    inicializarApp();
  }, [usuario]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (cargando) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-2" />
        <p className="text-slate-500 font-bold font-sans">Abriendo Maxi Emprendedores...</p>
      </div>
    );
  }

  return (
    // Contenedor global optimizado para móviles (se centra en pantallas de PC como un teléfono simulado)
    <div className="min-h-screen bg-slate-100 font-sans flex justify-center">
      <div className="w-full max-w-md bg-slate-50 min-h-screen flex flex-col shadow-2xl relative pb-24 overflow-x-hidden">
        
        {/* HEADER SUPERIOR (ZONA DE CONTROL) */}
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-amber-400 rounded-full flex items-center justify-center font-black text-white shadow-md text-sm">
              M
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-none">
                {perfil?.nombre_negocio || 'Mi Dulcería'}
              </h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Maxi Panel v2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de Tasa BCV */}
            <div className="bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-xl text-right">
              <p className="text-[9px] font-bold text-amber-600 uppercase leading-none">Tasa BCV</p>
              <p className="text-xs font-black text-amber-700 mt-0.5">{tasaBcv?.toFixed(2)} Bs</p>
            </div>
            
            {/* Botón de Salir Discreto */}
            <button 
              onClick={cerrarSesion} 
              className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
              title="Salir del sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* CONTENEDOR DE PANTALLAS DINÁMICAS (ZONA DE JUEGO) */}
        <main className="flex-1 p-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={tabActiva}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {tabActiva === 'alacena' && <MiAlacena usuario={usuario} tasaBcv={tasaBcv} />}
              {tabActiva === 'cocina' && <LaCocina usuario={usuario} tasaBcv={tasaBcv} />}
              {tabActiva === 'nevera' && <MiNevera usuario={usuario} tasaBcv={tasaBcv} />}
              {tabActiva === 'cuentas' && <MisCuentas usuario={usuario} tasaBcv={tasaBcv} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* 📋 BARRA DE NAVEGACIÓN INFERIOR (ZONA DEL PULGAR) */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-2 flex justify-around items-center z-50 rounded-t-3xl">
          
          {/* Pestaña: Alacena */}
          <button
            onClick={() => setTabActiva('alacena')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${
              tabActiva === 'alacena' 
                ? 'bg-emerald-50 text-emerald-600 scale-105 font-black' 
                : 'text-slate-400 font-medium'
            }`}
          >
            <Archive className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Alacena</span>
          </button>

          {/* Pestaña: La Cocina */}
          <button
            onClick={() => setTabActiva('cocina')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${
              tabActiva === 'cocina' 
                ? 'bg-amber-50 text-amber-600 scale-105 font-black' 
                : 'text-slate-400 font-medium'
            }`}
          >
            <Soup className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">La Cocina</span>
          </button>

          {/* Pestaña: Mi Nevera */}
          <button
            onClick={() => setTabActiva('nevera')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${
              tabActiva === 'nevera' 
                ? 'bg-blue-50 text-blue-600 scale-105 font-black' 
                : 'text-slate-400 font-medium'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Mi Nevera</span>
          </button>

          {/* Pestaña: Mis Cuentas */}
          <button
            onClick={() => setTabActiva('cuentas')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${
              tabActiva === 'cuentas' 
                ? 'bg-indigo-50 text-indigo-600 scale-105 font-black' 
                : 'text-slate-400 font-medium'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Finanzas</span>
          </button>

        </nav>

      </div>
    </div>
  );
}