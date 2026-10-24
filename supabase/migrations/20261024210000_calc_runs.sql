-- Elke berekening in de calculator, volledig: alle invoer, het voertuig en de uitkomst.
-- De site schrijft met de publishable key (alleen insert, nooit lezen). Bekijk ze via analytics.calculaties.
-- Zonder toestemming voor statistieken staat er geen bezoekers- of sessie-ID bij.
-- Een kenteken wordt nooit opgeslagen, alleen de openbare RDW-gegevens (merk, model, bouwjaar, gewicht, euroklasse).

create table if not exists public.calc_runs (
  id           bigint generated always as identity primary key,
  received_at  timestamptz not null default now(),
  client_ts    timestamptz,
  consent      text not null check (consent in ('stat', 'anon')),
  visitor_id   uuid,
  session_id   uuid,
  reeks        uuid not null,                 -- willekeurig per paginabezoek, alleen in het geheugen van de browser
  nr           int not null check (nr between 1 and 10000),
  trigger      text not null check (trigger in ('invulvenster', 'aanpassing')),
  modus        text not null check (modus in ('simpel', 'uitgebreid')),
  vt           text not null check (char_length(vt) <= 20),
  model_id     text check (char_length(model_id) <= 80),
  km           numeric,
  jaren        numeric,
  goedkoper    text check (goedkoper in ('e', 'd', 'gelijk')),
  verschil_jaar numeric,
  invoer       jsonb not null check (jsonb_typeof(invoer) = 'object' and pg_column_size(invoer) <= 12000),
  gewijzigd    jsonb not null default '[]'::jsonb check (jsonb_typeof(gewijzigd) = 'array' and pg_column_size(gewijzigd) <= 4000),
  voertuig     jsonb not null default '{}'::jsonb check (jsonb_typeof(voertuig) = 'object' and pg_column_size(voertuig) <= 4000),
  uitkomst     jsonb not null default '{}'::jsonb check (jsonb_typeof(uitkomst) = 'object' and pg_column_size(uitkomst) <= 4000),
  bron         jsonb not null default '{}'::jsonb check (jsonb_typeof(bron) = 'object' and pg_column_size(bron) <= 1000),
  constraint calc_runs_anon_has_no_ids check (consent = 'stat' or (visitor_id is null and session_id is null)),
  constraint calc_runs_geen_kenteken check (not (voertuig ? 'kenteken') and not (invoer ?| array['kt', 'plk', 'plkE']) and not (gewijzigd ?| array['plk', 'plkE']))
);

create index if not exists calc_runs_received_idx on public.calc_runs (received_at);
create index if not exists calc_runs_reeks_idx    on public.calc_runs (reeks, nr);
create index if not exists calc_runs_visitor_idx  on public.calc_runs (visitor_id);

alter table public.calc_runs enable row level security;

drop policy if exists "site kan berekeningen toevoegen" on public.calc_runs;
create policy "site kan berekeningen toevoegen" on public.calc_runs
  for insert to anon, authenticated
  with check (received_at > now() - interval '1 minute');
revoke select, update, delete on public.calc_runs from anon, authenticated;
grant insert on public.calc_runs to anon, authenticated;

-- Overzicht: één regel per berekening, nieuwste eerst. Klik in de Table editor op invoer/uitkomst voor alles.
create schema if not exists analytics;
create or replace view analytics.calculaties as
select
  id,
  (received_at at time zone 'Europe/Amsterdam')::timestamp(0) as tijd,
  reeks, nr, trigger, modus, vt as voertuig,
  voertuig->>'model'                          as model,
  voertuig->>'diesel'                         as diesel,
  voertuig->>'elektrisch'                     as elektrisch,
  km, jaren,
  (uitkomst->>'diesel_jaar')::numeric         as diesel_per_jaar,
  (uitkomst->>'elektrisch_jaar')::numeric     as elektrisch_per_jaar,
  verschil_jaar,
  (uitkomst->>'pct')::numeric                 as pct,
  (uitkomst->>'terugverdien_jaar')::numeric   as terugverdien_jaar,
  voertuig->'kenteken_diesel'->>'merk'        as kenteken_merk,
  voertuig->'kenteken_diesel'->>'jaar'        as kenteken_bouwjaar,
  gewijzigd, invoer, voertuig as voertuig_details, uitkomst, bron,
  consent, visitor_id, session_id
from public.calc_runs
order by received_at desc;
revoke all on analytics.calculaties from anon, authenticated;

-- Bewaartermijn: zelfde als de events, 25 maanden
create or replace function analytics.opruimen() returns void
language sql security definer set search_path = '' as $$
  delete from public.web_events where received_at < now() - interval '25 months';
  delete from public.calc_runs  where received_at < now() - interval '25 months';
$$;
revoke all on function analytics.opruimen() from public, anon, authenticated;

-- Het kenteken stond tot 24 oktober 2026 in props.inputs van wizard_complete (met toestemming). Weghalen:
update public.web_events set props = jsonb_set(props, '{inputs}', (props->'inputs') - 'plk' - 'plkE')
where event = 'wizard_complete' and props->'inputs' ?| array['plk', 'plkE'];

notify pgrst, 'reload schema';
