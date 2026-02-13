import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function addEvent(keywords) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('events')
    .insert({ keywords, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function searchEvents(query) {
  let q = supabase
    .from('events')
    .select('*')
    .order('timestamp', { ascending: false });

  if (query && query.trim()) {
    q = q.ilike('keywords', `%${query.trim()}%`);
  }

  const { data, error } = await q.limit(100);
  if (error) throw error;
  return data;
}

export async function updateEvent(id, keywords) {
  const { data, error } = await supabase
    .from('events')
    .update({ keywords })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
