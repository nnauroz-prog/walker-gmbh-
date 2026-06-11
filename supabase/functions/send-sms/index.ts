// Walker GmbH — SMS-Versand bei Status "Abholbereit"
//
// Deployment (einmalig, NICHT von Walker):
//   1. Supabase CLI installieren: https://supabase.com/docs/guides/cli
//   2. supabase login
//   3. supabase link --project-ref <PROJECT_REF>
//   4. supabase secrets set SMS_API_KEY=<seven.io API-Key>
//      supabase secrets set SMS_SENDER="Walker GmbH"
//   5. supabase functions deploy send-sms
//   6. Database-Trigger im SQL-Editor anlegen (siehe setup.sql Abschnitt 7)
//
// Provider-Wahl: seven.io (DE-Server, DSGVO-konform, ~7 Cent/SMS).
// Alternative Provider können durch Anpassung der `sendSms()`-Funktion
// unten verwendet werden — der Rest bleibt identisch.

// Deno-Std (Supabase Edge Function Runtime)
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SMS_API_KEY = Deno.env.get("SMS_API_KEY") ?? "";
const SMS_SENDER  = Deno.env.get("SMS_SENDER") ?? "Walker GmbH";

interface Payload {
  plate?: string;
  plate_display?: string;
  customer_phone?: string;
  sms_consent?: boolean;
  status?: string;
  sms_sent_at?: string | null;
}

interface TriggerPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Payload | null;
  old_record: Payload | null;
  schema: string;
}

function buildMessage(record: Payload): string {
  const plate = record.plate_display || record.plate || "Ihr Fahrzeug";
  return (
    `Walker GmbH: Ihr Mercedes-Benz (${plate}) ist abholbereit.\n` +
    `Mo–Do 07:30–18:30, Fr 07:00–12:00.\n` +
    `Ifflandstraße 71, Hamburg-Hohenfelde.`
  );
}

async function sendSms(phone: string, text: string): Promise<{ ok: boolean; error?: string }> {
  if (!SMS_API_KEY) return { ok: false, error: "SMS_API_KEY nicht gesetzt" };

  // seven.io REST-API
  const response = await fetch("https://gateway.seven.io/api/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": SMS_API_KEY,
    },
    body: JSON.stringify({
      to: phone,
      from: SMS_SENDER,
      text: text,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return { ok: false, error: `seven.io ${response.status}: ${errText.slice(0, 200)}` };
  }
  return { ok: true };
}

serve(async (req: Request) => {
  // Erwartet POST mit Supabase-DB-Trigger-Payload ODER manuellen Trigger
  if (req.method !== "POST") {
    return new Response("Only POST", { status: 405 });
  }

  let payload: TriggerPayload;
  try {
    payload = await req.json() as TriggerPayload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const rec = payload.record;
  if (!rec) return new Response("No record", { status: 200 });

  // Versand-Bedingungen prüfen
  if (rec.status !== "ready") return new Response("not-ready", { status: 200 });
  if (!rec.sms_consent)       return new Response("no-consent", { status: 200 });
  if (!rec.customer_phone)    return new Response("no-phone", { status: 200 });
  if (rec.sms_sent_at)        return new Response("already-sent", { status: 200 });

  // Vorheriger Status: nur senden wenn von etwas anderem auf "ready" gewechselt
  // wurde — Updates ohne Status-Wechsel (z. B. Hinweis-Edit) lösen kein SMS aus
  const prev = payload.old_record;
  if (prev && prev.status === "ready") {
    return new Response("status-unchanged", { status: 200 });
  }

  const result = await sendSms(rec.customer_phone, buildMessage(rec));

  if (!result.ok) {
    console.error("SMS send failed:", result.error);
    return new Response(JSON.stringify({ ok: false, error: result.error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Erfolgreich versendet — sms_sent_at zurückschreiben, damit kein
  // Doppel-Versand bei späterem Update passiert
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (SUPABASE_URL && SERVICE_KEY && rec.plate) {
    await fetch(`${SUPABASE_URL}/rest/v1/vehicle_status?plate=eq.${encodeURIComponent(rec.plate)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ sms_sent_at: new Date().toISOString() }),
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
