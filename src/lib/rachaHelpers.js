/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (hora local)
 */
export function fechaHoy() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula la fecha de ayer en formato YYYY-MM-DD (hora local)
 */
export function fechaAyer() {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const year = ayer.getFullYear();
  const month = String(ayer.getMonth() + 1).padStart(2, '0');
  const day = String(ayer.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verifica si la fecha dada es hoy (comparación directa de strings)
 */
export function esHoy(fechaStr) {
  return fechaStr === fechaHoy();
}

/**
 * Verifica si la fecha dada es ayer (comparación directa de strings)
 */
export function esAyer(fechaStr) {
  return fechaStr === fechaAyer();
}