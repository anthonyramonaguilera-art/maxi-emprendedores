import { supabase } from './supabase';
import { rachasStore } from '../store/rachaStore';
import { tasaBcvStore, origenTasaStore } from '../store/configStore';

/**
 * Obtiene ventas del día actual para un usuario
 */
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

/**
 * Obtiene el producto más vendido (top 1) de los últimos 7 días
 */
export async function obtenerProductoEstrella(userId) {
  const hace7dias = new Date();
  hace7dias.setDate(hace7dias.getDate() - 7);
  const { data, error } = await supabase
    .from('ventas')
    .select('producto_id, cantidad, total_usd')
    .eq('user_id', userId)
    .gte('created_at', hace7dias.toISOString());

  if (error || !data.length) return null;

  // Agrupar por producto_id
  const mapa = {};
  data.forEach(v => {
    if (!mapa[v.producto_id]) mapa[v.producto_id] = { cantidad: 0, total: 0 };
    mapa[v.producto_id].cantidad += v.cantidad;
    mapa[v.producto_id].total += parseFloat(v.total_usd);
  });

  // Ordenar por cantidad descendente
  const productos = Object.entries(mapa).sort((a, b) => b[1].cantidad - a[1].cantidad);
  if (!productos.length) return null;

  const [id, datos] = productos[0];
  // Obtener nombre del producto
  const { data: prod } = await supabase
    .from('productos')
    .select('nombre')
    .eq('id', id)
    .single();

  return { nombre: prod?.nombre || 'Producto', ...datos };
}

/**
 * Obtiene insumos con stock bajo (cantidad <= 3)
 */
export async function obtenerStockBajo(userId) {
  const { data } = await supabase
    .from('insumos')
    .select('nombre, cantidad_actual, unidad_medida')
    .eq('user_id', userId)
    .lte('cantidad_actual', 3)
    .order('cantidad_actual', { ascending: true });

  return data || [];
}

/**
 * Genera una respuesta automática basada en el mensaje del usuario y contexto
 */
export async function generarRespuesta(mensaje, userId) {
  const texto = mensaje.toLowerCase().trim();

  // Saludos
  if (/hola|buenos días|buenas tardes|buenas noches|hey/i.test(texto)) {
    const saludos = [
      "¡Hola, Emprendedor! 🌟 ¿En qué puedo ayudarte hoy?",
      "¡Bendiciones! ✨ ¿Listo para hacer crecer tu negocio?",
      "¡Hey! 😊 Qué alegría verte por aquí. Dime, ¿cómo va todo?",
      "¡Hola, crack! 💪 ¿Qué tal va la jornada?"
    ];
    return saludos[Math.floor(Math.random() * saludos.length)];
  }

  // Agradecimientos
  if (/gracias|te quiero|eres genial/i.test(texto)) {
    return "¡A ti! 🙏 Eres una persona increíble y me encanta acompañarte en este viaje. ¡Sigamos brillando juntos! ✨";
  }

  // Preguntas frecuentes
  if (/cómo agrego|agregar insumo|nuevo insumo/i.test(texto)) {
    return "¡Claro! 📦 Ve a la pestaña 'Alacena' y toca el botón verde con el '+' 🟢. Llena el nombre, cantidad y costo. ¿Ves el campo de imagen? Puedes subir una foto del producto. ¡Así tendrás todo organizado!";
  }

  if (/cómo vendo|vender producto|despachar/i.test(texto)) {
    return "¡Fácil! 🛒 En 'Mi Nevera' verás tus productos listos para vender. Toca uno para añadirlo al carrito, ajusta la cantidad y presiona 'CONFIRMAR Y RECIBIR PAGO'. ¡Ching, venta registrada! 💰";
  }

  if (/racha|racha de ventas|qué es racha/i.test(texto)) {
    const rachas = rachasStore.get();
    return `Las rachas 🏆 son tus días consecutivos realizando una actividad. Actualmente llevas:\n🔥 Ventas: ${rachas.ventas?.racha || 0} días\n👨‍🍳 Cocina: ${rachas.cocina?.racha || 0} días\n📚 Aprendizaje: ${rachas.aprendizaje?.racha || 0} días\n¡Cada día cuenta! Si fallas un día, la racha se reinicia. ¿Aceptas el reto de mantenerlas? 💪`;
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
    if (origenTasaStore.get() === 'manual') {
      respuesta += `💱 Tasa manual: ${tasa.toFixed(2)} Bs/$ (recuerda actualizarla si cambió)`;
    } else {
      respuesta += `💱 Tasa BCV: ${tasa.toFixed(2)} Bs/$`;
    }

    return respuesta;
  }

  if (/consejo|tip|recomendación/i.test(texto)) {
    const consejos = [
      "⏰ Intenta preparar tus productos estrella la noche anterior para tenerlos listos bien temprano. ¡La frescura vende!",
      "📸 Una buena foto de tu producto puede aumentar tus ventas hasta un 30%. ¿Ya subiste imágenes a tu nevera?",
      "🤝 Ofrece un pequeño descuento por pagos en efectivo o por transferencia inmediata. ¡Te ayuda a fidelizar clientes!",
      "📊 Revisa 'Mis Cuentas' cada noche. Conocer tus números es el primer paso para crecer.",
      "🙏 Comienza cada día con una oración de gratitud. Un corazón agradecido atrae abundancia."
    ];
    return consejos[Math.floor(Math.random() * consejos.length)];
  }

  // Mensaje de ayuda por defecto
  const sugerencias = [
    "Puedes preguntarme:",
    "• ¿Cómo agrego un insumo?",
    "• ¿Cómo vendo un producto?",
    "• Dame un resumen",
    "• Dame un consejo",
    "• ¿Qué es una racha?"
  ];
  return `¡Estoy aquí para ti! 🥰\n${sugerencias.join('\n')}`;
}

/**
 * Genera un mensaje a partir de un evento automático (venta, cocina, stock bajo)
 */
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