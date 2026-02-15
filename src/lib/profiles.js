import { supabase } from './supabase.js';

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function togglePremium(id, isPremium) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_premium: isPremium })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
