// ═══════════════════════════════════════════════════════════════
//  VitalDoctor — Webhook Hotmart (Supabase Edge Function)
//  Deploy: Supabase Dashboard → Edge Functions → New → "hotmart-webhook"
//  URL:    https://lrmylsywevawexzcgqzc.supabase.co/functions/v1/hotmart-webhook
//  Env:    HOTMART_WEBHOOK_SECRET  (Supabase → Settings → Edge Functions)
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const SECRET = Deno.env.get("HOTMART_WEBHOOK_SECRET") || "";

serve(async (req) => {
  // ── CORS ──────────────────────────────────────────────────────
  if (req.method === "OPTIONS") return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST" }
  });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // ── Verificar token Hotmart ───────────────────────────────────
  const token = req.headers.get("x-hotmart-hottok") || req.headers.get("hottok") || "";
  if (SECRET && token !== SECRET) {
    console.error("Token inválido:", token);
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const event: string = body.event || body.data?.event || "";
    const data = body.data || body;

    const email = (data?.buyer?.email || data?.subscriber?.email || "").toLowerCase().trim();
    console.log("Hotmart event:", event, "email:", email);

    if (!email) return new Response(JSON.stringify({ ok: true, msg: "no email" }), { status: 200 });

    // ── Encontrar utilizador pelo email ───────────────────────────
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, modulos_ativos, preferencias, plano")
      .eq("email", email);

    // ── Eventos que ACTIVAM o acesso ──────────────────────────────
    const ACTIVAR = [
      "PURCHASE_APPROVED", "PURCHASE_COMPLETE",
      "SUBSCRIPTION_ACTIVE", "RECURRENCE_APPROVED"
    ];
    // ── Eventos que DESACTIVAM o acesso ──────────────────────────
    const DESACTIVAR = [
      "PURCHASE_CANCELED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK",
      "SUBSCRIPTION_CANCELED", "SUBSCRIPTION_EXPIRED", "SUBSCRIPTION_INACTIVE"
    ];

    if (ACTIVAR.includes(event)) {
      // Calcular validade (mensal = +35 dias; anual = +370 dias)
      let validade: string | null = null;
      const period = data?.subscription?.plan?.recurrency_period
        || data?.offer?.payment_mode;
      if (period === "MONTHLY" || period === "monthly") {
        validade = new Date(Date.now() + 35 * 86400000).toISOString().slice(0, 10);
      } else if (period === "YEARLY" || period === "annual") {
        validade = new Date(Date.now() + 370 * 86400000).toISOString().slice(0, 10);
      }

      if (profiles && profiles.length > 0) {
        // Utilizador já registado → activar acesso
        const p = profiles[0];
        const mods = [...new Set([...(p.modulos_ativos || []), "avancado"])];
        const prefs = {
          ...(p.preferencias || {}),
          modulos_validade: { ...(p.preferencias?.modulos_validade || {}), avancado: validade }
        };
        await sb.from("profiles")
          .update({ modulos_ativos: mods, plano: "pro", preferencias: prefs })
          .eq("id", p.id);
        console.log("Acesso activado para:", email, "validade:", validade || "vitalício");
      } else {
        // Utilizador não registado → guardar activação pendente
        await sb.from("config_global").upsert({
          chave: `pending_${email}`,
          valor: JSON.stringify({ email, event, validade, ts: new Date().toISOString() })
        }, { onConflict: "chave" });
        console.log("Activação pendente guardada para:", email);
      }

    } else if (DESACTIVAR.includes(event)) {
      if (profiles && profiles.length > 0) {
        const p = profiles[0];
        const mods = (p.modulos_ativos || []).filter((m: string) => m !== "avancado");
        await sb.from("profiles")
          .update({ modulos_ativos: mods, plano: "trial" })
          .eq("id", p.id);
        console.log("Acesso removido para:", email);
      }
    }

    return new Response(JSON.stringify({ success: true, event, email }), {
      headers: { "Content-Type": "application/json" }, status: 200
    });

  } catch (err) {
    console.error("Erro no webhook:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
