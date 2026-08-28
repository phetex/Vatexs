import { supabase } from './supabase';

export async function uploadListingImage(userId: string, uri: string, mimeType?: string | null) {
  const arraybuffer = await fetch(uri).then((res) => res.arrayBuffer());
  const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage.from('listing-images').upload(path, arraybuffer, {
    contentType: mimeType ?? `image/${fileExt}`,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
  return data.publicUrl;
}
