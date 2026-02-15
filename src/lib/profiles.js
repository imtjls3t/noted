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

export async function deleteUser(id) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: id }),
  });

  if (!res.ok) {
    let msg;
    try {
      msg = (await res.json()).error;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
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
