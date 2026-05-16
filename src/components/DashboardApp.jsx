import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import ModuloGastos from './ModuloGastos';
import ModuloFiados from './ModuloFiados';
import { LogOut, Package, TrendingUp, BookOpen, User, Beaker, ShoppingCart, Activity, ChefHat, Settings, Store, Receipt, BookMarked } from 'lucide-react';
import InventarioMermas from './InventarioMermas';
import MisRecetas from './MisRecetas';
import ModuloProduccion from './ModuloProduccion';
import ModuloVentas from './ModuloVentas';
import ModuloResumen from './ModuloResumen';
import CentroPreparacion from './CentroPreparacion';
import ModuloConfiguracion from './ModuloConfiguracion';

export default function DashboardApp() {
  const [usuario, setUsuario] = useState(null);
  const [perfilNegocio, setPerfilNegocio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('resumen');

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        setUsuario(user);
        
        // Cargar el perfil del negocio para el Logo y el Nombre
        const { data } = await supabase.from('perfiles').select('*').eq('user_id', user.id).single();
        if (data) setPerfilNegocio(data);
      } else {
        window.location.href = '/login';
      }
      setCargando(false);
    };

    verificarSesion();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-xl font-bold text-slate-500 animate-pulse">Cargando tu negocio...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      <aside className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-sm z-10">
        <div>
          {/* LOGO DINÁMICO */}
          <div className="flex items-center justify-center md:justify-start gap-3 mb-10 mt-2 overflow-hidden">
            {perfilNegocio?.logo_url ? (
              <img src={perfilNegocio.logo_url} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover drop-shadow-sm shrink-0" />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md">
                <Store className="w-6 h-6"/>
              </div>
            )}
            <span className="hidden md:block font-black text-lg text-slate-800 tracking-tight truncate">
              {perfilNegocio?.nombre_negocio || 'MaxiPOS'}
            </span>
          </div>

          <nav className="space-y-4">
            <button onClick={() => setVistaActiva('resumen')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${vistaActiva === 'resumen' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <TrendingUp className="w-5 h-5" /> <span className="hidden md:block">Mi Resumen</span>
            </button>
            <button onClick={() => setVistaActiva('inventario')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${vistaActiva === 'inventario' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <Package className="w-5 h-5" /> <span className="hidden md:block">Inventario & Mermas</span>
            </button>
            <button onClick={() => setVistaActiva('preparacion')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${vistaActiva === 'preparacion' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <ChefHat className="w-5 h-5" /> <span className="hidden md:block">Preparaciones</span>
            </button>
            <button onClick={() => setVistaActiva('recetas')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${vistaActiva === 'recetas' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <BookOpen className="w-5 h-5" /> <span className="hidden md:block">Mis Recetas</span>
            </button>
            <button onClick={() => setVistaActiva('gastos')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${vistaActiva === 'gastos' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
          <Receipt className="w-5 h-5" /> <span className="hidden md:block">Gastos Operativos</span>
        </button>
            <button onClick={() => setVistaActiva('produccion')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${vistaActiva === 'produccion' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <Beaker className="w-5 h-5" /> <span className="hidden md:block">Producción</span>
            </button>
            <button onClick={() => setVistaActiva('ventas')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${vistaActiva === 'ventas' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <ShoppingCart className="w-5 h-5" /> <span className="hidden md:block">Punto de Venta</span>
            </button>
            <button onClick={() => setVistaActiva('fiados')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${vistaActiva === 'fiados' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
          <BookMarked className="w-5 h-5" /> <span className="hidden md:block">Cuaderno de Fiados</span>
        </button>
          </nav>
        </div>

        <div>
          <button onClick={() => setVistaActiva('configuracion')} className={`w-full flex items-center gap-3 p-3 mb-2 rounded-xl font-bold transition-all ${vistaActiva === 'configuracion' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
            <Settings className="w-5 h-5" /> <span className="hidden md:block">Configuración</span>
          </button>
          <button onClick={cerrarSesion} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-all">
            <LogOut className="w-5 h-5" /> <span className="hidden md:block">Salir</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl md:text-3xl font-black text-slate-800">
              ¡Hola, {perfilNegocio?.nombre_negocio || 'Emprendedor'}! 👋
            </motion.h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Conectado como: {usuario?.email}</p>
          </div>
          <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100 hidden md:block">
            {perfilNegocio?.logo_url ? (
              <img src={perfilNegocio.logo_url} alt="User" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </header>

        {/* --- RENDERIZADO DE VISTAS --- */}
        {vistaActiva === 'resumen' && <ModuloResumen usuario={usuario} />}
        {vistaActiva === 'inventario' && <InventarioMermas usuario={usuario} />}
        {vistaActiva === 'preparacion' && <CentroPreparacion usuario={usuario} />}
        {vistaActiva === 'recetas' && <MisRecetas usuario={usuario} />}
        {vistaActiva === 'produccion' && <ModuloProduccion usuario={usuario} />}
       {vistaActiva === 'ventas' && <ModuloVentas usuario={usuario} />}
        {vistaActiva === 'configuracion' && <ModuloConfiguracion usuario={usuario} />}
        {vistaActiva === 'gastos' && <ModuloGastos usuario={usuario} />}
        {vistaActiva === 'fiados' && <ModuloFiados usuario={usuario} />}
      </main>
    </div>
  );
}