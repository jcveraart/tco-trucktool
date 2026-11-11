-- Welke verzenddienst een campagnemail heeft verstuurd (Resend of Brevo).
-- Alles van voor 11 november 2026 15:40 ging via Resend.
alter table public.email_verzonden add column if not exists dienst text not null default 'resend';
alter table public.email_verzonden add column if not exists dienst_id text;
alter table public.email_verzonden drop constraint if exists email_verzonden_dienst_chk;
alter table public.email_verzonden add constraint email_verzonden_dienst_chk check (dienst in ('resend', 'brevo'));
notify pgrst, 'reload schema';
