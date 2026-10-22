-- Vlootanalyse: contactaanvragen via het formulier op #vlootanalyse.
-- Bezoekers mogen alleen toevoegen, nooit lezen. Inzien gaat via het Supabase-dashboard.

create table if not exists public.fleet_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company text not null check (char_length(company) between 1 and 200),
  contact_name text not null check (char_length(contact_name) between 1 and 200),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 50),
  fleet_size text check (fleet_size in ('1-5', '6-20', '21-50', '50+')),
  message text check (char_length(message) <= 4000),
  calc_link text check (char_length(calc_link) <= 4000),
  status text not null default 'nieuw' check (status in ('nieuw', 'in behandeling', 'afgerond', 'vervallen'))
);

alter table public.fleet_requests enable row level security;

grant insert on public.fleet_requests to anon;

create policy "Allow public insert of new fleet requests"
  on public.fleet_requests for insert
  to anon
  with check (status = 'nieuw');
