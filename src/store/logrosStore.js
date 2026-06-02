import { atom } from 'nanostores';
import { agregarMensaje } from './maxiStore'; // importación directa

export const LOGROS_DEFINICIONES = {
  primera_venta: {
    titulo: 'Primera Venta',
    icono: '💰',
    mensaje: '¡Has registrado tu primera venta! Cada paso cuenta en el camino del emprendedor.',
    versiculo: '“El principio de la sabiduría es el temor de Jehová; los insensatos desprecian la sabiduría y la enseñanza.” (Proverbios 1:7)',
  },
  primera_receta: {
    titulo: 'Chef Creador',
    icono: '👨🏻‍🍳',
    mensaje: '¡Has creado tu primera receta! Crear es un don que honra a Dios.',
    versiculo: '“Y vio Dios todo lo que había hecho, y he aquí que era bueno en gran manera.” (Génesis 1:31)',
  },
  racha_3: {
    titulo: 'Constancia de Bronce',
    icono: '🥉',
    mensaje: '¡3 días seguidos! La fidelidad en lo poco te llevará a grandes cosas.',
    versiculo: '“El que en poco es fiel, también en mucho es fiel.” (Lucas 16:10)',
  },
  racha_7: {
    titulo: 'Constancia de Plata',
    icono: '🥈',
    mensaje: '¡Una semana completa! La disciplina es la base del éxito.',
    versiculo: '“Todo lo que te viniere a la mano para hacer, hazlo según tus fuerzas.” (Eclesiastés 9:10)',
  },
  racha_14: {
    titulo: 'Constancia de Oro',
    icono: '🥇',
    mensaje: '¡Dos semanas de fidelidad! Estás construyendo un hábito poderoso.',
    versiculo: '“Porque el Señor da la sabiduría, y de su boca viene el conocimiento y la inteligencia.” (Proverbios 2:6)',
  },
  racha_30: {
    titulo: 'Mayordomo Fiel',
    icono: '👑',
    mensaje: '¡30 días de constancia! Eres un verdadero mayordomo fiel.',
    versiculo: '“Bien, buen siervo y fiel; sobre poco has sido fiel, sobre mucho te pondré.” (Mateo 25:23)',
  },
};

const guardados = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('maxi_logros') || '[]') : [];

export const logrosDesbloqueados = atom(guardados);
export const logroReciente = atom(null);

logrosDesbloqueados.listen((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('maxi_logros', JSON.stringify(value));
  }
});

export function desbloquearLogro(clave) {
  const actuales = logrosDesbloqueados.get();
  if (!actuales.includes(clave) && LOGROS_DEFINICIONES[clave]) {
    logrosDesbloqueados.set([...actuales, clave]);
    const logro = LOGROS_DEFINICIONES[clave];
    logroReciente.set(logro);
    // Anunciar en el chat de Maxi
    agregarMensaje('maxi', `🏆 ¡Nuevo logro! **${logro.titulo}**\n${logro.mensaje}`);
  }
}

export function limpiarLogroReciente() {
  logroReciente.set(null);
}

export function verificarLogrosRacha(rachaVentas) {
  if (rachaVentas === 3) desbloquearLogro('racha_3');
  if (rachaVentas === 7) desbloquearLogro('racha_7');
  if (rachaVentas === 14) desbloquearLogro('racha_14');
  if (rachaVentas === 30) desbloquearLogro('racha_30');
}