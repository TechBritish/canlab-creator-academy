-- Micro-Influencer Partner Agreement e-signatures (Oct 2026 program).
-- Run once in the Supabase SQL editor.

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
  -- Filled in by Canlab after signing (enrollment / activation record).
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
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "admins read all agreements" on partner_agreements;
create policy "admins read all agreements" on partner_agreements
  for select to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins update agreements" on partner_agreements;
create policy "admins update agreements" on partner_agreements
  for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
