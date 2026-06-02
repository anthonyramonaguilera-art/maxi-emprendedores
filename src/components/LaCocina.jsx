import React, { useState } from 'react';
import { Soup, CakeSlice, Plus, ArrowRight, ArrowLeft, Loader2, Trash2, Store, X, Zap, IceCream, BookMarked, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCocina from '../hooks/useCocina';

export default function LaCocina({ usuario, tasaBcv, playSound }) {
  const {
    alacena,
    cargandoAlacena,
    recetas,
    cargandoRecetas,
    ingredientesOlla,
    costoIngredientesUsd,
    agregarALaOlla,
    actualizarCantidadUsada,
    sacarDeLaOlla,
    enviarANevera,
    cargarRecetaCompleta,
    handleEliminarReceta,
  } = useCocina(usuario?.id, tasaBcv, playSound);

  const [subPestaña, setSubPestaña] = useState('preparar');
  const [paso, setPaso] = useState(1);
  const [tipoPreparacion, setTipoPreparacion] = useState('olla');
  const [mostrarSelector, setMostrarSelector] = useState(false);

  const [rendimiento, setRendimiento] = useState('');
  const [nombreProducto, setNombreProducto] = useState('');
  const [precioVentaUsd, setPrecioVentaUsd] = useState('');
  const [precioVentaBs, setPrecioVentaBs] = useState('');
  const [tempCongelado, setTempCongelado] = useState('');
  const [tiempoCongelado, setTiempoCongelado] = useState('');
  const [requierePalito, setRequierePalito] = useState(false);
  const [porcentajeOperativo, setPorcentajeOperativo] = useState(15);
  const [modoAvanzadoOperativo, setModoAvanzadoOperativo] = useState(false);
  const [guardarComoReceta, setGuardarComoReceta] = useState(false);
  const [nombreReceta, setNombreReceta] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cálculos basados en el hook
  const montoOperativoUsd = costoIngredientesUsd * (porcentajeOperativo / 100);
  const costoTotalOllaUsd = costoIngredientesUsd + montoOperativoUsd;
  const costoPorPorcionUsd = rendimiento > 0 ? (costoTotalOllaUsd / parseInt(rendimiento)) : 0;
  const precioSugeridoUsd = costoPorPorcionUsd * 1.30;

  // Efecto para sugerir precio
  if (rendimiento > 0 && !precioVentaUsd) {
    const usd = precioSugeridoUsd.toFixed(2);
    setPrecioVentaUsd(usd);
    setPrecioVentaBs((parseFloat(usd) * (tasaBcv || 1)).toFixed(2));
  }

  const handleUsdChange = (value) => {
    const raw = value.replace(',', '.');
    setPrecioVentaUsd(value);
    const num = parseFloat(raw);
    setPrecioVentaBs(!isNaN(num) ? (num * (tasaBcv || 1)).toFixed(2) : '');
  };

  const handleBsChange = (value) => {
    const raw = value.replace(',', '.');
    setPrecioVentaBs(value);
    const num = parseFloat(raw);
    if (!isNaN(num) && tasaBcv) setPrecioVentaUsd((num / tasaBcv).toFixed(2));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    const ok = await enviarANevera({
      nombreProducto, rendimiento, precioVentaUsd, tipoPreparacion,
      tempCongelado, tiempoCongelado, requierePalito, guardarComoReceta, nombreReceta,
    });
    if (ok) {
      setRendimiento(''); setNombreProducto(''); setPrecioVentaUsd(''); setPrecioVentaBs('');
      setPaso(1); setPorcentajeOperativo(15); setModoAvanzadoOperativo(false);
      setTempCongelado(''); setTiempoCongelado(''); setRequierePalito(false);
      setGuardarComoReceta(false); setNombreReceta('');
    }
    setGuardando(false);
  };

  if (cargandoAlacena) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-4 font-sans pb-24">
      {/* Header */}
      <div className="bg-amber-50 rounded-3xl p-4 shadow-sm flex items-center gap-3 border border-amber-100">
        <div className="text-3xl animate-bounce">👨🏻‍🍳</div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-amber-600">Maxi Chef</p>
          <p className="text-sm font-bold text-slate-700 leading-tight mt-0.5">
            {subPestaña === 'preparar' ? (paso === 1 ? "Echa los ingredientes a la olla" : "Dime cuántos salieron") : "Tus recetas guardadas"}
          </p>
        </div>
      </div>

      {/* Pestañas internas */}
      <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={() => { setSubPestaña('preparar'); setPaso(1); }} className={`flex-1 py-2 rounded-xl font-black text-sm flex items-center justify-center gap-2 ${subPestaña === 'preparar' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 bg-slate-50'}`}>
          <Soup className="w-5 h-5"/> Preparar
        </button>
        <button onClick={() => setSubPestaña('misRecetas')} className={`flex-1 py-2 rounded-xl font-black text-sm flex items-center justify-center gap-2 ${subPestaña === 'misRecetas' ? 'bg-purple-100 text-purple-700' : 'text-slate-400 bg-slate-50'}`}>
          <BookMarked className="w-5 h-5"/> Mis Recetas
        </button>
      </div>

      {/* Contenido preparación */}
      {subPestaña === 'preparar' && (
        <AnimatePresence mode="wait">
          {paso === 1 && (
            <motion.div key="paso1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-white p-2 rounded-2xl flex gap-2 shadow-sm border border-slate-100">
                <button onClick={() => setTipoPreparacion('olla')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 ${tipoPreparacion === 'olla' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 bg-slate-50'}`}><Soup className="w-5 h-5"/> Mezcla / Olla</button>
                <button onClick={() => setTipoPreparacion('bandeja')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 ${tipoPreparacion === 'bandeja' ? 'bg-orange-100 text-orange-700' : 'text-slate-400 bg-slate-50'}`}><CakeSlice className="w-5 h-5"/> Masas / Horno</button>
                <button onClick={() => setTipoPreparacion('congelador')} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 ${tipoPreparacion === 'congelador' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 bg-slate-50'}`}><IceCream className="w-5 h-5"/> Congelador</button>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 min-h-[200px] flex flex-col">
                <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                  {tipoPreparacion === 'olla' ? '🥣 Dentro de la Olla' : tipoPreparacion === 'bandeja' ? '🥮 En la Bandeja' : '🧊 En el Congelador'}
                </h3>
                <div className="space-y-3 flex-1">
                  {ingredientesOlla.length === 0 && (
                    <div className="text-center py-8 opacity-50">
                      <Soup className="w-12 h-12 mx-auto mb-2 text-slate-300"/>
                      <p className="text-sm font-bold text-slate-400">La preparación está vacía</p>
                    </div>
                  )}
                  {ingredientesOlla.map((item) => {
                    const cant = parseFloat(item.cantidadUsada.toString().replace(',', '.')) || 0;
                    const costoPielUsd = ((item.insumo.costo_usd / item.insumo.cantidad_actual) * cant);
                    const costoPielBs = costoPielUsd * (tasaBcv || 1);
                    return (
                      <div key={item.insumo.id} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-slate-700 text-sm truncate">{item.insumo.nombre}</p>
                          <div className="flex gap-2 mt-1">
                            <input type="text" inputMode="decimal" placeholder="Cant" value={item.cantidadUsada} onChange={(e) => actualizarCantidadUsada(item.insumo.id, e.target.value)} className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-amber-500" />
                            <span className="text-[10px] font-bold text-slate-400 self-center uppercase">{item.insumo.unidad_medida}</span>
                          </div>
                        </div>
                        <div className="text-right pr-2">
                          <span className="block font-black text-emerald-600 text-sm leading-none">${costoPielUsd.toFixed(2)}</span>
                          <span className="text-[9px] font-bold text-slate-400">{costoPielBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                        </div>
                        <button onClick={() => sacarDeLaOlla(item.insumo.id)} className="text-slate-400 active:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setMostrarSelector(true)} className="w-full mt-4 border-2 border-dashed border-amber-200 text-amber-600 bg-amber-50 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95">
                  <Plus className="w-5 h-5"/> AÑADIR INGREDIENTE
                </button>
              </div>

              {ingredientesOlla.length > 0 && costoIngredientesUsd > 0 && (
                <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={() => setPaso(2)} className="w-full bg-slate-900 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2">
                  SIGUIENTE PASO <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </motion.div>
          )}

          {paso === 2 && (
            <motion.div key="paso2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              <button onClick={() => setPaso(1)} className="flex items-center gap-2 text-sm font-black text-slate-400 mb-2"><ArrowLeft className="w-4 h-4"/> Volver a la Preparación</button>

              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">¿Qué postre preparaste?</label>
                  <input type="text" placeholder="Ej: Yogurt de Fresa 8oz" value={nombreProducto} onChange={e => setNombreProducto(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl outline-none focus:border-amber-500 font-black mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">¿Cuántas unidades te salieron?</label>
                  <input type="number" placeholder="Ej: 47" value={rendimiento} onChange={e => setRendimiento(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-amber-600 px-4 py-3 rounded-2xl outline-none focus:border-amber-500 font-black text-xl mt-1" />
                </div>

                {tipoPreparacion === 'congelador' && (
                  <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-200 space-y-3">
                    <h4 className="text-xs font-black text-cyan-800 uppercase tracking-wider flex items-center gap-1"><IceCream className="w-3 h-3"/> Parámetros de Congelación</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[10px] font-bold text-cyan-700 block mb-1">Temp. de congelado</label><input type="text" placeholder="Ej: -18°C" value={tempCongelado} onChange={e => setTempCongelado(e.target.value)} className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-cyan-500" /></div>
                      <div><label className="text-[10px] font-bold text-cyan-700 block mb-1">Tiempo de congelado</label><input type="text" placeholder="Ej: 4 horas" value={tiempoCongelado} onChange={e => setTiempoCongelado(e.target.value)} className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-cyan-500" /></div>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-bold text-cyan-800"><input type="checkbox" checked={requierePalito} onChange={e => setRequierePalito(e.target.checked)} className="rounded" /> Requiere palito</label>
                  </div>
                )}

                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-black text-blue-800 uppercase flex items-center gap-1"><Zap className="w-3 h-3"/> Costos Ocultos</label>
                    <button onClick={() => setModoAvanzadoOperativo(!modoAvanzadoOperativo)} className="text-[10px] font-black text-blue-500 uppercase underline">{modoAvanzadoOperativo ? 'Usar Recomendado' : 'Ajuste Avanzado'}</button>
                  </div>
                  {!modoAvanzadoOperativo ? (
                    <div className="flex justify-between items-center bg-white border border-blue-200 p-2.5 rounded-xl shadow-sm"><span className="text-xs font-bold text-slate-500">Porcentaje Sugerido</span><span className="bg-blue-100 text-blue-700 font-black text-xs px-2 py-1 rounded-md">15%</span></div>
                  ) : (
                    <div className="flex gap-2"><div className="relative flex-1"><input type="number" value={porcentajeOperativo} onChange={(e) => setPorcentajeOperativo(e.target.value)} className="w-full bg-white border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 font-black text-sm" /><span className="absolute right-3 top-3 text-slate-400 font-black text-sm">%</span></div></div>
                  )}
                </div>

                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-purple-700"><input type="checkbox" checked={guardarComoReceta} onChange={e => setGuardarComoReceta(e.target.checked)} /> Guardar esta combinación como receta</label>
                  {guardarComoReceta && <input type="text" placeholder="Nombre de la receta" value={nombreReceta} onChange={e => setNombreReceta(e.target.value)} className="mt-2 w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500" />}
                </div>
              </div>

              {rendimiento > 0 && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 rounded-3xl p-5 shadow-xl text-white space-y-4">
                  <div className="space-y-2 border-b border-slate-700 pb-3">
                    <div className="flex justify-between items-center"><span className="text-slate-400 font-medium text-xs">Materia Prima:</span><span className="text-slate-300 font-bold text-sm">${costoIngredientesUsd.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-400 font-medium text-xs">Extras:</span><span className="text-slate-300 font-bold text-sm">+ ${montoOperativoUsd.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-800"><span className="text-slate-200 font-black text-sm">COSTO TOTAL RECETA:</span><span className="text-amber-400 font-black text-lg">${costoTotalOllaUsd.toFixed(2)}</span></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400 font-bold text-sm">Costo Real por Unidad:</span>
                    <div className="text-right"><span className="block text-3xl font-black text-white leading-none">${costoPorPorcionUsd.toFixed(2)}</span><span className="text-xs font-bold text-emerald-300/50">{(costoPorPorcionUsd * (tasaBcv || 1)).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span></div>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mt-2">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2"><span className="text-xs font-bold text-slate-400 uppercase">Sugerido (30%+)</span><span className="text-base font-black text-slate-300">${precioSugeridoUsd.toFixed(2)}</span></div>
                    <label className="text-xs font-black text-amber-400 uppercase block mb-1">Tu precio final de VENTA</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative"><span className="absolute left-3 top-3 text-emerald-400 font-bold text-sm">$</span><input type="text" inputMode="decimal" placeholder="0.00" value={precioVentaUsd} onChange={(e) => handleUsdChange(e.target.value)} className="w-full bg-slate-900 border-2 border-amber-500/50 text-amber-400 pl-8 pr-4 py-3 rounded-xl outline-none focus:border-amber-400 font-black text-xl text-center" /></div>
                      <div className="relative"><span className="absolute left-3 top-3 text-emerald-400 font-bold text-sm">Bs</span><input type="text" inputMode="decimal" placeholder="0.00" value={precioVentaBs} onChange={(e) => handleBsChange(e.target.value)} className="w-full bg-slate-900 border-2 border-amber-500/50 text-amber-400 pl-8 pr-4 py-3 rounded-xl outline-none focus:border-amber-400 font-black text-xl text-center" /></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 text-center">Tasa: {tasaBcv?.toFixed(2) || '---'} Bs/$</p>
                  </div>
                  <button onClick={handleGuardar} disabled={guardando} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex justify-center items-center gap-2 mt-4">
                    {guardando ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Store className="w-6 h-6" /> GUARDAR EN MI NEVERA</>}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mis Recetas */}
      {subPestaña === 'misRecetas' && (
        <div className="space-y-3">
          {cargandoRecetas ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-purple-500"/></div>
          ) : recetas.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200">
              <BookMarked className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 font-medium">No tienes recetas guardadas</p>
            </div>
          ) : (
            recetas.map(receta => (
              <div key={receta.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-800">{receta.nombre}</h3>
                  <p className="text-xs text-slate-500">Rendimiento: {receta.rendimiento || '?'} unidades</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { cargarRecetaCompleta(receta.id); setSubPestaña('preparar'); setPaso(1); }} className="px-3 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-1"><FolderOpen className="w-4 h-4"/> Usar</button>
                  <button onClick={() => handleEliminarReceta(receta.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5"/></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal selector de insumos */}
      <AnimatePresence>
        {mostrarSelector && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-[60] max-w-md mx-auto backdrop-blur-sm" onClick={() => setMostrarSelector(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-[70] p-6 pb-8 h-[70vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0"><h3 className="font-black text-xl text-slate-800">Tu Alacena</h3><button onClick={() => setMostrarSelector(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 active:scale-90"><X className="w-5 h-5"/></button></div>
              <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                {alacena.length === 0 ? (<p className="text-slate-400 text-center">Alacena vacía</p>) : (
                  alacena.map(item => (
                    <button key={item.id} onClick={() => { agregarALaOlla(item); setMostrarSelector(false); }} className="w-full text-left bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center active:bg-amber-50">
                      <span className="font-bold text-slate-700">{item.nombre}</span>
                      <span className="text-xs font-black text-slate-400 bg-white px-2 py-1 rounded-md">{item.cantidad_actual} {item.unidad_medida} disp.</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}