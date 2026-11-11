-- Scanner-classificatie aangescherpt (spiegel van klasseerKlikken in
-- scripts/mail/core.mjs en de Edge Function email-dashboard).
-- De grens van 60 sec bleek te smal: beveiligingsscanners die maar een link
-- aanklikken deden dat 60-146 sec na verzending en telden zo als menselijk
-- (12 stuks in de golf van 11 nov 2026). Alle eenlink-scanners in de live
-- data zaten binnen 146 sec; de eerste echte klik pas na uren. Daarom:
-- eerste klik binnen 300 sec = vermoedelijke scanner, net als twee
-- verschillende knoppen tegelijk (5 sec) of 2+ knoppen binnen 10 minuten.
-- Ook: klikken vanaf twee apparaten binnen 300 sec (twee scanners bij
-- dezelfde ontvanger; een mens wisselt zo snel niet van apparaat).
-- Alleen 'menselijk' telt als echte klik; de rapportageviews
-- (email_resultaten e.d.) lezen deze view en gaan automatisch mee.
-- Kolommen worden expliciet opgesomd: zo blijft de bestaande view-volgorde
-- staan, ook nu public.email_kliks er sinds 20261103170000 een intern-kolom
-- bij heeft (die hier alleen in de case wordt gelezen, niet geselecteerd).
create or replace view analytics.email_kliks_geklasseerd as
with agg as (
  select token, campagne, min(ontvangen_op) as eerste_klik, count(distinct link) as links_totaal
  from public.email_kliks group by token, campagne
), basis as (
  select k.id, k.ontvangen_op, k.token, k.campagne, k.variant, k.link, k.ua, k.bot, k.intern,
         v.verzonden_op, a.eerste_klik, a.links_totaal
  from public.email_kliks k
  left join public.email_verzonden v on v.token = k.token and v.campagne = k.campagne
  left join agg a on a.token is not distinct from k.token and a.campagne is not distinct from k.campagne
)
select basis.id, basis.ontvangen_op, basis.token, basis.campagne, basis.variant, basis.link,
       basis.ua, basis.bot, basis.verzonden_op, basis.eerste_klik, basis.links_totaal,
  case
    when basis.intern then 'intern'
    when basis.bot then 'scanner'
    when basis.token is null then 'onbekend'
    when exists (
      select 1 from public.email_kliks x
      where x.id <> basis.id
        and x.token is not distinct from basis.token
        and x.campagne is not distinct from basis.campagne
        and x.link <> basis.link
        and abs(extract(epoch from (x.ontvangen_op - basis.ontvangen_op))) < 5
    ) then 'scanner_vermoedelijk'
    when exists (
      select 1 from public.email_kliks x
      where x.id <> basis.id
        and x.token is not distinct from basis.token
        and x.campagne is not distinct from basis.campagne
        and coalesce(x.ua, '') <> coalesce(basis.ua, '')
        and abs(extract(epoch from (x.ontvangen_op - basis.ontvangen_op))) < 300
    ) then 'scanner_vermoedelijk'
    when basis.verzonden_op is not null and basis.ontvangen_op < basis.verzonden_op + interval '300 seconds' then 'scanner_vermoedelijk'
    when basis.links_totaal >= 2 and basis.ontvangen_op <= basis.eerste_klik + interval '600 seconds' then 'scanner_vermoedelijk'
    else 'menselijk'
  end as klasse
from basis;
