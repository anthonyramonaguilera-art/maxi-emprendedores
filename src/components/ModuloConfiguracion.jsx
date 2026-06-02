import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Store, MessageSquare, Save, Loader2, UploadCloud, CheckCircle, CreditCard, DollarSign, RefreshCw, PenTool } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { tasaBcvStore, actualizarTasaBcv, origenTasaStore } from '../store/configStore';
import { addToast } from '../store/toastStore'; // ✅ NUEVO
import { maxiVisible } from '../store/maxiStore';

const LOGOS_PREDETERMINADOS = [
  "https://api.dicebear.com/7.x/initials/svg?seed=MX&backgroundColor=2563eb",
  "https://api.dicebear.com/7.x/icons/svg?seed=Coffee&backgroundColor=f59e0b",
  "https://api.dicebear.com/7.x/icons/svg?seed=Cake&backgroundColor=ec4899",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Tech&backgroundColor=10b981"
];

export default function ModuloConfiguracion({ usuario }) {
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [cargandoOficial, setCargandoOficial] = useState(false);
// Al inicio del componente, después de las declaraciones:
useEffect(() => {
  const saved = localStorage.getItem('maxi_visible');
  if (saved !== null) maxiVisible.set(saved === 'true');
}, []);
  const tasaGlobal = useStore(tasaBcvStore);
  const origenGlobal = useStore(origenTasaStore);
  const [inputTasa, setInputTasa] = useState('');

  const [nombreNegocio, setNombreNegocio] = useState('');
  const [mensajeRecibo, setMensajeRecibo] = useState('');
  
  const [banco, setBanco] = useState('');
  const [telefonoPago, setTelefonoPago] = useState('');
  const [cedulaRif, setCedulaRif] = useState('');

  const [logoActual, setLogoActual] = useState('');
  const [archivoLocal, setArchivoLocal] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState('');

  useEffect(() => {
    if (tasaGlobal > 0 && !inputTasa) {
      setInputTasa(tasaGlobal.toString());
    }
  }, [tasaGlobal]);

  useEffect(() => {
    if (usuario?.id) cargarPerfil();
  }, [usuario]);

  const cargarPerfil = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('user_id', usuario.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setNombreNegocio(data.nombre_negocio || '');
        setMensajeRecibo(data.mensaje_recibo || '');
        setBanco(data.banco || '');
        setTelefonoPago(data.telefono_pago || '');
        setCedulaRif(data.cedula_rif || '');
        setLogoActual(data.logo_url || '');
        setVistaPrevia(data.logo_url || '');
      } else {
        await supabase.from('perfiles').insert([{ user_id: usuario.id }]);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setCargando(false);
    }
  };

  const cargarTasaOficial = async () => {
    setCargandoOficial(true);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      const nuevaTasa = data.promedio;
      actualizarTasaBcv(nuevaTasa, 'oficial');
      setInputTasa(nuevaTasa.toString());
      addToast(`✅ Tasa oficial actualizada: ${nuevaTasa.toFixed(2)} Bs`, 'success'); // ✅ TOAST
    } catch (error) {
      console.error(error);
      addToast("❌ No se pudo obtener la tasa oficial. Revisa tu conexión.", 'error'); // ✅ TOAST
    } finally {
      setCargandoOficial(false);
    }
  };

  const aplicarTasaManual = () => {
    if (!inputTasa) return;
    const num = parseFloat(inputTasa.toString().replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      addToast("Ingresa un número válido para la tasa manual", 'error'); // ✅ TOAST
      return;
    }
    actualizarTasaBcv(num, 'manual');
    addToast(`📝 Tasa manual establecida: ${num.toFixed(2)} Bs`, 'success'); // ✅ TOAST
  };

  const manejarSeleccionArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoLocal(file);
      setVistaPrevia(URL.createObjectURL(file));
    }
  };

  const seleccionarPredeterminado = (url) => {
    setArchivoLocal(null);
    setLogoActual(url);
    setVistaPrevia(url);
  };

  const guardarConfiguracion = async (e) => {
    e.preventDefault();
    setProcesando(true);
    
    let urlFinalLogo = logoActual;

    try {
      if (inputTasa && parseFloat(inputTasa) !== tasaGlobal) {
        actualizarTasaBcv(inputTasa, 'manual');
      }

      if (archivoLocal) {
        const fileExt = archivoLocal.name.split('.').pop();
        const fileName = `${usuario.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, archivoLocal);
        if (uploadError) throw new Error("Error al subir imagen.");

        const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(fileName);
        urlFinalLogo = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('perfiles').upsert({
        user_id: usuario.id,
        nombre_negocio: nombreNegocio,
        mensaje_recibo: mensajeRecibo,
        banco: banco,
        telefono_pago: telefonoPago,
        cedula_rif: cedulaRif,
        logo_url: urlFinalLogo
      });

      if (error) throw error;

      addToast("¡Configuración y Tasa guardadas con éxito!", 'success'); // ✅ TOAST
      
    } catch (error) {
      addToast(error.message, 'error'); // ✅ TOAST
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 font-sans">
      <header className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10"><Settings className="w-32 h-32"/></div>
        <h2 className="text-2xl font-black flex items-center gap-2 relative z-10">
          <Settings className="text-blue-400 w-7 h-7"/> Ajustes del Negocio
        </h2>
        <p className="text-slate-300 text-sm mt-1 relative z-10">Configura tu tasa de cambio, identidad y datos de pago.</p>
      </header>

      <form onSubmit={guardarConfiguracion} className="space-y-6">
        <div className="bg-emerald-50 p-6 rounded-3xl shadow-sm border border-emerald-100">
          <h3 className="flex items-center gap-2 text-sm font-black text-emerald-800 mb-4 uppercase tracking-wider">
            <DollarSign className="w-5 h-5 text-emerald-600"/> Tasa de Cambio
          </h3>
          <div className="flex items-center gap-3 bg-white p-2 border border-emerald-200 rounded-2xl shadow-inner">
            <span className="text-2xl font-black text-emerald-600 pl-4">Bs</span>
            <input 
              type="text" 
              inputMode="decimal" 
              required 
              placeholder="Ej: 36.50" 
              value={inputTasa} 
              onChange={(e) => setInputTasa(e.target.value)} 
              className="w-full px-4 py-3 outline-none text-2xl font-black text-slate-800 bg-transparent" 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="button"
              onClick={cargarTasaOficial}
              disabled={cargandoOficial}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {cargandoOficial ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Oficial BCV
            </button>
            <button
              type="button"
              onClick={aplicarTasaManual}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <PenTool className="w-4 h-4" />
              Manual
            </button>
          </div>
          <p className="text-xs text-emerald-600/70 mt-3 font-bold pl-2">
            {origenGlobal === 'oficial' ? '✅ Usando tasa oficial del BCV' : '✏️ Usando tasa manual ingresada'}
          </p>
        </div>

        {/* Toggle para mostrar/ocultar Maxi */}
<div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
  <div className="flex items-center justify-between">
    <div>
      <label className="text-sm font-black text-slate-700">Mostrar a Maxi</label>
      <p className="text-xs text-slate-400">El asistente te motivará con versículos bíblicos</p>
    </div>
    <button
      type="button"
      onClick={() => {
        const newValue = !maxiVisible.get();
        maxiVisible.set(newValue);
        localStorage.setItem('maxi_visible', newValue);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maxiVisible.get() ? 'bg-blue-600' : 'bg-gray-300'}`}
    >

      
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maxiVisible.get() ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
</div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-2"><Store className="w-4 h-4 text-blue-500"/> Nombre Comercial</label>
              <input type="text" required placeholder="Ej: Maxi Yogurt" value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-700" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-2"><MessageSquare className="w-4 h-4 text-green-500"/> Mensaje del Ticket</label>
              <input type="text" required placeholder="Ej: ¡Gracias por elegirnos!" value={mensajeRecibo} onChange={(e) => setMensajeRecibo(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-slate-700" />
            </div>
          </div>
          <hr className="border-slate-100" />
          <div>
            <h3 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-4"><CreditCard className="w-4 h-4 text-purple-500"/> Datos de Pago Móvil</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Banco (Ej: 0134)" value={banco} onChange={(e) => setBanco(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm" />
              <input type="text" placeholder="Teléfono (Ej: 0414...)" value={telefonoPago} onChange={(e) => setTelefonoPago(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm" />
              <input type="text" placeholder="Cédula/RIF (Ej: V123...)" value={cedulaRif} onChange={(e) => setCedulaRif(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm" />
            </div>
          </div>
          <hr className="border-slate-100" />
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Logo del Negocio</label>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 space-y-4 w-full">
                <div className="relative border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors rounded-2xl p-6 text-center cursor-pointer">
                  <input type="file" accept="image/*" onChange={manejarSeleccionArchivo} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-blue-700">Toca para subir imagen</p>
                </div>
                <div className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">O Elige una plantilla</div>
                <div className="flex justify-center gap-3">
                  {LOGOS_PREDETERMINADOS.map((url, idx) => (
                    <button type="button" key={idx} onClick={() => seleccionarPredeterminado(url)} className={`relative w-12 h-12 rounded-xl border-2 overflow-hidden transition-all hover:scale-110 ${vistaPrevia === url ? 'border-blue-600 shadow-md' : 'border-slate-200'}`}>
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                      {vistaPrevia === url && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><CheckCircle className="text-white w-5 h-5"/></div>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-64 bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center shrink-0">
                <div className="w-24 h-24 bg-white rounded-full shadow-lg border-4 border-white overflow-hidden mb-4 flex items-center justify-center">
                  {vistaPrevia ? <img src={vistaPrevia} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-10 h-10 text-slate-300"/>}
                </div>
                <h3 className="text-lg font-black text-slate-800 leading-tight">{nombreNegocio || 'Tu Local'}</h3>
              </div>
            </div>
          </div>
        </div>

        <button disabled={procesando} type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all">
          {procesando ? <Loader2 className="animate-spin w-6 h-6"/> : <Save className="w-6 h-6"/>}
          GUARDAR AJUSTES TOTALES
        </button>
      </form>
    </div>
  );
}