-- Admin rejection feedback + creator resubmission support for submissions.

-- Rejection reason the admin leaves when moving a submission to "Needs changes".
alter table submissions add column if not exists admin_note text;

-- Set by the creator when they resubmit a previously rejected post, so the
-- admin can see what changed without the creator needing a separate channel.
alter table submissions add column if not exists resubmit_note text;
