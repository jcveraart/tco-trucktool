# 02 · Data: wat we vragen en hoe we het klaarmaken

Stand 27 oktober 2026. De eerste scope is beschreven in [01](01-werkwijze.md). Een databestand is geen bewijs dat alle vereiste eigenschappen bevestigd zijn. Het model is zo goed als de data. Dit document zegt welke data we van een klant vragen, in welk formaat, hoe we die aanvullen uit open bronnen, hoe we opschonen, en hoe we van ruwe ritten naar de diensten en representatieve dagen komen die het [model](03-model.md) gebruikt.

---

## 1. Drie lagen data

| Laag | Data | Bron bij de klant | Waarvoor | Zonder deze data |
| --- | --- | --- | --- | --- |
| 1. Altijd | Voertuiglijst | Wagenparkbeheer, Excel | Wie, wat, hoe oud, welk contract | Geen analyse |
| 1. Altijd | Tankpasdata, 12 maanden | Export van de tankpas | Werkelijk verbruik en kilometers | Verbruik uit catalogus, grote marge |
| 1. Altijd | Depot en aansluiting | Energierekening, netbeheerder | Laadplan, netbehoefte | Alleen per voertuig rekenen |
| 2. Veel beter | Ritten en stops, 3 tot 12 maanden | Telematica of planningssysteem | Diensten, stilstand op depot, laadkansen | Alleen kostenoriëntatie; geen onderbouwde dagelijkse ritgeschiktheid |
| 2. Veel beter | Kwartierverbruik depot | Meetbedrijf (grootverbruik), slimme meter (kleinverbruik) | Ruimte op de aansluiting per kwartier | Standaardprofiel |
| 3. Grote vloot | Voertuigdata via rFMS (de standaard van de truckmerken) | Portalen van DAF, Scania, Volvo, Mercedes-Benz, MAN | Beschikbare voertuigsignalen; volledigheid, meetgrens en hardware per veld controleren | Regressie op ritdata |

Met alleen laag 1 maken we een quickscan. Voor een vlootplan is laag 2 nodig.

---

## 2. Sjablonen

We sturen de klant een Excel-bestand met een tabblad per sjabloon, plus een korte uitleg per tankpas en telematicasysteem. Verplichte velden zijn **vet**. Kentekens vervangen we na ontvangst door een code; chauffeursnamen vragen we niet.

### 2.1 `voertuigen`

| Veld | Type | Voorbeeld | Toelichting |
| --- | --- | --- | --- |
| **voertuig_code** | tekst | `BW-07` | Eigen code van de klant of door ons gegeven. |
| kenteken | tekst | `12-ABC-3` | Voor RDW-aanvulling; daarna vervangen door de code. |
| **soort** | keuze | `bakwagen` | `trekker`, `bakwagen`, `bestel`, `bus` (zelfde indeling als de calculator). |
| **depot** | tekst | `tilburg` | Waar het voertuig 's nachts staat. |
| **eigendom** | keuze | `lease` | `koop`, `lease`, `financial_lease`, `huur`. |
| lease_einde | datum | `2028-03-31` | Verplicht bij lease. |
| leaseprijs_maand | getal | `1450` | Excl. btw. |
| lease_km_per_jaar | getal | `60000` | Contractkilometers. |
| boete_vroeg_stoppen | tekst | `3 maanden` | Wat het contract zegt. |
| km_stand | getal | `412300` | Met datum. |
| km_stand_datum | datum | `2026-10-01` | |
| bijzonderheden | lijst | `koeling;laadklep` | `koeling`, `vries`, `laadklep`, `kraan`, `kipper`, `adr`, `pto`, `oplegger_zwaar`. |
| max_lading_kg | getal | `9000` | Zwaarste gebruikelijke lading. |
| planning_groep | tekst | `koel_noord` | Voertuigen waartussen diensten te wisselen zijn. |
| thuis_mee | ja/nee | `nee` | Neemt de chauffeur het voertuig mee naar huis? |
| thuis_oprit | ja/nee | | Alleen als thuis_mee ja is. |

### 2.2 `tankpas`

| Veld | Type | Voorbeeld |
| --- | --- | --- |
| **datum_tijd** | datum en tijd | `2026-03-04 06:12` |
| **voertuig_code of kenteken** | tekst | `BW-07` |
| **product** | keuze | `diesel`, `adblue`, `hvo`, `stroom`, `overig` |
| **hoeveelheid** | getal | `212,4` |
| **eenheid** | keuze | `l`, `kWh` |
| bedrag_excl_btw | getal | `431,17` |
| km_stand | getal | `398812` |
| plaats | tekst | `Tilburg` |
| land | tekst | `NL` |

De meeste tankpasportalen hebben een transactie-export naar Excel of CSV per periode. Vraag bij voorkeur 12 maanden en leg ontbrekende perioden vast; een kortere periode rechtvaardigt geen uitspraak over niet-gemeten seizoenen.

### 2.3 `ritten` (uit telematica of planning)

| Veld | Type | Voorbeeld | Toelichting |
| --- | --- | --- | --- |
| **voertuig_code** | tekst | `BW-07` | |
| **vertrek** | datum en tijd | `2026-03-04 05:58` | |
| **aankomst** | datum en tijd | `2026-03-04 07:41` | |
| **van_locatie** | tekst of code | `depot_tilburg` | Adres of afgeronde coördinaten (3 decimalen is ongeveer 100 m, genoeg). |
| **naar_locatie** | tekst of code | `klant_42` | |
| **km** | getal | `96,3` | |
| brandstof_l | getal | `27,1` | Als het systeem dat meet. |
| lading_kg | getal | `7200` | Uit planning of weegsysteem, als beschikbaar. |
| gem_snelheid | getal | `61` | km/u. |

### 2.4 `stops`

| Veld | Type | Voorbeeld | Toelichting |
| --- | --- | --- | --- |
| **voertuig_code** | tekst | `BW-07` | |
| **aankomst** | datum en tijd | `2026-03-04 07:41` | |
| **vertrek** | datum en tijd | `2026-03-04 08:30` | |
| **locatie** | tekst of code | `klant_42` | |
| soort | keuze | `klant` | `klant`, `pauze`, `depot`, `tanken`, `overig`. |
| laadpaal | keuze | `onbekend` | `ja` (met kW), `nee`, `onbekend`. |

Telematicasystemen hebben vrijwel allemaal een ritrapport (rittenoverzicht) met per rit vertrek, aankomst, adres en kilometers, en een stoprapport. Een export per voertuig per maand kan als bron dienen; controleer tijdzone, volledigheid en de definitie van rit en stop voordat de gegevens geschikt worden verklaard. Ruwe GPS-punten vragen we niet.

### 2.5 `depots`

| Veld | Voorbeeld | Toelichting |
| --- | --- | --- |
| **depot** | `tilburg` | |
| **adres** | | Voor netcongestie en zon. |
| **netbeheerder** | `Enexis` | |
| ean | | Voor het opvragen van meetdata (met toestemming). |
| **aansluitwaarde** | `3x80A` of `250 kVA` | |
| gecontracteerd_kw | `150` | Alleen grootverbruik. |
| **jaarverbruik_kwh** | `85000` | Van de energierekening. |
| energiecontract | `vast 0,21` of `dynamisch` | |
| zon_kwp | `0` | Bestaande panelen. |
| eigen_terrein | `ja` | Of huur. |
| ruimte_laadpunten | `10` | Plekken waar een laadpunt kan. |
| aanvraag_netbeheerder | `aangevraagd 2026-05, verwacht 2029` | Wat de netbeheerder heeft gezegd. |

### 2.6 `verbruik_kwartier` (per depot)

Tijdstip en kWh per kwartier, minstens 12 maanden. Bij grootverbruik levert het meetbedrijf dit; bij kleinverbruik de leverancier of de slimme meter. Zonder deze data gebruiken we een standaardprofiel (§8).

### 2.7 `locaties_met_laadpaal`

Klanten, eigen vestigingen en vaste pauzeplekken waar geladen kan worden: locatie, vermogen (kW), AC of DC, prijs of afspraak, openingstijden.

---

## 3. Aanvullen uit open bronnen

| Bron | Wat we halen | Gebruik |
| --- | --- | --- |
| RDW open data (kenteken) | Merk, handelsbenaming, datum eerste toelating, leeggewicht, toegestane maximummassa, brandstof, emissieklasse | Soort en klasse (N1, N2, N3), leeftijd, laadvermogen, zero-emissiezoneregels |
| KNMI daggegevens | Gemiddelde en minimale temperatuur per dag (dichtstbijzijnde station) | Wintertoeslag op verbruik, keuze representatieve dagen |
| Day-ahead-stroomprijzen (bijvoorbeeld via het ENTSO-E-transparantieplatform) | Intervalprijzen (tegenwoordig ook kwartieren) | Prijsprofiel bij een dynamisch contract |
| Openbare laadpuntregisters en de sites van truckladernetwerken | Locatie, vermogen, geschiktheid voor vrachtwagens | Laadkansen onderweg |
| Capaciteitskaart van de netbeheerders | Indicatie van congestie | Alleen scenario; geen individuele wachttijd of transportrecht |
| Zero-emissiezones (dezelfde gegevens als de [kaart in de overstapgids](https://stekkerofdiesel.nl/overstapgids/zero-emissiezones/)) | Zonegrenzen en ingangsdata | Welke diensten een zone in rijden |
| Hoogtedata | Helling per ritsegment | Alleen bij heuvelachtige routes (buitenland) |
| Modellencatalogus van de site (`data/vehicles_catalog.json`, Supabase) | Accu, bereik, laadvermogen, prijs | Kandidaattypen $`\mathcal{K}`$ |

---

## 4. Opschonen

### 4.1 Tankpas

1. Sorteer per voertuig op tijd.
2. Kilometerstanden moeten reconcilieerbaar zijn. Markeer sprongen en teruglopende standen. Een groot verschil kan door een lang interval of een ontbrekende tankbeurt komen; verwijder niets automatisch op een vaste kilometergrens.
3. Liters tussen volle tankbeurten zijn alleen bruikbaar als vol-tank-status betrouwbaar is. Leg opening/eindvoorraad, gedeeltelijk tanken en hulpverbruik vast of gebruik een langere gereconcilieerde periode met onzekerheidsband. Het huidige transactiesjabloon bewijst geen volle tank.
4. Meerdere voertuigen op één pas: eerst toewijzing onderzoeken. Een verdeling naar kilometers is een expliciete schatting, geen gemeten kalibratie.
5. AdBlue: meestal 3 tot 6% van het dieselverbruik. Ver daarbuiten: controleren.
6. Plausibiliteit per soort (zie [06 · Parameters](06-parameters.md#voertuigen-per-soort)): een bakwagen op 8 l/100 km of 60 l/100 km is fout of bijzonder.

### 4.2 Ritten en stops

1. Markeer korte ritten en terreinverplaatsingen; verwijder ze niet automatisch. PTO, koeling en omzetten kunnen bedrijfsmatig relevant zijn.
2. Gaten in de tijd (voertuig vertrekt ergens anders dan waar het aankwam): markeren; vaak een gemiste rit door storing.
3. Vergelijk met een plausibele route voor de voertuigklasse. Rechte afstand × 1,3 is hoogstens een signaal; rondritten, zones en truckbeperkingen kunnen veel afwijken.
4. Totale kilometers per voertuig per maand vergelijken met de tankpas; meer dan 10% verschil uitzoeken.

---

## 5. Van ritten naar diensten

1. Normaliseer tijdstippen naar UTC met bewaarde lokale bedrijfstijd en oorspronkelijke offset. Een lokale dag kan 92, 96 of 100 kwartieren bevatten.
2. Gebruik unieke voertuig-/contract-ID's, bronbestand en exportversie. Leg begin-/eindlocatie en SoC vast waar beschikbaar.
3. Bouw diensten uit de echte ritten en stops; behoud meerdaagse ketens en externe overnachtingen. Een dagovergang reset geen accu of voertuiglocatie.
4. Stel planningsgroepen en vaste plekken met de klant vast. Een gebiedscirkel kan depotstops helpen herkennen, maar bevestig de ligging en toegang.
5. Splits intervallen op werkelijke aankomst-/vertrekgrenzen. Een fractie kwartier kan geen overlappende stekkerbezetting legitimeren.
6. Maak laadacties uitsluitend uit bevestigde stilstand en geschikte locaties. Neem aansluiten, trucktoegang en omrijden mee; een ontbrekende pauze wordt geen automatisch ingevoegde laadstop.
7. Extra wachttijd vraagt een herberekende hele dienst met latere tijdvensters. De referentie ondersteunt alleen vaste vensters.
8. Route-/zone-/tolinformatie vraagt routegegevens of bevestigde routeklassen; alleen vertrek- en eindpunt bewijzen niet welke wegen zijn gereden.

Alleen tankpasdata geven geen vertrek, terugkomst of dagspreiding. Zij ondersteunen kostenoriëntatie, geen groen haalbaarheidsoordeel uit een fictieve langste-dagfactor.

## 6. Representatieve dagen

Kies hele echte depotdagen, inclusief gelijktijdigheid van diensten en gebouwbelasting. Clustering is een screeningsmethode, geen validatie. Vergelijk jaarenergie, piek, beschikbaarheidsvensters en kritieke dienstdekking; voeg drukke koude dagen, late terugkomst, korte nachten en laderuitval toe.

Bewaar extreme dagen ook als hun kostenweging nul is. Externe dekking daarop moet expliciet toegestaan, beschikbaar en geprijsd zijn. Een nulgewicht maakt een niet-passende dienst niet gratis of robuust.

Speel het gekozen plan daarna chronologisch terug op **alle beschikbare opeenvolgende dagen**, met dezelfde fysieke voertuigen en begin/eind-SoC. Gebruik waar mogelijk een andere periode dan de kalibratie en voeg ontbrekende seizoenen als scenario of meetvraag toe.

## 7. Energiemodel kalibreren

Begin bij bevestigde gegevens van dezelfde uitvoering en vergelijkbare inzet. Diesel-naar-elektrisch is een expliciete startschatting; aandrijfverliezen, stilstand, PTO en koeling zijn niet met één vaste factor te scheiden.

Kalibreer temperatuur, belading en snelheid tegen passende EV-data of een praktijkproef. Vermijd een tweede wintertoeslag als de startwaarde die al bevat. Fabrieksbereik gedeeld door accucapaciteit is geen praktijkmeting.

Hulpverbruik volgt actieve uren tijdens rijden én stops: koeluren, PTO-werkuren, HVAC en voorconditioneren afzonderlijk. De fysische recuperatie gebruikt positieve arbeid en terugwinning apart; zie [03 §5](03-model.md#5-laag-1-voorbewerking-per-dienst-en-voertuigsoort).

Bewaar twee reeksen: verwacht verbruik voor kosten en expliciet ontwerp-/stressverbruik voor haalbaarheid. Rapporteer hun aannames en foutband. Een marge van 10% is een aanname, geen bewezen zekerheid.

## 8. Gebouwprofiel en prijsprofiel

Meterdata bevatten expliciet begin/eind, eenheid, richting en meetgrens. Kwartier-kWh × 4 is gemiddeld kW bij exact 15 minuten; gebruik bij andere intervallen de echte duur. Controleer bestaande EV-laders, zonnepanelen en teruglevering om dubbeltelling te voorkomen.

Een standaardgebouwprofiel is alleen screening en geen bewijs dat een aansluiting een vloot draagt. Gebruik voor een definitieve depottoets echte intervalmetingen én het transportcontract. Een 3×80A-aansluiting vraagt ook fase-/installatiecontrole; de laadpalen krijgen niet automatisch alle circa 55 kW.

Prijs-, gebouw- en ritprofielen gebruiken dezelfde UTC-tijdas, ook bij kwartierprijzen en zomer-/wintertijd. Bij een dynamisch contract gelden opslag en belasting volgens dat contract; voeg ze niet nogmaals toe aan een all-in prijs. Toekomstprijzen zijn scenario's met een passende reële of nominale rente.

### Verplichte metadata en uitvoeringsgegevens

Bewaar per veld waarde, eenheid, status (`bevestigd`, `schatting`, `onbekend`), bron, controledatum en geldigheidsperiode. Voeg toe: chassis/opties/opbouwprijs, echte bruikbare accu, AC/DC-acceptatie, connector, payload/aslasten, contractdekking en reserve/charter.

De openbare catalogus is een oriëntatiebron. Op 27 oktober bevat de geaudite JSON 67 modellen, 24 expliciete bruikbare accu's, 7 expliciete verbruiken, 32 numerieke prijzen en geen gestructureerd AC-veld. Dit zegt niets over eventueel aanvullende live databasevelden. Vul ontbrekende waarden niet gunstig in; vraag een uitvoering/offerte of beperk de conclusie.

De referentie `normaliseer_meter` weigert ontbrekende tijdzone, overlap en onbekende eenheden; gaten komen zichtbaar in het kwaliteitsrapport. Een echte importketen moet daarnaast voertuigen, brandstofvoorraad, locaties en contracten reconcilieren.

---

## 9. Kwaliteitsrapport per klant

Na het opschonen een kort intern overzicht:

| Onderdeel | Waarde |
| --- | --- |
| Periode | van en tot, aantal dagen |
| Voertuigen | in lijst, in data, ontbrekend (met reden) |
| Ritten | aantal, verwijderd (met reden) |
| Diensten | aantal, met externe overnachting |
| Tankpas | dekking in % van de kilometers |
| Kwartierdata | ja of standaardprofiel |
| Representatieve dagen | $`k`$, fout in jaarverbruik en jaarpiek |
| Aannames | lijst, bronstatus, goedkeuring en effect op advies |

De aannames gaan mee naar de bijlage van het rapport.

## 10. Beslispoort voor data

Geen ritdata: alleen kostenbandbreedte. Geen bevestigde uitvoering: geschiktheid niet aangetoond. Geen echte meterdata of transportcontract: geen definitief depotbewijs. Geen passende EV-meting: verbruik blijft een gekalibreerde/geschatte band met praktijkcontrole als voorwaarde.

Bronnen: [Webfleet-rapportage](https://www.webfleet.com/en_gb/webfleet/products/webfleet/reporting/), [ENTSO-E marktresolutie](https://www.entsoe.eu/network_codes/cacm/implementation/sdac/), [betekenis capaciteitskaart](https://capaciteitskaart.netbeheernederland.nl/info/faq/).

