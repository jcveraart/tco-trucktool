# Website-overzicht — Stekker of Diesel

**Doel van dit document:** één plek die beschrijft hoe de hele website is gebouwd, wat elke pagina doet, en waar per pagina de verbeterpunten staan. Gebruik het als tracker: vul per pagina de status en je eigen notities aan. Niets in dit document wordt automatisch bijgewerkt — werk het bij als je iets verandert.

Laatst bijgewerkt: 28 oktober 2026 (na de SEO-quick-wins). Statuslegenda: ✅ op orde · 🔧 verbeteren · 💡 idee · ❌ probleem.

---

## 1. Hoe de site is gebouwd

**In één zin:** de hele site is één groot HTML-bestand (`index.html`, ± 860 KB) dat als single-page app werkt; een generator maakt daar 48 statische pagina's van (23 routes × Nederlands/Engels, plus noindex-pagina's), zodat Google elke URL apart kan lezen.

| Onderdeel | Hoe het werkt |
|---|---|
| Bron | `index.html` (broncode van alles: rekenmodel, schermen, teksten, en het `seo`-JSON-blok met per route het pad, de Engelse slug, titel en omschrijving) |
| Pagina's genereren | `node scripts/seo.mjs` leest de routes uit `index.html`, zet per route de juiste sectie vooraan zichtbaar, vult titel/meta/canonical/hreflang/JSON-LD in en schrijft `map/index.html` per route. Daarna `node scripts/i18n.cjs` voor de Engelse vertalingen (`data/translations.en.json`) |
| Testen | `node --test tests/*.test.cjs` (27 tests: canonicals, hreflang, sitemap-exactheid, titels uniek + merksuffix, twitter:image, scripts compileren, herbouw behoudt datums). Draait in CI (`.github/workflows/ci.yml`) en lokaal vóór elke push van gegenereerde bestanden |
| Publiceren | GitHub Pages vanaf `main` (domein `stekkerofdiesel.nl` via `CNAME`). Er is ook een workflow (`.github/workflows/seo.yml`) die na wijzigingen aan `index.html` of `scripts/seo.mjs` de pagina's opnieuw genereert en commit |
| Backend | Supabase (alleen na toestemming/interactie): restwaarde-meldingen en prijsalarmen, subsidietabellen (AanZET), formulieren. Geen eigen server |
| Meten | GA4 alleen na toestemming voor statistieken en alleen op het productiedomein (zie `docs/analytics.md`) |
| Advertenties | Uitgezet (`AD_SLOT` leeg). Bewuste keuze: onafhankelijkheid boven advertentie-inkomsten |
| Rapportviewer | `rapport/` is de online-rapportviewer van de Vlootanalyse (eigen repo). Komt uit `Vlootanalyse/web/online` via `tools/export_report_viewer.py`; staat op `noindex,nofollow` en hoort niet in de sitemap |

**Belangrijkste technische feit om te onthouden:** elke gegenereerde pagina bevat nu de volledige app met alle secties verborgen erin (alleen de eigen sectie is zichtbaar). Daardoor is elke pagina ± 860 KB met in de bron 24 H1's. Titels en meta zijn wél uniek per pagina. Voor bezoekers werkt dit prima; voor Google is het de grootste bekende verbeterkans (zie backlog #1).

**Regels die in deze repo gelden (uit CLAUDE.md en docs/seo.md):**
- Wijzig gedeelde kopie in `index.html` (de bron), nooit in één gegenereerde pagina; draai daarna de generator en de tests.
- `docs/source-register.md` is de bronnenlijst; uitspraken over tarieven en regels moeten daar een bron met datum hebben.
- Modelkaarten houden hun bestaande accu/prijs/actieradius-aannames; geen verzonnen aanbiedingen, reviews of ratings in structured data.
- FAQ is gewone inhoud; geen FAQ-rich-results beloven.
- De calculator slaat lokaal op; er zijn geen accounts en geen tracking vóór toestemming.

## 2. Pagina-overzicht (tracker)

### Hoofdpagina's

| Pagina (NL / EN) | Doel en inhoud | Status | Te verbeteren | Notities |
|---|---|---|---|---|
| `/` · `/en/` — Calculator | Gratis vergelijking diesel vs elektrisch voor één voertuig (trekker, bakwagen, bestelbus, bus): kosten/km en /jaar, terugverdientijd, kantelpunt, actieradiuscheck, CO₂. Voorbeeldcijfers vooringevuld; delen via `?s=`-link en `?embed=1` | ✅ | "TCO berekenen" staat nu in de meta-omschrijving; H1 zelf ongewijzigd. Homepage concurreert met `/uitgebreid/` als calculator | |
| `/uitgebreid/` · `/en/detailed-calculation/` — Uitgebreide berekening | Zelfde rekenkern, alle velden en posten open (financiering, laadpaal, buitenlandse tol). `noindex` — bewust buiten de zoekresultaten | ✅ | Kannibalisatie in de gaten houden: twee calculator-URL's, één geïndexeerd | |
| `/modellen/` · `/en/models/` — Elektrische modellen | Overzicht van 67 modellen met filters (vermogen, actieradius, laadsnelheid, prijs), vergelijkfunctie en "reken door met dit model" | 🔧 | Geen pagina per model: zoekvragen als "eActros 600 prijs" landen nergens (backlog #2) | |
| `/modellen/trekkers/` · `/en/models/tractor-units/` | Categoriepagina trekkers (N3) met echte modelkaarten vóór JavaScript | ✅ | Per-model detailpagina's ontbreken (zie hierboven) | |
| `/modellen/bakwagens/` · `/en/models/rigid-trucks/` | Categoriepagina bakwagens (N2/N3) | ✅ | Idem | |
| `/modellen/bestelbussen/` · `/en/models/vans/` | Categoriepagina bestelbussen (N1) | ✅ | Idem; BPM/wegenbelasting-informatie ontbreekt als onderwerp (backlog #6) | |
| `/modellen/bussen/` · `/en/models/buses/` | Categoriepagina bussen (M3) | ✅ | Idem | |
| `/nieuws/` · `/en/news/` — Nieuws | Tijdlijn met 5 ontwikkelingen (heffing, dieselaccijns, ETS2, kantelpunt lange afstand) op één URL | 🔧 | Geen artikelen met eigen URL of NewsArticle-schema; per nieuwszoekvraag niet vindbaar (backlog #4) | |
| `/over-ons/` · `/en/about/` — Over ons | Wie we zijn, onafhankelijkheid, hoe de cijfers tot stand komen | ✅ | Auteurs-/expertisesignalen (E-E-A-T) niet gecontroleerd in de SEO-analyse | |
| `/vlootanalyse/` · `/en/fleet-analysis/` — Vlootanalyse | Leadgeneratie voor de betaalde vlootanalyse: uitleg, taartgrafiek "waar zit het geld", aanvraagformulier | ✅ | Is nu vooral formulier; een inhoudelijke gids "wagenpark doorrekenen" zou de zoekvraag beter raken | |
| `/restwaarde/` · `/en/residual-value/` — Restwaarde | Restwaarde-index: marktprijzen gebruikte elektrische voertuigen, eigen prijs melden, prijsalarm | 🔧 | Databronnen in `scripts/bronnen.json` staan op `actief: false` — belofte is dun zolang dat zo is (backlog #5) | |
| `/privacy/` · `/en/privacy/` — Privacy | Privacybeleid, toestemming, wat er wel/niet wordt opgeslagen | ✅ | — | |

### Overstapgids (alle pagina's ook in het Engels onder `/en/switching-guide/`)

| Pagina | Doel en inhoud | Status | Te verbeteren | Notities |
|---|---|---|---|---|
| `/overstapgids/` — Overstapgids (start) | Ingang van de gids, veelgestelde vragen | ✅ | — | |
| `/overstapgids/stappenplan/` — Stappenplan | 9 stappen van oriëntatie tot rijden, afvinkbaar | 💡 | HowTo-schema overwegen (alleen na herziening van het FAQ-beleid in `docs/seo.md`) | |
| `/overstapgids/netcongestie/` — Netcongestie | Postcodecheck, wachttijden, alternatieven (flexcontract, batterij) | ✅ | SPULA/publiek laden en MCS-laadpleinen als onderwerp toevoegen (backlog #6) | |
| `/overstapgids/laden/` — Laden | Depotladen vs onderweg, DC/MCS, ERE's met geijkte meter | ✅ | Idem SPULA/MCS | |
| `/overstapgids/stroom/` — Stroom en zon | Stroomcontracten, dal/piek, zonnepanelen, teruglevering | ✅ | — | |
| `/overstapgids/actieradius/` — Actieradius | Past het bereik bij de dagrit, winter en volle lading, bijladen | ✅ | — | |
| `/overstapgids/zero-emissiezones/` — Zero-emissiezones | Kaart en kentekencheck, overgangsregelingen per euroklasse | 🔧 | Zoekvraag is lokaal: pagina's per gemeente overwegen (backlog #3) | |
| `/overstapgids/subsidies/` — Subsidies | AanZET (percentages en maxima), MIA, SPRILA, ERE; rondes en data | ✅ | Bedragen elk kwartaal nalopen (controledatums staan in de tekst) | |
| `/overstapgids/heffing/` — Vrachtwagenheffing | Tarieven per km naar CO₂- en gewichtsklasse, korting, Eurovignet-vervanging | ✅ | "Eurovignet → heffing + OBU kiezen" als zoekonderwerp toevoegen (backlog #6) | |
| `/overstapgids/financiering/` — Financiering | Kopen, financial/operational lease, huren; wie draagt accu- en restwaarderisico | ✅ | — | |
| `/overstapgids/accu/` — Accu en restwaarde | Levensduur, garantie, accuconditie (SoH) en restwaarde | 💡 | Koppeling met tweedehands-koopgids (backlog #5) | |
| `/overstapgids/regels/` — Regels | Rijbewijs, gewichten, tachograaf, werkplaats | ✅ | Tachograafplicht lichte bedrijfsauto's internationaal (juli 2026) opnemen zodra definitief | |

### Systeempagina's (niet voor bezoekers via het menu)

| Pagina | Doel | Status | Te verbeteren | Notities |
|---|---|---|---|---|
| `/rapport/` — Online rapportviewer | Persoonlijke vlootrapporten van klanten openen (`?r=`-link of demo). Noindex, geen tracking | ✅ | Alleen wijzigen via de export uit de Vlootanalyse-repo | |
| `404.html` | Foutpagina, tweetalig, links naar calculator/modellen/gids | ✅ | — | |
| `sitemap.xml`, `robots.txt`, `CNAME` | Vindbaarheid en domein (apex, HTTPS afdwingen in GitHub Pages-instellingen) | ✅ | Live redirects (www → apex, http → https) eenmalig met `curl -I` controleren | |

## 3. Hoe een wijziging wordt doorgevoerd

1. Pas de bron aan: teksten en schermen in `index.html`, routegegevens (titel/omschrijving/pad) in het `seo`-blok van `index.html`, generatorlogica in `scripts/seo.mjs`.
2. Vertaal nieuwe tekst in `data/translations.en.json` en draai `node scripts/i18n.cjs`.
3. Genereer opnieuw: `node scripts/seo.mjs`.
4. Test: `node --test tests/*.test.cjs` (moet 27/27 groen zijn).
5. Commit bron én gegenereerde bestanden samen en push naar `main`. De SEO-workflow doet stap 3–4 ook zelf na een push, maar lokaal controleren blijft de norm.
6. Werk dit document bij als een pagina van doel, status of inhoud verandert.

## 4. Verbeter-backlog (uit de SEO-analyse van oktober 2026)

Geprioriteerd op verwachte waarde. Zet een datum en status achter een punt zodra je het oppakt.

1. **🔧 SPA-shell per pagina snoeien (grootste technische winst).** Nu serveren alle 46 URL's dezelfde ± 860 KB met alle secties verborgen en 24 H1's in de bron. Laat de generator per pagina alleen de eigen sectie + calculator-kern overhouden, met één paginaspecifieke H1. Verwachting: pagina's van ± 860 KB naar eigen inhoud, minder duplicaat-verdunning, sneller laden. Oppakken in `scripts/seo.mjs`; vereist de volledige testronde en liefst een vergelijking van de oude en nieuwe HTML per route.
2. **💡 Pagina per model.** 67 modellen in `data/vehicles_catalog.json`, maar geen enkele model-URL. Zoekvragen als "eActros 600 prijs" en "DAF XF Electric actieradius" zijn de sterkste koopintentie die er is. Genereer per model een pagina met prijs, actieradius (ook winter), laadtijd en een knop "reken door met dit model", met Product/Offer-structured data op basis van de bestaande cataloguscijfers (niets verzinnen).
3. **💡 Zero-emissiezone per gemeente.** De zoekvraag is lokaal ("mag mijn diesel nog in Utrecht"). Maak per grote gemeente een pagina met ingangsdatum, overgang, ontheffing en de kentekencheck.
4. **🔧 Nieuws splitsen.** Vijf nieuwsitems op één URL; maak er artikelen met eigen URL, datum en auteur van, met NewsArticle-schema. Onderwerpen liggen klaar: AanZET-ronde 2027, heffingstarieven 2027, dieselaccijns, ETS2 2028.
5. **🔧 Restwaarde-data aanzetten.** De drie bronnen in `scripts/bronnen.json` staan op `actief: false`. Activeer ze of versmal de belofte op de pagina. Daarna: een koopgids "tweedehands elektrische vrachtwagen kopen" (accucheck, garantie) die naar de restwaarde-index linkt.
6. **💡 Ontbrekende onderwerpen** (gemeten: 0× op de site): SPULA en publiek/MCS-laden; HVO100 en waterstof als vergelijking; Eurovignet → heffing en OBU-aanbieder kiezen; wegenbelasting/BPM bestelbus en bijtelling; ERE verkopen in stappen.
7. **✅ Gedaan (okt 2026):** twitter:image op alle pagina's; merksuffix in alle titels (test dwingt het af); langere Engelse meta-omschrijvingen; "TCO berekenen" in de homepage-meta; Supabase-preconnect verwijderd; CI draait de tests bij elke push.
8. **Uitgesteld besluit:** FAQPage/HowTo-schema uit de 25+ bestaande vraag-antwoordblokken. Google toont FAQ-resultaten nauwelijks nog en `docs/seo.md` zegt bewust geen rich results te beloven. Alleen oppakken als dat beleid wordt herzien.

**Niet gecontroleerd in de analyse (eerlijk benoemen):** geen live crawl of Lighthouse-run gedaan, geen Search Console-data gebruikt, Engelse pagina's alleen op koppen gecontroleerd, geen velddata over Core Web Vitals. Wie #1 of #2 oppakt, doet er goed aan eerst één live controle te draaien (gerenderde H1 per URL, `curl -I` op www/http-varianten, Rich Results-test op één gidsartikel).

## 5. Notities

*Ruimte voor eigen aantekeningen per datum.*

- _28-10-2026 — Document aangemaakt op basis van de SEO-analyse; quick wins uit backlog #7 zijn doorgevoerd en gepusht (a314ae1). Grootste open punten: #1 (shell snoeien) en #2 (modelpagina's)._


