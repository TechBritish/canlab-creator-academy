// Emails Canlab whenever a creator e-signs the Partner Agreement.
//
// Deploy:  supabase functions deploy agreement-notify
// Secrets: supabase secrets set RESEND_API_KEY=... NOTIFY_EMAIL=gary@... NOTIFY_FROM="CANLAB Academy <partners@canlabacademy.com>"
//
// Called from the site with { id } right after the insert. It reads the row
// with the service role so the email always reflects what was actually saved.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') ?? '';
const NOTIFY_FROM = Deno.env.get('NOTIFY_FROM') ?? 'CANLAB Academy <onboarding@resend.dev>';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    return new Response(JSON.stringify({ skipped: 'email not configured' }), { headers: cors });
  }

  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return new Response('missing id', { status: 400, headers: cors });

  const rowRes = await fetch(`${SUPABASE_URL}/rest/v1/partner_agreements?id=eq.${Number(id)}&select=*`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const [row] = await rowRes.json();
  if (!row) return new Response('not found', { status: 404, headers: cors });

  const signed = new Date(row.signed_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/New_York' });
  const lines: [string, unknown][] = [
    ['Legal name', row.legal_name],
    ['Email', row.email],
    ['Country / state', row.country_state],
    ['Handles', row.handles],
    ['Follower count', row.follower_count],
    ['Option', row.compensation_option],
    ['Signature', row.signature_name],
    ['Signed', `${signed} ET`],
    ['Agreement version', row.agreement_version],
  ];
  const html = `<h2>New Partner Agreement signed</h2>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
${lines.map(([k, v]) => `<tr><td style="color:#666">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('\n')}
</table>
<p style="font-family:sans-serif;font-size:14px">Next: send the secure W-9 and payout request, countersign, then issue the referral link and code. Track it in Admin → Agreements on canlabacademy.com.</p>`;

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: NOTIFY_EMAIL.split(',').map((s) => s.trim()),
      reply_to: row.email,
      subject: `Partner Agreement signed: ${row.legal_name}`,
      html,
    }),
  });
  return new Response(JSON.stringify({ sent: send.ok }), { status: send.ok ? 200 : 502, headers: cors });
});
