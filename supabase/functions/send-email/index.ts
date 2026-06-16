// Granvia — send-email Edge Function
// Runtime: Deno (Supabase Edge Functions)
// Sends transactional emails via Zoho SMTP using SmtpClient (pure Deno, no npm).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // ── Auth: require a signed-in user ──────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    // ── Parse request body ──────────────────────────────────────────
    const { to, subject, html, text } = await req.json() as {
      to: string;
      subject: string;
      html: string;
      text?: string;
    };

    if (!to || !subject || !html) {
      return json({ error: 'Missing required fields: to, subject, html' }, 400);
    }

    // ── SMTP config from Edge Function secrets ──────────────────────
    const smtpHost  = Deno.env.get('SMTP_HOST')       ?? 'smtp.zoho.in';
    const smtpPort  = Number(Deno.env.get('SMTP_PORT') ?? '587');
    const smtpUser  = Deno.env.get('SMTP_USER')        ?? '';
    const smtpPass  = Deno.env.get('SMTP_PASSWORD')    ?? '';
    const fromEmail = Deno.env.get('SMTP_FROM_EMAIL')  ?? smtpUser;
    const fromName  = Deno.env.get('SMTP_FROM_NAME')   ?? 'Granvia';

    if (!smtpUser || !smtpPass) {
      return json({ error: 'SMTP credentials not configured in Edge Function secrets.' }, 500);
    }

    // ── Send via denomailer (pure Deno SMTP client) ─────────────────
    // Port 465 → implicit TLS (connectTLS)
    // Port 587 → STARTTLS (connect)
    // Port 25  → plain (connect, no TLS) — avoid in production
    const client = new SmtpClient();
    const useTLS = smtpPort === 465;
    if (useTLS) {
      await client.connectTLS({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPass,
      });
    } else {
      await client.connect({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPass,
      });
    }

    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
      content: text ?? html.replace(/<[^>]+>/g, ''),
    });

    await client.close();

    return json({ success: true });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[send-email] error:', message);
    return json({ error: message }, 500);
  }
});
