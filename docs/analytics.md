# Metingen, cookiemelding en A/B-tests

## Hoe het werkt

- **Cookiemelding** (`#ck` in `index.html`): Weigeren, Instellen (Statistieken / Advertenties op maat) en Akkoord. De keuze staat 12 maanden in `localStorage` (`sod-consent`). Via *Cookies* in de footer pas je hem aan.
- **Google Consent Mode v2** (`<script id="consent-default">` in `<head>`, vóór AdSense): alles staat standaard op `denied`. AdSense doet geen advertentieverzoeken (`pauseAdRequests`) tot er een keuze is; zonder toestemming voor advertenties op maat zijn ze niet-gepersonaliseerd.
- **Melding van Google (TCF)**: zet je in AdSense *Privacy en berichten* de Europese toestemmingsmelding aan, dan ziet de site `__tcfapi`, verbergt de eigen melding en volgt de keuze uit Google's melding (statistieken = doel 1 + 8, advertenties = doel 1 + 3 + 4). Er staat dus nooit twee keer een melding.
- **Events** (`<script id="meten">` en `<script id="meten-koppelen">`) gaan in batches naar de tabel `public.web_events` in Supabase, met de publishable key. Die mag alleen invoegen, nooit lezen.
  - Met toestemming voor statistieken: willekeurig bezoekers-ID (`sod-vid`), sessie-ID (`sod-sid`, 30 min inactief = nieuwe sessie) en alle events hieronder.
  - Zonder toestemming (of zonder keuze): alleen `page_view` en `consent`, zonder ID's en zonder iets op te slaan. De database dwingt dat af.
- **Google Analytics 4** is optioneel: vul `GA_ID` in (`G-...`). Het laadt pas na toestemming voor statistieken en krijgt dezelfde events.

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
