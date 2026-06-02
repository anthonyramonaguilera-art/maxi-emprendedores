import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Star, Zap, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import useSound from '../hooks/useSound';
import { xpStore, nivelStore, leccionesCompletadasStore, completarLeccion } from '../store/aprendizajeStore';
import { actualizarRachaAprendizaje } from '../store/rachaStore';

// Definición de lecciones (más enriquecidas y bíblicas)
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
        correcta: 0, // (2.5-1.5)/2.5 = 0.4 -> 40%
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
        correcta: 1, // 20 / (2-1) = 20
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
  }
];

export default function Aprender({ playSound }) {
  const [leccionActual, setLeccionActual] = useState(null); // objeto lección
  const [pasoActual, setPasoActual] = useState(0);
  const [mostrarRetro, setMostrarRetro] = useState(false);
  const [retroTexto, setRetroTexto] = useState('');
  const [retroCorrecta, setRetroCorrecta] = useState(true);
  const [completada, setCompletada] = useState(false);
  const [leccionCompletadaHoy, setLeccionCompletadaHoy] = useState(false);

  const xp = useStore(xpStore);
  const nivel = useStore(nivelStore);
  const completadas = useStore(leccionesCompletadasStore);

  useEffect(() => {
    actualizarRachaAprendizaje();
  }, []);

  const iniciarLeccion = (leccion) => {
    setLeccionActual(leccion);
    setPasoActual(0);
    setCompletada(false);
    setMostrarRetro(false);
    if (playSound) playSound('pencil_write');
  };

  const responder = (indice) => {
    const paso = leccionActual.pasos[pasoActual];
    const esCorrecta = indice === paso.correcta;
    setRetroTexto(paso.retro);
    setRetroCorrecta(esCorrecta);
    setMostrarRetro(true);
    if (playSound) {
      esCorrecta ? playSound('coin_drop') : playSound('alert');
    }
    if (esCorrecta) {
      setTimeout(() => {
        setMostrarRetro(false);
        if (pasoActual + 1 < leccionActual.pasos.length) {
          setPasoActual(pasoActual + 1);
        } else {
          // Lección completada
          setCompletada(true);
          const primeraVez = completarLeccion(leccionActual.key);
          setLeccionCompletadaHoy(primeraVez);
          if (playSound) playSound('celebration');
        }
      }, 1800);
    }
  };

  const cerrarLeccion = () => {
    setLeccionActual(null);
    setCompletada(false);
  };

  // Vista de lista de lecciones
  if (!leccionActual) {
    return (
      <div className="space-y-4 font-sans pb-24">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h2 className="font-black text-xl">Aprende con Maxi</h2>
              <p className="text-purple-100 text-sm">Nivel {nivel} • {xp} XP</p>
            </div>
          </div>
          {/* Barra de progreso de nivel */}
          <div className="mt-3 bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="bg-yellow-300 h-full rounded-full" style={{ width: `${Math.min(100, (xp / 100) * 10)}%` }}></div>
          </div>
        </div>

        <h3 className="font-black text-slate-800 text-lg">Lecciones disponibles</h3>
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
                  <p className="text-xs text-slate-400">{lec.pasos.length} preguntas • 50 XP</p>
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

  // Vista de lección activa
  const paso = leccionActual.pasos[pasoActual];
  const progreso = ((pasoActual + (completada ? 1 : 0)) / leccionActual.pasos.length) * 100;

  return (
    <AnimatePresence mode="wait">
      {completada ? (
        <motion.div
          key="completada"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="text-center space-y-6 py-10"
        >
          <div className="text-6xl animate-bounce">{leccionActual.icono}</div>
          <h2 className="text-3xl font-black text-slate-800">¡Lección completada!</h2>
          {leccionCompletadaHoy && (
            <div className="bg-amber-100 inline-block px-4 py-2 rounded-full font-black text-amber-700">
              +50 XP ✨
            </div>
          )}
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
      ) : (
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
              <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${progreso}%` }}></div>
            </div>
            <span className="text-xs font-bold text-slate-500">{pasoActual + 1}/{leccionActual.pasos.length}</span>
          </div>

          <div className={`bg-white rounded-3xl p-6 shadow-lg border border-slate-100`}>
            <h3 className="text-xl font-black text-slate-800 mb-4">{paso.pregunta}</h3>
            <div className="grid gap-3">
              {paso.opciones.map((opcion, idx) => (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !mostrarRetro && responder(idx)}
                  disabled={mostrarRetro}
                  className={`w-full text-left p-4 rounded-2xl font-bold text-sm border-2 transition-all ${
                    mostrarRetro && idx === paso.correcta
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : mostrarRetro && idx !== paso.correcta
                      ? 'border-red-300 bg-red-50 text-red-500 opacity-70'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-purple-300'
                  }`}
                >
                  {opcion}
                </motion.button>
              ))}
            </div>

            {/* Retroalimentación animada */}
            <AnimatePresence>
              {mostrarRetro && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-3 rounded-xl flex items-start gap-2 ${retroCorrecta ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}
                >
                  {retroCorrecta ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
                  <p className="text-sm font-medium">{retroTexto}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}