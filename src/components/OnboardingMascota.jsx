import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ArrowRight, DollarSign, Package, TrendingUp, RefreshCcw, Banknote, Loader2 } from 'lucide-react';

export default function OnboardingMascota() {
  const [paso, setPaso] = useState(0);
  
  // Estados para la Tasa BCV Dinámica
  const [tasaBcv, setTasaBcv] = useState(null);
  const [cargandoTasa, setCargandoTasa] = useState(true);

  // Estados bimonetarios
  const [costoUsd, setCostoUsd] = useState('');
  const [costoBs, setCostoBs] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioUsd, setPrecioUsd] = useState('');
  const [precioBs, setPrecioBs] = useState('');
  const [resultado, setResultado] = useState(null);

  // Efecto para consultar el BCV al iniciar la app
  useEffect(() => {
    const obtenerTasaBCV = async () => {
      try {
        // Usamos una API comunitaria estable para evitar bloqueos del BCV
        const respuesta = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await respuesta.json();
        setTasaBcv(data.promedio);
      } catch (error) {
        console.error("Error conectando al BCV, usando tasa de respaldo", error);
        // Si el internet falla, usamos una tasa de emergencia basada en tu contexto
        setTasaBcv(500.00); 
      } finally {
        setCargandoTasa(false);
      }
    };
    obtenerTasaBCV();
  }, []);

  const dialogos = [
    "¡Hola, emprendedor! Qué bueno verte por aquí. Soy Maxi, tu nuevo asistente financiero. 🚀",
    "Sé que sacar cuentas en dólares y bolívares al mismo tiempo marea a cualquiera. ¡Para eso estoy yo!",
    "Hagamos magia. Te enseñaré a calcular tu ganancia real en Bs y $ en solo 3 pasos. ¿Listo?"
  ];

  const siguientePaso = () => { if (paso < dialogos.length) setPaso(paso + 1); };

  // Manejadores Bimonetarios con la Tasa Real
  const handleCostoUsd = (val) => {
    setCostoUsd(val);
    setCostoBs(val ? (parseFloat(val) * tasaBcv).toFixed(2) : '');
  };
  const handleCostoBs = (val) => {
    setCostoBs(val);
    setCostoUsd(val ? (parseFloat(val) / tasaBcv).toFixed(2) : '');
  };
  const handlePrecioUsd = (val) => {
    setPrecioUsd(val);
    setPrecioBs(val ? (parseFloat(val) * tasaBcv).toFixed(2) : '');
  };
  const handlePrecioBs = (val) => {
    setPrecioBs(val);
    setPrecioUsd(val ? (parseFloat(val) / tasaBcv).toFixed(2) : '');
  };

  const calcularGanancia = () => {
    const cTotal = parseFloat(costoUsd);
    const cant = parseInt(cantidad);
    const pVenta = parseFloat(precioUsd);

    if (cTotal && cant && pVenta) {
      const costoUnitarioUsd = cTotal / cant;
      const gananciaUnitUsd = pVenta - costoUnitarioUsd;
      const gananciaTotalUsd = gananciaUnitUsd * cant;
      
      setResultado({
        costoUnitUsd: costoUnitarioUsd.toFixed(2),
        costoUnitBs: (costoUnitarioUsd * tasaBcv).toFixed(2),
        gananciaUnitUsd: gananciaUnitUsd.toFixed(2),
        gananciaUnitBs: (gananciaUnitUsd * tasaBcv).toFixed(2),
        gananciaTotalUsd: gananciaTotalUsd.toFixed(2),
        gananciaTotalBs: (gananciaTotalUsd * tasaBcv).toFixed(2),
      });
    }
  };

  const reiniciar = () => {
    setCostoUsd(''); setCostoBs(''); setCantidad(''); setPrecioUsd(''); setPrecioBs('');
    setResultado(null); setPaso(0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 font-sans">
      
      <AnimatePresence mode="wait">
        <motion.div
          key={paso + (resultado ? '-res' : '')}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md text-center mb-8 relative z-20"
        >
          {paso < 3 && <p className="text-xl text-slate-700 font-medium leading-relaxed">{dialogos[paso]}</p>}

          {paso === 3 && !resultado && (
            <div className="space-y-5 text-left">
              
              {/* Indicador de BCV Dinámico */}
              <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-center gap-2 mb-4">
                {cargandoTasa ? (
                  <><Loader2 className="animate-spin text-blue-600" size={18} /> <span className="text-sm font-medium text-slate-600">Consultando BCV...</span></>
                ) : (
                  <span className="text-sm font-bold text-slate-800">🇻🇪 Tasa BCV Oficial: {tasaBcv} Bs</span>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">1. Gasto total en materiales</label>
                <div className="flex gap-2">
                  <div className="relative w-1/2">
                    <DollarSign className="absolute left-3 top-3 text-green-600" size={18} />
                    <input type="number" placeholder="USD" value={costoUsd} onChange={(e) => handleCostoUsd(e.target.value)} disabled={cargandoTasa}
                      className="w-full pl-9 pr-2 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50" />
                  </div>
                  <div className="relative w-1/2">
                    <Banknote className="absolute left-3 top-3 text-blue-600" size={18} />
                    <input type="number" placeholder="Bs" value={costoBs} onChange={(e) => handleCostoBs(e.target.value)} disabled={cargandoTasa}
                      className="w-full pl-9 pr-2 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">2. ¿Cuántos postres salieron?</label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="number" placeholder="Ej: 20 Unidades" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">3. Precio de venta por unidad</label>
                <div className="flex gap-2">
                  <div className="relative w-1/2">
                    <DollarSign className="absolute left-3 top-3 text-green-600" size={18} />
                    <input type="number" placeholder="USD" value={precioUsd} onChange={(e) => handlePrecioUsd(e.target.value)} disabled={cargandoTasa}
                      className="w-full pl-9 pr-2 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50" />
                  </div>
                  <div className="relative w-1/2">
                    <Banknote className="absolute left-3 top-3 text-blue-600" size={18} />
                    <input type="number" placeholder="Bs" value={precioBs} onChange={(e) => handlePrecioBs(e.target.value)} disabled={cargandoTasa}
                      className="w-full pl-9 pr-2 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {resultado && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">¡Magia Bimonetaria! ✨</h3>
              <p className="text-slate-600 text-sm">Producir un postre te cuesta: <strong className="text-red-500">${resultado.costoUnitUsd} / {resultado.costoUnitBs} Bs</strong></p>
              
              <div className="bg-green-50 border border-green-100 p-4 rounded-2xl mt-4">
                <p className="text-sm text-green-800 font-medium mb-1">Ganancia por unidad:</p>
                <p className="text-2xl font-black text-green-600">${resultado.gananciaUnitUsd}</p>
                <p className="text-lg font-bold text-slate-500">{resultado.gananciaUnitBs} Bs</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <p className="text-sm text-blue-800 font-medium mb-1">Ganancia por el lote completo:</p>
                <p className="text-2xl font-black text-blue-600">${resultado.gananciaTotalUsd}</p>
                <p className="text-lg font-bold text-slate-500">{resultado.gananciaTotalBs} Bs</p>
              </div>
            </div>
          )}

          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45 border-b border-r border-slate-100 z-10"></div>
        </motion.div>
      </AnimatePresence>

      <motion.img src="/logo.png" alt="Maxi Asistente" className="w-48 md:w-64 h-auto drop-shadow-2xl z-10" animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />

      <div className="h-20 flex items-center justify-center mt-6 z-20">
        {paso < 3 && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={siguientePaso} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-blue-700"> {paso === 2 ? <>¡Empezar! <Calculator size={20} /></> : <>Continuar <ArrowRight size={20} /></>} </motion.button>}
        {paso === 3 && !resultado && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={calcularGanancia} disabled={cargandoTasa} className="flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"> Descubrir ganancia ✨ </motion.button>}
        {resultado && (
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={reiniciar} 
              className="flex items-center justify-center gap-2 bg-slate-200 text-slate-800 px-6 py-3 rounded-full font-bold shadow hover:bg-slate-300 transition-colors"
            > 
              <RefreshCcw size={18} /> Otro cálculo 
            </motion.button>
            
            {/* NUEVO BOTÓN QUE LLEVA AL LOGIN */}
            <motion.a 
              href="/login"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-colors"
            >
              Guardar receta y continuar <ArrowRight size={18} />
            </motion.a>
          </div>
        )}
        </div> 
    </div>
  );
}