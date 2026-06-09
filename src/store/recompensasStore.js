import { atom } from 'nanostores';

// Puntos (MaxiCoins)
const puntosGuardados = typeof window !== 'undefined' ? parseInt(localStorage.getItem('maxi_puntos') || '0') : 0;
export const puntosStore = atom(puntosGuardados);

puntosStore.listen((value) => {
  if (typeof window !== 'undefined') localStorage.setItem('maxi_puntos', value.toString());
});

export function sumarPuntos(cantidad) {
  puntosStore.set(puntosStore.get() + cantidad);
}

export function restarPuntos(cantidad) {
  puntosStore.set(Math.max(0, puntosStore.get() - cantidad));
}

// Catálogo de accesorios para Maxi
export const ACCESORIOS_TIENDA = [
  { id: 'sombrero_chef', nombre: 'Gorro de Chef', icono: '👨🏻‍🍳', costo: 100, categoria: 'cabeza' },
  { id: 'lentes_sol', nombre: 'Lentes de Sol', icono: '🕶️', costo: 150, categoria: 'cara' },
  { id: 'collar_oro', nombre: 'Collar de Oro', icono: '📿', costo: 200, categoria: 'cuello' },
  { id: 'capa_emprendedor', nombre: 'Capa Emprendedora', icono: '🧥', costo: 300, categoria: 'cuerpo' },
  { id: 'reloj_lujo', nombre: 'Reloj de Lujo', icono: '⌚', costo: 250, categoria: 'muñeca' },
  { id: 'corona_rey', nombre: 'Corona del Rey', icono: '👑', costo: 500, categoria: 'cabeza' },
  { id: 'anillo_bendicion', nombre: 'Anillo de Bendición', icono: '💍', costo: 400, categoria: 'mano' },
  { id: 'zapatos_paz', nombre: 'Zapatos de Paz', icono: '👞', costo: 150, categoria: 'pies' },
];

// Accesorios comprados (ids)
const compradosGuardados = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('maxi_accesorios_comprados') || '[]') : [];
export const accesoriosCompradosStore = atom(compradosGuardados);

accesoriosCompradosStore.listen((value) => {
  if (typeof window !== 'undefined') localStorage.setItem('maxi_accesorios_comprados', JSON.stringify(value));
});

// Accesorio equipado actualmente
const equipadoGuardado = typeof window !== 'undefined' ? localStorage.getItem('maxi_accesorio_equipado') : null;
export const accesorioEquipadoStore = atom(equipadoGuardado);

accesorioEquipadoStore.listen((value) => {
  if (typeof window !== 'undefined') localStorage.setItem('maxi_accesorio_equipado', value || '');
});

export function comprarAccesorio(id) {
  const accesorio = ACCESORIOS_TIENDA.find(a => a.id === id);
  if (!accesorio) return false;
  if (puntosStore.get() < accesorio.costo) return false;
  if (accesoriosCompradosStore.get().includes(id)) return false;
  restarPuntos(accesorio.costo);
  accesoriosCompradosStore.set([...accesoriosCompradosStore.get(), id]);
  return true;
}

export function equiparAccesorio(id) {
  if (!accesoriosCompradosStore.get().includes(id)) return false;
  accesorioEquipadoStore.set(id);
  return true;
}

export function quitarAccesorio() {
  accesorioEquipadoStore.set(null);
}