import { emitirEvento } from '../store/maxiStore';

export function notificarVenta(datosVenta) {
  emitirEvento('venta_realizada', {
    totalUsd: datosVenta.totalUsd || 0,
    producto: datosVenta.producto || '',
  });
}

export function notificarPrimeraVentaDelDia() {
  emitirEvento('primera_venta_dia', {});
}

export function notificarRachaAlcanzada(dias) {
  if ([3, 7, 14, 30].includes(dias)) {
    emitirEvento('racha_alcanzada', { dias });
  }
}

export function notificarProductoEstrella(nombre) {
  emitirEvento('producto_estrella', { nombre });
}

export function notificarCocina(datosReceta) {
  emitirEvento('receta_guardada', {
    nombreProducto: datosReceta.nombre || 'una receta',
  });
}

export function notificarStockBajo(insumo) {
  emitirEvento('stock_bajo', { insumo });
}

export function notificarFiadoCobrado(monto) {
  emitirEvento('fiado_cobrado', { monto });
}

export function notificarTasaDesactualizada() {
  emitirEvento('tasa_desactualizada', {});
}

export function notificarUsuarioInactivo() {
  emitirEvento('usuario_inactivo', {});
}

export function notificarLogro(mensaje) {
  emitirEvento('logro', { mensaje });
}
export function notificarRachaPerdida(tipo) {
  emitirEvento('racha_perdida', { tipo });
}