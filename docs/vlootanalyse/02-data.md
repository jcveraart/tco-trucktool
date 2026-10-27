# 02 · Data: wat we vragen en hoe we het klaarmaken

Het model is zo goed als de data. Dit document zegt welke data we van een klant vragen, in welk formaat, hoe we die aanvullen uit open bronnen, hoe we opschonen, en hoe we van ruwe ritten naar de diensten en representatieve dagen komen die het [model](03-model.md) gebruikt.

---

## 1. Drie lagen data

| Laag | Data | Bron bij de klant | Waarvoor | Zonder deze data |
| --- | --- | --- | --- | --- |
| 1. Altijd | Voertuiglijst | Wagenparkbeheer, Excel | Wie, wat, hoe oud, welk contract | Geen analyse |
| 1. Altijd | Tankpasdata, 12 maanden | Export van de tankpas | Werkelijk verbruik en kilometers | Verbruik uit catalogus, grote marge |
| 1. Altijd | Depot en aansluiting | Energierekening, netbeheerder | Laadplan, netbehoefte | Alleen per voertuig rekenen |
| 2. Veel beter | Ritten en stops, 3 tot 12 maanden | Telematica of planningssysteem | Diensten, stilstand op depot, laadkansen | Diensten grof benaderd uit tankpas |
| 2. Veel beter | Kwartierverbruik depot | Meetbedrijf (grootverbruik), slimme meter (kleinverbruik) | Ruimte op de aansluiting per kwartier | Standaardprofiel |
| 3. Grote vloot | Voertuigdata via rFMS (de standaard van de truckmerken) | Portalen van DAF, Scania, Volvo, Mercedes-Benz, MAN | Exact verbruik, snelheid, gewicht | Regressie op ritdata |

Met alleen laag 1 maken we een quickscan. Voor een vlootplan is laag 2 nodig.

---

## 2. Sjablonen

We sturen de klant een Excel-bestand met een tabblad per sjabloon, plus een korte uitleg per tankpas en telematicasysteem. Verplichte velden zijn **vet**. Kentekens vervangen we na ontvangst door een code; chauffeursnamen vragen we niet.

### 2.1 `voertuigen`

| Veld | Type | Voorbeeld | Toelichting |
| --- | --- | --- | --- |
| **voertuig_code** | tekst | `BW-07` | Eigen code van de klant of door ons gegeven. |
| **kenteken** | tekst | `12-ABC-3` | Voor RDW-aanvulling; daarna vervangen door de code. |
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

De meeste tankpasportalen hebben een transactie-export naar Excel of CSV per periode. Vraag 12 maanden, zodat winter en zomer erin zitten.

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

Telematicasystemen hebben vrijwel allemaal een ritrapport (rittenoverzicht) met per rit vertrek, aankomst, adres en kilometers, en een stoprapport. Een export per voertuig per maand naar Excel volstaat. Ruwe GPS-punten vragen we niet.

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
| Day-ahead-stroomprijzen (bijvoorbeeld via het ENTSO-E-transparantieplatform) | Uurprijzen | Prijsprofiel bij een dynamisch contract |
| Openbare laadpuntregisters en de sites van truckladernetwerken | Locatie, vermogen, geschiktheid voor vrachtwagens | Laadkansen onderweg |
| Capaciteitskaart van de netbeheerders | Of er een wachtrij is in het gebied | Verwachte $`y^{\min}_{o,\ell}`$, als de klant het nog niet weet |
| Zero-emissiezones (dezelfde gegevens als de [kaart in de overstapgids](https://stekkerofdiesel.nl/overstapgids/zero-emissiezones/)) | Zonegrenzen en ingangsdata | Welke diensten een zone in rijden |
| Hoogtedata | Helling per ritsegment | Alleen bij heuvelachtige routes (buitenland) |
| Modellencatalogus van de site (`data/vehicles_catalog.json`, Supabase) | Accu, bereik, laadvermogen, prijs | Kandidaattypen $`\mathcal{K}`$ |

---

## 4. Opschonen

### 4.1 Tankpas

1. Sorteer per voertuig op tijd.
2. Kilometerstanden moeten oplopen. Een stand die terugloopt of meer dan 3.000 km (vrachtwagen) of 1.500 km (bestelbus) na de vorige ligt, is waarschijnlijk een tikfout: markeer en sla die tankbeurt over in de verbruiksberekening.
3. Verbruik per periode = liters tussen twee volle tankbeurten gedeeld door de kilometers ertussen. Gebruik maandgemiddelden om ruis van niet-volle tankbeurten te dempen.
4. Meerdere voertuigen op één pas: verdelen naar kilometers, of het voertuig weglaten uit de verbruikskalibratie.
5. AdBlue: meestal 3 tot 6% van het dieselverbruik. Ver daarbuiten: controleren.
6. Plausibiliteit per soort (zie [06 · Parameters](06-parameters.md#voertuigen-per-soort)): een bakwagen op 8 l/100 km of 60 l/100 km is fout of bijzonder.

### 4.2 Ritten en stops

1. Ritten korter dan 0,5 km of korter dan 2 minuten zijn meestal verplaatsingen op het terrein: samenvoegen met de stop.
2. Gaten in de tijd (voertuig vertrekt ergens anders dan waar het aankwam): markeren; vaak een gemiste rit door storing.
3. Kilometers per rit vergelijken met de rechte afstand × 1,3: veel groter of kleiner is verdacht.
4. Totale kilometers per voertuig per maand vergelijken met de tankpas; meer dan 10% verschil uitzoeken.

---

## 5. Van ritten naar diensten

Een **dienst** is wat één voertuig op één dag doet, van vertrek uit het depot tot terugkomst. Dat is de eenheid van het model.

**Algoritme**

1. **Depots herkennen.** Een cirkel van 150 tot 300 m om elk eigen depot. Een stop binnen die cirkel is een depotstop.
2. **Dagen afbakenen.** Kies als dagovergang het moment waarop de meeste voertuigen op het depot staan (vaak tussen 01:00 en 04:00). Zo valt een late avonddienst niet in tweeën.
3. **Dienst per voertuig per dag:** alle ritten en stops tussen twee dagovergangen. Begint en eindigt hij op het depot, dan is $`o(j)`$ dat depot.
4. **Externe overnachting** (voertuig slaapt elders): de dienst eindigt daar. Laden kan dan alleen via een laadkans op die plek. Markeer deze diensten; ze komen apart in het rapport.
5. **Op het depot per tijdstap:** $`\delta_{j,t} = 1`$ als het voertuig het hele kwartier op het depot staat. Voor gedeeltelijke kwartieren gebruiken we de fractie (0 tot 1) als vermenigvuldiger van het maximale laadvermogen in restrictie (A5).
6. **Verbruik per tijdstap:** het verbruik van een rit (uit §7) verdelen we over de kwartieren waarin gereden wordt, naar rato van de tijd.
7. **Laadkansen onderweg** maken we van stops:
   - pauzes van 45 minuten of langer binnen 5 km van een geschikte snellader;
   - stops bij een klant of eigen locatie met laadpaal, met stilstand van minstens 15 minuten;
   - per laadkans: $`t_s`$, $`\tau_s`$, $`P^{\text{rt}}_s`$, omrijkilometers en omrijtijd, soort (voor de bedrijfsschakelaars).
8. **Rijtijden:** waar de data geen pauze laat zien, leggen we een verplichte pauze na 4,5 uur rijden; die wordt een potentiële laadkans (variant B in [04 · Bedrijfsvarianten](04-bedrijfsvarianten.md#1-onderweg-laden)).
9. **Eisen aan de dienst:** maximale lading, koeling, zones op de route, buitenlandse kilometers, kilometers op het heffingsnet. Daaruit volgt $`\phi_{j,m,y}`$.

**Alleen tankpasdata, geen ritten (quickscan).** Benader een dienst per werkdag: kilometers per dag = kilometers tussen tankbeurten gedeeld door werkdagen. Neem een standaardwerkdag (bijvoorbeeld vertrek 06:00, terug 17:00) en zeg in het rapport dat dit grof is. De spreiding over dagen is onbekend, dus gebruik voor ritgeschiktheid een toeslag (bijvoorbeeld de langste dag = 1,4 × gemiddelde dag).

---

## 6. Representatieve dagen

Het model rekent niet met 365 dagen maar met 6 tot 12 echte historische dagen die het jaar vertegenwoordigen, plus een paar extreme dagen.

**Kenmerken per historische dag** (elk genormaliseerd):

- totaal benodigde energie per depot als alles elektrisch zou rijden (met het standaard elektrische verbruik);
- aantal diensten;
- energie van de zwaarste dienst;
- kortste stilstand op het depot;
- aantal voertuigen op het depot per uur (24 getallen);
- gemiddelde buitentemperatuur;
- weekdag of weekend.

**Methode:** k-medoids (PAM) met $`k`$ tussen 6 en 12. Een medoid is een echte dag, dus alle diensten en stilstanden zijn echt en onderling consistent. Gewicht $`w_d`$ = aantal dagen in het cluster, geschaald naar het aantal inzetdagen per jaar.

**Extreme dagen** $`\mathcal{D}^x`$, met gewicht 0 of 1:

1. de dag met de meeste totale energie;
2. de koudste werkdag;
3. de dag met de zwaarste enkele dienst;
4. de dag met de kortste nachtelijke stilstand.

**Controle:** reken met de representatieve dagen het jaarverbruik en de jaarpiek (bij alles elektrisch, dom laden) en vergelijk met alle dagen. Verschil meer dan 5%: $`k`$ verhogen of kenmerken aanpassen. Met minder dan 60 dagen data gebruiken we gewoon alle dagen.

---

## 7. Energiemodel kalibreren

**Stap 1: startwaarde uit diesel.** Voor dezelfde dienst verhoudt elektrisch verbruik zich ruwweg tot dieselverbruik als de rendementen van de aandrijving. Een liter diesel bevat ongeveer 10 kWh; een dieselaandrijving haalt daar 35 tot 42% van, een elektrische 85 tot 90%. De standaardwaarden van de calculator geven deze verhoudingen:

| Soort | Diesel l/100 km | Elektrisch kWh/100 km | kWh per liter |
| --- | --- | --- | --- |
| Trekker | 30 | 115 | 3,8 |
| Bakwagen | 25 | 100 | 4,0 |
| Bestelbus | 9 | 25 | 2,8 |
| Bus | 32 | 120 | 3,8 |

Dus: elektrisch verbruik van een dienst ≈ diesel l/100 km van dat voertuig × de factor van zijn soort.

**Stap 2: corrigeren voor het type.** Een type met een lagere fabrieksopgave dan het categoriegemiddelde krijgt naar verhouding minder: vermenigvuldig met $`\text{verbruik}_k / \text{verbruik}_{\text{soort}}`$ uit de catalogus.

**Stap 3: temperatuur.** Toeslag per dag: $`1 + \beta_4 \max(0, 15 - T_d)`$, met $`\beta_4`$ zo gekozen dat een dag rond 0 °C 15 tot 30% meer verbruikt (meer bij bestelbussen en stadsdistributie, minder bij trekkers op de snelweg). Bij voertuigen met warmtepomp lager.

**Stap 4: gewicht en snelheid**, als ritdata dat geven: regressie zoals in het model (§5.1). Ankerpunten: fabrieksopgaven bij genoemde belading, praktijkmetingen uit open bronnen, en het liefst data van een elektrisch voertuig dat de klant al heeft.

**Stap 5: marge.** Ontwerpverbruik = berekend verbruik × (1 + 10%) voor de ritgeschiktheid. In de kosten rekenen we zonder die marge.

**Stap 6: koeling en aftakas** apart optellen (kWh per uur), uit opgave van de fabrikant van de koelunit of telematica.

---

## 8. Gebouwprofiel en prijsprofiel

**Gebouw.** Uit `verbruik_kwartier` per representatieve dag het profiel van dezelfde datum nemen. Zonder kwartierdata: een standaardprofiel voor bedrijven (bijvoorbeeld de NEDU-profielen) geschaald naar het jaarverbruik. Zeg in het rapport dat dit geschat is.

**Stroomprijs.**

- Vast contract: één prijs per kWh, plus energiebelasting en netkosten.
- Dynamisch: uurprijzen van dezelfde datum vorig jaar, verschoven naar het verwachte prijsniveau, plus opslag leverancier, energiebelasting en netkosten per kWh.
- Toekomstige jaren: een prijspad per scenario (zie [06 · Parameters](06-parameters.md#prijzen-en-prijspaden)).

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
| Aannames | lijst |

De aannames gaan mee naar de bijlage van het rapport.
