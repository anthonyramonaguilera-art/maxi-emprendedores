import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Archive, 
  Soup, 
  Store, 
  LogOut, 
  Coins,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONEXIÓN AL CEREBRO GLOBAL ---
import { useStore } from '@nanostores/react';
import { tasaBcvStore, actualizarTasaBcv } from '../store/configStore';

// Componentes
import MiAlacena from './MiAlacena';
import LaCocina from './LaCocina';
import MiNevera from './MiNevera';
import MisCuentas from './MisCuentas';
import ModuloConfiguracion from './ModuloConfiguracion'; // <-- Agregado

export default function DashboardApp({ usuario }) {
  const [tabActiva, setTabActiva] = useState('nevera'); 
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Escuchamos la tasa global desde nanostores
  const tasaBcvGlobal = useStore(tasaBcvStore);

  useEffect(() => {
    const inicializarApp = async () => {
      // Solo buscamos de internet si la usuaria NO ha puesto una tasa manual (es decir, si es 0)
      try {
        if (tasaBcvGlobal === 0) {
          const resTasa = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
          const dataTasa = await resTasa.json();
          actualizarTasaBcv(dataTasa.promedio);
        }
      } catch (e) { 
        if (tasaBcvGlobal === 0) actualizarTasaBcv(51.20); 
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
  }, [usuario, tasaBcvGlobal]);

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
    <div className="min-h-screen bg-slate-100 font-sans flex justify-center">
      <div className="w-full max-w-md bg-slate-50 min-h-screen flex flex-col shadow-2xl relative pb-24 overflow-x-hidden">
        
        {/* HEADER SUPERIOR */}
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-amber-400 rounded-full flex items-center justify-center font-black text-white shadow-md text-sm overflow-hidden">
              {perfil?.logo_url ? (
                <img src={perfil.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                "M"
              )}
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
            {/* Indicador de Tasa BCV (Ahora conectado al cerebro global) */}
            <div className="bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-xl text-right">
              <p className="text-[9px] font-bold text-amber-600 uppercase leading-none">Tasa BCV</p>
              <p className="text-xs font-black text-amber-700 mt-0.5">{tasaBcvGlobal > 0 ? tasaBcvGlobal.toFixed(2) : '---'} Bs</p>
            </div>
            
            <button 
              onClick={cerrarSesion} 
              className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
              title="Salir del sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
            
            {/* CORRECCIÓN: Botón de Configuración con el state correcto */}
            <button 
              onClick={() => setTabActiva('configuracion')} 
              className={`p-2 rounded-full transition-transform active:scale-90 ${tabActiva === 'configuracion' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </header>

        {/* CONTENEDOR DE PANTALLAS DINÁMICAS */}
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
              {/* Le pasamos la tasa global a todos los hijos */}
              {tabActiva === 'alacena' && <MiAlacena usuario={usuario} tasaBcv={tasaBcvGlobal} />}
              {tabActiva === 'cocina' && <LaCocina usuario={usuario} tasaBcv={tasaBcvGlobal} />}
              {tabActiva === 'nevera' && <MiNevera usuario={usuario} tasaBcv={tasaBcvGlobal} />}
              {tabActiva === 'cuentas' && <MisCuentas usuario={usuario} tasaBcv={tasaBcvGlobal} />}
              {tabActiva === 'configuracion' && <ModuloConfiguracion usuario={usuario} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* BARRA DE NAVEGACIÓN INFERIOR */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-2 flex justify-around items-center z-50 rounded-t-3xl">
          <button onClick={() => setTabActiva('alacena')} className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${tabActiva === 'alacena' ? 'bg-emerald-50 text-emerald-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <Archive className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Alacena</span>
          </button>
          <button onClick={() => setTabActiva('cocina')} className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${tabActiva === 'cocina' ? 'bg-amber-50 text-amber-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <Soup className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">La Cocina</span>
          </button>
          <button onClick={() => setTabActiva('nevera')} className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${tabActiva === 'nevera' ? 'bg-blue-50 text-blue-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <Store className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Mi Nevera</span>
          </button>
          <button onClick={() => setTabActiva('cuentas')} className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${tabActiva === 'cuentas' ? 'bg-indigo-50 text-indigo-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <Coins className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Finanzas</span>
          </button>
        </nav>

      </div>
    </div>
  );
}