# TCO TruckTool

Een rekentool die een nieuwe diesel en een nieuwe elektrische N3 trekker vergelijkt: kosten per kilometer, per jaar en over de afschrijftermijn.

De tool is één statisch bestand (`index.html`) zonder build-stap en zonder framework. Open het in een browser, of zet het op GitHub Pages, Netlify of andere statische hosting. Het enige externe bestand is het lettertype (Google Fonts), met een systeemlettertype als terugval.

## Twee weergaven

**Simpel**: gebruik (kilometers, kilometers met kilometerheffing, afschrijftermijn), kosten (aanschaf, restwaarde, verbruik, brandstof- en stroomprijs, onderhoud, verzekering, ERE-opbrengst) en belastingen en subsidies. Bij subsidies kies je tussen AanZET (percentage en maximum per bedrijfsgrootte) en MIA (extra aftrek, met keuze tussen 19% en 25,8% vennootschapsbelasting). Die twee kunnen niet tegelijk. De uitkomst is de prijs per kilometer en de besparing per jaar.

**Uitgebreid**: bouwt voort op Simpel met financiering (annuïteitenlening en rendementseis op eigen geld), laadpaal (met optioneel SPRILA), laden onderweg en buitenlandse tol per land (Vlaanderen, Wallonië, Frankrijk, Duitsland, Italië, Polen, Oostenrijk). Je ziet een waterval van Simpel naar Uitgebreid, een terugverdientijdgrafiek, de gevoeligheid voor diesel- en stroomprijs (break-even en heatmap) en een kostenopbouw per categorie.

## Rekenmethode

De afschrijving per jaar is aanschafprijs, bij elektrisch verminderd met subsidie of MIA-voordeel, min restwaarde, gedeeld door de afschrijftermijn. Energie is kilometers maal verbruik maal prijs, bij elektrisch min de ERE-opbrengst. Onderhoud is kilometers maal tarief, verzekering een vast bedrag per jaar, kilometerheffing het aantal kilometers met heffing maal tarief. In Uitgebreid worden kilometers in het buitenland uit de Nederlandse heffing gehaald en tegen het tarief van het betreffende land gerekend.

De terugverdientijd is het moment waarop de opgebouwde kosten van elektrisch (extra investering plus jaarkosten, inclusief financiering) onder die van diesel komen. De restwaarde is hierin niet meegenomen, want die ontvang je pas bij verkoop.

## Aanpassen

Standaardwaarden en tarieven staan bovenaan het script in `index.html`: schuiven en velden (`SL`, `SLX`), subsidietabel (`AZ`), tolling per land (`TOL`) en kostencategorieën (`CAT`, `CATX`). De berekening staat in `calc()` (Simpel) en `calcX()` (Uitgebreid).

## Disclaimer

Dit is een rekenvoorbeeld en geen financieel of fiscaal advies. Subsidiebedragen (AanZET, MIA, SPRILA) en tarieven zijn indicatief. Controleer ze altijd bij RVO en de Belastingdienst.
