-- Auto-approve creators on sign-up (Nov 2026).
-- Every new creator profile is approved the moment it is created, so there is
-- no manual approval step. Admins can still reject a creator later from the
-- admin page (status -> 'rejected'), and content review is unchanged.
--
-- Safe to run more than once. Does NOT change existing 'pending' profiles;
-- approve those from the admin page or with an explicit update.

-- Force status on insert. Runs before the RLS check, so the policy below must
-- not require 'pending' any more. A signed-up user can still only create their
-- own creator profile, and whatever status they send is overwritten here.
create or replace function auto_approve_creator() returns trigger
language plpgsql as $$
begin
  if new.role = 'creator' then
    new.status := 'approved';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_approve_creator on profiles;
create trigger trg_auto_approve_creator before insert on profiles
  for each row execute function auto_approve_creator();

drop policy if exists "new users create own profile" on profiles;
create policy "new users create own profile" on profiles
  for insert to anon, authenticated
  with check (can_create_profile(id) and role = 'creator');
