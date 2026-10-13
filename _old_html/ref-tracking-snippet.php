<?php
// Set ref_code cookie + log a click to Supabase when landing with ?ref=
add_action('template_redirect', function () {
    if (empty($_GET['ref'])) return;
    $ref = strtoupper(sanitize_text_field($_GET['ref']));

    setcookie('ref_code', $ref, time() + 60*60*24*30, '/', '', true, true);

    $supabase_url = 'https://mfermgolhwbnsamtkszg.supabase.co';
    $anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZXJtZ29saHdibnNhbXRrc3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MTc0MzIsImV4cCI6MjEwNzA5MzQzMn0.nGbBIivQ9A0smMxtzTw0Vs-C6dxzUP2V4xl8hmetJ8U';

    wp_remote_post($supabase_url . '/rest/v1/clicks', [
        'headers' => [
            'apikey' => $anon_key,
            'Authorization' => 'Bearer ' . $anon_key,
            'Content-Type' => 'application/json',
        ],
        'body' => wp_json_encode([
            'ref_code' => $ref,
            'landing_url' => home_url(add_query_arg(null, null)),
            'ip_hash' => hash('sha256', $_SERVER['REMOTE_ADDR'] ?? ''),
            'ua_hash' => hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? ''),
        ]),
        'timeout' => 3,
        'blocking' => false,
    ]);
});

// Tag the order with the ref_code cookie at checkout
add_action('woocommerce_checkout_create_order', function ($order) {
    if (!empty($_COOKIE['ref_code'])) {
        $order->update_meta_data('_ref_code', sanitize_text_field($_COOKIE['ref_code']));
    }
});
