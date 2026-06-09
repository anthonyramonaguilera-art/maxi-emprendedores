import { supabase } from '../lib/supabase';

/**
 * Obtiene los insumos activos (no archivados) de un usuario.
 */
export async function fetchInsumosActivos(userId) {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('user_id', userId)
    .eq('archivado', false)
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Obtiene los insumos archivados.
 */
export async function fetchInsumosArchivados(userId) {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('user_id', userId)
    .eq('archivado', true)
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Crea un nuevo insumo.
 */
export async function createInsumo(data) {
  const { error } = await supabase.from('insumos').insert([data]);
  if (error) throw error;
}

/**
 * Actualiza un insumo existente.
 */
export async function updateInsumo(id, data) {
  const { error } = await supabase.from('insumos').update(data).eq('id', id);
  if (error) throw error;
}

/**
 * Elimina un insumo.
 */
export async function deleteInsumo(id) {
  const { error } = await supabase.from('insumos').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Sube una imagen al bucket de insumos y devuelve la URL pública.
 */
export async function uploadInsumoImage(userId, file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const { error } = await supabase.storage
    .from('insumos')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('Error al subir imagen.');
  const { data } = supabase.storage.from('insumos').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function toggleFavorito(id, valor) {
  const { error } = await supabase.from('insumos').update({ es_favorito: valor }).eq('id', id);
  if (error) throw error;
}

export async function toggleFijado(id, valor) {
  const { error } = await supabase.from('insumos').update({ fijado: valor }).eq('id', id);
  if (error) throw error;
}

export async function archivarConFecha(id) {
  const { error } = await supabase.from('insumos').update({
    archivado: true,
    fecha_archivado: new Date().toISOString()
  }).eq('id', id);
  if (error) throw error;
}

export async function restaurarInsumo(id) {
  const { error } = await supabase.from('insumos').update({
    archivado: false,
    fecha_archivado: null
  }).eq('id', id);
  if (error) throw error;
}