import { supabase } from '../lib/supabase';

/**
 * Obtiene todas las ventas del usuario, ordenadas por fecha descendente.
 */
export async function fetchVentas(userId) {
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Obtiene las ventas de los últimos 7 días para el gráfico.
 */
export async function fetchVentasUltimos7Dias(userId) {
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - 7);
  fechaInicio.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('ventas')
    .select('total_usd, created_at')
    .eq('user_id', userId)
    .gte('created_at', fechaInicio.toISOString());
  if (error) throw error;
  return data;
}

/**
 * Obtiene todos los fiados del usuario, ordenados por fecha descendente.
 */
export async function fetchFiados(userId) {
  const { data, error } = await supabase
    .from('fiados')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Obtiene los productos con stock > 0 para seleccionar en un fiado.
 */
export async function fetchProductosConStock(userId) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('user_id', userId)
    .gt('stock_actual', 0);
  if (error) throw error;
  return data;
}

/**
 * Crea un nuevo fiado.
 */
export async function crearFiado(fiadoData) {
  const { data, error } = await supabase
    .from('fiados')
    .insert(fiadoData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Marca un fiado como pagado.
 */
export async function marcarFiadoPagado(id) {
  const { error } = await supabase.from('fiados').update({ estado: 'Pagado' }).eq('id', id);
  if (error) throw error;
}

/**
 * Registra una venta asociada a un fiado (descuenta stock y crea registro en ventas).
 */
export async function registrarVentaFiado(ventaData) {
  const { error } = await supabase.from('ventas').insert([ventaData]);
  if (error) throw error;
}

/**
 * Descuenta el stock de un producto.
 */
export async function descontarStockProducto(id, nuevoStock) {
  const { error } = await supabase.from('productos').update({ stock_actual: nuevoStock }).eq('id', id);
  if (error) throw error;
}