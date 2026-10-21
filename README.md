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
| `index.html` | Calculator, Simpel |
| `index.html#uitgebreid` | Calculator, Uitgebreid |
| `index.html#faq` | Veelgestelde vragen |
| `index.html#nieuws` | Nieuws |
| `index.html#over-ons` | Over ons |

## Opbouw van de calculator

1. **Wat vergelijk je?** Trekker (N3), bakwagen (N2 of N3), bestelbus (N1) of bus (M3). Elk voertuig heeft eigen voorbeeldcijfers en eigen regels: kilometerheffing en AanZET gelden alleen voor vrachtwagens, en bij een bakwagen kies je N2 of N3 (dat bepaalt de AanZET-tabel).
2. **Uitkomst**: diesel links (donker), elektrisch rechts (licht), met prijs per kilometer en per jaar en in één zin het verschil. Bij het scrollen blijft een smalle versie onder de kop staan. Daaronder vier kerncijfers: terugverdientijd, vanaf hoeveel kilometer per jaar elektrisch goedkoper is, actieradius tegenover de gemiddelde dagrit (met een waarschuwing als laden onderweg nodig is) en CO₂-besparing.
3. **Vul je eigen cijfers in**: zolang je nog voorbeeldcijfers ziet, staat direct onder de bedragen een groene balk met één grote knop en de verwachte moeite (*6 korte stappen · ± 2 minuten*). Scrol je daar voorbij, dan verschijnt een zwevende knop (op een telefoon onderin, binnen bereik van je duim). De knop opent een invulvenster met per stap één onderwerp en hooguit vier of vijf schuiven: gebruik, aanschaf en afschrijving, subsidie (met N2 of N3 bij een bakwagen), energie en actieradius, onderhoud en verzekering, en bij vrachtwagens kilometerheffing. Bovenin staat de stap en één geruststellende regel (*Weet je iets niet? Laat het voorbeeld staan.*), onderin rekent de uitkomst live mee. Na de laatste stap licht de uitkomst even op en verdwijnt de uitnodiging; dan verschijnt de samenvatting *Jouw cijfers* met een knop Aanpassen.
4. **Waar zit het verschil?** Per kostenpost een regel met diesel links en elektrisch rechts, met balken vanuit het midden. Een klik op een regel of op een onderdeel van de samenvatting opent het invulvenster op de juiste stap.
5. **Uitgebreid** zet alle schuiven onder elkaar in een kolom links (op een telefoon boven de uitkomst), met de uitkomst ernaast die live meerekent. Financiering, laadpaal, laden onderweg en (bij vrachtwagens) tol buitenland komen erbij, en de terugverdientijd staat in een grafiek. Een klik op een kostenregel springt naar de juiste schuiven. Waterval en gevoeligheid voor energieprijzen staan achter uitklapregels.

Waar iemand die van diesel komt vragen kan hebben (onderhoud en verzekering elektrisch, stroomprijs, bruikbare accu, ERE, kilometerheffing, AanZET en MIA, N2 of N3, laadpaal, netaansluiting, SPRILA, openbaar laden, laadtijd, financiering en de kerncijfers) staat een klein vraagteken. Dat opent op verzoek een korte uitleg met een link naar de officiële bron; op een telefoon schuift die van onderen in beeld. De teksten staan in `TIPS` bovenaan het script. Veelgestelde vragen heeft een groep *Overstappen op elektrisch* over zero-emissiezones, netcongestie, laden, de accu en de planning.

Elk getal is een schuif die je ook kunt typen; met de pijltjestoetsen verhoog of verlaag je per stap (met Shift per tien stappen).

De invoer wordt alleen in de eigen browser bewaard (`localStorage`). *Herstel voorbeeldcijfers* zet alles terug naar de voorbeeldcijfers van het gekozen voertuig. Bij de uitkomst staan **Deel** (kopieert een korte samenvatting met een link `?s=…` naar precies deze berekening) en **Print**.

Advertentieplekken hebben de class `.ad`: een brede band onder de calculator, een kolom bij Veelgestelde vragen en een band onder Nieuws en Over ons.

## Rekenmethode

De afschrijving per jaar is de aanschafprijs, bij elektrisch verminderd met de subsidie of het MIA-voordeel, min de restwaarde, gedeeld door de afschrijftermijn. Energie is kilometers maal verbruik maal prijs, bij elektrisch min de ERE-opbrengst. Onderhoud is kilometers maal tarief, verzekering een vast bedrag per jaar, kilometerheffing (alleen vrachtwagens) het aantal kilometers met heffing maal het tarief. In Uitgebreid worden kilometers in het buitenland uit de Nederlandse heffing gehaald en tegen het tarief van het betreffende land gerekend.

De terugverdientijd is het moment waarop de opgebouwde kosten van elektrisch (extra investering plus jaarkosten, inclusief financiering) onder die van diesel komen. De restwaarde is hierin niet meegenomen, want die ontvang je pas bij verkoop.

## Aanpassen

Bovenaan het script in `index.html` staan alle velden met bereik en standaardwaarde (`FIELDS`), de voertuigen met hun voorbeeldcijfers (`VT`), de AanZET-tabellen voor N2 en N3 (`AZT`), tolling per land (`TOL`) en de stappen van het invulvenster (`STEPS`). De berekening staat in `calc()` en `calcX()`. Kleuren en lettertypes staan als variabelen bovenaan de stylesheet (`:root`). De naam van de site staat in `BRAND` en in de kop en voet van de HTML.

## Disclaimer

Dit is een rekenvoorbeeld en geen financieel of fiscaal advies. Voorbeeldcijfers, subsidiebedragen (AanZET, MIA, SPRILA) en tarieven zijn indicatief. Controleer ze altijd bij RVO en de Belastingdienst.
