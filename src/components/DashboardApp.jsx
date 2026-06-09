import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import { Archive, Soup, Store, LogOut, Coins, Loader2, Settings, GraduationCap, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { tasaBcvStore, actualizarTasaBcv, origenTasaStore } from '../store/configStore';
import { actualizarRachaAprendizaje } from '../store/rachaStore';
import useSound from '../hooks/useSound';
import ErrorBoundary from './ErrorBoundary';
import MaxiAvatar from './MaxiAvatar';
import MaxiAssistant from './MaxiAssistant';
import LogroDesbloqueadoModal from './LogroDesbloqueadoModal';
import OnboardingWizard from './OnboardingWizard';
import { carritoStore } from '../store/carritoStore';

const MiAlacena = React.lazy(() => import('./MiAlacena'));
const LaCocina = React.lazy(() => import('./LaCocina'));
const MiNevera = React.lazy(() => import('./MiNevera'));
const MisCuentas = React.lazy(() => import('./MisCuentas'));
const Carrito = React.lazy(() => import('./Carrito'));
const ModuloConfiguracion = React.lazy(() => import('./ModuloConfiguracion'));
const Aprender = React.lazy(() => import('./Aprender'));
const ToastContainer = React.lazy(() => import('./ToastContainer'));
const RachaBar = React.lazy(() => import('./RachaBar'));

export default function DashboardApp({ usuario }) {
  const tipoGuardado = typeof window !== 'undefined' ? localStorage.getItem('maxi_tipo_usuario') : null;
  const [tabActiva, setTabActiva] = useState(
    tipoGuardado === 'emprendedor' ? 'cocina' : (tipoGuardado === 'revendedor' ? 'nevera' : 'nevera')
  );
  const [perfil, setPerfil] = useState(null);
  const [usuarioValidado, setUsuarioValidado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);

  const tasaBcvGlobal = useStore(tasaBcvStore);
  const origenTasa = useStore(origenTasaStore);
  const { playSound } = useSound();
  const carrito = useStore(carritoStore);

  useEffect(() => {
    let montado = true;
    const inicializarApp = async () => {
      try {
        if (tasaBcvStore.get() === 0) {
          fetch('https://ve.dolarapi.com/v1/dolares/oficial')
            .then(res => res.json())
            .then(data => actualizarTasaBcv(data.promedio, 'oficial'))
            .catch(() => actualizarTasaBcv(51.20, 'manual'));
        }
        let currentUser = usuario;
        if (!currentUser || !currentUser.id) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (session?.user) currentUser = session.user;
        }
        if (!currentUser || !currentUser.id) {
          window.location.href = '/login';
          return;
        }
        if (montado) {
          setUsuarioValidado(currentUser);
          actualizarRachaAprendizaje();
        }
        const { data, error: perfilError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        if (perfilError) throw perfilError;
        if (montado && data) setPerfil(data);
      } catch (err) {
        console.error('Error de inicialización:', err);
        if (montado) setError(err.message);
      } finally {
        if (montado) setCargando(false);
      }
    };
    inicializarApp();
    return () => { montado = false; };
  }, [usuario]);

  useEffect(() => {
    if (!usuarioValidado) return;
    const onboardCompletado = localStorage.getItem('maxi_onboarding_completado');
    if (onboardCompletado !== 'true') {
      setMostrarOnboarding(true);
    }
  }, [usuarioValidado]);

  const completarOnboarding = async (tipoUsuario) => {
    localStorage.setItem('maxi_onboarding_completado', 'true');
    localStorage.setItem('maxi_tipo_usuario', tipoUsuario);
    const { error } = await supabase
      .from('perfiles')
      .upsert({ user_id: usuarioValidado.id, tipo_usuario: tipoUsuario });
    if (!error) {
      setPerfil(prev => ({ ...prev, tipo_usuario: tipoUsuario }));
    }
    setMostrarOnboarding(false);
    if (tipoUsuario === 'emprendedor') {
      setTabActiva('cocina');
    } else {
      setTabActiva('nevera');
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (cargando) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col justify-center items-center z-[100]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-2" />
        <p className="text-slate-500 font-bold">Abriendo Maxi Emprendedores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-red-50 flex flex-col justify-center items-center z-[100] p-4">
        <p className="text-red-600 font-bold mb-2">Error al cargar la aplicación</p>
        <p className="text-sm text-slate-600">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl">Recargar</button>
      </div>
    );
  }

  if (!usuarioValidado) return null;

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex justify-center">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-slate-50 min-h-screen flex flex-col shadow-2xl relative pb-24 overflow-x-hidden">
        
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex flex-col sticky top-0 z-40 shadow-sm">
          <div className="flex justify-between items-center">
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maxi Panel v2</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-xl text-right">
                <p className="text-[9px] font-bold text-amber-600 uppercase leading-none">
                  {origenTasa === 'oficial' ? 'Tasa BCV' : 'Tasa Manual'}
                </p>
                <p className="text-xs font-black text-amber-700 mt-0.5">
                  {tasaBcvGlobal > 0 ? tasaBcvGlobal.toFixed(2) : '---'} Bs
                </p>
              </div>
              
              <button onClick={cerrarSesion} className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors active:scale-90">
                <LogOut className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setTabActiva('configuracion')} 
                className={`p-2 rounded-full transition-transform active:scale-90 ${tabActiva === 'configuracion' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Settings className="w-5 h-5"/>
              </button>
            </div>
          </div>
          <Suspense fallback={<div className="h-8 animate-pulse bg-slate-200 rounded-full mt-1"></div>}>
            <RachaBar />
          </Suspense>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
          <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-blue-500"/></div>}>
            <AnimatePresence mode="wait">
              <motion.div key={tabActiva} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.15 }} className="h-full">
                <ErrorBoundary>
                  {tabActiva === 'alacena' && <MiAlacena usuario={usuarioValidado} tasaBcv={tasaBcvGlobal} playSound={playSound} />}
                </ErrorBoundary>
                <ErrorBoundary>
                  {tabActiva === 'cocina' && <LaCocina usuario={usuarioValidado} tasaBcv={tasaBcvGlobal} playSound={playSound} />}
                </ErrorBoundary>
                <ErrorBoundary>
                  {tabActiva === 'nevera' && <MiNevera usuario={usuarioValidado} tasaBcv={tasaBcvGlobal} playSound={playSound} />}
                </ErrorBoundary>
                <ErrorBoundary>
                  {tabActiva === 'carrito' && <Carrito usuario={usuarioValidado} tasaBcv={tasaBcvGlobal} playSound={playSound} />}
                </ErrorBoundary>
                <ErrorBoundary>
                  {tabActiva === 'cuentas' && <MisCuentas usuario={usuarioValidado} tasaBcv={tasaBcvGlobal} playSound={playSound} />}
                </ErrorBoundary>
                <ErrorBoundary>
                  {tabActiva === 'configuracion' && <ModuloConfiguracion usuario={usuarioValidado} />}
                </ErrorBoundary>
                <ErrorBoundary>
                  {tabActiva === 'aprender' && <Aprender playSound={playSound} />}
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-2 flex justify-around items-center z-50 rounded-t-3xl">
          <button onClick={() => setTabActiva('alacena')} className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all active:scale-90 ${tabActiva === 'alacena' ? 'bg-emerald-50 text-emerald-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <Archive className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Alacena</span>
          </button>
          <button onClick={() => setTabActiva('cocina')} className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all active:scale-90 ${tabActiva === 'cocina' ? 'bg-amber-50 text-amber-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <Soup className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">La Cocina</span>
          </button>
          <button onClick={() => setTabActiva('nevera')} className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all active:scale-90 ${tabActiva === 'nevera' ? 'bg-blue-50 text-blue-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <Store className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Mi Nevera</span>
          </button>
          <button onClick={() => setTabActiva('carrito')} className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all active:scale-90 ${tabActiva === 'carrito' ? 'bg-orange-50 text-orange-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Carrito</span>
            {carrito.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                {carrito.length}
              </span>
            )}
          </button>
          <button onClick={() => setTabActiva('cuentas')} className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all active:scale-90 ${tabActiva === 'cuentas' ? 'bg-indigo-50 text-indigo-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <Coins className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Finanzas</span>
          </button>
          <button onClick={() => setTabActiva('aprender')} className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all active:scale-90 ${tabActiva === 'aprender' ? 'bg-purple-50 text-purple-600 scale-105 font-black' : 'text-slate-400 font-medium'}`}>
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Aprender</span>
          </button>
        </nav>

        <MaxiAvatar activeTab={tabActiva} />
        <MaxiAssistant usuario={usuarioValidado} />

        <Suspense fallback={null}>
          <ToastContainer />
        </Suspense>
      </div>

      <LogroDesbloqueadoModal />
      {mostrarOnboarding && <OnboardingWizard onComplete={completarOnboarding} />}
    </div>
  );
}