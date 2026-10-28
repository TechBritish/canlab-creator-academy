-- Full database setup for a fresh CANLAB Creator Academy Supabase project.
-- Rebuilt from what the site code reads and writes (Oct 2026), then the two
-- earlier migrations (affiliate tracking, submission feedback) and partner
-- agreements on top. Safe to run more than once.

-- ---------- profiles ----------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'creator' check (role in ('creator', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  platform text,
  followers text,
  handle text,
  niche text,
  ref_code text unique,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;


-- The apply form inserts the profile straight after sign-up, before email
-- confirmation gives the browser a session. Allow that one insert for a
-- brand-new auth user who has no profile yet, always as a pending creator.
create or replace function can_create_profile(p_id uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from auth.users u where u.id = p_id and u.created_at > now() - interval '30 minutes')
     and not exists (select 1 from profiles p where p.id = p_id);
$$;

drop policy if exists "new users create own profile" on profiles;
create policy "new users create own profile" on profiles
  for insert to anon, authenticated
  with check (can_create_profile(id) and role = 'creator' and status = 'pending');

drop policy if exists "users read own profile" on profiles;
create policy "users read own profile" on profiles
  for select to authenticated using (id = auth.uid() or is_admin());

drop policy if exists "admins update profiles" on profiles;
create policy "admins update profiles" on profiles
  for update to authenticated using (is_admin());

-- ---------- referral codes ----------
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

-- ---------- academy progress ----------
create table if not exists academy_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_key)
);
alter table academy_progress enable row level security;
drop policy if exists "own progress" on academy_progress;
create policy "own progress" on academy_progress
  for all to authenticated using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

-- ---------- quiz attempts ----------
create table if not exists quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  score int,
  passed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table quiz_attempts enable row level security;
drop policy if exists "own quiz attempts" on quiz_attempts;
create policy "own quiz attempts" on quiz_attempts
  for all to authenticated using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

-- ---------- submissions ----------
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  clip_used text,
  platform text,
  post_url text not null,
  status text not null default 'In review',
  status_cls text not null default 'warn',
  views text default '—',
  admin_note text,
  resubmit_note text,
  created_at timestamptz not null default now()
);
alter table submissions enable row level security;
drop policy if exists "creators read own submissions" on submissions;
create policy "creators read own submissions" on submissions
  for select to authenticated using (user_id = auth.uid() or is_admin());
drop policy if exists "creators insert own submissions" on submissions;
create policy "creators insert own submissions" on submissions
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "creators and admins update submissions" on submissions;
create policy "creators and admins update submissions" on submissions
  for update to authenticated using (user_id = auth.uid() or is_admin());

-- ---------- orders ----------
create table if not exists orders (
  id bigint generated always as identity primary key,
  user_id uuid references profiles (id) on delete set null,
  amount numeric(12, 2) not null default 0,
  status text not null default 'processing',
  woo_order_id bigint unique,
  ref_code text,
  created_at timestamptz not null default now()
);
alter table orders enable row level security;
drop policy if exists "creators read own orders" on orders;
create policy "creators read own orders" on orders
  for select to authenticated using (user_id = auth.uid() or is_admin());
drop policy if exists "admins insert orders" on orders;
create policy "admins insert orders" on orders
  for insert to authenticated with check (is_admin());

-- ---------- clicks (written by canlabintl.com) ----------
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
drop policy if exists "anon can insert clicks" on clicks;
create policy "anon can insert clicks" on clicks for insert to anon with check (true);
drop policy if exists "creators read own clicks" on clicks;
create policy "creators read own clicks" on clicks
  for select to authenticated
  using (ref_code in (select ref_code from profiles where id = auth.uid()) or is_admin());

-- ---------- partner agreements ----------
create table if not exists partner_agreements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  agreement_version text not null,
  legal_name text not null,
  email text not null,
  country_state text not null,
  handles text not null,
  follower_count text not null,
  compensation_option text not null default 'Product Partner',
  signature_name text not null,
  confirmed_eligibility boolean not null default false,
  agreed_terms boolean not null default false,
  user_agent text,
  signed_at timestamptz not null default now(),
  w9_received boolean not null default false,
  payout_setup boolean not null default false,
  company_signed_at timestamptz,
  admin_note text
);
create index if not exists partner_agreements_user_idx on partner_agreements (user_id);
alter table partner_agreements enable row level security;
drop policy if exists "creators insert own agreement" on partner_agreements;
create policy "creators insert own agreement" on partner_agreements
  for insert to authenticated
  with check (user_id = auth.uid() and agreed_terms and confirmed_eligibility);
drop policy if exists "creators read own agreement" on partner_agreements;
create policy "creators read own agreement" on partner_agreements
  for select to authenticated using (user_id = auth.uid() or is_admin());
drop policy if exists "admins update agreements" on partner_agreements;
create policy "admins update agreements" on partner_agreements
  for update to authenticated using (is_admin());
