-- Affiliate click + WooCommerce order tracking
-- Run this once in Supabase SQL editor (or `supabase db push`).

-- 1. Stable, persisted referral code per creator (was previously computed
--    client-side from full_name, which isn't stable or guaranteed unique).
alter table profiles add column if not exists ref_code text unique;

create or replace function gen_ref_code(p_full_name text)
returns text language plpgsql as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := upper(regexp_replace(coalesce(p_full_name, 'CREATOR'), '[^a-zA-Z]', '', 'g'));
  base := left(nullif(base, ''), 4);
  if base is null or base = '' then base := 'CRTR'; end if;
  loop
    candidate := base || (15 + n)::text;
    exit when not exists (select 1 from profiles where ref_code = candidate);
    n := n + 1;
  end loop;
  return candidate;
end;
$$;

create or replace function set_ref_code() returns trigger language plpgsql as $$
begin
  if new.ref_code is null then
    new.ref_code := gen_ref_code(new.full_name);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_ref_code on profiles;
create trigger trg_set_ref_code before insert on profiles
  for each row execute function set_ref_code();

-- Backfill existing creators that don't have a code yet.
update profiles set ref_code = gen_ref_code(full_name) where ref_code is null;

-- 2. Link orders to the WooCommerce order they came from, and to the
--    ref_code that was attributed (via cookie or coupon).
alter table orders add column if not exists woo_order_id bigint unique;
alter table orders add column if not exists ref_code text;
alter table orders add column if not exists status text not null default 'processing';

-- 3. One row per tracked click on canlabintl.com/?ref=...
create table if not exists clicks (
  id bigint generated always as identity primary key,
  ref_code text not null,
  created_at timestamptz not null default now(),
  landing_url text,
  ip_hash text,
  ua_hash text
);
create index if not exists clicks_ref_code_idx on clicks (ref_code);
create index if not exists clicks_created_at_idx on clicks (created_at);

alter table clicks enable row level security;

-- WordPress inserts clicks using the anon key, so anonymous insert must be
-- allowed. Nothing sensitive is exposed by this (write-only for anon).
drop policy if exists "anon can insert clicks" on clicks;
create policy "anon can insert clicks" on clicks
  for insert to anon with check (true);

-- Creators can only read click counts for their own ref_code.
drop policy if exists "creators read own clicks" on clicks;
create policy "creators read own clicks" on clicks
  for select to authenticated
  using (ref_code in (select ref_code from profiles where id = auth.uid()));
