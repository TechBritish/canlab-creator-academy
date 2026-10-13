// Supabase Edge Function: creates a WooCommerce coupon matching a creator's
// ref_code. Called from the admin dashboard right after a creator is
// approved, so onboarding needs zero manual WooCommerce steps.
//
// Deploy:  supabase functions deploy woo-create-coupon
// Secrets: supabase secrets set WOO_URL=... WOO_CONSUMER_KEY=... WOO_CONSUMER_SECRET=...
//
// Request body: { "ref_code": "ABCD15", "discount_percent": 15 }
// Auth: expects the caller's Supabase access token (verified via --verify-jwt,
// the default), so only logged-in users can call it. Admin-only enforcement
// happens in the RLS-backed profiles check below.

import { createClient } from 'npm:@supabase/supabase-js@2';

const WOO_URL = Deno.env.get('WOO_URL') ?? '';
const WOO_CONSUMER_KEY = Deno.env.get('WOO_CONSUMER_KEY') ?? '';
const WOO_CONSUMER_SECRET = Deno.env.get('WOO_CONSUMER_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer /i, '');
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData.user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (callerProfile?.role !== 'admin') {
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  let body: { ref_code?: string; discount_percent?: number };
  try {
    body = await req.json();
  } catch {
    return new Response('Bad payload', { status: 400, headers: corsHeaders });
  }

  const refCode = body.ref_code?.trim().toUpperCase();
  if (!refCode) {
    return new Response('ref_code is required', { status: 400, headers: corsHeaders });
  }
  const discountPercent = body.discount_percent ?? 10;

  const auth = 'Basic ' + btoa(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`);

  // Avoid creating a duplicate coupon if one with this code already exists.
  const existingRes = await fetch(
    `${WOO_URL}/wp-json/wc/v3/coupons?code=${encodeURIComponent(refCode)}`,
    { headers: { Authorization: auth } }
  );
  const existing = await existingRes.json();
  if (Array.isArray(existing) && existing.length > 0) {
    return new Response(JSON.stringify({ ok: true, coupon: existing[0], created: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const createRes = await fetch(`${WOO_URL}/wp-json/wc/v3/coupons`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: refCode,
      discount_type: 'percent',
      amount: String(discountPercent),
      individual_use: true,
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error('woocommerce coupon create failed', createRes.status, text);
    return new Response(`WooCommerce error: ${text}`, { status: 502, headers: corsHeaders });
  }

  const coupon = await createRes.json();
  return new Response(JSON.stringify({ ok: true, coupon, created: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
