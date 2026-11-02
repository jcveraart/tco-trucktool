-- Scanner-classificatie van kliks. Beveiligingsscanners (Safe Links e.d.)
-- draaien een echte browser, dus de user-agent verraadt ze niet. Wel hun
-- gedrag: binnen enkele seconden na verzending op (vrijwel) alle links in
-- de mail klikken. Mensen doen dat niet; die klikken later en gericht.
-- Klasse per klik: menselijk / scanner_vermoedelijk / scanner (bot-vlag) /
-- onbekend (geen bekend contact). Alleen 'menselijk' telt als echte klik.
create or replace view analytics.email_kliks_geklasseerd as
with agg as (
  select token, campagne, min(ontvangen_op) as eerste_klik, count(distinct link) as links_totaal
  from public.email_kliks group by token, campagne
), basis as (
  select k.*, v.verzonden_op, a.eerste_klik, a.links_totaal
  from public.email_kliks k
  left join public.email_verzonden v on v.token = k.token and v.campagne = k.campagne
  left join agg a on a.token is not distinct from k.token and a.campagne is not distinct from k.campagne
)
select *,
  case
    when bot then 'scanner'
    when token is null then 'onbekend'
    when verzonden_op is not null and ontvangen_op < verzonden_op + interval '60 seconds' then 'scanner_vermoedelijk'
    when links_totaal >= 3 and ontvangen_op <= eerste_klik + interval '600 seconds' then 'scanner_vermoedelijk'
    else 'menselijk'
  end as klasse
from basis;

-- Dashboardtellingen: alleen menselijke kliks; scanners apart zichtbaar.
create or replace view analytics.email_resultaten as
with v as (
  select campagne, variant, count(*) as verzonden from public.email_verzonden group by 1, 2
), k as (
  select campagne, variant, count(*) as kliks, count(distinct token) as unieke_klikkers
  from analytics.email_kliks_geklasseerd where klasse = 'menselijk' group by 1, 2
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
select campagne, variant, link,
       count(*) filter (where klasse = 'menselijk') as kliks,
       count(distinct token) filter (where klasse = 'menselijk') as unieke_klikkers,
       count(*) filter (where klasse in ('scanner', 'scanner_vermoedelijk')) as scanner_kliks
from analytics.email_kliks_geklasseerd group by 1, 2, 3 order by 1, 2, 4 desc;

create or replace view analytics.email_klant_resultaten as
select c.token, c.email, c.bedrijf, c.naam, c.notion_page_id,
       c.afgemeld_op is not null as afgemeld,
       count(distinct s.campagne) as campagnes,
       count(k.id) as kliks,
       max(k.ontvangen_op) as laatste_klik
from public.email_contacten c
left join public.email_verzonden s on s.token = c.token
left join analytics.email_kliks_geklasseerd k on k.token = c.token and k.klasse = 'menselijk'
group by c.token, c.email, c.bedrijf, c.naam, c.notion_page_id, c.afgemeld_op;

create or replace view analytics.email_laatste_kliks as
select k.ontvangen_op, k.campagne, k.variant, k.link, c.bedrijf, c.email
from analytics.email_kliks_geklasseerd k
join public.email_contacten c on c.token = k.token
where k.klasse = 'menselijk'
order by k.ontvangen_op desc;

revoke all on analytics.email_kliks_geklasseerd from anon, authenticated;
