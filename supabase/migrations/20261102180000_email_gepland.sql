-- Geplande verzendtijd (Resend scheduled_at) apart bewaren, zodat het
-- dashboard ingeplande mails los van al verstuurde mails kan tonen.
alter table public.email_verzonden add column if not exists gepland_voor timestamptz;
