-- Testmails (send.mjs --test) worden voortaan ook gelogd in
-- public.email_verzonden, maar met test = true. Zo verschijnen ze apart in
-- het e-maildashboard en vervuilen ze de campagnestatistieken niet.
-- Testcontacten (bron = 'test') komen nooit in de echte verzendlijst.

alter table public.email_verzonden
  add column if not exists test boolean not null default false;

-- Campagneresultaten: alleen echte verzendingen tellen mee.
create or replace view analytics.email_resultaten as
with v as (
  select campagne, variant, count(*) as verzonden
  from public.email_verzonden
  where not test
  group by 1, 2
), k as (
  select campagne, variant, count(*) as kliks, count(distinct token) as unieke_klikkers
  from analytics.email_kliks_geklasseerd
  where klasse = 'menselijk'
  group by 1, 2
), a as (
  select s.campagne, s.variant, count(*) as afmeldingen
  from public.email_afmeldingen f
  join public.email_verzonden s on s.token = f.token and s.campagne = f.campagne and not s.test
  group by 1, 2
)
select v.campagne, v.variant, v.verzonden,
       coalesce(k.unieke_klikkers, 0) as unieke_klikkers,
       coalesce(k.kliks, 0) as kliks,
       round(100.0 * coalesce(k.unieke_klikkers, 0)::numeric / nullif(v.verzonden, 0), 1) as klik_pct,
       coalesce(a.afmeldingen, 0) as afmeldingen,
       round(100.0 * coalesce(a.afmeldingen, 0)::numeric / nullif(v.verzonden, 0), 1) as afmeld_pct,
       case when v.campagne ~ '\d+$' then (regexp_match(v.campagne, '(\d+)$'))[1] || v.variant
            else v.campagne || '-' || v.variant end as email_label
from v
left join k on k.campagne = v.campagne and k.variant = v.variant
left join a on a.campagne = v.campagne and a.variant = v.variant
order by v.campagne, v.variant;

-- Verzendlijst: testcontacten nooit echt mailen.
create or replace view analytics.email_verzendlijst as
select token, email, bedrijf, naam, segment from public.email_contacten
where afgemeld_op is null and bounce_op is null and bron is distinct from 'test';

-- Per klant: testverzendingen tellen niet als campagne.
create or replace view analytics.email_klant_resultaten as
select c.token, c.email, c.bedrijf, c.naam, c.notion_page_id,
       c.afgemeld_op is not null as afgemeld,
       count(distinct s.campagne) as campagnes,
       count(k.id) as kliks,
       max(k.ontvangen_op) as laatste_klik
from public.email_contacten c
left join public.email_verzonden s on s.token = c.token and not s.test
left join public.email_kliks k on k.token = c.token and not k.bot
group by c.token, c.email, c.bedrijf, c.naam, c.notion_page_id, c.afgemeld_op;

revoke all on analytics.email_resultaten, analytics.email_verzendlijst, analytics.email_klant_resultaten from anon, authenticated;
