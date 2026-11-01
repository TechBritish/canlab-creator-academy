-- Academy emails (Nov 2026): the database tells GHL when to email.
-- CANLAB's GoHighLevel workflow "CANLAB Academy - creator emails" (Inbound Webhook)
-- creates/updates the contact and sends from admin@canlabintl.com.
--   welcome             right after a creator applies
--   agreement_reminder  once, 3+ days after applying with no signed agreement
--   digest              daily to admin@canlabintl.com: prospects contacted 4+ days ago

create extension if not exists pg_net;
create extension if not exists pg_cron;

alter table profiles add column if not exists agreement_reminded_at timestamptz;
-- Accounts that existed before go-live (team and test sign-ups) never get a reminder.
update profiles set agreement_reminded_at = now() where agreement_reminded_at is null;

create or replace function notify_academy_email(payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://services.leadconnectorhq.com/hooks/ZHrkBqYAcCfsmox7FGc1/webhook-trigger/deebacfd-8f41-4a03-bfa0-964e76ab5e9f',
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
end;
$$;
revoke all on function notify_academy_email(jsonb) from public, anon, authenticated;

-- Welcome email on application.
create or replace function on_profile_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'creator' then
    perform notify_academy_email(jsonb_build_object('type', 'welcome', 'to', new.email, 'name', split_part(new.full_name, ' ', 1)));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profile_welcome on profiles;
create trigger trg_profile_welcome after insert on profiles
  for each row execute function on_profile_created();

-- One reminder for creators who applied 3+ days ago and haven't signed.
create or replace function send_agreement_reminders() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in
    select p.id, p.email, p.full_name from profiles p
    where p.role = 'creator' and p.status <> 'rejected'
      and p.created_at < now() - interval '3 days'
      and p.agreement_reminded_at is null
      and not exists (select 1 from partner_agreements a where a.user_id = p.id)
  loop
    perform notify_academy_email(jsonb_build_object('type', 'agreement_reminder', 'to', r.email, 'name', split_part(r.full_name, ' ', 1)));
    update profiles set agreement_reminded_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Daily digest of prospects needing their one follow-up.
create or replace function send_prospect_digest() returns int
language plpgsql security definer set search_path = public as $$
declare cnt int; rows_html text; summary text;
begin
  select count(*),
         coalesce(string_agg(format('@%s (%s followers, contacted %s) %s',
           handle, followers, to_char(contacted_at, 'DD Mon'), profile_url), E'\n' order by contacted_at), '')
    into cnt, rows_html
    from prospects
   where status = 'Contacted' and contacted_at < now() - interval '4 days';
  if cnt = 0 then return 0; end if;
  select string_agg(format('%s %s', count, status), ', ' order by status) into summary
    from (select status, count(*) from prospects group by status) s;
  perform notify_academy_email(jsonb_build_object(
    'type', 'digest', 'to', 'admin@canlabintl.com', 'name', 'CANLAB team',
    'follow_up_count', cnt, 'follow_up_html', rows_html, 'summary', summary));
  return cnt;
end;
$$;
revoke all on function send_agreement_reminders() from public, anon, authenticated;
revoke all on function send_prospect_digest() from public, anon, authenticated;

-- 14:00 UTC = 9–10am US Eastern.
select cron.unschedule(jobid) from cron.job where jobname in ('academy-agreement-reminders', 'academy-prospect-digest');
select cron.schedule('academy-agreement-reminders', '0 15 * * *', 'select send_agreement_reminders()');
select cron.schedule('academy-prospect-digest', '0 14 * * *', 'select send_prospect_digest()');
