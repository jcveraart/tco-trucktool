# TCO TruckTool

Een rekentool die een nieuwe diesel en een nieuwe elektrische N3 trekker vergelijkt: kosten per kilometer, per jaar en over de afschrijftermijn.

De tool is één statisch bestand (`index.html`) zonder build-stap en zonder framework. Open het in een browser, of zet het op GitHub Pages, Netlify of andere statische hosting. Het enige externe bestand is het lettertype (Google Fonts), met een systeemlettertype als terugval.

## Lokaal openen

Download de map (op GitHub: **Code → Download ZIP**, of `git clone`) en dubbelklik op `index.html`. Er is geen server of installatie nodig. Met internet worden de lettertypes geladen; zonder internet valt de pagina terug op een systeemlettertype.

## Pagina's

De site heeft vijf adressen, allemaal in hetzelfde bestand:

| Adres | Pagina |
|---|---|
| `index.html` | Calculator, Simpel |
| `index.html#uitgebreid` | Calculator, Uitgebreid |
| `index.html#faq` | Veelgestelde vragen |
| `index.html#nieuws` | Nieuws |
| `index.html#over-ons` | Over ons |

Simpel en Uitgebreid delen dezelfde invoer, dus wisselen tussen de twee of naar een andere pagina gaat zonder dat je iets kwijtraakt. De terugknop van de browser werkt gewoon.

## Opbouw van de calculator

De calculator is gebouwd rond één vergelijking: diesel links (donker), elektrisch rechts (licht).

1. **Uitkomst bovenaan**: prijs per kilometer en per jaar voor beide trucks, en in één zin het verschil per jaar en over de afschrijftermijn. Zodra je verder scrolt, blijft een smalle versie van de uitkomst onder de kop staan.
2. **Jouw uitgangspunten**: één rij met de gedeelde gegevens (kilometers, kilometers met heffing, afschrijftermijn, restwaarde, bedrijfsgrootte en subsidie). Klik op een waarde om hem in een klein venster aan te passen; op een telefoon schuift dat venster van onderen in beeld.
3. **Waar zit het verschil?**: per kostenpost een regel met diesel links en elektrisch rechts, met balken die vanuit het midden naar buiten lopen. Klik op een regel om de cijfers van die post aan te passen: diesel links, elektrisch rechts. Er staat steeds maar één regel open. Bovenaan kies je per kilometer, per jaar of totaal.
4. **Uitgebreid** voegt aan dezelfde lijst financiering, laadpaal, laden onderweg en tol buitenland toe (elk aan of uit te zetten; bij tol kies je eerst de landen), en toont de terugverdientijd. De waterval en de gevoeligheid voor energieprijzen staan achter uitklapregels.

Eén advertentieplek staat als brede band onder de calculator (class `.ad`). Veelgestelde vragen heeft een advertentie in de linkerkolom, Nieuws en Over ons een band onderaan.

Getallen achter een schuif kun je ook typen. De invoer wordt alleen in de eigen browser bewaard (`localStorage`), zodat bezoekers verder kunnen waar ze waren; Herstel voorbeeldcijfers zet alles terug. Bij de uitkomst staan Kopieer (samenvatting als tekst) en Print.

## Twee weergaven

**Simpel**: gebruik (kilometers, kilometers met kilometerheffing, afschrijftermijn), kosten (aanschaf, restwaarde, verbruik, brandstof- en stroomprijs, onderhoud, verzekering, ERE-opbrengst) en belastingen en subsidies. Bij subsidies kies je tussen AanZET (percentage en maximum per bedrijfsgrootte) en MIA (extra aftrek, met keuze tussen 19% en 25,8% vennootschapsbelasting). Die twee kunnen niet tegelijk. De uitkomst is de prijs per kilometer en de besparing per jaar.

**Uitgebreid**: bouwt voort op Simpel met financiering (annuïteitenlening en rendementseis op eigen geld), laadpaal (met optioneel SPRILA), laden onderweg en buitenlandse tol per land (Vlaanderen, Wallonië, Frankrijk, Duitsland, Italië, Polen, Oostenrijk). Je ziet een waterval van Simpel naar Uitgebreid, een terugverdientijdgrafiek, de gevoeligheid voor diesel- en stroomprijs (break-even en heatmap) en een kostenopbouw per categorie.

## Rekenmethode

De afschrijving per jaar is aanschafprijs, bij elektrisch verminderd met subsidie of MIA-voordeel, min restwaarde, gedeeld door de afschrijftermijn. Energie is kilometers maal verbruik maal prijs, bij elektrisch min de ERE-opbrengst. Onderhoud is kilometers maal tarief, verzekering een vast bedrag per jaar, kilometerheffing het aantal kilometers met heffing maal tarief. In Uitgebreid worden kilometers in het buitenland uit de Nederlandse heffing gehaald en tegen het tarief van het betreffende land gerekend.

De terugverdientijd is het moment waarop de opgebouwde kosten van elektrisch (extra investering plus jaarkosten, inclusief financiering) onder die van diesel komen. De restwaarde is hierin niet meegenomen, want die ontvang je pas bij verkoop.

## Aanpassen

Standaardwaarden en tarieven staan bovenaan het script in `index.html`: schuiven en velden (`SL`, `SLX`), subsidietabel (`AZ`), tolling per land (`TOL`) en kostencategorieën (`CAT`, `CATX`). De berekening staat in `calc()` (Simpel) en `calcX()` (Uitgebreid). Kleuren en lettertypes staan als variabelen bovenaan de stylesheet (`:root`).

## Disclaimer

Dit is een rekenvoorbeeld en geen financieel of fiscaal advies. Subsidiebedragen (AanZET, MIA, SPRILA) en tarieven zijn indicatief. Controleer ze altijd bij RVO en de Belastingdienst.
