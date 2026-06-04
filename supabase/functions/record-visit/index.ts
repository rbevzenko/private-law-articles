import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id required");

    // Try Cloudflare header first (works if Supabase uses CF infrastructure)
    let country: string | null = req.headers.get("cf-ipcountry") || null;

    // Fallback: resolve country from client IP via server-side API call
    if (!country) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        null;

      if (ip && ip !== "::1" && !ip.startsWith("127.")) {
        try {
          const r = await fetch(`https://ipapi.co/${ip}/country/`, {
            headers: { "User-Agent": "supabase-edge-function" },
          });
          if (r.ok) {
            const text = (await r.text()).trim();
            if (text.length === 2) country = text;
          }
        } catch { /* ignore geo lookup failure */ }
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("visits").insert({ session_id, country });

    return new Response(JSON.stringify({ ok: true, country }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
