# 05 · Oplossen en valideren

Stand 27 oktober 2026. Het ongeteste Gurobi-skelet is verwijderd: het dekte belangrijke voorwaarden uit het ontwerp niet. [03](03-model.md) is de gecorrigeerde ontwerpbron; `referentie.py` is de beperkte, uitgevoerde referentie. Een beschreven uitbreiding is geen geïmplementeerde feature.

## 1. Solver en modelleertaal

`highspy==1.15.1` staat in `requirements.txt`. HiGHS is een open-source optie, ook voor commercieel gebruik onder de toepasselijke licentie. Kies Gurobi na benchmarks en met een passende productielicentie. De pip-licentie van Gurobi is beperkt tot 2.000 variabelen en 2.000 restricties en niet voor commercieel gebruik. [Gurobi](https://support.gurobi.com/hc/en-us/articles/29682074018833-What-does-Restricted-license-for-non-production-use-only-mean).

## 2. Hoe groot wordt het model

Een vaste laadplanning is veel kleiner dan gezamenlijke voertuig-, lease-, subsidie- en tienjaarsoptimalisatie. Leg per benchmark bouwtijd, geheugen, solverversie, hardware, rekentijd, status en gap vast. De oude indicatieve tabel en rekentijdclaims waren geen aangetoonde producteigenschappen.

## 3. Decompositie

Een operationeel deelprobleem is pas een LP als alle discrete laad-/connector-/contractbeslissingen vastliggen. Wegladen tot een SoC-grens, SOS2-belasting en batterijrichtingen kunnen een MIP vereisen. Klassieke LP-Benders is dan niet zonder meer toepasbaar.

Vergelijk voor de pilot concrete plannen en toets de volledige tijdas. Een latere decompositie moet sneden bewijzen en tegen het ongesplitste model worden getest. Verbied niet alleen aantallen elektrische diensten wanneer andere combinaties met hetzelfde aantal wel uitvoerbaar zijn.

## 4. Andere manieren om het klein te houden

Beperk scope en bevestigde kandidaten. Gebruik representatieve dagen voor screening en daarna chronologische replay. Aggregeer alleen fysiek en contractueel uitwisselbare voertuigen. Gebruik geen nacht-piekgrens die ook overdag geladen energie naar de nacht verplaatst.

## 5. Geteste referentie

### Deelregels

`reservebehoefte`: gehele reserve; `lease_meerkosten`: uitsluitend operational lease; `tractie_kwh`: correcte terugwinning; `hulpenergie_kwh`: activiteitsuren, ook bij stops; `startmutatie`: verkoop/afkoop op t=0; `contante_kosten`: echte kasstromen en horizonverplichtingen; `reele_rente`: consistente rente; `aanzet_bedrag`, `fiscale_regel`, `controle_subsidies`: beperkte bevestigde deelregels; `fallback`: geen gratis nooddekking; `normaliseer_meter` en `gegevensniveau`: eenheden, tijdzone, gaten en beperkte conclusies.

### Invoer laadplan

| Veld | Betekenis |
|---|---|
| `dt` | Werkelijke intervalduren in uren |
| `tijdstippen` | n+1 aaneengesloten ISO-tijdstippen met UTC-offset; verplicht bij chronologie |
| `gebouw_kw`, `net_kw` | Gebouwbelasting en fysieke/contractuele grens per interval |
| `kasten` | Unieke ID en kW-grens per fysieke vermogenskast |
| `voertuigen` | Unieke ID, kast, eigen connector, bevestigde ontwerpcapaciteit/reserve en rendementen |
| `depot_kw`, `weg_kw` | Bevestigd beschikbaar vermogen in vaste werkelijke vensters |
| `verbruik_kwh` | Accuverbruik per interval, inclusief relevante hulpenergie |
| `begin_kwh` | Expliciete beginlading, verplicht bij chronologie |
| `eind_min_kwh` | Eindvoorwaarde; standaard blijft beginlading beschikbaar |
| `weg_soc_max` | Bovengrens bij daadwerkelijk onderweg laden |

`laadplan(data, modus='chronologisch')` minimaliseert **depotpiek**, geen energiekosten of voertuigkeuze. Een integer laadactie voorkomt een kunstmatige 80%-grens bij een ongebruikte laadstop. Daarna reconstrueert `controleer_plan` energie, SoC, laadvensters, kastvermogen en netafname onafhankelijk.

`cyclische_screening` heeft een vrije cyclische beginlading en bewijst uitsluitend dat dezelfde dag herhaald kan worden. De uitvoer vermeldt die modus; gebruik haar nooit als stilzwijgende toets van opeenvolgende dagen.

Beperkingen: één depot, toegewezen connectoren zonder omhangen, vaste laadvensters en bevestigde effectieve vermogens. Geen volledige laadcurves, automatische voertuigselectie, batterij/zon, thuisladen of routetiming. Gelijktijdige weglaadacties van verschillende voertuigen worden geweigerd tot stationcapaciteit apart is gemodelleerd. Onbekende eigenschappen worden niet automatisch gunstig.

### 5.1 Schaduwprijzen

Geen globale euro/jaar-waarde uit `fixed()` rapporteren. Duale waarden zijn lokaal, conditioneel op vastgezette discrete keuzes en in de eenheid van de doelfunctie. Reken concrete upgrade-/voertuigalternatieven opnieuw door. [Gurobi-uitleg](https://support.gurobi.com/hc/en-us/articles/360034305272-How-do-I-retrieve-the-dual-Pi-values-for-a-MIP-problem).

### 5.2 Reproduceren

```sh
python -m pip install -r docs/vlootanalyse/requirements.txt
python -m unittest discover -s docs/vlootanalyse -p 'test_*.py' -v
python docs/vlootanalyse/rekenvoorbeeld.py
```

## 6. Wat het model oplevert

Een referentierun levert haalbaar/ondoenlijk, modus, depotpiek, acculadingen en laadvermogens. Het voorbeeld voegt eenvoudige jaar-TCO-scenario's toe. Het levert geen optimale vervangkalender, subsidieclaim of beproefd klantadvies.

Een vlootplan voegt bewezen strategische keuzes, invoer-/prijsversies, kosten/kasstromen, uitzonderingsdekking en praktijkcontrole toe. Zie [01](01-werkwijze.md).

## 7. Controleren en valideren

Tests omvatten oorspronkelijke pieken en stresstests, opeenvolgende dagen, ongebruikte weglaadstop boven 80%, onbekende beginlading, gedeeld kastvermogen, dubbele connectoren, corrupte solveruitvoer, datagaten en zomer-/wintertijd.

Voor klantwerk zijn daarnaast onafhankelijke uitvoerings-/contractcontrole, replay op andere historische dagen, uitvalscenario's, een passende praktijkproef en tweede beoordeling verplicht. Fictieve tests bewijzen geen gemeten modelnauwkeurigheid.

## 8. Voorstel voor de codestructuur (privé repository)

Scheid originele brondata, normalisatie, versieerbare parameters, strategische keuze, chronologische simulatie, onafhankelijke verifier en rapportage. De website en vlootkern delen een vastgelegde kostenspecificatie; voer cross-language-golden-tests uit vóór inzet van een volledige Python-kostenkern. Jaar-TCO en NCW zijn bewust verschillende grootheden.

Klantbestanden, identifiers en offertes gaan niet naar deze repository of analytics. Server-intake, notificaties, toegang, bewaartermijnen en verwijdering vragen een afzonderlijke livecontrole. [08](08-correcties-en-acceptatie.md) geeft de acceptatiepoorten.
