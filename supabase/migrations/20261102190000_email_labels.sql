-- Specifiek e-mail label (campagne-1 + a = 1a) als kolom in de rapportage,
-- zodat elk overzicht dezelfde naam gebruikt. Opslag blijft variant a/b.
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
       round(100.0 * coalesce(a.afmeldingen, 0) / nullif(v.verzonden, 0), 1) as afmeld_pct,
       case when v.campagne ~ '\d+$' then (regexp_match(v.campagne, '(\d+)$'))[1] || v.variant
            else v.campagne || '-' || v.variant end as email_label
from v
left join k on k.campagne = v.campagne and k.variant = v.variant
left join a on a.campagne = v.campagne and a.variant = v.variant
order by v.campagne, v.variant;

create or replace view analytics.email_kliks_per_link as
select campagne, variant, link,
       count(*) filter (where klasse = 'menselijk') as kliks,
       count(distinct token) filter (where klasse = 'menselijk') as unieke_klikkers,
       count(*) filter (where klasse in ('scanner', 'scanner_vermoedelijk')) as scanner_kliks,
       case when campagne ~ '\d+$' then (regexp_match(campagne, '(\d+)$'))[1] || variant
            else campagne || '-' || variant end as email_label
from analytics.email_kliks_geklasseerd group by 1, 2, 3 order by 1, 2, 4 desc;

revoke all on analytics.email_resultaten, analytics.email_kliks_per_link from anon, authenticated;
