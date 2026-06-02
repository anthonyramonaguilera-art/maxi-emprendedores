import { supabase } from '../lib/supabase';

export async function fetchProductos(userId) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('user_id', userId)
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateProducto(id, updates) {
  const { error } = await supabase.from('productos').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteProducto(id) {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadProductoImage(userId, file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const { error } = await supabase.storage
    .from('productos')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('Error al subir imagen: ' + error.message);
  const { data } = supabase.storage.from('productos').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function crearVenta(ventaData) {
  const { error } = await supabase.from('ventas').insert([ventaData]);
  if (error) throw error;
}