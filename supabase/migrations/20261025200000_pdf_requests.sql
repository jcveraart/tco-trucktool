-- PDF-rapport: wie een PDF van zijn berekening maakt, laat eenmalig een e-mailadres achter.
-- Bezoekers mogen alleen toevoegen, nooit lezen. Inzien gaat via het Supabase-dashboard. Rijen ouder dan 25 maanden verwijderen.

create table if not exists public.pdf_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nieuws boolean not null default false,
  vt text check (vt in ('trekker', 'bakwagen', 'bestel', 'bus')),
  modus text check (modus in ('simpel', 'uitgebreid')),
  lang text check (lang in ('nl', 'en')),
  calc_link text check (char_length(calc_link) <= 4000)
);

alter table public.pdf_requests enable row level security;

grant insert on public.pdf_requests to anon;

create policy "Allow public insert of pdf requests"
  on public.pdf_requests for insert
  to anon
  with check (true);
