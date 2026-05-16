import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Store, MessageSquare, Save, Loader2, UploadCloud, CheckCircle, CreditCard } from 'lucide-react';

const LOGOS_PREDETERMINADOS = [
  "https://api.dicebear.com/7.x/initials/svg?seed=MX&backgroundColor=2563eb",
  "https://api.dicebear.com/7.x/icons/svg?seed=Coffee&backgroundColor=f59e0b",
  "https://api.dicebear.com/7.x/icons/svg?seed=Cake&backgroundColor=ec4899",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Tech&backgroundColor=10b981"
];

export default function ModuloConfiguracion({ usuario }) {
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [nombreNegocio, setNombreNegocio] = useState('');
  const [mensajeRecibo, setMensajeRecibo] = useState('');
  
  // Datos Pago Movil
  const [banco, setBanco] = useState('');
  const [telefonoPago, setTelefonoPago] = useState('');
  const [cedulaRif, setCedulaRif] = useState('');

  const [logoActual, setLogoActual] = useState('');
  const [archivoLocal, setArchivoLocal] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState('');

  useEffect(() => {
    if (usuario?.id) cargarPerfil();
  }, [usuario]);

  const cargarPerfil = async () => {
    setCargando(true);
    const { data } = await supabase.from('perfiles').select('*').eq('user_id', usuario.id).single();
    
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
    setCargando(false);
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

      alert("¡Perfil guardado con éxito!");
      window.location.reload(); 

    } catch (error) {
      alert(error.message);
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Settings className="text-slate-600 w-7 h-7"/> Identidad y Pagos
        </h2>
        <p className="text-slate-500">Configura tus datos para que aparezcan en los recibos automáticos.</p>
      </header>

      <form onSubmit={guardarConfiguracion} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
        
        {/* TEXTOS DEL NEGOCIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2"><Store className="w-4 h-4 text-blue-500"/> Nombre Comercial</label>
            <input type="text" required placeholder="Ej: Maxi Yogurt" value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2"><MessageSquare className="w-4 h-4 text-green-500"/> Mensaje del Ticket</label>
            <input type="text" required placeholder="Ej: ¡Gracias por elegirnos!" value={mensajeRecibo} onChange={(e) => setMensajeRecibo(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* DATOS DE PAGO MOVIL */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4"><CreditCard className="w-4 h-4 text-purple-500"/> Datos de Pago Móvil</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input type="text" placeholder="Banco (Ej: Banesco 0134)" value={banco} onChange={(e) => setBanco(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            </div>
            <div>
              <input type="text" placeholder="Teléfono (Ej: 04141234567)" value={telefonoPago} onChange={(e) => setTelefonoPago(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            </div>
            <div>
              <input type="text" placeholder="Cédula/RIF (Ej: V12345678)" value={cedulaRif} onChange={(e) => setCedulaRif(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* ÁREA DE IMAGEN DE MARCA */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-4">Logo del Negocio</label>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <div className="relative border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors rounded-2xl p-6 text-center cursor-pointer">
                <input type="file" accept="image/*" onChange={manejarSeleccionArchivo} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-blue-700">Subir imagen</p>
              </div>
              <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">O Elige una plantilla</div>
              <div className="flex justify-center gap-3">
                {LOGOS_PREDETERMINADOS.map((url, idx) => (
                  <button type="button" key={idx} onClick={() => seleccionarPredeterminado(url)} className={`relative w-12 h-12 rounded-xl border-2 overflow-hidden transition-all hover:scale-110 ${vistaPrevia === url ? 'border-blue-600 shadow-md' : 'border-slate-200'}`}>
                    <img src={url} alt="preset" className="w-full h-full object-cover" />
                    {vistaPrevia === url && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><CheckCircle className="text-white w-5 h-5"/></div>}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full md:w-64 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center shrink-0">
              <div className="w-24 h-24 bg-white rounded-full shadow-md border-4 border-white overflow-hidden mb-4 flex items-center justify-center">
                {vistaPrevia ? <img src={vistaPrevia} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-10 h-10 text-slate-300"/>}
              </div>
              <h3 className="text-lg font-black text-slate-800 leading-tight">{nombreNegocio || 'Tu Local'}</h3>
            </div>
          </div>
        </div>

        <button disabled={procesando} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black shadow-xl hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
          {procesando ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>}
          GUARDAR IDENTIDAD
        </button>
      </form>
    </div>
  );
}