

import { registrarEvento } from '../store/maxiStore';

/**
 * Los componentes pueden llamar a estas funciones para notificar eventos a Maxi.
 */
export function notificarVenta(datosVenta) {
  registrarEvento('venta', datosVenta);
}

export function notificarCocina(datosReceta) {
  registrarEvento('cocina', datosReceta);
}

export function notificarStockBajo(insumo) {
  registrarEvento('stock_bajo', insumo);
}

export function notificarLogro(mensaje) {
  registrarEvento('logro', { mensaje });
}