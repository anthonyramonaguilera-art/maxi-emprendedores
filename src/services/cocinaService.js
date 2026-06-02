import { supabase } from '../lib/supabase';

/**
 * Obtiene los insumos activos con stock > 0, para usar en la olla.
 */
export async function fetchInsumosDisponibles(userId) {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('user_id', userId)
    .eq('archivado', false)
    .gt('cantidad_actual', 0)
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Descuenta la cantidad usada de un insumo.
 */
export async function descontarInsumo(id, nuevaCantidad) {
  const { error } = await supabase
    .from('insumos')
    .update({ cantidad_actual: nuevaCantidad })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Inserta un producto en la tabla productos.
 */
export async function crearProducto(data) {
  const { error } = await supabase.from('productos').insert([data]);
  if (error) throw error;
}

/**
 * Guarda una receta (cabecera).
 */
export async function crearReceta(data) {
  const { data: receta, error } = await supabase
    .from('recetas')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return receta;
}

/**
 * Inserta un ingrediente de una receta.
 */
export async function agregarIngredienteReceta(recetaId, insumoId, cantidad, unidad) {
  const { error } = await supabase
    .from('recetas_ingredientes')
    .insert({ receta_id: recetaId, insumo_id: insumoId, cantidad_necesaria: cantidad, unidad_medida: unidad });
  if (error) throw error;
}

/**
 * Obtiene todas las recetas del usuario.
 */
export async function fetchRecetas(userId) {
  const { data, error } = await supabase
    .from('recetas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Obtiene los ingredientes de una receta específica.
 */
export async function fetchIngredientesReceta(recetaId) {
  const { data, error } = await supabase
    .from('recetas_ingredientes')
    .select('insumo_id, cantidad_necesaria, unidad_medida')
    .eq('receta_id', recetaId);
  if (error) throw error;
  return data;
}

/**
 * Elimina una receta y sus ingredientes (en cascada por BD si está configurado, sino manual).
 */
export async function eliminarReceta(recetaId) {
  const { error } = await supabase.from('recetas').delete().eq('id', recetaId);
  if (error) throw error;
}