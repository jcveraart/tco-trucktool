# 01 · Werkwijze: van aanvraag tot vlootplan

Dit is de praktische gids: wat we doen vanaf het moment dat een aanvraag binnenkomt via [de vlootanalysepagina](https://stekkerofdiesel.nl/vlootanalyse/) tot het rapport op tafel ligt, en daarna. De wiskunde staat in [03 · Model](03-model.md); hier gaat het om het traject, de vragen, de controles en de afspraken.

---

## 1. Wat we leveren

| Pakket | Voor wie | Inhoud | Data nodig | Doorlooptijd |
| --- | --- | --- | --- | --- |
| **Quickscan** | 3 tot 20 voertuigen, eerste oriëntatie | TCO per voertuig met eigen cijfers, globale ritgeschiktheid, vervangvolgorde, eerste inschatting laden op het depot | Voertuiglijst, tankpasdata, gegevens aansluiting | 1 week |
| **Vlootplan** | 5 tot 100 voertuigen, wil beslissen | Alles van de quickscan, plus ritanalyse per dienst, laadplan met netaansluiting, vervangplan per jaar uit de optimalisatie, subsidietiming, onzekerheid, bespreking | Plus ritdata (telematica of planning) en kwartierverbruik van het depot | 2 tot 4 weken |
| **Monitoring** | Klanten na een vlootplan | Elk kwartaal de echte ritten en het echte laden naast het plan; seintje als het volgende voertuig rijp is; jaarlijkse herberekening | Doorlopende export of koppeling | doorlopend |

De site toont bewust geen prijs, en deze repository is openbaar: prijzen en offertes horen hier dus niet. Spreek per pakket een vaste prijs af (monitoring per voertuig per maand) en stel die bij na de eerste vijf klanten, op basis van de gemeten tijd per stap in §2.

---

## 2. Het traject in tien stappen

| Stap | Wat | Uitkomst | Tijd (vlootplan) |
| --- | --- | --- | --- |
| 0 | Aanvraag komt binnen (tabel `fleet_requests` in Supabase) | Reactie binnen 1 werkdag, zoals de site belooft | 15 min |
| 1 | Kennismaking (30 tot 45 minuten, bellen of langs) | Beeld van de vloot, het doel en de beslisser | 1 uur |
| 2 | Voorstel en afspraken | Pakket, prijs, planning, verwerkersovereenkomst getekend | 1 uur |
| 3 | Data-intake | Sjablonen ingevuld, exports ontvangen | 1 week wachten, 1 uur werk |
| 4 | Data opschonen en diensten opbouwen | Schone diensten per dag, voertuigen aangevuld uit RDW, kwaliteitsrapport | 2 tot 6 uur |
| 5 | Quickscan | TCO per voertuig en globale ritgeschiktheid; eerste gevoel | 1 uur |
| 6 | Optimalisatie en scenario's | Vervangplan, laadplan, netbehoefte, scenario's | 2 tot 6 uur |
| 7 | Controle | Vier-ogen-check, plausibiliteit, terugtoets op historische dagen | 1 tot 2 uur |
| 8 | Rapport en bespreking | Rapport, bespreking van 60 tot 90 minuten | 3 uur |
| 9 | Nazorg | Vragen, offertes vergelijken, eventueel monitoring | naar behoefte |

### Stap 0: aanvraag

- De aanvraag staat in Supabase (`fleet_requests`: naam, bedrijf, e-mail, telefoon, aantal voertuigen, eventueel de link naar een berekening uit de calculator).
- Reageer binnen 1 werkdag, liefst telefonisch, anders per mail vanaf help@stekkerofdiesel.nl. Stel een tijd voor de kennismaking voor.
- Kijk vooraf: als er een calculatorlink is, open die; dan weet je al welk voertuig en welke cijfers de klant in gedachten heeft.

### Stap 1: kennismaking

Doel: begrijpen wat de klant wil beslissen, en of een quickscan of een vlootplan past. Gebruik de [vragenlijst in §3](#3-vragenlijst-kennismaking). Sluit af met:

- welk pakket,
- welke data de klant kan leveren en wie die gaat exporteren,
- wanneer het rapport klaar is en wanneer de bespreking is.

### Stap 2: voorstel en afspraken

Een korte mail of pdf met: wat we doen, wat we nodig hebben, wanneer het klaar is, de prijs, de voorwaarden (inclusief de [beperking van aansprakelijkheid in §6](#6-privacy-afspraken-en-aansprakelijkheid)), en de verwerkersovereenkomst.

### Stap 3: data-intake

Stuur de sjablonen en de uitleg per tankpas en telematicasysteem uit [02 · Data](02-data.md#2-sjablonen). Bied aan om samen een half uur door de exports te lopen; dat scheelt dagen heen en weer mailen.

### Stap 4: opschonen en diensten opbouwen

Volgens [02 · Data](02-data.md). Altijd afsluiten met een kwaliteitsrapport voor jezelf: hoeveel dagen, hoeveel ritten, wat ontbrak, wat is aangenomen. Belangrijke aannames gaan later in het rapport.

### Stap 5: quickscan

Reken elk voertuig door zoals de calculator dat doet, met de eigen cijfers van de klant (km per jaar, verbruik, prijzen). Plus per voertuig de eenvoudige ritgeschiktheid: haalt de langste gewone dag het met alleen 's nachts laden? Voor het quickscanpakket is dit, netjes opgeschreven, het product. Voor het vlootplan is het de controle of de optimalisatie later iets geks doet.

### Stap 6: optimalisatie en scenario's

Bouw de klantconfiguratie ([04 · Bedrijfsvarianten](04-bedrijfsvarianten.md#20-klantconfiguratie-in-één-bestand)), draai het model ([05 · Oplossen](05-oplossen.md)) en draai minstens deze scenario's:

1. **Basis:** de configuratie zoals besproken.
2. **Zonder onderweg laden** (als de basis het toestaat) of **met laden in de pauze** (als de basis het niet toestaat). De klant ziet zo wat die keuze waard is.
3. **Geen netverzwaring:** wat kan binnen de huidige aansluiting, met slim laden en eventueel een batterij.
4. **Prijzen tegen:** diesel 15% goedkoper, stroom 30% duurder, restwaarde elektrisch 10 procentpunt lager.
5. **Alles diesel houden:** de referentie waartegen alle besparingen gelden.

Plus de Monte Carlo over het gekozen plan voor de bandbreedte.

### Stap 7: controle

Zie de [controlelijst in §5](#5-controlelijst-voor-oplevering). Bij twijfel: laat iemand anders de uitkomst in één zin navertellen; als die zin niet klopt met jouw verhaal, deugt het rapport nog niet.

### Stap 8: rapport en bespreking

Opbouw in [§4](#4-opbouw-van-het-rapport). Stuur het rapport een dag voor de bespreking. In de bespreking: begin met het antwoord ("vier van je twaalf wagens kunnen in 2027 elektrisch, dat scheelt zoveel per jaar, je aansluiting kan het aan met slim laden"), dan pas de onderbouwing.

### Stap 9: nazorg

- Vragen beantwoorden, offertes van dealers en installateurs naast het plan leggen (we blijven onafhankelijk: geen voorkeur, geen commissie).
- Na een half jaar bellen: is er iets veranderd? Dat is ook het moment om monitoring aan te bieden.

---

## 3. Vragenlijst kennismaking

Niet alles hoeft in het eerste gesprek. Wat er niet uitkomt, komt in de data-intake.

**Doel en besluit**

- Waarom nu? (zone, klant die het vraagt, contract dat afloopt, subsidie, kosten, imago)
- Wie beslist, en wanneer moet er een besluit liggen?
- Is er een doel (bijvoorbeeld "in 2030 de helft elektrisch") of een eis van een opdrachtgever?
- Is er een budget per jaar?

**Vloot**

- Hoeveel voertuigen, welke soorten (trekker, bakwagen, bestelbus, bus), hoe oud?
- Eigendom of lease, en wanneer lopen contracten af?
- Al elektrische voertuigen? Ervaringen?
- Bijzonderheden: koeling, laadklep, kraan of andere aftakas, ADR, assen, lange of zware ladingen.

**Ritten en planning**

- Vaste routes of elke dag anders?
- Kan de planner diensten tussen wagens wisselen?
- Hoe lang is een gewone dag, en de langste dag? Ploegendiensten?
- Komen de wagens 's nachts terug op het depot? Of neemt de chauffeur de wagen mee naar huis?
- Rijden jullie in zero-emissiezones, en zo ja welke?
- Buitenland?
- Charters of onderaannemers?

**Laden**

- Mag een chauffeur onderweg laden? Alleen in de pauze, of ook daarbuiten?
- Hebben klanten laadpalen waar jullie lossen?
- Hebben chauffeurs thuis een eigen oprit (bij bestelbussen)?

**Depot en net**

- Eigen terrein of huur? Ruimte voor laadpunten?
- Netbeheerder, aansluitwaarde (bijvoorbeeld 3x80A of kVA), gecontracteerd vermogen?
- Is er al contact met de netbeheerder geweest? Wat zei die?
- Zonnepanelen of plannen daarvoor?
- Energiecontract: vast, dag en nacht, of dynamisch?

**Data**

- Welk telematicasysteem (Webfleet, Trimble, Transics, fabrikantenportaal, anders)?
- Welke tankpas (Travelcard, DKV, Shell, TotalEnergies, anders)?
- Wie kan exports maken?

**Bedrijf**

- Aantal medewerkers en omzet (bepaalt AanZET en SPRILA).
- BV of eenmanszaak (bepaalt het fiscale voordeel).

---

## 4. Opbouw van het rapport

Het rapport volgt de stijl van de bestaande pdf-rapporten van de calculator. Elk hoofdstuk heeft één boodschap in de kop.

| Nr | Hoofdstuk | Inhoud | Uit het model |
| --- | --- | --- | --- |
| 1 | Samenvatting | Het antwoord in drie zinnen, het plan per jaar in één tabel, de besparing met bandbreedte | Vervangplan, $`Z`$ tegen alles diesel, Monte Carlo |
| 2 | Jouw vloot vandaag | Voertuigen, kilometers, kosten per jaar, CO₂ | Data en referentiescenario |
| 3 | Ritanalyse | Per dienst: groen, oranje of rood, en waarom (depot, onderweg, zone, snellader, klant) | Ritgeschiktheid §5.3, $`\phi`$ |
| 4 | Laden en netaansluiting | Laadpunten, piekvermogen, laadprofiel van een gewone en een zware dag, wel of geen verzwaring, wat een kW extra waard is | $`u`$, $`P^{\text{pk}}`$, $`p`$, schaduwprijs van (N2) |
| 5 | Vervangplan | Welk voertuig wanneer, koop of lease, welk type (zonder merkvoorkeur: we noemen geschikte modellen) | $`z`$, $`b`$, $`n`$ |
| 6 | Kosten en subsidie | TCO per jaar, AanZET-rondes, MIA, SPRILA, kasstroom per jaar | Doelfunctie per term |
| 7 | Onzekerheid | Wat als diesel goedkoper wordt of stroom duurder; kans dat het plan goedkoper is dan alles diesel | Scenario's en Monte Carlo |
| 8 | Volgende stappen | Wat de klant deze maand, dit kwartaal en dit jaar doet (aanvraag netbeheerder, AanZET-ronde, offertes) | Eerste-fasebeslissingen |
| B | Bijlage: aannames | Alle parameters met bron, wat geschat is | Configuratie en [06 · Parameters](06-parameters.md) |

---

## 5. Controlelijst voor oplevering

**Data**

- [ ] Elk voertuig uit de lijst komt in de data voor, of het ontbreken is verklaard.
- [ ] Kilometers per jaar uit de data liggen binnen 10% van wat de klant zelf opgaf.
- [ ] Dieselverbruik per voertuig is plausibel voor de soort (zie [06 · Parameters](06-parameters.md)).
- [ ] De representatieve dagen geven samen het jaarverbruik en de jaarpiek binnen 5% terug.

**Model**

- [ ] Het scenario *alles diesel* geeft dezelfde jaarkosten als de quickscan (binnen 2%).
- [ ] Geen dienst is uitbesteed in de basis, tenzij dat zo bedoeld is.
- [ ] Optimaliteitsgat kleiner dan 1% (of verklaard).
- [ ] Het gekozen plan is op kwartierniveau nagerekend voor alle extreme dagen.
- [ ] Terugtoets: het plan is haalbaar op minstens 97% van alle historische dagen (niet alleen de representatieve).

**Rapport**

- [ ] De samenvatting noemt het plan, de besparing met bandbreedte en de belangrijkste voorwaarde.
- [ ] Elke geschatte waarde is gemarkeerd als schatting.
- [ ] Geen merkvoorkeur; waar modellen genoemd worden, staan er meerdere geschikte.
- [ ] Aannames en beperkingen staan in de bijlage.

---

## 6. Privacy, afspraken en aansprakelijkheid

**Privacy (AVG)**

- Ritdata en telematica zijn persoonsgegevens van chauffeurs. Wij zijn verwerker, de klant verantwoordelijke: teken een verwerkersovereenkomst vóór de data komt.
- Vraag alleen wat nodig is. Ritsamenvattingen (vertrek, aankomst, kilometers, stops) zijn genoeg; geen ruwe GPS-sporen, geen chauffeursnamen. Vervang kentekens en chauffeur-id's door codes in de werkbestanden.
- Bewaar klantdata niet in de publieke repository en niet in openbare tabellen. Een afgeschermde opslag (bijvoorbeeld een privé-bucket in Supabase met alleen beheerderstoegang, of versleutelde lokale opslag) met een vaste bewaartermijn: ruwe data weg binnen 3 maanden na oplevering, het rapport en de geaggregeerde invoer zolang de klant monitoring heeft of maximaal 12 maanden, in lijn met de [privacyverklaring](https://stekkerofdiesel.nl/privacy/).

**Aansprakelijkheid**

Het rapport is een advies op basis van aangeleverde data en aannames. Neem in de voorwaarden en in het rapport op:

- dat de uitkomsten afhangen van de data van de klant en van aannames die in de bijlage staan;
- dat actieradius in de praktijk afhangt van weer, belading, rijstijl en accuveroudering, en dat we daarom marges gebruiken;
- dat subsidies, tarieven en regels kunnen veranderen en dat de klant ze vóór een besluit nagaat bij RVO, de netbeheerder en de leverancier;
- een beperking van de aansprakelijkheid tot het factuurbedrag.

Laat de voorwaarden één keer door een jurist nakijken.

**Onafhankelijkheid**

De site belooft: geen merkvoorkeur en we verkopen geen trucks. Daarom geen commissie van merken, dealers of leasemaatschappijen. Partners (installateurs, energieadviseurs) alleen na het rapport, en als er een vergoeding is, dan staat die open op de site.

---

## 7. Gereedschap

| Doel | Gereedschap |
| --- | --- |
| Data inlezen en opschonen | Python met pandas; Jupyter-notebooks per klant |
| Open data | RDW (kenteken), KNMI (temperatuur), energieprijzen, laadpuntlocaties (zie [02 · Data](02-data.md#3-aanvullen-uit-open-bronnen)) |
| Optimalisatie | `gurobipy` (Gurobi); voor ontwikkelen en kleine klanten kan het open-source HiGHS. Zie [05 · Oplossen](05-oplossen.md#1-solver-en-modelleertaal) |
| Rapport | Dezelfde opmaak als de pdf-rapporten van de calculator; grafieken met matplotlib of Vega-Lite |
| Opslag klantdata | Afgeschermd, nooit in deze repository |
| Versiebeheer van de modelcode | Een aparte, **privé** repository (deze repository is openbaar en voedt de website) |

---

## 8. Groeipad

| Fase | Wanneer | Wat | Poort naar de volgende fase |
| --- | --- | --- | --- |
| 0. Voorbereiden | nu, 2 tot 3 weken | Sjablonen, verwerkersovereenkomst, rekenkern van de calculator als Python-module, rapportsjabloon, model met testdata | Een verzonnen vloot van 10 voertuigen in één dag doorgerekend |
| 1. Eerste klanten | 1 tot 2 maanden | 3 klanten, de eerste twee goedkoop in ruil voor referentie; veel handwerk | 3 rapporten, minstens 1 betalende klant of echte vervanging |
| 2. Vastzetten | 1 maand | Pakketten en prijzen, rekenregels en marges vast, tijd per stap gemeten | Een vlootplan kost hooguit 1 dag |
| 3. Eigen tool | 2 tot 3 maanden | Intern beheerscherm: upload, opschonen, model, rapport met één klik | Vlootplan in 2 tot 3 uur, 10 klanten gedaan |
| 4. Schalen | doorlopend | Koppelingen met de twee meest gebruikte telematicasystemen, monitoring als abonnement, partners aan de uitvoerkant | Terugkerende omzet en aanvragen zonder eigen werving |
