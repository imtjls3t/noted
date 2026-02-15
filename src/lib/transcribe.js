import { supabase } from './supabase.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function transcribeWhisper(audioBlob) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: formData,
  });

  const body = await res.text();

  if (!res.ok) {
    let msg;
    try {
      msg = JSON.parse(body).error;
    } catch {
      msg = body;
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const { text } = JSON.parse(body);
  return text;
}
