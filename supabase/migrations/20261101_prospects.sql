-- Creator prospects for CANLAB's Micro-Influencer outreach (Nov 2026).
-- Seeded from TikTok One (US, 500–3,500 followers); admins work the list
-- from Admin → Prospects and track each creator's outreach status.

create table if not exists prospects (
  id bigint generated always as identity primary key,
  platform text not null default 'TikTok',
  handle text not null,
  name text,
  profile_url text,
  followers int,
  median_views int,
  engagement_rate numeric(6, 2),
  content_tags text,
  industry_tags text,
  highly_active boolean not null default false,
  suggested_rate_usd int,
  found_via text,
  niche_fit text check (niche_fit in ('Strong', 'Possible', 'Weak')),
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Replied', 'Applied', 'Not interested', 'Not a fit')),
  notes text,
  contacted_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (platform, handle)
);
create index if not exists prospects_status_idx on prospects (status);

alter table prospects enable row level security;

drop policy if exists "admins manage prospects" on prospects;
create policy "admins manage prospects" on prospects
  for all to authenticated using (is_admin()) with check (is_admin());
