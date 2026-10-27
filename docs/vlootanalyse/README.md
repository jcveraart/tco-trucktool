# Vlootanalyse: uitvoerbaar model en validatie

Stand: 27 oktober 2026 · gecorrigeerd ontwerp, gezamenlijke optimalisatie en uitgevoerd notebook.

De dienst beantwoordt welke voertuigen elektrisch kunnen, onder welke laadvoorwaarden en met welke kosten en kasstromen. De eerste scope is een **begeleide pilot: één depot, vaste of duidelijk begrensde routegroepen en bevestigde voertuiguitvoeringen**. De klant krijgt inzicht in haalbaarheid, kosten en uitzonderingen; geen onvoorwaardelijke investeringsgarantie.

## Wat is uitgevoerd?

| Onderdeel | Status |
|---|---|
| Website | Kennismaking en contactaanvraag; geen online vlootoptimizer |
| `referentie.py` | Geteste hulpmiddelen voor energie, reserve, lease, kasstromen, datakwaliteit en een vast laadplan |
| `rekenvoorbeeld.py` | Reproduceerbare screening en afzonderlijke stresscases, met voorwaardelijke uitkomsten |
| [Gezamenlijke optimalisatie in Jupyter](vlootanalyse.ipynb) | Uitgevoerde MILP-kern: vloot, koop/lease, vervangmoment, infrastructuur en laden; fictieve demo, grafieken en 30 modeltests |
| Productie- en praktijkvalidatie | Geen online vlootoptimizer of empirisch gevalideerd klantmodel; intake en praktijkpoorten blijven nodig |
| Klantadvies | Pas na intake, chronologische replay, scenario's, onafhankelijke controle en menselijke goedkeuring |

De referentie bevat geen klantdata. Productiecode, klantbestanden en prijsafspraken horen in een afgeschermde omgeving. Een onbekende technische waarde wordt niet stilzwijgend een standaard of een groen oordeel.

## Documenten

| Nr | Document | Inhoud |
|---|---|---|
| 01 | [Werkwijze](01-werkwijze.md) | Scope, intake, rapportage en doorgaancriteria |
| 02 | [Data](02-data.md) | Tijdas, sjablonen, eenheden, bronstatus en kwaliteitscontrole |
| 03 | [Model](03-model.md) | Fysieke voertuigen/cohorten, kasstromen en gecorrigeerde restricties |
| 04 | [Bedrijfsvarianten](04-bedrijfsvarianten.md) | Grenzen van de pilot en voorwaarden voor uitbreidingen |
| 05 | [Oplossen](05-oplossen.md) | Geteste referentie, implementatiecontract en validatie |
| 06 | [Parameters](06-parameters.md) | Bevestigde waarden, schattingen en geldigheidsdata |
| 07 | [Rekenvoorbeeld](07-rekenvoorbeeld.md) | Basis, gevoeligheden en wat het voorbeeld niet bewijst |
| 08 | [Correcties en acceptatie](08-correcties-en-acceptatie.md) | Traceerbare dekking van de review en verplichte pilotpoorten |
| 09 | [Uitvoerbaar notebook](09-notebook.md) | Installeren, gezamenlijke rekenkern, invoercontract, uitvoer en grenzen |

## Reproduceren

**Volledige gezamenlijke optimalisatie:** Python 3.12+, in een eigen omgeving. Open daarna het notebook en kies Run All. Het bevat alle code en heeft geen API-sleutel nodig.

```sh
python -m pip install -r docs/vlootanalyse/requirements-notebook.txt
python -m jupyterlab docs/vlootanalyse/vlootanalyse.ipynb
```

**Alle Python-tests** na installatie van die omgeving:

```sh
python -m unittest discover -s docs/vlootanalyse -p 'test_*.py' -v
```

**Oorspronkelijke beperkte laadreferentie:** Python 3.11+, in een eigen omgeving. Selecteer alleen deze tests als je uitsluitend de oude requirements installeert:

```sh
python -m pip install -r docs/vlootanalyse/requirements.txt
python -m unittest discover -s docs/vlootanalyse -p 'test_referentie.py' -v
python docs/vlootanalyse/rekenvoorbeeld.py
```

De tests bevatten kleine tegenvoorbeelden voor reserveafronding, koop versus lease, verkoop op tijdstip nul, recuperatie, extreme dagen, te korte laadstops, datagaten, zomer-/wintertijd en opeenvolgende dagen. De referentie controleert de gevonden laadoplossing onafhankelijk op energie, vermogen en begin/eindlading.

## Eerste klanttraject

1. Bevestig scope, bevoegdheid voor de data en beschikbare reserve/charterdekking.
2. Verzamel originele bestanden, eenheden, tijdzone, voertuigspecificaties en laad-/netcontracten.
3. Lever een kwaliteitsrapport; onvoldoende data leiden tot een beperkte uitkomst of aanvullende meting.
4. Reken een beperkt aantal plannen door en speel die chronologisch terug op de beschikbare historie.
5. Controleer uitzonderingen, subsidie zonder toekenning, geen ERE en uitval van een kritieke lader.
6. Vergelijk een passende praktijkdienst met een demonstratiewagen en laat een tweede beoordelaar tekenen.

De doorlooptijd wordt in pilots gemeten. Representatieve dagen versnellen screening; zij vervangen de chronologische eindcontrole niet. Een solvergap van 1% is geen nauwkeurigheidsbelofte over de werkelijkheid.
