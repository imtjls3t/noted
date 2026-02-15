import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAIL = "usual-polo-uphill@duck.com";

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

  // Only admin can delete users
  if (user.email !== ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  // Parse request body
  const { user_id } = await req.json();
  if (!user_id) {
    return new Response(JSON.stringify({ error: "Missing user_id" }), { status: 400 });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Delete user's events
  const { error: eventsError } = await adminClient
    .from("events")
    .delete()
    .eq("user_id", user_id);

  if (eventsError) {
    return new Response(JSON.stringify({ error: `Failed to delete events: ${eventsError.message}` }), { status: 500 });
  }

  // Delete auth user (profiles row cascades via FK)
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);

  if (deleteError) {
    return new Response(JSON.stringify({ error: `Failed to delete user: ${deleteError.message}` }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
