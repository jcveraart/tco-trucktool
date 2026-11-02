-- E-mailsysteem: Notion-koppeling op contacten, Resend-verzend-id en events,
-- plus een resultatenoverzicht per klant voor het Notion-dashboard.
-- Draaien na 20261102120000_email_campagne.sql.

alter table public.email_contacten add column if not exists notion_page_id text unique;
alter table public.email_verzonden add column if not exists resend_id text;
create index if not exists email_verzonden_resend_idx on public.email_verzonden (resend_id);

-- Gebeurtenissen uit Resend (delivered/opened/clicked/bounced/complained),
-- gesynchroniseerd door scripts/mail/resend-sync.mjs. Alleen laatste stand per mail.
create table if not exists public.email_events (
  resend_id    text primary key,
  token        uuid references public.email_contacten(token) on delete set null,
  campagne     text,
  variant      text,
  last_event   text not null,
  bijgewerkt_op timestamptz not null default now()
);
alter table public.email_events enable row level security;
revoke all on public.email_events from anon, authenticated;

-- Resultaten per klant (voor terugschrijven naar Notion en het dashboard).
create or replace view analytics.email_klant_resultaten as
select c.token, c.email, c.bedrijf, c.naam, c.notion_page_id,
       c.afgemeld_op is not null as afgemeld,
       count(distinct s.campagne) as campagnes,
       count(k.id) as kliks,
       max(k.ontvangen_op) as laatste_klik
from public.email_contacten c
left join public.email_verzonden s on s.token = c.token
left join public.email_kliks k on k.token = c.token and not k.bot
group by c.token, c.email, c.bedrijf, c.naam, c.notion_page_id, c.afgemeld_op;

-- Recente klikken met klantnaam (dashboardblok "laatste klikken").
create or replace view analytics.email_laatste_kliks as
select k.ontvangen_op, k.campagne, k.variant, k.link, c.bedrijf, c.email
from public.email_kliks k
join public.email_contacten c on c.token = k.token
where not k.bot
order by k.ontvangen_op desc;

revoke all on analytics.email_klant_resultaten, analytics.email_laatste_kliks from anon, authenticated;
