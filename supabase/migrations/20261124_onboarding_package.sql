-- Onboarding package (Nov 2026).
-- On sign-up, the database (1) creates the creator's WooCommerce coupon at 60%
-- and (2) sends GoHighLevel the welcome payload with ref_code, portal_url and
-- agreement_url, so the GHL welcome email can fill them in.
--
-- Settings live in app_settings. Set them once in the Supabase SQL editor:
--   update app_settings set value = '...' where key = '...';
-- Keys: site_url, functions_url, internal_secret.
-- Safe to run more than once.

create table if not exists app_settings (
  key text primary key,
  value text not null
);
alter table app_settings enable row level security; -- no policies: only security-definer code reads it

insert into app_settings (key, value) values
  ('site_url', 'https://canlab-creator-academy.vercel.app'),
  ('functions_url', 'https://REPLACE-WITH-PROJECT-REF.supabase.co/functions/v1'),
  ('internal_secret', 'REPLACE-ME')
on conflict (key) do nothing;

create or replace function setting(p_key text) returns text
language sql stable security definer set search_path = public as $$
  select value from app_settings where key = p_key;
$$;
revoke all on function setting(text) from public, anon, authenticated;

-- Welcome email, now with the onboarding links and referral code.
create or replace function on_profile_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  site text := rtrim(setting('site_url'), '/');
begin
  if new.role = 'creator' then
    perform notify_academy_email(jsonb_build_object(
      'type', 'welcome',
      'to', new.email,
      'name', split_part(new.full_name, ' ', 1),
      'ref_code', new.ref_code,
      'portal_url', site || '/portal',
      'agreement_url', site || '/agreement'
    ));

    -- Create the 60% WooCommerce coupon named after the referral code.
    perform net.http_post(
      url := rtrim(setting('functions_url'), '/') || '/woo-create-coupon',
      body := jsonb_build_object('ref_code', new.ref_code, 'discount_percent', 60),
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', setting('internal_secret'))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profile_welcome on profiles;
create trigger trg_profile_welcome after insert on profiles
  for each row execute function on_profile_created();
