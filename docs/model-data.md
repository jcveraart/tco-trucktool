# Modelgegevens en presets

Uitbreiding en broncontrole: 21 oktober 2026. De catalogus telt 67 modellen: 31 bestelbussen, 14 bakwagens, 11 trekkers en 11 bussen. De website blijft zelfstandig werken vanuit `index.html`; dit document is alleen onderhoudsinformatie.

## Selectie van gegevens

- Gebruik voor nieuwe records fabrikantensites, technische bladen of officiële prijslijsten. Bewaar de bron bij het model, inclusief de gekozen uitvoering en meetomstandigheden in `n`.
- Combineer geen accugrootte van de ene uitvoering met actieradius, verbruik of prijs van een andere uitvoering. De hoogste commerciële actieradius kan horen bij een andere carrosserie, snelheidsbegrenzing of gewichtsklasse.
- `g` betekent bruto/geïnstalleerd, `u` expliciet bruikbaar en `a` door de fabrikant opgegeven zonder duidelijk bruto/netto-onderscheid. `ue` is afgeleid; `derived` beschrijft die afleiding. Maak onbekende capaciteit niet stilzwijgend bruto of netto.
- `gt`, `ut` en `at` bewaren een gepubliceerde bandbreedte of ondergrens voor het bijbehorende accutype. `r` blijft de numerieke referentiewaarde voor sortering, `rt` de zichtbare kwalificatie en `rc` de testcyclus. Een SORT-cijfer voor een stadsbus is geen WLTP-cijfer voor een bestelwagen.
- `st:komt` met `y` is een verwachting, ook als een kalenderjaar bijna voorbij is. Zet beschikbaarheid pas om na een broncontrole. Een model in het huidige aanbod garandeert geen individuele levertijd.
- `fam` (`model_family`) en `vl` (`variant_label`) groeperen uitvoeringen van hetzelfde model, zoals accuopties of generaties. Elke uitvoering blijft een eigen record met eigen accu, bereik en prijs; de modellenpagina toont ze als één rij met een keuze per uitvoering.
- `checked` geeft aan welke records bij deze uitbreiding zijn gecontroleerd. Ongewijzigde oudere records zijn daardoor niet automatisch opnieuw geverifieerd.

## Gebruik in de rekentool

De modelkeuze in de stap Aanschaf en beide knoppen om met een model te rekenen gebruiken dezelfde functie. De categorie wordt gekozen en accu en elektrisch verbruik worden ingevuld. Gebruik wordt binnen dezelfde voertuigsoort behouden; een andere voertuigsoort laadt de bijbehorende scenario-voorbeelden.

Bruikbare accu heeft voorrang op afgeleide capaciteit. Bij alleen bruto of onbekend accutype is 90% van de opgegeven capaciteit een **expliciete schatting**, afgerond op hele kWh. Bij een bekende bruikbare capaciteit blijven decimalen behouden.

Officieel verbruik voor de gekozen uitvoering heeft voorrang. Anders is het startverbruik `bruikbare accu / opgegeven bereik × 100`, afgerond op één decimaal. Dat is een indicatieve afleiding uit de fabrieksactieradius en bevat geen laadverlies. Het is geen gemeten praktijkverbruik. De calculator blijft bewerkbaar; eigen belading, snelheden, wintergebruik en laadverliezen vragen eigen invoer.

Een modelprijs wordt alleen ingevuld als die voor dezelfde uitvoering is onderbouwd, exclusief btw. Anders verschijnt het categorievoorbeeld met het label **Voorbeeldbedrag**. Dit geldt ook voor dieselreferentie en overige kosten: een elektrische modelkeuze levert daarvoor geen fabrieksgegevens. Modelwaarden herstellen bewaart een eigen aanschafprijs wanneer geen modelprijs beschikbaar is.

`gvw` en `vc` maken bekende lichte bakwagens herkenbaar. De FUSO van 8,55 ton start bijvoorbeeld als N2 zonder AanZET-voorbeeld. De bezoeker moet zijn kenteken, regeling en eigen inzet blijven controleren.

## Belangrijke configuratiekeuzes

- **Fiat E-Ducato:** N1 L3H2 van 3,5 ton, 110,6 kWh geïnstalleerd / 97,8 kWh bruikbaar, 378 km, 29,4 kWh/100 km en € 53.700 excl. btw volgens de Nederlandse prijslijst van 1 september 2026. De 424 km hoort bij 4,25 ton en is hier niet gebruikt.
- **Ford E-Transit:** N1 350 L3H2 89 kWh, 341 km en 26,1 kWh/100 km uit de officiële Europese prijslijst. De 402 km van de zwaardere, tot 90 km/u begrensde uitvoering is niet als N1-preset gebruikt.
- **Mercedes-Benz eSprinter:** een Nederlandse N1 L2-referentie met 81 kWh / 268 km. De vroegere 113 kWh-referentie is vervangen om hogere toegestane massa niet met N1 te verwarren. Capaciteit en klasse zijn ook vergeleken met het officiële Mercedes-Benz aanbod.
- **Renault Master:** 87 kWh / maximaal 410 km als N1-referentie. De geadverteerde 460 km is gekoppeld aan een 4-tonuitvoering en is daarom niet als N1-startwaarde gebruikt.
- **Scania R-serie:** 560 kWh bruikbaar en 515 km bij 42 ton. De afzonderlijke 720 km-configuratie heeft extra batterijen achter de cabine en wordt niet aan hetzelfde pakket gekoppeld.
- **MAN eTGX:** huidige generatie en aangekondigde 2027-generatie zijn aparte records. De 660 km-versie wordt niet als nu leverbaar gepresenteerd; de fabrikant plant verkoop vanaf april 2027 en productie in de zomer.
- **Solaris:** de fabrikant noemt meer dan 600 respectievelijk 800 kWh. De groter-dan-tekens en SORT-cycli blijven zichtbaar. De calculator gebruikt een expliciete schatting vanaf die numerieke referentie.
- **Niet toegevoegd:** Nissan Interstar-e is hier nog niet toegevoegd omdat de gebruikte Nederlandse bron N1/N2-bereik bundelt. IVECO E-WAY 416 kWh is uitgesteld omdat de gevonden 400 km-opgave voor een generatie gold en niet eenduidig voor die configuratie.

## Controle

`node --test tests/catalog.test.cjs` controleert syntax, dekking, unieke identifiers, datavelden, presetgrenzen, decimalen en bekende verwarringen tussen accutypen/configuraties. Daarnaast zijn alle 67 modelkeuzes in de browser doorlopen. Zoeken zonder accenten, lege resultaten, alle sorteervolgordes, aangekondigde modellen, drie modellen vergelijken, starten vanuit vergelijking, eigen invoer, herladen, delen, herstellen en wisselen van voertuigsoort zijn interactief gecontroleerd.

## Bronnen per model

De bronlink opent ook vanuit het tabblad Modellen en de modelbasis in de calculator. “Bestaand” hieronder betekent dat bij deze uitbreiding geen nieuwe controledatum is toegekend.

| Soort | Model | Bron | Controle |
| --- | --- | --- | --- |
| Trekker | Mercedes-Benz eActros 600 | [Mercedes-Benz Trucks](https://www.mercedes-benz-trucks.com/content/dam/brandhub/markets/gb/files/product-sheets/eActros-600-product-sheet.pdf.coredownload.pdf) | 2026-10-21 |
| Trekker | Tesla Semi (Europa) | [Tesla](https://www.tesla.com/en_GB/semi) | 2026-10-21 |
| Trekker | Volvo FH Aero Electric | [electrive](https://www.electrive.com/2026/04/14/volvo-trucks-increases-range-of-flagship-e-truck-to-700-km/) | Bestaand |
| Trekker | DAF XF Electric | [electrive](https://www.electrive.com/2025/09/22/daf-begins-series-production-of-xd-and-xf-electric-electric-trucks) | Bestaand |
| Trekker | MAN eTGX (nieuwe generatie 2027) | [MAN Truck & Bus](https://www.man.eu/global/en/truck/all-models/the-man-tgx/the-man-etgx/the-new-man-etgx.html) | 2026-10-21 |
| Trekker | Scania R-serie elektrisch | [Scania](https://www.scania.com/group/en/home/products-and-services/trucks/battery-electric-truck.html) | 2026-10-21 |
| Trekker | Renault Trucks E-Tech T 780 | [Renault Trucks](https://www.renault-trucks.com/en/newsroom/press-releases/long-haul-operations-now-within-reach-renault-trucks-electric-tractors) | 2026-10-21 |
| Trekker | Iveco S-eWay | [IVECO](https://www.iveco.com/estonia/-/media/IVECOdotcom/Content/Products/S-eWay_2026/Brochure/IVECO-S-eWay_EN.pdf?rev=-1) | 2026-10-21 |
| Bakwagen | Mercedes-Benz eActros 300/400 | [Mercedes-Benz Trucks](https://www.mercedes-benz-trucks.com/en_GB/emobility/world/your-benefits/usability.html) | Bestaand |
| Bakwagen | DAF XD Electric | [DAF](https://dealers.daf.com/-/media/files/document-library/infosheets/electric/daf-xd-electric-infosheet-xde-en-556205.pdf) | Bestaand |
| Bakwagen | DAF XB Electric | [DAF](https://www.daf.co.uk/-/media/files/document-library/infosheets/electric/daf-xb-electric-infosheet-xbe-en-556205.pdf) | Bestaand |
| Bakwagen | Volvo FM Electric | [Volvo Trucks Nederland](https://www.volvotrucks.nl/nl-nl/trucks/electric/volvo-fm-electric.html) | 2026-10-21 |
| Bakwagen | MAN eTGL | [electrive](https://www.electrive.com/2024/09/04/man-adds-12-tonne-model-to-its-electric-truck-portfolio) | Bestaand |
| Bakwagen | Renault Trucks E-Tech D 16 t | [Renault Trucks](https://www.renault-trucks.de/sites/default/files/2024-09/Renault%20Trucks%20E-TECH%20D16%20MED%20P4x2_0.pdf) | Bestaand |
| Bestelbus | Mercedes-Benz eSprinter | [Mercedes-Benz Nederland](https://certified.vans.mercedes-benz.nl/mercedes-benz/esprinter/esprinter-320-bestelwagen-l2/occ21613999) | 2026-10-21 |
| Bestelbus | Ford E-Transit | [Ford Europa (Finland)](https://www.ford.fi/content/dam/guxeu/fi/documents/pricelists/cv/transit-van/PL-ford-e-transit.pdf) | 2026-10-21 |
| Bestelbus | Renault Master E-Tech | [Renault](https://www.renault.is/cars/master-e-tech-rafmagn/master.html) | 2026-10-21 |
| Bestelbus | Fiat E-Ducato | [Fiat Professional Nederland](https://www.fiat.nl/professional/modellen/e-ducato/prijslijst) | 2026-10-21 |
| Bus | Mercedes-Benz eCitaro | [Mercedes-Benz Bus](https://www.mercedes-benz-bus.com/en_DE/models/ecitaro.html) | Bestaand |
| Bus | Mercedes-Benz eCitaro G | [Mercedes-Benz Bus](https://www.mercedes-benz-bus.com/en_DE/models/ecitaro.html) | Bestaand |
| Bus | VDL Citea LE-122 | [electrive](https://www.electrive.net/2025/03/21/transdev-bestellt-42-elektrobusse-bei-vdl/) | Bestaand |
| Bus | Yutong T12E touringcar | [electrive](https://www.electrive.com/2026/02/26/three-battery-electric-yutong-coaches-deployed-in-austria/) | Bestaand |
| Bestelbus | Citroën ë-Berlingo Van | [Citroën Nederland](https://www.citroen.nl/modellen/bedrijfswagens/e-berlingo-van.html) | 2026-10-21 |
| Bestelbus | Citroën ë-Jumpy Comfort Range | [Citroën Nederland](https://www.citroen.nl/modellen/bedrijfswagens/e-jumpy.html) | 2026-10-21 |
| Bestelbus | Peugeot E-Partner | [Peugeot Nederland](https://www.peugeot.nl/showroom/peugeot-partner/elektrisch.html) | 2026-10-21 |
| Bestelbus | Peugeot E-Expert 75 kWh | [Peugeot Nederland](https://www.peugeot.nl/showroom/peugeot-expert/faq.html) | 2026-10-21 |
| Bestelbus | Opel Combo Cargo Electric | [Opel Nederland](https://www.opel.nl/bedrijfswagens/combo-modellen/nieuwe-combo-electric/overzicht.html) | 2026-10-21 |
| Bestelbus | Opel Vivaro Electric 75 kWh | [Opel Nederland](https://www.opel.nl/elektrisch-rijden/elektrische-bedrijfswagens.html) | 2026-10-21 |
| Bestelbus | Fiat E-Doblò | [Fiat Professional Nederland](https://www.fiat.nl/professional/modellen/e-doblo) | 2026-10-21 |
| Bestelbus | Fiat E-Scudo 75 kWh | [Fiat Professional Nederland](https://www.fiat.nl/professional/modellen/e-scudo/features) | 2026-10-21 |
| Bestelbus | Toyota Proace City Electric | [Toyota Nederland](https://www.toyota.nl/modellen/proace-city) | 2026-10-21 |
| Bestelbus | Toyota Proace Electric 75 kWh | [Toyota Nederland](https://www.toyota.nl/modellen/proace) | 2026-10-21 |
| Bestelbus | Renault Kangoo Van E-Tech electric | [Renault Nederland](https://bedrijfswagens.renault.nl/modellen/kangoo-e-tech-electric.html?bodyTypeCode=PT1261_kastenwagen) | 2026-10-21 |
| Bestelbus | Nissan Townstar EV Van | [Nissan Nederland](https://www.nissan.nl/voertuigen/nieuw/townstar/motor.html) | 2026-10-21 |
| Bestelbus | Mercedes-Benz eCitan | [Mercedes-Benz Nederland](https://www.mercedes-benz.nl/vans/models/ecitan/panel-van/overview.html) | 2026-10-21 |
| Bestelbus | Ford E-Transit Custom | [Ford Nederland](https://fordmediacenter.nl/meer-kilometers-minder-wachttijd-ford-e-transit-custom-geeft-jouw-werkdag-een-upgrade/) | 2026-10-21 |
| Bestelbus | Ford E-Transit Courier | [Ford Nederland](https://fordmediacenter.nl/ford-e-transit-courier-krijgt-grotere-batterij-meer-actieradius-verbeterde-connectiviteit-en-inzetbaarheid/) | 2026-10-21 |
| Bestelbus | Volkswagen ID. Buzz Cargo | [Volkswagen Bedrijfswagens](https://www.vwbedrijfswagens.nl/nl/modellen/id-buzz-cargo.html) | 2026-10-21 |
| Bestelbus | Volkswagen e-Transporter | [Volkswagen Bedrijfswagens](https://www.vwbedrijfswagens.nl/nl/modellen/e-transporter.html) | 2026-10-21 |
| Bestelbus | Renault Trafic Van E-Tech (nieuwe generatie) | [Renault Nederland](https://bedrijfswagens.renault.nl/trafic-van/trafic-e-tech-electric.html) | 2026-10-21 |
| Bestelbus | Opel Movano Electric | [Opel Nederland](https://www.opel.nl/bedrijfswagens/movano-modellen/nieuwe-movano-electric/overzicht.html) | 2026-10-21 |
| Bestelbus | Peugeot E-Boxer | [Peugeot Nederland](https://www.peugeot.nl/content/dam/peugeot/netherlands/b2c/brochures/model/boxer/11032026-Prijzen-en-specificaties-Peugeot-E-Boxer.pdf) | 2026-10-21 |
| Bestelbus | Citroën ë-Jumper | [Citroën Nederland](https://www.citroen.nl/modellen/bedrijfswagens/e-jumper.html) | 2026-10-21 |
| Bestelbus | Toyota Proace Max Electric | [Toyota Nederland](https://www.toyota.nl/modellen/proace-max) | 2026-10-21 |
| Bestelbus | IVECO eDaily | [IVECO Nederland](https://info.iveco.nl/hubfs/Brochure%20IVECO%20eDaily.pdf?hsLang=nl-nl) | 2026-10-21 |
| Bestelbus | Maxus eDeliver 3 | [Maxus Nederland](https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-3-v3.pdf) | 2026-10-21 |
| Bestelbus | Maxus eDeliver 5 | [Maxus Nederland](https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-5-v2.pdf) | 2026-10-21 |
| Bestelbus | Maxus eDeliver 7 | [Maxus Nederland](https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-7-v7.pdf) | 2026-10-21 |
| Bestelbus | Maxus eDeliver 9 | [Maxus Nederland](https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-9-v4.pdf) | 2026-10-21 |
| Bakwagen | Volvo FL Electric | [Volvo Trucks](https://www.volvotrucks.com/en-en/trucks/electric/volvo-fl-electric.html) | 2026-10-21 |
| Bakwagen | Volvo FE Electric | [Volvo Trucks](https://www.volvotrucks.com/en-en/trucks/electric/volvo-fe-electric.html) | 2026-10-21 |
| Bakwagen | Volvo FM Low Entry | [Volvo Trucks](https://www.volvotrucks.com/en-en/trucks/electric/volvo-fm-low-entry.html) | 2026-10-21 |
| Bakwagen | Volvo FMX Electric | [Volvo Trucks](https://www.volvotrucks.com/en-en/trucks/electric/volvo-fmx-electric.html) | 2026-10-21 |
| Bakwagen | FUSO eCanter 9C18e L | [FUSO technische gegevens](https://www.fuso-trucks.com/wp-content/uploads/sites/2/2024/05/eCanter_Technical-Datasheets_2024_EN_855T.pdf) | 2026-10-21 |
| Bakwagen | MAN eTGM (4 accupakketten) | [MAN Truck & Bus](https://www.man.eu/uk/en/truck/all-models/the-man-tgm-and-man-tgl/the-man-etgm/overview.html) | 2026-10-21 |
| Bakwagen | MAN eTGS 4×2 chassis | [MAN Truck & Bus](https://www.man.eu/uk/en/truck/all-models/the-man-tgs/the-man-etgs/overview.html) | 2026-10-21 |
| Bakwagen | Renault Trucks E-Tech D Wide 375 | [Renault Trucks](https://www.renault-trucks.at/press-release/renault-trucks-e-tech-d-wide-erste-praxiseinsatze) | 2026-10-21 |
| Bus | Solaris Urbino 12 electric (modulair) | [Solaris Bus & Coach](https://www.solarisbus.com/en/urbino-12-electric-with-modular-drive) | 2026-10-21 |
| Bus | Solaris Urbino 18 electric (modulair) | [Solaris Bus & Coach](https://www.solarisbus.com/en/urbino-18-electric) | 2026-10-21 |
| Bus | MAN Lion’s City 10 E | [MAN brochure Lion’s City E](https://www.man.eu/content/dam/man/countries/doc/bw-master/bus/eventassets-1/Brochure-MAN-Lions-City-E-IT.pdf/_jcr_content/renditions/original./Brochure-MAN-Lions-City-E-IT.pdf) | 2026-10-21 |
| Bus | MAN Lion’s City 12 E | [MAN brochure Lion’s City E](https://www.man.eu/content/dam/man/countries/doc/bw-master/bus/eventassets-1/Brochure-MAN-Lions-City-E-IT.pdf/_jcr_content/renditions/original./Brochure-MAN-Lions-City-E-IT.pdf) | 2026-10-21 |
| Bus | MAN Lion’s City 18 E | [MAN technische gegevens](https://media.man.eu/is/content/MAN/man_lions_city_datenblatt_18-E_ENpdf) | 2026-10-21 |
| Bus | BYD eBus B12.b | [BYD Europe](https://bydeurope.com/byd-ebus-b12) | 2026-10-21 |
| Bus | Karsan e-ATA 12 | [Karsan](https://www.karsan.com/en/electric-bus/e-ata-12) | 2026-10-21 |
| Trekker | MAN eTGX (huidige generatie) | [MAN Truck & Bus](https://www.man.eu/uk/en/truck/all-models/the-man-tgx/the-man-etgx/overview.html) | 2026-10-21 |
| Trekker | Renault Trucks E-Tech T 540 | [Renault Trucks](https://www.renault-trucks.com/en/newsroom/press-releases/long-haul-operations-now-within-reach-renault-trucks-electric-tractors) | 2026-10-21 |
| Trekker | Renault Trucks E-Tech T 585 | [Renault Trucks](https://www.renault-trucks.com/en/newsroom/press-releases/long-haul-operations-now-within-reach-renault-trucks-electric-tractors) | 2026-10-21 |
