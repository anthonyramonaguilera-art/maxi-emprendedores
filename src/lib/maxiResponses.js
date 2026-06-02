import { supabase } from './supabase';
import { rachasStore } from '../store/rachaStore';
import { tasaBcvStore, origenTasaStore } from '../store/configStore';

// ---- Funciones existentes (obtenerVentasHoy, etc.) las mantienes igual ----
export async function obtenerVentasHoy(userId) {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();
  const { data, error } = await supabase
    .from('ventas')
    .select('total_usd')
    .eq('user_id', userId)
    .gte('created_at', inicio)
    .lt('created_at', fin);
  if (error) return { total: 0, cantidad: 0 };
  const total = data.reduce((acc, v) => acc + parseFloat(v.total_usd), 0);
  return { total, cantidad: data.length };
}

export async function obtenerProductoEstrella(userId) {
  const hace7dias = new Date();
  hace7dias.setDate(hace7dias.getDate() - 7);
  const { data, error } = await supabase
    .from('ventas')
    .select('producto_id, cantidad, total_usd')
    .eq('user_id', userId)
    .gte('created_at', hace7dias.toISOString());
  if (error || !data.length) return null;
  const mapa = {};
  data.forEach(v => {
    if (!mapa[v.producto_id]) mapa[v.producto_id] = { cantidad: 0, total: 0 };
    mapa[v.producto_id].cantidad += v.cantidad;
    mapa[v.producto_id].total += parseFloat(v.total_usd);
  });
  const productos = Object.entries(mapa).sort((a, b) => b[1].cantidad - a[1].cantidad);
  if (!productos.length) return null;
  const [id, datos] = productos[0];
  const { data: prod } = await supabase.from('productos').select('nombre').eq('id', id).single();
  return { nombre: prod?.nombre || 'Producto', ...datos };
}

export async function obtenerStockBajo(userId) {
  const { data } = await supabase
    .from('insumos')
    .select('nombre, cantidad_actual, unidad_medida')
    .eq('user_id', userId)
    .lte('cantidad_actual', 3)
    .order('cantidad_actual', { ascending: true });
  return data || [];
}

// ---- NUEVO: Sistema de lecciones ----

const LECCIONES = {
  costo_real: {
    titulo: '📚 ¿Qué es el costo real?',
    pasos: [
      {
        pregunta: 'Imagina que compras harina por $5.00. ¿Eso es todo lo que te costó hacer un pastel?',
        opciones: ['Sí, solo la harina', 'No, también gasté gas, luz y mi tiempo'],
        respuestaCorrecta: 1,
        explicacion: '¡Exacto! El costo real incluye todos los gastos: ingredientes, gas, electricidad y tu mano de obra. A eso se le llama "costo de producción".'
      },
      {
        pregunta: 'Si vendes el pastel en $15.00 y tu costo real fue $10.00, ¿cuál es tu ganancia?',
        opciones: ['$5.00', '$15.00', '$10.00'],
        respuestaCorrecta: 0,
        explicacion: '¡Correcto! Ganancia = Precio de venta - Costo real. En este caso, $15 - $10 = $5.00. Esa es tu recompensa por tu trabajo.'
      }
    ],
    versiculoFinal: '“El que labra su tierra se saciará de pan; mas el que sigue a los ociosos se llenará de pobreza.” (Proverbios 28:19)'
  }
};

let estadoLeccion = null; // { leccionKey, pasoActual }

export function iniciarLeccion(leccionKey) {
  estadoLeccion = { leccionKey, pasoActual: 0 };
  const leccion = LECCIONES[leccionKey];
  if (!leccion) return null;
  const paso = leccion.pasos[0];
  return {
    texto: `${leccion.titulo}\n\n${paso.pregunta}`,
    opciones: paso.opciones,
  };
}

export function responderLeccion(respuestaIndice) {
  if (!estadoLeccion) return null;
  const leccion = LECCIONES[estadoLeccion.leccionKey];
  if (!leccion) return null;
  const paso = leccion.pasos[estadoLeccion.pasoActual];
  const esCorrecta = paso.respuestaCorrecta === respuestaIndice;
  let texto = '';
  let opciones = [];

  if (esCorrecta) {
    texto = `✅ ${paso.explicacion}`;
    estadoLeccion.pasoActual++;
    if (estadoLeccion.pasoActual < leccion.pasos.length) {
      const siguientePaso = leccion.pasos[estadoLeccion.pasoActual];
      texto += `\n\nSiguiente pregunta:\n${siguientePaso.pregunta}`;
      opciones = siguientePaso.opciones;
    } else {
      texto += `\n\n🎉 ¡Lección completada! ${leccion.versiculoFinal}`;
      estadoLeccion = null;
    }
  } else {
    texto = `❌ No es correcto. ${paso.explicacion}`;
    opciones = paso.opciones; // volver a intentar
  }

  return { texto, opciones };
}

// ---- Función principal generarRespuesta ----

export async function generarRespuesta(mensaje, userId) {
  const texto = mensaje.toLowerCase().trim();

  // Si hay una lección activa, interpretar la respuesta como selección de opción
  if (estadoLeccion) {
    const opciones = LECCIONES[estadoLeccion.leccionKey].pasos[estadoLeccion.pasoActual].opciones;
    const indice = opciones.findIndex(op => op.toLowerCase() === texto);
    if (indice !== -1) {
      return responderLeccion(indice);
    }
    // Si no coincide con ninguna opción, sugerir que elija una
    return {
      texto: 'Por favor, elige una de las opciones disponibles para continuar la lección.',
      opciones: opciones,
    };
  }

  // Solicitud de iniciar lección
  if (/aprender|lección|educación|enséñame/i.test(texto)) {
    return {
      texto: '¡Me encanta que quieras aprender! Tengo una lección sobre "¿Qué es el costo real?". ¿Empezamos?',
      opciones: ['Sí, empezar lección', 'Ahora no, gracias'],
    };
  }

  if (texto === 'sí, empezar lección') {
    return iniciarLeccion('costo_real');
  }

  if (texto === 'ahora no, gracias') {
    return 'Está bien. Cuando quieras aprender, solo dime "Quiero aprender". 😊';
  }

  // Saludos
  if (/hola|buenos días|buenas tardes|buenas noches|hey/i.test(texto)) {
    const saludos = [
      "¡Hola, Emprendedor! 🌟 ¿En qué puedo ayudarte hoy?",
      "¡Bendiciones! ✨ ¿Listo para hacer crecer tu negocio?",
      "¡Hey! 😊 Qué alegría verte por aquí. Dime, ¿cómo va todo?",
      "¡Hola, crack! 💪 ¿Qué tal va la jornada?"
    ];
    return {
      texto: saludos[Math.floor(Math.random() * saludos.length)],
      opciones: ['Dame un resumen', 'Quiero aprender', 'Dame un consejo'],
    };
  }

  // Agradecimientos
  if (/gracias|te quiero|eres genial/i.test(texto)) {
    return "¡A ti! 🙏 Eres una persona increíble y me encanta acompañarte en este viaje. ¡Sigamos brillando juntos! ✨";
  }

  // Preguntas frecuentes
  if (/cómo agrego|agregar insumo|nuevo insumo/i.test(texto)) {
    return {
      texto: "¡Claro! 📦 Ve a la pestaña 'Alacena' y toca el botón verde con el '+' 🟢. Llena el nombre, cantidad y costo. ¿Quieres que te lleve ahora?",
      opciones: ['Ir a Alacena', 'Dame un consejo', 'Volver al menú'],
    };
  }

  if (/cómo vendo|vender producto|despachar/i.test(texto)) {
    return {
      texto: "¡Fácil! 🛒 En 'Mi Nevera' verás tus productos listos para vender. Toca uno para añadirlo al carrito, ajusta la cantidad y presiona 'CONFIRMAR Y RECIBIR PAGO'. ¿Vamos a la nevera?",
      opciones: ['Ir a Mi Nevera', 'Dame un resumen', 'Volver al menú'],
    };
  }

  if (/racha|racha de ventas|qué es racha/i.test(texto)) {
    const rachas = rachasStore.get();
    const msg = `Las rachas 🏆 son tus días consecutivos realizando una actividad. Actualmente llevas:\n🔥 Ventas: ${rachas.ventas?.racha || 0} días\n👨‍🍳 Cocina: ${rachas.cocina?.racha || 0} días\n📚 Aprendizaje: ${rachas.aprendizaje?.racha || 0} días\n¡Cada día cuenta! Si fallas un día, la racha se reinicia. ¿Aceptas el reto de mantenerlas? 💪`;
    return {
      texto: msg,
      opciones: ['¿Cómo aumentar mi racha?', 'Dame un consejo', 'Volver al menú'],
    };
  }

  if (/resumen|balance|ganancias|ventas de hoy|total hoy/i.test(texto)) {
    if (!userId) return "No tengo acceso a tu identidad ahora mismo 😔. Por favor, recarga la página.";

    const [ventasHoy, stockBajo, productoEstrella] = await Promise.all([
      obtenerVentasHoy(userId),
      obtenerStockBajo(userId),
      obtenerProductoEstrella(userId),
    ]);

    let respuesta = `📊 **Resumen de hoy** 📊\n\n`;
    respuesta += `💰 Ventas hoy: $${ventasHoy.total.toFixed(2)} (${ventasHoy.cantidad} transacciones)\n`;

    if (productoEstrella) {
      respuesta += `⭐ Producto estrella: ${productoEstrella.nombre} (${productoEstrella.cantidad} vendidos)\n`;
    }

    if (stockBajo.length > 0) {
      respuesta += `⚠️ Stock bajo en: ${stockBajo.map(i => i.nombre).join(', ')}\n`;
    }

    const tasa = tasaBcvStore.get();
    respuesta += origenTasaStore.get() === 'manual'
      ? `💱 Tasa manual: ${tasa.toFixed(2)} Bs/$ (recuerda actualizarla si cambió)`
      : `💱 Tasa BCV: ${tasa.toFixed(2)} Bs/$`;

    return {
      texto: respuesta,
      opciones: ['¿Cómo puedo mejorar?', 'Dame un consejo', 'Volver al menú'],
    };
  }

  if (/consejo|tip|recomendación/i.test(texto)) {
    const consejos = [
      "⏰ Intenta preparar tus productos estrella la noche anterior para tenerlos listos bien temprano. ¡La frescura vende!",
      "📸 Una buena foto de tu producto puede aumentar tus ventas hasta un 30%. ¿Ya subiste imágenes a tu nevera?",
      "🤝 Ofrece un pequeño descuento por pagos en efectivo o por transferencia inmediata. ¡Te ayuda a fidelizar clientes!",
      "📊 Revisa 'Mis Cuentas' cada noche. Conocer tus números es el primer paso para crecer.",
      "🙏 Comienza cada día con una oración de gratitud. Un corazón agradecido atrae abundancia."
    ];
    return {
      texto: consejos[Math.floor(Math.random() * consejos.length)],
      opciones: ['Otro consejo', 'Dame un resumen', 'Volver al menú'],
    };
  }

  // Mensaje de ayuda por defecto
  return {
    texto: "¡Estoy aquí para ti! 🥰 ¿Qué necesitas?",
    opciones: ['Dame un resumen', 'Quiero aprender', 'Dame un consejo', '¿Qué es una racha?'],
  };
}

export function generarMensajeEvento(evento) {
  const { tipo, datos } = evento;

  switch (tipo) {
    case 'venta':
      const total = datos.totalUsd || 0;
      return `🎉 ¡Sí, vendiste! Acabo de registrar una venta por $${total.toFixed(2)}. ¡Cada venta te acerca más a tu sueño! ✨`;
    case 'cocina':
      return `👨‍🍳 ¡Manos a la obra! Has cocinado algo delicioso. Recuerda ponerle un precio justo que valore tu esfuerzo. 💖`;
    case 'stock_bajo':
      const nombre = datos.nombre || 'un insumo';
      return `⚠️ ¡Cuidado! Te queda poco "${nombre}". ¿Quieres agregarlo a tu lista de compras? Así no te quedarás sin tu material estrella. 🛒`;
    case 'logro':
      return `🏆 ¡Logro desbloqueado! ${datos.mensaje || 'Sigue así, vas por buen camino.'}`;
    default:
      return null;
  }
}