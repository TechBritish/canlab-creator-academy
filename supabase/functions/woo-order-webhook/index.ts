// Supabase Edge Function: receives WooCommerce "order created" / "order
// updated" webhooks, verifies the HMAC signature, resolves the creator's
// ref_code from order meta or coupon lines, and upserts into `orders`.
//
// Deploy:  supabase functions deploy woo-order-webhook --no-verify-jwt
// Secrets: supabase secrets set WC_WEBHOOK_SECRET=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
//
// In WooCommerce: Settings -> Advanced -> Webhooks -> Add webhook
//   Topic: Order created (add a second one for Order updated)
//   Delivery URL: https://<project>.supabase.co/functions/v1/woo-order-webhook
//   Secret: same value as WC_WEBHOOK_SECRET

import { createClient } from 'npm:@supabase/supabase-js@2';

const WC_WEBHOOK_SECRET = Deno.env.get('WC_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Orders in these WooCommerce statuses count toward tiers/payouts.
// refunded/cancelled/failed are stored too, but excluded by the portal UI.
type WooOrder = {
  id: number;
  status: string;
  total: string;
  meta_data?: { key: string; value: unknown }[];
  coupon_lines?: { code: string }[];
};

async function verifySignature(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader || !WC_WEBHOOK_SECRET) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(WC_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signatureHeader;
}

function extractRefCode(order: WooOrder): string | null {
  const metaRef = order.meta_data?.find((m) => m.key === '_ref_code')?.value;
  if (typeof metaRef === 'string' && metaRef.trim()) return metaRef.trim().toUpperCase();

  const couponCode = order.coupon_lines?.[0]?.code;
  if (couponCode) return couponCode.trim().toUpperCase();

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-wc-webhook-signature');

  if (!(await verifySignature(rawBody, signature))) {
    return new Response('Invalid signature', { status: 401 });
  }

  let order: WooOrder;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return new Response('Bad payload', { status: 400 });
  }

  // Webhook ping / non-order payloads have no id.
  if (!order?.id) {
    return new Response('ok', { status: 200 });
  }

  const refCode = extractRefCode(order);
  if (!refCode) {
    // No attribution on this order — nothing to record.
    return new Response('ok (no ref)', { status: 200 });
  }

  const { data: creator } = await admin
    .from('profiles')
    .select('id')
    .eq('ref_code', refCode)
    .maybeSingle();

  if (!creator) {
    return new Response('ok (unknown ref_code)', { status: 200 });
  }

  const { error } = await admin.from('orders').upsert(
    {
      woo_order_id: order.id,
      user_id: creator.id,
      ref_code: refCode,
      amount: Number(order.total) || 0,
      status: order.status,
    },
    { onConflict: 'woo_order_id' }
  );

  if (error) {
    console.error('orders upsert failed', error);
    return new Response('db error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
