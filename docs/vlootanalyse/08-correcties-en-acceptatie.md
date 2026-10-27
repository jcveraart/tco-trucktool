# 08 · Correcties en acceptatie

27 oktober 2026. Deze matrix koppelt de review aan wijzigingen en bewijs. Geteste deelregels zijn geen volledige productie-optimizer. De referentie en tests bevatten uitsluitend fictieve gegevens.

| Bevinding | Correctie | Bewijs / poort |
|---|---|---|
| F01 reserve | Geheel afgesproken aantal, ook bij bestaande vloot; voorbeeld 0 expliciet | `test_reserve_is_een_bewuste_hele_wagen`; praktijk: geschikte reserve bevestigen |
| F02 koop/lease | Inzet en inbegrepen kosten per contract/cohort; koop geen lease-km | `test_koop_en_financial_lease_geen_fictieve_km` |
| F03 start/horizon | t=0-verkoop/afkoop en terminale verplichtingen expliciet | `test_directe_verkoop_en_leaseafkoop`, `test_tijdstip_nul_en_horizonverplichtingen` |
| F04 recuperatie | Positieve arbeid en terugwinning apart | `test_regeneratie_is_niet_dubbel` |
| F05 chronologie | Expliciete beginlading, echte UTC-keten en eindvoorwaarde | `test_losse_dagen_zijn_geen_chronologisch_bewijs`, `test_geen_onbekende_beginlading_of_datagat` |
| F06 extremen | Geen gratis/ongecontracteerde fallback op nulgewogen dag | `test_extreme_dag_fallback_blijft_geprijsd`; klant: capaciteit en frequentie bevestigen |
| F07 tijdvensters | Referentie uitsluitend vaste stops; extra tijd vraagt volledige herplanning | Stresstest kortere stop; §8–9 model; geen verborgen extra tijd |
| F08 subsidie | Chassisgrondslag, code/jaar, geen generieke Vamil, houden/betalen/projectvoorwaarden | Regelt tests; actuele aanspraak blijft menselijke bron-/contractcontrole |
| F09 schaduwprijzen | Geen globale euro/jaar uit fixed MIP; concrete opties heroptimaliseren | Ongetest skelet verwijderd; §14 model en §5.1 oplossen |
| F10 hulpenergie | Koeling/PTO tijdens werk en stops | `test_koeling_en_pto_ook_bij_stilstand` |
| F10 laadtechniek | Fysieke connector/kast, effectieve acceptatie; ongebruikte stop geen 80%-grens | Kast-/connector-/wegstoptests en onafhankelijke verifier |
| F10 onzekerheid | Lager vermogen, kortere stop, uitval; geen gemiddelde beschikbaarheidsgarantie | Basiscases + stresscases; §12 model |
| F10 overige extensies | Geen ongeldige nachtsnede/symmetrie; thuisladen, batterij/zon, meerdere depots hebben expliciete grenzen | §9–15 model en varianten; geen onbewezen implementatieclaim |
| Data | UTC-offset, echte intervallen, eenheden, gaten, bronstatus, contract/uitvoering | Meter-/DST-/gegevensniveautests; §2 data |
| Financiën | Jaar-TCO versus NCW, reëel/nominaal, subsidie/ERE-scenario's en liquiditeit | Rentetest en drie jaarvergelijkingen; parameters en model |
| Dienstverlening | Smallere pilot, gemeten tijd, privacyrollen, beveiligde intake en opvolging | Werkwijze; live poorten hieronder |
| Website | Inzicht/voorwaarden in plaats van onvoorwaardelijke zekerheid | Nederlandse en Engelse vlootcopy; bestaand ontwerp behouden |

## Verplichte poorten vóór echt klantadvies

1. Originele bronbestanden, meetgrens, tijdzone en dekking gereconcilieerd; geen onverklaarde datagaten.
2. Uitvoering, payload, AC/DC-acceptatie, contracten, reserve en laadplekken bevestigd.
3. Vast plan chronologisch afgespeeld; alle uitzonderingen expliciet gedekt en geprijsd.
4. Kosten, liquiditeit, subsidie-/belastingaanspraak en horizonverplichtingen onafhankelijk gecontroleerd.
5. Andere historische periode, storingsscenario en passende praktijkproef beoordeeld.
6. Rapport met bron-/modelversies, beperkingen en tweede beoordelaar.

## Live dienstverlening apart controleren

De openbare repository bevat een insert-only contactformulier, geen beveiligd klantportaal of complete productiebackend. Controleer uitgerolde RLS, servervalidatie/rate limiting/idempotentie, ontvangst-ID en meldingen, eigenaar van opvolging, klantgebonden opslag, toegang, bewaartermijnen en verwijdering. Claim deze functies niet op basis van alleen de documentatie. Hiervoor zijn een concrete productieomgeving, configuratie en praktijktest nodig.

## Onderhoud

Bij wijziging van websitekosten: vergelijk vastgelegde invoer en formules vóór hergebruik in een Python-kostenkern. Bij regelwijziging: bron, ingangsdatum, code en tests aanpassen. Bij extra bedrijfsvariant: model en inputcontract uitbreiden én een nieuwe fout-/grensgevaltest toevoegen. Een onbekend veld wordt nooit stilzwijgend een positieve haalbaarheidsuitkomst.
