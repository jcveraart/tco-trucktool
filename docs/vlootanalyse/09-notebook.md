# 09 · Uitvoerbaar gezamenlijk vlootmodel

27 oktober 2026. Het [Jupyter notebook](vlootanalyse.ipynb) bevat de volledige gezamenlijke MILP-rekenkern, fictieve invoer, uitgevoerde resultaten, grafieken, scenariovergelijkingen en automatische tegenvoorbeelden. Het heeft geen API-sleutel, internetverbinding of externe bronmodule nodig tijdens het rekenen.

## Openen en uitvoeren

Download het notebook en open het in JupyterLab of VS Code met een Python 3.12+-kernel. GitHub toont de opgeslagen uitvoer; wijzigen en opnieuw rekenen doe je in een notebookomgeving.

```sh
python -m pip install -r docs/vlootanalyse/requirements-notebook.txt
python -m jupyterlab docs/vlootanalyse/vlootanalyse.ipynb
```

Kies **Run → Run All Cells**. De standaardrun gebruikt uitsluitend fictieve data. De rekentijd per optimalisatie is begrensd; status en werkelijk behaalde MIP-gap blijven zichtbaar. De requirements pinnen de geteste rekenbibliotheken.

## Bestanden

| Bestand | Functie |
|---|---|
| [vlootanalyse.ipynb](vlootanalyse.ipynb) | Alle rekenkerncode ingebed, uitleg, invoer, oplossingen, grafieken en tests |
| [vlootmodel.py](vlootmodel.py) | Dezelfde rekenkern als importeerbare bronmodule |
| [test_vlootmodel.py](test_vlootmodel.py) | Kleine controleerbare gevallen en onmogelijke tegenvoorbeelden |
| [voorbeeld_invoer.json](voorbeeld_invoer.json) | Volledige fictieve JSON-invoerstructuur |
| [requirements-notebook.txt](requirements-notebook.txt) | Python-afhankelijkheden |

Voor hergebruik buiten het notebook:

```python
from vlootmodel import FleetModel, load_case

data = load_case('voorbeeld_invoer.json')
model = FleetModel(data)
result = model.solve(time_limit=60, gap=.001)
if result['feasible']:
    print(model.verify_physics())
    print(model.tables()['fleet'])
```

De notebookmetadata bevatten hashes van bronmodule en testbron. Als je de bronmodule wijzigt, moet de ingebedde code ook worden bijgewerkt en het notebook opnieuw volledig worden uitgevoerd. De openbare notebookuitvoer bevat uitsluitend fictieve gegevens.

## Implementatiedekking

| Onderdeel uit 03 | Uitvoerbare implementatie |
|---|---|
| Voertuigen en verwerving | Fysieke slots, behoud, verkoop op t=0, koop/operational lease, beschikbare startcohorten, vervangmoment, leeftijd/contracteinde, geen terugkeer na verkoop |
| Contracten | Werkelijk per leasevoertuig gereden kilometers, periodefees, onderhoudsdekking via expliciete prijzen, beëindigingskosten en netto resterende horizonverplichtingen |
| Inzet | Eén complete dagdienst per voertuig/dag, compatibiliteit, vaste dienstbinding, expliciete gehele reserve, begrensde en geprijsde charter |
| Tijd en locaties | Bevestigde complete dienstvarianten, aankomst-/vertrekgrenzen, meerdere depots/expliciete thuislocaties, fysieke locatieconservering |
| Energie | Accu-kWh/dieselliters per interval, HVAC/koeling/PTO tijdens activiteiten, optionele segmentraming, begrensde recuperatie en afwijzen van overschot |
| Accu en laden | Gemeten begin-SoC, capaciteit/SoH per periode, doorlopende energiebalans, eindvoorwaarden, AC/DC-acceptatie, concave lineaire laadcurves, openbare laadvensters en stationcapaciteit |
| Laadinfrastructuur | Fysieke connectoren, gedeeld kastvermogen, vaste connectorreservering of werkelijk omhangen met personeelscapaciteit en kosten |
| Net en energie | Netniveaus en toegestane overgangskosten/beschikbaarheidsdatum, import/export, volumetarieven met aangrenzende segmenten, factuurpieken, PV en stationaire opslag per cohort |
| Geld en beleid | NCW op betaalmoment, restwaarden, bevestigde subsidie-/fiscale betaalreeksen en houdvoorwaarden, projectsubsidie voor nieuw materieel, kapitaalbudget/piek, CO₂/ZE-doelen, ERE-leverings-/netimportbegrenzing |
| Scenario's | Gedeelde investeringen, operationele recourse, vermogen-/voertuiguitval, verwachte kosten en CVaR, heroptimalisatie en replay met vaste investeringen |
| Controle | Alle matrixrijen, bounds en integrality; afzonderlijk opgebouwde accu-/net-/kastbalansen en kasstroomreconciliatie; bekende goede én onmogelijke gevallen |

Koop met financiering gebruikt dezelfde economische voertuigkosten als koop uit eigen middelen. Een aparte banklening, cashflowdienst voor rente/aflossing, werkkapitaal en fiscale aangifte zijn geen extra beslismodules in deze kern. Tel financieringsrente niet dubbel naast economische kapitaalkosten. Een specifieke lening/financial-lease-offerte vraagt een afzonderlijke, consistente financieringsreconciliatie.

## Aannames die bij eigen data expliciet moeten blijven

De demo bevat twee bestaande dieselbestelwagens, vier beslisjaren, twee scenario's, koop-/leasealternatieven in 2026/2027, één tweepoort-laadkast, een vertraagde netverzwaring en optionele PV/opslag. Alle prijzen en voertuigspecificaties zijn fictief. Het 50%-ZE-doel is een vrijwillig demodoel.

De demo herhaalt per jaar één 24-uurswerkdag 250 maal. Ook de gebouwlast wordt zo gewogen. Dit is een planningsvoorbeeld, geen volledige kalenderfactuur, PV-jaaropbrengst of bewijs voor opeenvolgende willekeurige dagen. Voor echte historie: `mode='full_chronology'`, `repeat=1`, aansluitende tijdstippen en expliciete begin/eindlading. Een invoergat wordt niet stilzwijgend nulverbruik. Uurgrenzen bewijzen geen veilige volgorde binnen dat uur; gebruik bij korte laadstops een fijnere tijdstap.

Voertuigkosten `fixed_cost`, `lease_cost`, `normal_tax_shield`, verkoop/afkoop en `contract_km` zijn expliciete bedragen/volumes per beslisperiode. Stem een midjaarcontract af met fijnere beslisperioden en bevestigde deelbedragen. Infrastructuur-O&M en contractfees met `annual_` worden met de periodejaren gewogen. Modulelevensduur telt beslisperioden. De invoer moet dus bij de gekozen tijdindeling passen.

De beschikbare kandidaatcohorten begrenzen de zoekruimte. Als een model/uitvoering/startmoment ontbreekt, kan de solver dat niet kiezen. De fysieke en wettelijke compatibiliteit moet vooraf worden bevestigd via kenmerken, dienstvereisten en waar nodig `allowed_assets`; het model kijkt geen aslast, laadprotocol of routeverbod op internet na.

Het model plant geen nieuwe routes of personeelsroosters. Extra laden/omrijden staat uitsluitend in complete, bevestigde varianten met aangepaste tijd, afstand en energie. Aanschafbeslissingen zijn over alle scenario's gelijk; operationele planning mag het scenario kennen. Het is geen meertrapsmodel met geleidelijk bekend wordende toekomstige informatie.

Subsidie, fiscale winst, betaalmomenten, belasting- en ERE-aanspraak zijn bevestigde externe input. Geen generieke korting op een catalogusprijs. De demo claimt deze voordelen niet. De kapitaalpiek is gescheiden van NCW, maar bevat geen volledige operationele liquiditeitsprognose.

## Verificatie en praktijkvalidatie

De volledige notebookrun omvat het model, de uitvoertabellen en grafieken, vergelijking met de huidige vloot, vaste-plan-replay, vier gevoeligheidsgevallen en 30 modeltests. De modeltests bevatten onder andere:

- Een analytisch narekenbare laadkost inclusief laadverlies en discontering.
- Een tienjarige beslisketen en een onmogelijke accuketen zonder dagelijkse reset.
- Endogene koop/lease, verkoop op tijdstip nul, leasekilometers en resterende leasekosten.
- Een subsidie die de eerste factuur niet kan financieren, houdplicht en nieuw-projectvoorwaarden.
- Te late netverzwaring, uitgevallen openbare lader, gebrek aan personeel en voertuiguitval.
- Meerdere depots, negatieve stroomprijzen, opslag, ERE, tariefsegmenten en beschadigde uitvoer.

De bestaande 28 tests voor `referentie.py` blijven daarnaast behouden. Fictieve softwaretests bewijzen geen empirische nauwkeurigheid. Een klantpilot vraagt nog bevestigde data, kalibratie, replay op andere historische perioden, storingsscenario's, een praktijkdienst en tweede beoordeling volgens [08](08-correcties-en-acceptatie.md). Een echt groot jaarmodel is nog niet op rekentijd/geheugen gebenchmarkt.

De website bevat nog geen online uitvoering van dit notebook. Klantbestanden, offerteprijzen en notebookuitvoer met klantdata blijven in een afgeschermde omgeving.
