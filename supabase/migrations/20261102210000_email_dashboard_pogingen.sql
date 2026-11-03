-- Pogingen op het online e-maildashboard (rate-limit per IP op de code).
create table if not exists public.email_dashboard_pogingen (
  id bigint generated always as identity primary key,
  ip text not null,
  geslaagd boolean not null default false,
  poging_op timestamptz not null default now()
);
create index if not exists email_dashboard_pogingen_ip_tijd on public.email_dashboard_pogingen (ip, poging_op);
alter table public.email_dashboard_pogingen enable row level security;
revoke all on public.email_dashboard_pogingen from anon, authenticated;
