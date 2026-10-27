# Vlootanalyse: gids en optimalisatiemodel

Hoe Stekker of Diesel een vlootanalyse uitvoert: van aanvraag tot vlootplan, met het volledige wiskundige model erachter. Dit is werkdocumentatie; de website verandert er niet door.

Stand: 27 oktober 2026.

---

## In het kort

Een vlootanalyse beantwoordt: **welke voertuigen vervang je wanneer door welk type, hoe laad je ze, en kan je aansluiting dat aan**, tegen de laagste totale kosten. De calculator doet dat per voertuig. Een vloot is meer dan de som van die voertuigen, omdat drie dingen alleen op vlootniveau bestaan: de gedeelde netaansluiting, ruilbare ritten tussen voertuigen, en timing (subsidierondes, leasecontracten, wachttijd bij de netbeheerder, budget, zones).

Daarom is het een optimalisatieprobleem: een **minimalisatie van de netto contante waarde van alle vlootkosten** over 10 jaar, als gemengd geheeltallig lineair programma (MILP), op te lossen met Gurobi (of gratis met HiGHS voor kleine gevallen).

```math
\min\ \sum_{y} \text{DF}_y \Big( \underbrace{\text{aanschaf} - \text{subsidie}}_{\text{investering}} + \text{lease} + \text{vaste kosten} + \underbrace{\text{diesel} + \text{stroom} + \text{heffing} + \text{onderhoud}}_{\text{per gereden dienst}} + \text{netkosten} + \text{laadpunten} \Big) - \text{restwaarde}
```

onder de voorwaarden dat elke dienst gereden wordt, elke accu de dag haalt, het depot nooit meer vraagt dan de aansluiting, en de regels voor subsidie, lease, budget en zones kloppen.

---

## Leesvolgorde

| Nr | Document | Voor wie | Inhoud |
| --- | --- | --- | --- |
| 01 | [Werkwijze](01-werkwijze.md) | Iedereen | Het traject in tien stappen, vragenlijst kennismaking, opbouw rapport, controlelijst, privacy en aansprakelijkheid, groeipad |
| 02 | [Data](02-data.md) | Wie de data doet | Sjablonen voor de klant, open bronnen, opschonen, van ritten naar diensten, representatieve dagen, energiemodel |
| 03 | [Model](03-model.md) | Wie het model bouwt | Verzamelingen, parameters, beslisvariabelen, doelfunctie, alle restricties, onzekerheid, linearisaties |
| 04 | [Bedrijfsvarianten](04-bedrijfsvarianten.md) | Kennismaking en model | Onderweg laden ja of nee, thuisladen, vaste of flexibele planning, ploegendiensten, meerdere depots, netcongestie, omhangen, koeling en meer; plus een voorbeeld van een klantconfiguratie |
| 05 | [Oplossen](05-oplossen.md) | Wie het model bouwt | Gurobi, modelgrootte, Benders-decompositie, codeskelet, schaduwprijzen, validatie, codestructuur |
| 06 | [Parameters](06-parameters.md) | Iedereen | Alle standaardwaarden met bron (gelijk aan de calculator) en de aannames |
| 07 | [Rekenvoorbeeld](07-rekenvoorbeeld.md) | Iedereen | Drie bakwagens doorgerekend, met [`rekenvoorbeeld.py`](rekenvoorbeeld.py) om het laadschema na te rekenen |

---

## Het model in één tabel

| Onderdeel | Wat |
| --- | --- |
| **Beslissingen per jaar** | Bestaand voertuig houden of weg ($`z`$); nieuwe voertuigen per type, depot, koop of lease ($`b`$, $`n`$); AanZET of MIA per aankoop ($`x^{AZ}`$, $`x^{MIA}`$); aansluitoptie ($`g`$); laadpunten per type ($`u`$); batterij en zon |
| **Beslissingen per dag (representatief) en kwartier** | Welk voertuig rijdt welke dienst ($`\alpha`$); welk laadpunt ($`\lambda`$); laadvermogen ($`p`$); accu-inhoud ($`E`$); laden onderweg ($`\sigma`$, $`\varepsilon`$); afname van het net ($`P^{\text{imp}}`$) |
| **Doel** | Minimale netto contante waarde van alle kosten min restwaarde, optioneel met CO₂-prijs of risico (CVaR) |
| **Belangrijkste restricties** | Elke dienst gereden of uitbesteed; accu blijft tussen reserve en vol; laden alleen als het voertuig er staat; depot onder de aansluiting; stekkers genoeg; vloot en cohorten kloppen; lease loopt af; subsidie niet stapelen; budget |
| **Wat per bedrijf verschilt** | Schakelaars en parameters, zie [04 · Bedrijfsvarianten](04-bedrijfsvarianten.md) |
| **Uitkomst** | Vervangplan per jaar, ritanalyse per dienst, laadplan en netbehoefte, kosten per jaar, subsidietiming, CO₂, waarde van een kW extra, bandbreedte |

---

## Eerste stappen

1. Sjablonen voor de klant maken uit [02 · Data](02-data.md#2-sjablonen).
2. Verwerkersovereenkomst en voorwaarden (inclusief beperking van aansprakelijkheid) laten opstellen.
3. Een **privé** repository voor de modelcode starten met de structuur uit [05 · Oplossen](05-oplossen.md#8-voorstel-voor-de-codestructuur-privé-repository).
4. De rekenkern van de calculator omzetten naar Python en toetsen dat die hetzelfde rekent als de site.
5. Het [rekenvoorbeeld](07-rekenvoorbeeld.md) als eerste test laten slagen, daarna een verzonnen vloot van 10 voertuigen.
6. Twee pilotklanten.

---

Deze map staat in een openbare repository. Zet hier geen klantdata, prijsafspraken of offertes in.
