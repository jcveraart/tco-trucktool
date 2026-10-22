-- Eigen bezoekersstatistiek voor stekkerofdiesel.nl
-- De site schrijft events weg met de publishable key (alleen insert, nooit lezen).
-- Rapportages staan als views in het schema `analytics`, dat niet via de API openstaat:
-- bekijk ze in de Supabase SQL-editor of Table editor (schema analytics).

create table if not exists public.web_events (
  id           bigint generated always as identity primary key,
  received_at  timestamptz not null default now(),
  client_ts    timestamptz,
  event        text not null check (event ~ '^[a-z][a-z0-9_]{1,39}$'),
  page         text check (char_length(page) <= 40),
  -- 'stat' = toestemming voor statistieken, 'anon' = geen toestemming (geen ID's, alleen paginaweergave en keuze)
  consent      text not null check (consent in ('stat', 'anon')),
  visitor_id   uuid,
  session_id   uuid,
  props        jsonb not null default '{}'::jsonb check (jsonb_typeof(props) = 'object' and pg_column_size(props) <= 6000),
  experiments  jsonb not null default '{}'::jsonb check (jsonb_typeof(experiments) = 'object' and pg_column_size(experiments) <= 1000),
  constraint web_events_anon_has_no_ids check (consent = 'stat' or (visitor_id is null and session_id is null))
);

create index if not exists web_events_received_idx on public.web_events (received_at);
create index if not exists web_events_event_idx    on public.web_events (event, received_at);
create index if not exists web_events_session_idx  on public.web_events (session_id);
create index if not exists web_events_visitor_idx  on public.web_events (visitor_id);

alter table public.web_events enable row level security;

drop policy if exists "site kan events toevoegen" on public.web_events;
create policy "site kan events toevoegen" on public.web_events
  for insert to anon, authenticated
  with check (
    received_at > now() - interval '1 minute'
    and (consent = 'stat' or event in ('page_view', 'consent'))
  );
-- Geen select-, update- of delete-policy: met de publishable key kun je niets teruglezen of wijzigen.
revoke select, update, delete on public.web_events from anon, authenticated;
grant insert on public.web_events to anon, authenticated;

-- ===== Rapportages =====
create schema if not exists analytics;
revoke all on schema analytics from anon, authenticated;

-- Per dag: bezoekers, sessies, paginaweergaven en hoeveel mensen toestemming geven
create or replace view analytics.dagelijks as
select
  date_trunc('day', received_at at time zone 'Europe/Amsterdam')::date as dag,
  count(distinct visitor_id)                                            as bezoekers,
  count(distinct session_id)                                            as sessies,
  count(*) filter (where event = 'page_view')                           as paginaweergaven,
  count(*) filter (where event = 'page_view' and consent = 'anon')      as weergaven_zonder_toestemming,
  count(*) filter (where event = 'consent')                             as keuzes,
  round(100.0 * count(*) filter (where event = 'consent' and (props->>'stat')::boolean)
        / nullif(count(*) filter (where event = 'consent'), 0), 1)      as pct_akkoord_statistieken,
  count(distinct session_id) filter (where event = 'wizard_complete')   as sessies_met_berekening
from public.web_events
group by 1
order by 1 desc;

-- Trechter van de calculator over de laatste 30 dagen, per sessie
create or replace view analytics.trechter as
with s as (
  select session_id,
    bool_or(event = 'page_view' and page = 'calc')                       as calc,
    bool_or(event = 'cta_click')                                         as cta,
    bool_or(event = 'wizard_step' and props->>'step' = 'use')            as st_use,
    bool_or(event = 'wizard_step' and props->>'step' = 'buy')            as st_buy,
    bool_or(event = 'wizard_step' and props->>'step' = 'sub')            as st_sub,
    bool_or(event = 'wizard_step' and props->>'step' = 'en')             as st_en,
    bool_or(event = 'wizard_step' and props->>'step' = 'up')             as st_up,
    bool_or(event = 'wizard_complete')                                   as klaar,
    bool_or(event in ('share', 'print'))                                 as gedeeld
  from public.web_events
  where consent = 'stat' and received_at > now() - interval '30 days'
  group by session_id
)
select * from (values
  (1, 'Calculator bekeken',        (select count(*) from s where calc)),
  (2, 'Op een knop geklikt',       (select count(*) from s where cta)),
  (3, 'Stap Gebruik',              (select count(*) from s where st_use)),
  (4, 'Stap Aanschaf',             (select count(*) from s where st_buy)),
  (5, 'Stap Subsidie',             (select count(*) from s where st_sub)),
  (6, 'Stap Energie',              (select count(*) from s where st_en)),
  (7, 'Stap Onderhoud',            (select count(*) from s where st_up)),
  (8, 'Uitkomst bekeken',          (select count(*) from s where klaar)),
  (9, 'Gedeeld of geprint',        (select count(*) from s where gedeeld))
) t(stap, omschrijving, sessies);

-- Waar haken mensen af in het invulvenster (laatste stap bij sluiten zonder uitkomst)
create or replace view analytics.afhakers as
select props->>'step' as laatste_stap, count(*) as keer
from public.web_events
where event = 'wizard_close' and received_at > now() - interval '30 days'
group by 1 order by 2 desc;

-- Welke knoppen worden gebruikt
create or replace view analytics.knoppen as
select props->>'cta' as knop, count(*) as kliks, count(distinct session_id) as sessies
from public.web_events
where event = 'cta_click' and received_at > now() - interval '30 days'
group by 1 order by 2 desc;

-- Modellen: openen, vergelijken en ermee rekenen
create or replace view analytics.modellen as
select props->>'id' as model,
  count(*) filter (where event = 'model_open')  as geopend,
  count(*) filter (where event = 'model_apply') as gerekend,
  count(*) filter (where event = 'model_compare_item') as vergeleken
from public.web_events
where event in ('model_open', 'model_apply', 'model_compare_item') and received_at > now() - interval '90 days'
group by 1 order by 2 desc;

-- Herkomst van sessies
create or replace view analytics.herkomst as
select coalesce(props->>'utm_source', nullif(props->>'ref', ''), '(direct)') as bron,
  props->>'utm_medium'   as medium,
  props->>'utm_campaign' as campagne,
  count(*)               as sessies,
  count(*) filter (where (props->>'mobile')::boolean) as mobiel
from public.web_events
where event = 'session_start' and received_at > now() - interval '30 days'
group by 1, 2, 3 order by 4 desc;

-- Uitkomsten van berekeningen: wat rekenen mensen door
create or replace view analytics.berekeningen as
select props->>'vt' as voertuig,
  count(*)                                              as berekeningen,
  round(avg((props->>'km')::numeric))                   as gem_km_per_jaar,
  round(100.0 * avg(((props->>'cheaper') = 'e')::int), 1) as pct_elektrisch_goedkoper,
  round(avg((props->>'diff_year')::numeric))            as gem_verschil_per_jaar
from public.web_events
where event = 'wizard_complete' and received_at > now() - interval '90 days'
group by 1 order by 2 desc;

-- A/B-tests: per experiment en variant hoeveel bezoekers het zagen en hoeveel een berekening afrondden
create or replace view analytics.ab_resultaten as
with exp as (
  select distinct props->>'exp' as experiment, props->>'var' as variant, visitor_id
  from public.web_events where event = 'ab_exposure'
), conv as (
  select distinct visitor_id from public.web_events where event = 'wizard_complete'
), cta as (
  select distinct visitor_id from public.web_events where event = 'cta_click'
)
select experiment, variant,
  count(*)                                         as bezoekers,
  count(cta.visitor_id)                            as klikten,
  count(conv.visitor_id)                           as rekenden_door,
  round(100.0 * count(cta.visitor_id)  / count(*), 2) as pct_klik,
  round(100.0 * count(conv.visitor_id) / count(*), 2) as pct_conversie
from exp
left join cta  using (visitor_id)
left join conv using (visitor_id)
group by 1, 2 order by 1, 2;

-- Alle events per type, voor snel overzicht
create or replace view analytics.events as
select event, count(*) as totaal,
  count(*) filter (where received_at > now() - interval '1 day') as laatste_24u,
  max(received_at) as laatst
from public.web_events group by 1 order by 2 desc;

-- Bewaartermijn: events ouder dan 25 maanden opruimen. Draai handmatig of plan met pg_cron:
--   select cron.schedule('web_events_opruimen', '0 3 * * *', 'select analytics.opruimen()');
create or replace function analytics.opruimen() returns void
language sql security definer set search_path = '' as $$
  delete from public.web_events where received_at < now() - interval '25 months';
$$;
revoke all on function analytics.opruimen() from public, anon, authenticated;
