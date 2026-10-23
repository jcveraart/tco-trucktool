# Stekker of diesel

Een rekentool die een nieuw diesel- en een nieuw elektrisch bedrijfsvoertuig vergelijkt: kosten per kilometer, per jaar en over de afschrijftermijn. Voor een trekker, bakwagen, bestelbus of bus.

De site is één statisch bestand (`index.html`) zonder build-stap en zonder framework. Het enige externe bestand is het lettertype (Google Fonts), met een systeemlettertype als terugval.

## Lokaal openen

Download de map (op GitHub: **Code → Download ZIP**, of `git clone`) en dubbelklik op `index.html`. Er is geen server of installatie nodig.

## Online zetten

Zet GitHub Pages aan via **Settings → Pages → Deploy from a branch → `main` / root**. Elke andere statische hosting (Netlify, Vercel, een eigen server) werkt ook: het is één bestand.

## Pagina's

| Adres | Pagina |
|---|---|
| `index.html` | Calculator |
| `index.html#modellen` | Elektrische modellen |
| `index.html#faq` | Veelgestelde vragen |
| `index.html#nieuws` | Nieuws |
| `index.html#restwaarde` | Restwaarde-index, verkoopprijs melden en prijsalarm |
| `index.html#over-ons` | Over ons |
| `index.html?embed=1` | Calculator als widget voor een andere site |

## Opbouw van de calculator

1. **Wat vergelijk je?** Trekker (N3), bakwagen (N2 of N3), bestelbus (N1) of bus (M3). Elk voertuig heeft eigen voorbeeldcijfers en eigen regels: kilometerheffing en AanZET gelden alleen voor vrachtwagens, en bij een bakwagen kies je N2 of N3 (dat bepaalt de AanZET-tabel).
2. **Uitkomst**: diesel links (donker), elektrisch rechts (licht), met prijs per kilometer en per jaar en in één zin het verschil. Bij het scrollen blijft een smalle versie onder de kop staan. Daaronder vier kerncijfers: terugverdientijd, vanaf hoeveel kilometer per jaar elektrisch goedkoper is, actieradius tegenover de gemiddelde dagrit (met een waarschuwing als laden onderweg nodig is) en CO₂-besparing.
3. **Vul je eigen cijfers in**: zolang je nog voorbeeldcijfers ziet, staat direct onder de bedragen een groene balk met één grote knop en de verwachte moeite (*6 korte stappen · ± 2 minuten*). Scrol je daar voorbij, dan verschijnt een zwevende knop (op een telefoon onderin, binnen bereik van je duim). De knop opent een invulvenster met per stap één onderwerp en hooguit vier of vijf schuiven: gebruik, aanschaf en afschrijving, subsidie (met N2 of N3 bij een bakwagen), energie en actieradius, onderhoud en verzekering, en bij vrachtwagens kilometerheffing. Bovenin staat de stap en één geruststellende regel (*Weet je iets niet? Laat het voorbeeld staan.*), onderin rekent de uitkomst live mee. Na de laatste stap licht de uitkomst even op en verdwijnt de uitnodiging; dan verschijnt de samenvatting *Jouw cijfers* met een knop Aanpassen.
4. **Waar zit het verschil?** Per kostenpost een regel met diesel links en elektrisch rechts, met balken vanuit het midden. Een klik op een regel of op een onderdeel van de samenvatting opent het invulvenster op de juiste stap.
5. **Ook meenemen**: onder de verschillenlijst staan financiering, laadpaal, laden onderweg en (bij vrachtwagens) tol buitenland als knoppen. Ze staan standaard uit; een klik zet de post aan en opent de bijbehorende stap in het invulvenster, waar je hem ook weer uitzet. Aan staande posten verschijnen als extra regels in de lijst, met het bedrag per jaar op de knop. Het oude adres `#uitgebreid` opent gewoon de calculator.
6. **Wanneer verdien je het terug?** De terugverdientijd in een grafiek. Daaronder klappen open: wat als energieprijzen veranderen (break-even prijzen en tabel), wat de extra kosten met de besparing doen (alleen als er iets aan staat), goed om te weten en de uitgangspunten.

Waar iemand die van diesel komt vragen kan hebben (onderhoud en verzekering elektrisch, stroomprijs, bruikbare accu, ERE, kilometerheffing, AanZET en MIA, N2 of N3, laadpaal, netaansluiting, SPRILA, openbaar laden, laadtijd, financiering en de kerncijfers) staat een klein vraagteken. Dat opent op verzoek een korte uitleg met een link naar de officiële bron; op een telefoon schuift die van onderen in beeld. De teksten staan in `TIPS` bovenaan het script. Veelgestelde vragen heeft een groep *Overstappen op elektrisch* over zero-emissiezones, netcongestie, laden, de accu en de planning.

Elk getal is een schuif die je ook kunt typen; met de pijltjestoetsen verhoog of verlaag je per stap (met Shift per tien stappen).

De invoer wordt alleen in de eigen browser bewaard (`localStorage`). *Herstel voorbeeldcijfers* zet alles terug naar de voorbeeldcijfers van het gekozen voertuig. Bij de uitkomst staan **Deel** (kopieert een korte samenvatting met een link `?s=…` naar precies deze berekening) en **Print**.

Advertentieplekken hebben de class `.ad`: een brede band onder de calculator, een kolom bij Veelgestelde vragen en een band onder Nieuws en Over ons.

## Elektrische modellen

Onder **Modellen** staat per voertuig (trekker, bakwagen, bestelbus, bus) wat er elektrisch te koop is en wat eraan komt, zoals de Tesla Semi voor Europa. De pagina opent op het voertuig dat in de calculator gekozen is.

- Per model staan de accu (bruikbaar, of bruto als dat het enige opgegeven getal is), de opgegeven actieradius met een balk en het hoogste laadvermogen (CCS of MCS). Een streep in de balk toont je gemiddelde dagrit uit de calculator; een model dat die niet haalt, krijgt een oranje balk.
- Filter op voertuig, zet aangekondigde modellen aan of uit, en sorteer op actieradius, accu, snelladen of merk.
- Een klik op een model klapt de details open: toelichting, specificaties, hoe de actieradius zich verhoudt tot je dagrit, en de bron.
- Met het vinkje links zet je tot drie modellen naast elkaar in een vergelijking.
- Zoek op merk of model, ook zonder accenten, bijvoorbeeld `Citroen`. De categorieën tonen hoeveel modellen bij je zoekopdracht passen. De catalogus bevat op 21 oktober 2026 **67 modellen**: 31 bestelbussen, 14 bakwagens, 11 trekkers en 11 bussen.
- **Reken met dit model**, ook vanuit de vergelijking, kiest hetzelfde model als de keuze **Elektrisch model** in de stap Aanschaf van het invulvenster . Die keuze opent een korte, doorzoekbare lijst met alleen de modellen van de gekozen voertuigsoort; aangekondigde modellen staan erbij als verwacht.
- Bij een modelkeuze worden accu en elektrisch verbruik ingevuld. Expliciet door de fabrikant opgegeven verbruik heeft voorrang. Anders gebruiken we een indicatieve afleiding: bruikbare accu gedeeld door opgegeven actieradius, maal 100. Die afleiding is gebaseerd op het fabrieksbereik en bevat geen laadverlies; vervang hem door je praktijkverbruik. Als alleen bruto of een niet nader gespecificeerde capaciteit bekend is, schatten we bruikbaar op 90% daarvan en vermelden we die aanname.
- Bij een modelkeuze worden ook aanschafprijs en de dieselvergelijking ingevuld. Is een dieseltweeling met prijs bekend (`pD`, `pDm`, `pDs`, eventueel `ld`), dan gebruiken we die; anders schatten we de dieselprijs en het dieselverbruik naar verhouding van de voorbeeldcijfers van het voertuig. Onder de modelkeuze staan twee regels, elektrisch en diesel, met de bronnen en wat geschat is. Prijzen die niet uit een officiële prijslijst komen (`pt` is `reported` of `order`) heten indicatief. De schuiven krijgen een bereik rond het model.
- Onder de modelkeuze staat wat er is ingevuld, met de bron. Aanschafprijs wordt alleen als modelprijs ingevuld als een officiële prijs voor diezelfde uitvoering bekend is; anders blijft het duidelijk gelabelde categorievoorbeeld staan. Dieselreferentie en overige kosten blijven eigen of voorbeeldcijfers.
- Eigen invoer en modelkeuze blijven behouden na herladen en in een deellink. Kies het model opnieuw om accu en verbruik terug te zetten. **Herstel voorbeeldcijfers** en wisselen van voertuigsoort wissen de modelkeuze.

De gegevens staan in `MODELS` in het script: per model het voertuig (`c`), merk en model, bruto en bruikbare accu (`g`, `u`, of afgeleid `ue`), opgegeven capaciteit waarvan bruto/netto onbekend is (`a`), actieradius (`r`), meetcyclus (`rc`), laadvermogen CCS en MCS (`dc`, `mcs`), status (`nu` of `komt` met jaar `y`), een korte toelichting en de bron. Optionele velden zijn verbruik in kWh/100 km (`consumption`), prijs excl. btw voor die uitvoering (`price`), gewicht in kg (`gvw`), N2/N3 (`vc`) en datum van broncontrole (`checked`). Het zijn opgaven van fabrikanten; houd ze bij als er nieuwe modellen of uitvoeringen komen. Zie [bronkeuzes en aannames](docs/model-data.md).

De optionele ontwikkelcontrole heeft alleen Node.js nodig: `node --test tests/catalog.test.cjs`. De website zelf blijft één statisch HTML-bestand, zonder installatie of build-stap.

## Kenteken, restwaarde en live prijzen

- **Kenteken**: in de stap Aanschaf kies je bij diesel *Nieuwe kopen* of *Huidige houden*. Bij *Huidige houden* vul je optioneel het kenteken in (bij elektrisch *Gebruikt* ook). De site haalt merk, bouwjaar, gewicht en euroklasse op bij RDW open data (vanuit de browser, zonder sleutel) en vult daarmee leeftijd, waarde nu, verbruik en kilometerheffing in. In het veld staat daarna kort het voertuig; euroklasse en toegang tot zero-emissiezones staan eronder.
- **Huidige diesel**: met *Huidige houden* reken je vanaf de waarde nu (uit kenteken of leeftijd), met de restwaarde aan het eind van de termijn en onderhoud dat ongeveer 5% per jaar leeftijd stijgt. Een kenteken invullen zet dit vanzelf aan.
- **Restwaarde-index** (`#restwaarde`): mediaanprijs per aandrijving, voertuig en leeftijd uit de Supabase-view `residual_index`. Zolang er te weinig prijzen zijn, staat de eigen afschrijvingscurve er gestreept als schatting. Bezoekers kunnen een verkoopprijs melden en een prijsalarm zetten.
- **Live prijzen**: Supabase haalt elke ochtend de dieselprijs (CBS) en het stroomverschil nacht/dag (EnergyZero) op in `live_prices`; de site gebruikt die als voorbeeldwaarde.
- **Database**: alles staat in `supabase/migrations/20261023120000_restwaarde_offertes_live.sql`. Draai dat bestand eenmalig in de Supabase SQL-editor.
- **Wekelijkse verzamelaar**: `.github/workflows/restwaarde.yml` draait elke maandag `scripts/restwaarde.mjs`. Die leest de pagina's in `scripts/bronnen.json`, laat Claude de voertuigen met prijs eruit halen, slaat ze op in `residual_listings` en mailt prijsalarmen (via Resend). Zet in GitHub onder **Settings → Secrets and variables → Actions** de secrets `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` en eventueel `RESEND_API_KEY`. Alle bronnen staan standaard uit: veel advertentiesites verbieden automatisch verzamelen, dus zet een bron pas aan na eigen afweging. Proefdraaien: `cd scripts && npm install && node restwaarde.mjs --droog`.

## Rekenmethode

De afschrijving per jaar is de aanschafprijs, bij elektrisch verminderd met de subsidie of het MIA-voordeel, min de restwaarde, gedeeld door de afschrijftermijn. Energie is kilometers maal verbruik maal prijs, bij elektrisch min de ERE-opbrengst. Onderhoud is kilometers maal tarief, verzekering een vast bedrag per jaar, kilometerheffing (alleen vrachtwagens) het aantal kilometers met heffing maal het tarief. Met tol buitenland aan worden kilometers in het buitenland uit de Nederlandse heffing gehaald en tegen het tarief van het betreffende land gerekend.

De terugverdientijd is het moment waarop de opgebouwde kosten van elektrisch (extra investering plus jaarkosten, inclusief financiering) onder die van diesel komen. De restwaarde is hierin niet meegenomen, want die ontvang je pas bij verkoop.

## Aanpassen

Bovenaan het script in `index.html` staan alle velden met bereik en standaardwaarde (`FIELDS`), de voertuigen met hun voorbeeldcijfers (`VT`), de AanZET-tabellen voor N2 en N3 (`AZT`), tolling per land (`TOL`) de stappen van het invulvenster (`STEPS`) en de elektrische modellen (`MODELS`). De berekening staat in `calc()` en `calcX()`. Kleuren en lettertypes staan als variabelen bovenaan de stylesheet (`:root`). De naam van de site staat in `BRAND` en in de kop en voet van de HTML.

## Disclaimer

Dit is een rekenvoorbeeld en geen financieel of fiscaal advies. Voorbeeldcijfers, subsidiebedragen (AanZET, MIA, SPRILA) en tarieven zijn indicatief. Controleer ze altijd bij RVO en de Belastingdienst.

