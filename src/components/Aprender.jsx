import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowRight, CheckCircle2, XCircle, ShoppingBag, RotateCcw } from 'lucide-react';
import useSound from '../hooks/useSound';
import { xpStore, nivelStore, leccionesCompletadasStore, completarLeccion } from '../store/aprendizajeStore';
import { actualizarRachaAprendizaje } from '../store/rachaStore';
import { puntosStore, ACCESORIOS_TIENDA, accesoriosCompradosStore, comprarAccesorio, equiparAccesorio, accesorioEquipadoStore, quitarAccesorio } from '../store/recompensasStore';

// Definición de lecciones (mantengo las tuyas y añado nuevas)
const LECCIONES = [
  {
    key: 'costo_real',
    titulo: '📚 ¿Qué es el costo real?',
    icono: '💰',
    color: 'from-emerald-400 to-green-500',
    pasos: [
      {
        pregunta: 'Compraste harina por $5.00. ¿Eso es todo lo que gastaste para hacer un pastel?',
        opciones: ['Sí, solo la harina', 'No, también gas, luz y mi tiempo'],
        correcta: 1,
        retro: '¡Exacto! El costo real incluye insumos, servicios y tu mano de obra. En la Biblia, Proverbios 14:23 dice: "En toda labor hay fruto". Todo trabajo merece ser valorado.'
      },
      {
        pregunta: 'Si tu costo real es $10.00 y vendes en $15.00, ¿tu ganancia es?',
        opciones: ['$5.00', '$15.00', '$10.00'],
        correcta: 0,
        retro: '¡Sí! Ganancia = Venta - Costo real. Honra a Dios con trabajo justo: "El que trabaja con mano negligente empobrece, pero la mano de los diligentes enriquece" (Proverbios 10:4).'
      }
    ],
    versiculoFinal: '“El que labra su tierra se saciará de pan; mas el que sigue a los ociosos se llenará de pobreza.” (Proverbios 28:19)'
  },
  {
    key: 'margen_ganancia',
    titulo: '📈 Margen de ganancia',
    icono: '📊',
    color: 'from-blue-400 to-indigo-500',
    pasos: [
      {
        pregunta: 'Margen de ganancia es el porcentaje que ganas sobre el costo. Si vendes un yogur en $2.50 y te costó $1.50, ¿qué porcentaje es tu ganancia?',
        opciones: ['40%', '60%', '100%'],
        correcta: 0,
        retro: 'Correcto. Margen = (Precio - Costo) / Precio x 100. Un margen saludable te permite reinvertir y ser generoso. "El alma generosa será prosperada" (Proverbios 11:25).'
      },
      {
        pregunta: 'Para que un negocio sea sostenible, ¿es recomendable tener un margen de al menos?',
        opciones: ['10%', '30%', '5%'],
        correcta: 1,
        retro: '¡Exacto! Un margen del 30% o más te ayuda a cubrir imprevistos y crecer. Como José en Egipto, que ahorró en abundancia para tiempos de escasez (Génesis 41:34-36).'
      }
    ],
    versiculoFinal: '“El que siembra escasamente, también segará escasamente; y el que siembra generosamente, generosamente también segará.” (2 Corintios 9:6)'
  },
  {
    key: 'punto_equilibrio',
    titulo: '⚖️ Punto de equilibrio',
    icono: '🎯',
    color: 'from-purple-400 to-violet-500',
    pasos: [
      {
        pregunta: 'Si cada postre te cuesta $1.00 y lo vendes a $2.00, ¿cuántos debes vender para cubrir un gasto fijo de $20?',
        opciones: ['10', '20', '5'],
        correcta: 1,
        retro: 'Muy bien. Punto de equilibrio = Gastos fijos / (Precio - Costo unitario). Jesús habló de calcular los costos antes de edificar (Lucas 14:28-30). Planificar es sabiduría.'
      }
    ],
    versiculoFinal: '“Porque ¿quién de vosotros, queriendo edificar una torre, no se sienta primero y calcula los gastos, a ver si tiene lo que necesita para acabarla?” (Lucas 14:28)'
  },
  {
    key: 'generosidad',
    titulo: '🤲 Generosidad y diezmo',
    icono: '💖',
    color: 'from-pink-400 to-rose-500',
    pasos: [
      {
        pregunta: 'La Biblia nos enseña a honrar a Dios con nuestros bienes. ¿Qué porción de nuestros ingresos se menciona como "primicias"?',
        opciones: ['El 10% (diezmo)', 'El 50%', 'Todo'],
        correcta: 0,
        retro: 'Correcto. Proverbios 3:9: "Honra a Jehová con tus bienes, y con las primicias de todos tus frutos". Dar con gratitud abre bendiciones.'
      },
      {
        pregunta: '¿Por qué es importante apartar el diezmo ANTES de gastar en otras cosas?',
        opciones: ['Para no olvidarlo', 'Para demostrar que Dios es primero', 'Ambas son correctas'],
        correcta: 2,
        retro: '¡Ambas! Poner a Dios primero en tus finanzas es un acto de fe y mayordomía. "Mas buscad primeramente el reino de Dios... y todas estas cosas os serán añadidas" (Mateo 6:33).'
      }
    ],
    versiculoFinal: '“Honra a Jehová con tus bienes, y con las primicias de todos tus frutos; y serán llenos tus graneros con abundancia.” (Proverbios 3:9-10)'
  },
  {
    key: 'ahorro_hormiga',
    titulo: '🐜 Ahorro para el futuro',
    icono: '🐜',
    color: 'from-amber-400 to-yellow-500',
    pasos: [
      {
        pregunta: 'Proverbios 6:6-8 nos habla de un animal que ahorra en verano. ¿Cuál es?',
        opciones: ['La hormiga', 'La abeja', 'El camello'],
        correcta: 0,
        retro: '¡Sí! "Anda, perezoso, mira a la hormiga... prepara en el verano su comida". Dios nos llama a prever y ahorrar para tiempos difíciles.'
      },
      {
        pregunta: '¿Cuánto se recomienda ahorrar de cada ingreso según la sabiduría financiera?',
        opciones: ['Al menos el 10%', 'Nada, mejor gastarlo', 'Solo si sobra'],
        correcta: 0,
        retro: 'Muy bien. Ahorrar al menos el 10% te permite afrontar emergencias y metas. José ahorró el 20% del grano en Egipto y salvó a una nación (Génesis 41).'
      }
    ],
    versiculoFinal: '“Anda, perezoso, mira a la hormiga, mira sus caminos, y sé sabio; la cual no teniendo capitán, ni gobernador, ni señor, prepara en el verano su comida.” (Proverbios 6:6-8)'
  },
  // NUEVAS LECCIONES
  {
    key: 'deudas',
    titulo: '💳 Cómo manejar las deudas',
    icono: '💳',
    color: 'from-red-400 to-pink-500',
    pasos: [
      {
        pregunta: 'Según Proverbios 22:7, "El rico se enseñorea de los pobres, y el que toma prestado es siervo del que presta." ¿Qué nos enseña esto?',
        opciones: ['Pedir prestado es malo', 'Debemos ser cuidadosos con las deudas', 'No importa deber'],
        correcta: 1,
        retro: 'Correcto. Las deudas no son malas en sí, pero debemos ser sabios y no esclavizarnos a ellas.'
      },
      {
        pregunta: '¿Cuál es una buena práctica antes de endeudarte?',
        opciones: ['Evaluar si puedes pagarlo', 'Pedir sin pensar', 'Esconderte'],
        correcta: 0,
        retro: 'Siempre calcula si el ingreso futuro cubrirá la deuda. La prudencia es clave.'
      }
    ],
    versiculoFinal: '“El rico se enseñorea de los pobres, y el que toma prestado es siervo del que presta.” (Proverbios 22:7)'
  },
  {
    key: 'precio_justo',
    titulo: '🏷️ Cómo fijar precios justos',
    icono: '🏷️',
    color: 'from-teal-400 to-cyan-500',
    pasos: [
      {
        pregunta: 'Además del costo de producción, ¿qué otro factor debe influir en el precio de venta?',
        opciones: ['El color del empaque', 'El valor que percibe el cliente', 'Solo el costo'],
        correcta: 1,
        retro: 'El precio justo refleja el valor para el cliente y cubre costos. Proverbios 11:1: "El peso falso es abominación a Jehová; mas la pesa cabal le agrada".'
      },
      {
        pregunta: 'Si todos venden un producto similar al mismo precio, ¿deberías bajarlo drásticamente para ganar clientes?',
        opciones: ['Sí, siempre', 'No, podrías perder rentabilidad', 'Depende de la estrategia'],
        correcta: 2,
        retro: 'Depende. Una guerra de precios puede dañar tu negocio. A veces es mejor diferenciarte en calidad o servicio.'
      }
    ],
    versiculoFinal: '“El peso falso es abominación a Jehová; mas la pesa cabal le agrada.” (Proverbios 11:1)'
  },
  {
    key: 'flujo_caja',
    titulo: '📋 Flujo de caja simple',
    icono: '📋',
    color: 'from-indigo-400 to-blue-500',
    pasos: [
      {
        pregunta: 'El flujo de caja es:',
        opciones: ['El dinero que entra y sale de tu negocio', 'Solo las ganancias', 'Solo los gastos'],
        correcta: 0,
        retro: 'Correcto. Es el registro de todas las entradas y salidas de dinero en un período.'
      },
      {
        pregunta: '¿Por qué es importante tener un flujo de caja positivo?',
        opciones: ['Para poder pagar deudas y reinvertir', 'No es importante', 'Solo para empresas grandes'],
        correcta: 0,
        retro: 'Un flujo de caja positivo asegura que puedes cubrir tus obligaciones y hacer crecer tu negocio.'
      }
    ],
    versiculoFinal: '“Los pensamientos del diligente ciertamente tienden a la abundancia; mas todo el que se apresura alocadamente, de cierto va a la pobreza.” (Proverbios 21:5)'
  },
  {
    key: 'inversión',
    titulo: '🌱 Principios de inversión',
    icono: '🌱',
    color: 'from-green-400 to-emerald-500',
    pasos: [
      {
        pregunta: 'Según la parábola de los talentos (Mateo 25:14-30), ¿qué hizo el siervo fiel con el dinero recibido?',
        opciones: ['Lo enterró', 'Lo invirtió y duplicó', 'Lo gastó'],
        correcta: 1,
        retro: '¡Exacto! El siervo fiel invirtió y multiplicó lo recibido. Dios espera que hagamos crecer los recursos que nos da.'
      },
      {
        pregunta: '¿Es sabio invertir todo tu dinero en un solo negocio?',
        opciones: ['Sí, es la mejor estrategia', 'No, es mejor diversificar', 'Solo si estás seguro'],
        correcta: 1,
        retro: 'Diversificar reduce riesgos. Eclesiastés 11:2: "Reparte a siete, y aun a ocho; porque no sabes el mal que vendrá sobre la tierra".'
      }
    ],
    versiculoFinal: '“Reparte a siete, y aun a ocho; porque no sabes el mal que vendrá sobre la tierra.” (Eclesiastés 11:2)'
  }
];

export default function Aprender({ playSound }) {
  const [leccionActual, setLeccionActual] = useState(null);
  const [pasoActual, setPasoActual] = useState(0);
  const [respuestas, setRespuestas] = useState([]); // { paso, respuesta, correcta }
  const [completada, setCompletada] = useState(false);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [mostrarTienda, setMostrarTienda] = useState(false);

  const xp = useStore(xpStore);
  const nivel = useStore(nivelStore);
  const completadas = useStore(leccionesCompletadasStore);
  const puntos = useStore(puntosStore);
  const accesoriosComprados = useStore(accesoriosCompradosStore);
  const accesorioEquipado = useStore(accesorioEquipadoStore);

  useEffect(() => {
    actualizarRachaAprendizaje();
  }, []);

  const iniciarLeccion = (leccion) => {
    setLeccionActual(leccion);
    setPasoActual(0);
    setRespuestas([]);
    setMostrarResumen(false);
    setCompletada(false);
    if (playSound) playSound('pencil_write');
  };

  const responder = (indice) => {
    if (!leccionActual) return;
    const paso = leccionActual.pasos[pasoActual];
    const esCorrecta = indice === paso.correcta;
    const nuevaRespuesta = { paso: pasoActual, respuesta: indice, correcta: esCorrecta };
    const nuevasRespuestas = [...respuestas, nuevaRespuesta];
    setRespuestas(nuevasRespuestas);
    if (playSound) {
      esCorrecta ? playSound('coin_drop') : playSound('alert');
    }
    if (pasoActual + 1 < leccionActual.pasos.length) {
      setPasoActual(pasoActual + 1);
    } else {
      // Terminó todas las preguntas, mostrar resumen
      setMostrarResumen(true);
    }
  };

  const reintentarIncorrectas = () => {
    const incorrectas = respuestas.filter(r => !r.correcta);
    if (incorrectas.length === 0) {
      // Todas correctas, completar lección
      completarLeccion(leccionActual.key);
      setCompletada(true);
      if (playSound) playSound('celebration');
    } else {
      // Regresar a la primera pregunta incorrecta
      const primerPasoIncorrecto = incorrectas[0].paso;
      setPasoActual(primerPasoIncorrecto);
      setRespuestas(respuestas.filter(r => r.correcta)); // conservar solo correctas
      setMostrarResumen(false);
      if (playSound) playSound('pencil_write');
    }
  };

  const cerrarLeccion = () => {
    setLeccionActual(null);
    setCompletada(false);
    setMostrarResumen(false);
  };

  // Vista de tienda
  const TiendaView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 text-lg">Tienda de Accesorios</h3>
        <button onClick={() => setMostrarTienda(false)} className="text-slate-400 font-bold text-sm">&larr; Volver</button>
      </div>
      <p className="text-sm text-slate-600">Tus MaxiCoins: 🪙 {puntos}</p>
      <div className="grid gap-3">
        {ACCESORIOS_TIENDA.map(acc => {
          const comprado = accesoriosComprados.includes(acc.id);
          const equipado = accesorioEquipado === acc.id;
          return (
            <div key={acc.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3">
              <span className="text-3xl">{acc.icono}</span>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">{acc.nombre}</h4>
                <p className="text-xs text-slate-400">{comprado ? (equipado ? 'Equipado' : 'Comprado') : `Costo: ${acc.costo} 🪙`}</p>
              </div>
              {comprado ? (
                <button
                  onClick={() => equipado ? quitarAccesorio() : equiparAccesorio(acc.id)}
                  className={`px-3 py-1 rounded-lg font-bold text-sm ${equipado ? 'bg-slate-200 text-slate-600' : 'bg-emerald-500 text-white'}`}
                >
                  {equipado ? 'Quitar' : 'Usar'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (comprarAccesorio(acc.id)) {
                      addToast(`¡Compraste ${acc.nombre}!`, 'success');
                      equiparAccesorio(acc.id);
                    } else {
                      addToast('No tienes suficientes MaxiCoins', 'error');
                    }
                  }}
                  disabled={puntos < acc.costo}
                  className="px-3 py-1 rounded-lg font-bold text-sm bg-amber-500 text-white disabled:opacity-50"
                >
                  Comprar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Vista principal de lecciones
  if (!leccionActual && !mostrarTienda) {
    return (
      <div className="space-y-4 font-sans pb-24">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h2 className="font-black text-xl">Aprende con Maxi</h2>
              <p className="text-purple-100 text-sm">Nivel {nivel} • {xp} XP • 🪙 {puntos}</p>
            </div>
          </div>
          <div className="mt-3 bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="bg-yellow-300 h-full rounded-full" style={{ width: `${Math.min(100, (xp / 100) * 10)}%` }}></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-lg">Lecciones disponibles</h3>
          <button
            onClick={() => setMostrarTienda(true)}
            className="bg-amber-100 text-amber-700 font-bold text-sm px-3 py-1 rounded-full flex items-center gap-1"
          >
            <ShoppingBag className="w-4 h-4" /> Tienda
          </button>
        </div>
        <div className="grid gap-4">
          {LECCIONES.map((lec) => {
            const done = completadas.includes(lec.key);
            return (
              <motion.button
                key={lec.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => iniciarLeccion(lec)}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 text-left active:scale-95 transition-all ${done ? 'opacity-75' : ''}`}
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${lec.color} flex items-center justify-center text-white text-xl`}>
                  {lec.icono}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-800">{lec.titulo}</h4>
                  <p className="text-xs text-slate-400">{lec.pasos.length} preguntas • 50 XP • 50 🪙</p>
                </div>
                {done ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <ArrowRight className="w-6 h-6 text-slate-300" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  if (mostrarTienda) {
    return (
      <div className="space-y-4 font-sans pb-24">
        <TiendaView />
      </div>
    );
  }

  // Vista de lección activa
  const paso = leccionActual.pasos[pasoActual];

  if (mostrarResumen) {
    const total = leccionActual.pasos.length;
    const aciertos = respuestas.filter(r => r.correcta).length;
    const fallos = total - aciertos;
    return (
      <motion.div
        key="resumen"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="text-center space-y-6 py-10"
      >
        <div className="text-6xl">📝</div>
        <h2 className="text-2xl font-black text-slate-800">Resultado</h2>
        <div className="flex justify-center gap-4 text-lg font-bold">
          <span className="text-emerald-600">{aciertos} ✅</span>
          <span className="text-red-500">{fallos} ❌</span>
        </div>
        {fallos > 0 ? (
          <>
            <p className="text-slate-600">¡Sigue intentándolo! Repasa las preguntas incorrectas.</p>
            <button
              onClick={reintentarIncorrectas}
              className="bg-amber-500 text-white font-black py-3 px-6 rounded-2xl flex items-center gap-2 mx-auto active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Repetir incorrectas
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-600 italic px-4">{leccionActual.versiculoFinal}</p>
            <button
              onClick={reintentarIncorrectas}
              className="bg-emerald-500 text-white font-black py-3 px-6 rounded-2xl active:scale-95"
            >
              Completar lección (+50 XP +50 🪙)
            </button>
          </>
        )}
        <button
          onClick={cerrarLeccion}
          className="block mx-auto text-slate-400 font-bold text-sm mt-4"
        >
          Salir sin completar
        </button>
      </motion.div>
    );
  }

  if (completada) {
    return (
      <motion.div
        key="completada"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="text-center space-y-6 py-10"
      >
        <div className="text-6xl animate-bounce">{leccionActual.icono}</div>
        <h2 className="text-3xl font-black text-slate-800">¡Lección completada!</h2>
        <div className="bg-amber-100 inline-block px-4 py-2 rounded-full font-black text-amber-700">
          +50 XP ✨ +50 🪙
        </div>
        <p className="text-slate-600 italic px-4">{leccionActual.versiculoFinal}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={cerrarLeccion}
            className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl active:scale-95"
          >
            Volver a lecciones
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="pregunta"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        <button onClick={cerrarLeccion} className="text-slate-400 font-bold text-sm">&larr; Salir</button>
        <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
          <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${((pasoActual) / leccionActual.pasos.length) * 100}%` }}></div>
        </div>
        <span className="text-xs font-bold text-slate-500">{pasoActual + 1}/{leccionActual.pasos.length}</span>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-4">{paso.pregunta}</h3>
        <div className="grid gap-3">
          {paso.opciones.map((opcion, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={() => responder(idx)}
              className="w-full text-left p-4 rounded-2xl font-bold text-sm border-2 border-slate-200 bg-slate-50 text-slate-700 hover:border-purple-300 transition-all"
            >
              {opcion}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}