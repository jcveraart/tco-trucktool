# 07 · Rekenvoorbeeld: drie bakwagens

Dit fictieve voorbeeld toont de werking en gevoeligheid van een **vast** laadplan. Het is geen optimale aankoopkeuze of gevalideerd klantadvies. Draai [rekenvoorbeeld.py](rekenvoorbeeld.py) en de tests uit [05](05-oplossen.md).

## 1. De situatie

Eén depot met een fictieve beschikbare netgrens van 55 kW en drie bevestigde AC-22-kW-connectoren, ieder op een eigen kast. Gebouw: 20 kW van 07:00–18:00, anders 5 kW. Voor deze voorbeeldvoertuigen wordt AC-acceptatie verondersteld; bij een echte uitvoering moet die worden bevestigd.

| Dienst | Weg van depot | Km | Laadstop |
|---|---|---:|---|
| D1 | 06:00–15:00 | 180 | Geen |
| D2 | 05:00–17:00 | 260 | Bevestigde 45 minuten om 10:30, effectief 120 kW |
| D3 | 07:00–16:00 | 120 | Geen |

300 kWh bruikbaar × 85% SoH = 255 kWh ontwerpcapaciteit. Met 10% reserve is 229,5 kWh rij-energie beschikbaar. Ontwerpverbruik 1,20 kWh/km bevat winter en marge; voor de losse jaar-TCO gebruiken we 1,00 kWh/km.

**Reservebeleid:** 0 reservevoertuigen in dit didactische voorbeeld. Met 1 afgesproken geschikte reserve zijn 4 voertuigen nodig voor 3 diensten; prijs en inzet daarvan zijn hier niet opgenomen. Het voorbeeld bewijst dus geen storingsdekking.

## 2. Laag 1: ritgeschiktheid

D1 vraagt 216 kWh, D2 312 en D3 144. D2 vraagt meer dan de beschikbare 229,5 kWh; 45 minuten × 120 kW × 95% voegt maximaal 85,5 kWh toe. Samen 315 kWh: slechts 3 kWh boven de ontwerpvraag.

De conclusie is **voorwaardelijk en krap**, geen automatisch groen label. De code bewaakt de SoC gedurende de dag. Zij optimaliseert depotpiek, geen jaarlijkse energiekosten.

## 3. Laag 2: past het laden op het depot?

| Scenario | Uitkomst |
|---|---:|
| A: D1 en D3 elektrisch, geen onderweg laden | 32,6203 kW minimale depotpiek |
| B: alle drie, bevestigde laadstop | 49,5769 kW |
| D2 zonder onderweg laden | Ondoenlijk |
| B: ontwerpverbruik +1% | Ondoenlijk |
| B: effectief snellaadvermogen −20% | Ondoenlijk |
| B: 30 minuten beschikbaar laden | Ondoenlijk |
| B: 83% SoH | Ondoenlijk |
| B: 11 kW depotladen | Ondoenlijk |

Elke stresscase wijzigt één parameter. De +1% komt boven op het gekozen winterprofiel met marge; zij toont de krapte van deze ontwerpsituatie.

Dit is `cyclische_screening`: dezelfde dag kan met een passende beginlading worden herhaald. Echte opeenvolgende dagen vragen expliciete begin-SoC en doorlopende voertuig-/locatie-/energiebalans. De tests tonen A en B afzonderlijk haalbaar, maar A gevolgd door B onhaalbaar.

## 4. Laag 3: de kosten

Losse eenvoudige jaar-TCO, geen NCW of financieringsadvies. Aannames: 250 dagen, 7 jaar afschrijving, restwaarde 20% van oorspronkelijke prijs, diesel €95.000 en elektrisch €240.000, geen overige fiscale voordelen. De €240.000 wordt hier fictief volledig als subsidiabel chassis inclusief fabrieksopties behandeld; opbouwkosten zijn nul. Een echte offerte moet die onderdelen scheiden.

Diesel 25 l/100 km tegen €2,03/l; depot €0,25/kWh met 92% rendement; onderweg €0,55/kWh met 95%; ERE-scenario €0,10 per kWh van de hier gekozen leveringsgrens, alleen indien contract/aanspraak dit bevestigen. Onderhoud €0,10/€0,06 per km, verzekering €4.500/€6.500; fictief 80% heffingsnet tegen €0,182/€0,037. Controleer bij klantwerk werkelijke massa/tarieven en betaalmomenten.

De fictieve AanZET is 29% × €240.000 = €69.600 per voertuig, uitsluitend na aanspraakcontrole. Dit is geen garantie op toekenning of een toekomstige ronde.

| Scenario B, drie voertuigen | Jaarvoordeel elektrisch na €2.250 laadkosten |
|---|---:|
| AanZET en ERE | €37.606 |
| AanZET, geen ERE | €24.368 |
| Geen AanZET en geen ERE/overig fiscaal voordeel | **−€5.460** |

De laadkosten zijn drie AC-installaties van €2.500 plus €3.000 management in 10 jaar en €400 beheer per installatie per jaar. Reserve, financiering en andere niet-genoemde posten ontbreken. Een werkelijk vlootplan bevat de volledige kosten/kasstromen en een andere uitkomst kan volgen.

## 5. Wat het volledige model hier zou kiezen

Dat is **nog niet berekend**. De referentie heeft een vast gekozen vloot en bewijst geen optimaal vervangjaar, subsidie, lease of aankoop. Een toekomstig strategisch model moet reserve, bestaande verkoopwaarde, contracten, houdverplichtingen, liquiditeit, horizon en chronologie meenemen volgens [03](03-model.md).

## 6. Wat dit voorbeeld laat zien

Gezamenlijk laden vraagt een depottoets. De haalbaarheid is gevoelig voor een kritieke laadstop. Kosten hangen sterk van subsidies en marktinkomsten af. Een reproduceerbare screeningsuitkomst is nuttig, maar een klantbesluit vraagt bevestigde invoer, uitzonderingsdekking, replay en een praktijkproef.

