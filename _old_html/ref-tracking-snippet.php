<?php
// CANLAB Academy ref_code tracking (cache-safe, Oct 2026).
// Lives in canlabintl.com → Snippets → "Canlab ref_code tracking" (id 23).
// FlyingPress serves cached HTML, so PHP on the landing page doesn't run for
// every visit. The browser script below records the click in the Academy
// database and sets the 30-day ref_code cookie on every visit, cached or not.
// "canlab_click_" is in FlyingPress → Optimization → Delay All JavaScript →
// exclusions so the script runs without waiting for user interaction.
add_action('wp_footer', function () { ?>
<script data-no-optimize="1" data-no-defer="1" data-no-minify="1" data-cfasync="false">
(function () {
  var m = location.search.match(/[?&]ref=([A-Za-z0-9_-]{2,32})/);
  if (!m) return;
  var ref = m[1].toUpperCase();
  document.cookie = 'ref_code=' + ref + '; max-age=' + (60 * 60 * 24 * 30) + '; path=/; secure; samesite=lax';
  // One click per code per browser session, so refreshes don't inflate counts.
  var seen = 'canlab_click_' + ref;
  try { if (sessionStorage.getItem(seen)) return; sessionStorage.setItem(seen, '1'); } catch (e) {}
  var anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aHV4YXNvY2Fra3RnaXRpenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTY4NzEsImV4cCI6MjEwODc3Mjg3MX0.tOVj971CkRk-N1ujVJvorqH5rsRY_SSOBTOf_YkQHZ4';
  fetch('https://xzhuxasocakktgitizqt.supabase.co/rest/v1/clicks', {
    method: 'POST',
    keepalive: true,
    headers: { apikey: anon, Authorization: 'Bearer ' + anon, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ ref_code: ref, landing_url: location.href.slice(0, 500) })
  }).catch(function () {});
})();
</script>
<?php });

// Tag the order with the ref_code cookie at checkout (checkout isn't cached).
add_action('woocommerce_checkout_create_order', function ($order) {
    if (!empty($_COOKIE['ref_code'])) {
        $order->update_meta_data('_ref_code', strtoupper(sanitize_text_field($_COOKIE['ref_code'])));
    }
});
