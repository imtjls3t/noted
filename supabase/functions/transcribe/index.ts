import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_EMAIL = "usual-polo-uphill@duck.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // Verify auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (user.email !== ALLOWED_EMAIL) {
    return new Response(JSON.stringify({ error: "Whisper not available for this account" }), { status: 403 });
  }

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), { status: 500 });
  }

  // Get audio from request form data
  const formData = await req.formData();
  const audioFile = formData.get("audio");
  if (!audioFile) {
    return new Response(JSON.stringify({ error: "No audio file provided" }), { status: 400 });
  }

  // Forward to OpenAI Whisper
  const whisperForm = new FormData();
  whisperForm.append("file", audioFile, "audio.webm");
  whisperForm.append("model", "whisper-1");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: whisperForm,
  });

  if (!whisperRes.ok) {
    const err = await whisperRes.text();
    return new Response(JSON.stringify({ error: `Whisper error: ${err}` }), { status: 502 });
  }

  const result = await whisperRes.json();

  return new Response(JSON.stringify({ text: result.text }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
