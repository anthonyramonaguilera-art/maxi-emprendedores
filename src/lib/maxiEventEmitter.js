import { registrarEvento } from '../store/maxiStore';

export function notificarVenta(datosVenta) {
  registrarEvento('venta_realizada', datosVenta);
}

export function notificarCocina(datosReceta) {
  registrarEvento('receta_guardada', datosReceta);
}

export function notificarStockBajo(insumo) {
  registrarEvento('stock_bajo', insumo);
}

export function notificarLogro(mensaje) {
  registrarEvento('logro', { mensaje });
}

export function notificarPrimeraVenta() {
  registrarEvento('primera_venta_dia', {});
}

export function notificarRacha(dias) {
  registrarEvento('racha_alcanzada', { dias });
}

export function notificarProductoEstrella(nombre) {
  registrarEvento('producto_estrella', { nombre });
}

export function notificarFiadoCobrado(monto) {
  registrarEvento('fiado_cobrado', { monto });
}