# Metingen, cookiemelding en A/B-tests

## Hoe het werkt

- **Cookiedialoog** (`#ck` in `index.html`): verschijnt direct bij het eerste bezoek als een native dialoog, vóór interactie met de calculator. *Alleen noodzakelijk* en *Alles accepteren* zijn gelijkwaardig; *Instellingen* opent afzonderlijke, standaard uitgeschakelde keuzes voor Statistieken / Advertenties op maat. De dialoog is geen verplichting om tracking te accepteren: weigeren geeft toegang tot dezelfde website. De privacyverklaring blijft vanuit de dialoog bereikbaar. De keuze staat 12 maanden in `localStorage` (`sod-consent`); geldige bestaande keuzes worden gerespecteerd. Verlopen, toekomstige of verkeerd gevormde keuzes worden opnieuw gevraagd. Via *Cookies* in de footer pas je de keuze aan of trek je toestemming in.
- **Google Consent Mode v2** (`<script id="consent-default">` in `<head>`, vóór AdSense): alles staat standaard op `denied`. AdSense doet geen advertentieverzoeken (`pauseAdRequests`) tot er een keuze is; zonder toestemming voor advertenties op maat zijn ze niet-gepersonaliseerd.
- **Melding van Google (TCF)**: zet je in AdSense *Privacy en berichten* de Europese toestemmingsmelding aan, dan ziet de site `__tcfapi`, verbergt de eigen melding en volgt de keuze uit Google's melding (statistieken = doel 1 + 8, advertenties = doel 1 + 3 + 4). Er staat dus nooit twee keer een melding.
- **Events** (`<script id="meten">` en `<script id="meten-koppelen">`) gaan in batches naar de tabel `public.web_events` in Supabase, met de publishable key. Die mag alleen invoegen, nooit lezen.
  - Met toestemming voor statistieken: willekeurig bezoekers-ID (`sod-vid`), sessie-ID (`sod-sid`, 30 min inactief = nieuwe sessie) en alle events hieronder.
  - Zonder toestemming (of zonder keuze): alleen `page_view` en `consent`, zonder ID's en zonder iets op te slaan. De database dwingt dat af.
- **Google Analytics 4** is optioneel: vul `GA_ID` in (`G-...`). Het laadt pas na toestemming voor statistieken en krijgt dezelfde events.

## IP-adressen

De website schrijft geen ruwe IP-adressen of IP-hashes naar `web_events` of `calc_runs`; de tabellen bevatten daar geen kolom voor. Met statistiektoestemming worden willekeurige bezoekers- en sessie-ID's gebruikt. `GA_ID` is momenteel leeg: Google Analytics is voorbereid maar niet ingeschakeld. Anonieme paginatellingen en berekeningen blijven bestaan zonder bezoekers-ID, ook bij weigeren.

Dit betekent niet dat een bezoek geen IP-adres verwerkt. GitHub Pages [logt bezoekers-IP's voor beveiliging](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection). Supabase ontvangt het IP-adres bij netwerkverzoeken. Dat staat los van de applicatietabellen; de serverlogs van deze leveranciers vallen niet onder deze code-audit. Lettertypen worden lokaal gehost en vereisen geen Google Fonts-verzoek.

Toestemming voor tracking mag niet worden afgedwongen: [uitleg Autoriteit Persoonsgegevens](https://autoriteitpersoonsgegevens.nl/themas/internet-slimme-apparaten/cookies/trackingcookies). De dialoog biedt daarom weigeren en accepteren op dezelfde laag.

## Database

Migratie: `supabase/migrations/20261022120000_web_analytics.sql`. Draai die eenmalig in de Supabase SQL-editor.

Rapportages staan als views in het schema `analytics` (niet via de API bereikbaar):

| View | Wat |
|---|---|
| `analytics.dagelijks` | bezoekers, sessies, paginaweergaven, % akkoord, sessies met berekening per dag |
| `analytics.trechter` | calculator bekeken → knop → stappen → uitkomst → gedeeld (30 dagen) |
| `analytics.afhakers` | laatste stap als het invulvenster zonder uitkomst wordt gesloten |
| `analytics.knoppen` | welke knoppen het invulvenster openen |
| `analytics.modellen` | per model: geopend, vergeleken, mee gerekend |
| `analytics.herkomst` | bron, medium en campagne per sessie |
| `analytics.berekeningen` | per voertuig: aantal, gem. km, % elektrisch goedkoper, gem. verschil |
| `analytics.ab_resultaten` | per experiment en variant: bezoekers, klikken, conversie |
| `analytics.events` | alle eventtypes met aantallen |

Opruimen na 25 maanden: `select analytics.opruimen();` (of plannen met pg_cron, zie migratie).

## Berekeningen (`public.calc_runs`)

Elke berekening wordt volledig opgeslagen (`<script id="berekeningen">` in `index.html`): na het afronden van het invulvenster (`trigger = invulvenster`) en na elke aanpassing zodra het 4 seconden stil is (`trigger = aanpassing`, alleen als er iets veranderd is).

- `invoer`: alle velden van de calculator, `gewijzigd`: welke afwijken van de standaard, `voertuig`: soort, model, huidig/nieuw, lease per kant (schatting of offerte, prijs per maand), tol, bandbreedtes en RDW-gegevens, `uitkomst`: totalen per jaar en km, alle kostenposten, terugverdientijd, goedkoper-vanaf-km.
- `reeks` + `nr`: alle berekeningen binnen één paginabezoek (willekeurig ID, alleen in het geheugen, niets op het apparaat).
- Ook zonder toestemming, maar dan zonder `visitor_id`/`session_id` (de database dwingt dat af). Met toestemming staan die erbij.
- Het kenteken (`plk`, `plkE`) gaat nooit mee; de database weigert rijen waar het in staat.
- Bekijken: `select * from analytics.calculaties;` of de tabel `calc_runs` in de Table editor. Migratie: `supabase/migrations/20261024210000_calc_runs.sql`.

## Events

| Event | Props |
|---|---|
| `session_start` | `n` (hoeveelste sessie), `ref`, `land`, `utm_*`, `mobile`, `vw`, `lang` |
| `page_view` / `page_leave` | `p`; bij verlaten ook `sec` (zichtbare tijd) en `depth` (scroll %) |
| `consent` | `stat`, `ads`, `via` (banner, settings, tcf) |
| `cta_click` | `cta` (board, float, sum_edit, sum_row, cost_row, toast, add), `step`, `text` |
| `wizard_open` / `wizard_step` | `step`, `n` |
| `wizard_complete` | `vt`, `km`, `jr`, `diff_year`, `pct`, `cheaper` (e/d), `model`, `reg`, `opts`, `seen`, `inputs` |
| `wizard_close` | `step` (waar afgehaakt), `seen` |
| `vehicle_select`, `km_quick`, `unit`, `reset`, `share`, `print`, `tip_open` | |
| `model_open`, `model_variant`, `model_apply`, `model_compare`, `model_compare_item`, `model_filter`, `model_search`, `model_picker` | `id`, `q`, ... |
| `details_open` | `q` (vraag of kop), `p` |
| `faq_jump`, `nav`, `outbound` | |
| `fleet_cta_click`, `fleet_request_sent` | `from`; `fleet_size`, `files` (geen contactgegevens) |
| `ab_exposure` | `exp`, `var` |
| `js_error` | `m`, `src`, `line` (max 5 per paginabezoek) |

Elk event met toestemming heeft ook `experiments`: de varianten waarin de bezoeker zit.

## A/B-test opzetten

1. Voeg in `EXPERIMENTS` een test toe, bijvoorbeeld `'cta-tekst':{v:['a','b'],on:true}`. Variant `a` is altijd het origineel.
2. Gebruik de variant in de code: `ab('cta-tekst')==='b' ? 'Bereken je besparing' : 'Reken je eigen voordeel na'`, of in CSS: `[data-ab-cta-tekst="b"] .bcta{...}`.
3. Bezoekers worden vast ingedeeld op basis van hun bezoekers-ID. Zonder toestemming zie je altijd `a` en tel je niet mee.
4. Resultaat: `select * from analytics.ab_resultaten;`. Laat een test lopen tot elke variant enkele honderden bezoekers heeft.
5. Klaar: zet `on:false` (iedereen ziet `a`) of maak de winnaar de standaard en haal de test weg.

## Controle van toestemming

`node --test tests/*.test.cjs` controleert eerste bezoeken, opslaan en respecteren van weigering, verwerken van events na accepteren, afzonderlijke keuzes, intrekken, ongeldige/verlopen keuzes en de Engelse dialoog. De uitgestelde eventbuffer gebruikt een expliciete callback (`e => send(e)`), zodat de index van `forEach` nooit wordt geïnterpreteerd als een vlag voor anonieme verzending.

