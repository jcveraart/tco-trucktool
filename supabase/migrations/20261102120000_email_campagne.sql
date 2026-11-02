-- E-mailcampagne: adressenlijst met afmeldtoken, verzendlog, kliks en afmeldingen.
-- De site (publishable key) kan alleen via twee functies kliks en afmeldingen doorgeven;
-- tabellen zijn met de publishable key niet te lezen of te wijzigen.
-- Linkvorm in mails:  https://stekkerofdiesel.nl/m/?k=<link>&c=<campagne>&v=<variant>&t=<token>
-- Afmelden:           https://stekkerofdiesel.nl/afmelden/?t=<token>&c=<campagne>

create table if not exists public.email_contacten (
  token          uuid primary key default gen_random_uuid(),
  email          text not null unique check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  bedrijf        text,
  naam           text,
  rechtsvorm     text,            -- bv. 'bv', 'nv', 'cooperatie'; geen eenmanszaak/vof zonder toestemming
  kvk            text,
  segment        text,            -- bv. 'trekker', 'bestel', 'bus', 'vloot'
  bron           text,            -- waar het adres vandaan komt, bv. 'contactpagina website'
  bron_url       text,
  toegevoegd_op  timestamptz not null default now(),
  afgemeld_op    timestamptz,
  bounce_op      timestamptz
);

create table if not exists public.email_verzonden (
  id            bigint generated always as identity primary key,
  token         uuid not null references public.email_contacten(token) on delete cascade,
  campagne      text not null check (campagne ~ '^[a-z0-9-]{1,30}$'),
  variant       text not null default 'a' check (variant ~ '^[a-z0-9-]{1,20}$'),
  verzonden_op  timestamptz not null default now(),
  unique (token, campagne)
);

create table if not exists public.email_kliks (
  id            bigint generated always as identity primary key,
  ontvangen_op  timestamptz not null default now(),
  token         uuid references public.email_contacten(token) on delete set null,
  campagne      text check (campagne ~ '^[a-z0-9-]{1,30}$'),
  variant       text check (variant ~ '^[a-z0-9-]{1,20}$'),
  link          text not null check (link ~ '^[a-z0-9-]{1,20}$'),
  ua            text check (char_length(ua) <= 300),
  bot           boolean not null default false   -- headless/webdriver of bekende linkscanner
);
create index if not exists email_kliks_campagne_idx on public.email_kliks (campagne, variant, ontvangen_op);
create index if not exists email_kliks_token_idx on public.email_kliks (token);

create table if not exists public.email_afmeldingen (
  id            bigint generated always as identity primary key,
  ontvangen_op  timestamptz not null default now(),
  token         uuid references public.email_contacten(token) on delete set null,
  email         text,
  campagne      text check (campagne ~ '^[a-z0-9-]{1,30}$')
);

alter table public.email_contacten   enable row level security;
alter table public.email_verzonden   enable row level security;
alter table public.email_kliks       enable row level security;
alter table public.email_afmeldingen enable row level security;
revoke all on public.email_contacten, public.email_verzonden, public.email_kliks, public.email_afmeldingen from anon, authenticated;

-- Klik doorgeven (vanaf stekkerofdiesel.nl/m/). Onbekende tokens worden zonder token bewaard.
create or replace function public.email_klik(t uuid default null, c text default null, v text default null, k text default 'calc', ua text default null, bot boolean default false)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if k is null or k !~ '^[a-z0-9-]{1,20}$' then return; end if;
  insert into public.email_kliks (token, campagne, variant, link, ua, bot)
  values (
    (select x.token from public.email_contacten x where x.token = t),
    case when c ~ '^[a-z0-9-]{1,30}$' then c end,
    case when v ~ '^[a-z0-9-]{1,20}$' then v end,
    k,
    left(ua, 300),
    coalesce(bot, false)
  );
end $$;

-- Afmelden met token (link in de mail) of met e-mailadres (formulier zonder token).
-- Een onbekend adres komt op de lijst als afgemeld, zodat het nooit gemaild wordt.
create or replace function public.email_afmelden(t uuid default null, e text default null, c text default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  adres text := lower(btrim(e));
  gevonden uuid;
begin
  if t is not null then
    update public.email_contacten set afgemeld_op = coalesce(afgemeld_op, now()) where token = t returning token into gevonden;
  end if;
  if gevonden is null and adres ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(adres) <= 254 then
    insert into public.email_contacten (email, bron, afgemeld_op) values (adres, 'afmelding', now())
    on conflict (email) do update set afgemeld_op = coalesce(public.email_contacten.afgemeld_op, now())
    returning token into gevonden;
  end if;
  if gevonden is null then return false; end if;
  insert into public.email_afmeldingen (token, campagne)
  values (gevonden, case when c ~ '^[a-z0-9-]{1,30}$' then c end);
  return true;
end $$;

revoke execute on function public.email_klik(uuid, text, text, text, text, boolean) from public;
revoke execute on function public.email_afmelden(uuid, text, text) from public;
grant execute on function public.email_klik(uuid, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.email_afmelden(uuid, text, text) to anon, authenticated;

-- ===== Rapportage (schema analytics, niet via de API) =====
create schema if not exists analytics;

create or replace view analytics.email_resultaten as
with v as (
  select campagne, variant, count(*) as verzonden from public.email_verzonden group by 1, 2
), k as (
  select campagne, variant, count(*) as kliks, count(distinct token) as unieke_klikkers
  from public.email_kliks where not bot group by 1, 2
), a as (
  select s.campagne, s.variant, count(*) as afmeldingen
  from public.email_afmeldingen f join public.email_verzonden s on s.token = f.token and s.campagne = f.campagne
  group by 1, 2
)
select v.campagne, v.variant, v.verzonden,
       coalesce(k.unieke_klikkers, 0) as unieke_klikkers,
       coalesce(k.kliks, 0) as kliks,
       round(100.0 * coalesce(k.unieke_klikkers, 0) / nullif(v.verzonden, 0), 1) as klik_pct,
       coalesce(a.afmeldingen, 0) as afmeldingen,
       round(100.0 * coalesce(a.afmeldingen, 0) / nullif(v.verzonden, 0), 1) as afmeld_pct
from v
left join k on k.campagne = v.campagne and k.variant = v.variant
left join a on a.campagne = v.campagne and a.variant = v.variant
order by v.campagne, v.variant;

create or replace view analytics.email_kliks_per_link as
select campagne, variant, link, count(*) as kliks, count(distinct token) as unieke_klikkers,
       count(*) filter (where bot) as scanner_kliks
from public.email_kliks group by 1, 2, 3 order by 1, 2, 4 desc;

-- Wie mag gemaild worden: niet afgemeld, geen bounce.
create or replace view analytics.email_verzendlijst as
select token, email, bedrijf, naam, segment from public.email_contacten
where afgemeld_op is null and bounce_op is null;

revoke all on analytics.email_resultaten, analytics.email_kliks_per_link, analytics.email_verzendlijst from anon, authenticated;
