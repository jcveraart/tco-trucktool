# 03 · Het wiskundige model

**Uitvoerbare implementatie:** [het volledige Jupyter notebook](vlootanalyse.ipynb) en [de herbruikbare rekenkern](vlootmodel.py). [09](09-notebook.md) legt vast welke onderdelen zijn gecodeerd en getest, hoe je rekent en welke invoer-/praktijkvalidatie nog nodig is.

Gecorrigeerd ontwerp, 27 oktober 2026. Dit document is een specificatie voor een toekomstige vervangingsoptimizer. De uitgevoerde referentie in `referentie.py` toetst een **vast** laadplan en financiële deelregels; zij implementeert niet dit hele strategische model. Iedere toekomstige restrictie krijgt een test volgens [08 · Correcties en acceptatie](08-correcties-en-acceptatie.md).

Bedragen zijn euro excl. btw, energie kWh aan de expliciet genoemde meter/accuzijde, vermogen kW en tijd uur. Reken voor belasting of na belasting consequent; toon economische NCW, kasstroom en financieringsbehoefte afzonderlijk.

## 1. Opbouw in drie lagen

1. **Voorbewerking:** ongewijzigde bronbestanden naar gevalideerde tijdreeksen, fysieke voertuiguitvoeringen, dienstvereisten en bevestigde laadkansen. Iedere waarde is bevestigd, geschat of onbekend.
2. **Operationeel:** een laad- en inzetplan op echte opeenvolgende intervallen, met voertuigidentiteit, locatie en SoC. Representatieve dagen mogen de eerste screening versnellen.
3. **Strategisch:** aankoop, lease, behoud, verkoop en infrastructuur. Vergelijk voor de pilot eerst een klein aantal concrete plannen; optimaliseer daarna pas alle jaren gezamenlijk.

Een uitkomst is pas een advies na chronologische replay, verklaarde uitzonderingen, scenario's en menselijke beoordeling. Een 1%-solvergap zegt niets over voorspellingsnauwkeurigheid.

## 2. Verzamelingen en indices

| Symbool | Betekenis |
|---|---|
| `y=1,…,H` | Strategische planjaren; `y=0` is de bekende beginsituatie |
| `t` | Opeenvolgende UTC-intervallen; `Δt_t` is de werkelijke duur |
| `d` | Hele historische depotdagen voor screening; lokale dagen kunnen 92/96/100 kwartieren bevatten |
| `o` | Depot of andere bevestigde laadlocatie |
| `j` | Een volledige dagelijkse dienst, met werkelijke tijdvensters; meerdaags werk blijft een doorlopende keten |
| `i ∈ I` | Fysiek voertuig of een optionele kandidaat-slot met unieke identiteit |
| `k(i), c(i), a(i)` | Exacte uitvoering, verwervingsvorm en aankoopjaar van slot `i` |
| `g(i)` | Bevestigde plannings-/compatibiliteitsgroep |
| `r, q` | Fysieke connector en vermogenskast; connectoren zijn aan een kast gekoppeld |
| `s` | Bevestigde laadactie met locatie, tijdvenster, prijs en uitsluitingsgroep |
| `n` | Subsidieronde met aanvraag-, bestel- en leveringsvoorwaarden |

Bestaande voertuigen hebben `z[i,0]=1`. Nieuwe kandidaten hebben `z[i,0]=0` en mogen vóór `a(i)` niet actief zijn. Stel een eindig, verdedigbaar maximum aan kandidaat-slots. Inzet gebruikt voertuig-/contractidentiteit, zodat koop- en leasekilometers niet worden gemengd. Gelijke voertuigen mogen later worden geaggregeerd als contracten, technische eigenschappen en chronologische toestand identiek blijven.

Een bestaand voertuig kan niet zonder locatie- en energiebalans op een ander depot verschijnen. De pilot houdt voertuigen aan één depot. Meerdere depots vereisen voertuigstromen en dezelfde SoC-keten over de locaties.

## 3. Parameters

Per voertuig: bevestigde bruikbare accu `B_i`, SoH, reserve- en bovengrens, AC/DC-acceptatie, connector, laadcurve/geverifieerd effectief vermogen, opbouw, payload, aslasten, onderhoud en contractdekking. Een onbekende cruciale eigenschap blokkeert een definitieve geschiktheidsuitspraak.

Per dienst: werkelijke volgorde, afstand, rijtijd, stop-/werktijd, belading, carrosserie-eisen, zones en laadvensters. Per depot: gebouwbelasting **zonder dubbeltelling van bestaande EV-lading of zon**, import-/exportcontract, fasen, connectoren, kastruimte en maximumvermogen per interval.

Gebruik geen gemiddeld beschikbaarheidspercentage als vervanging voor laderuitval. Een kritieke laadactie heeft een basisscenario en aparte uitval-/vertragingsscenario's. Een openbare lader op 5 km afstand is pas kandidaat na controle van trucktoegang, route, omrijtijd en contract.

Financiële parameters hebben bron, prijsdatum, geldigheidsperiode, btw-status, uitvoering en contractscope. Scheid chassis, fabrieksopties en opbouw. Subsidie- en fiscale aanspraak zijn versieerbare toepassingsregels, geen universele voertuigkorting.

## 4. Beslisvariabelen

| Variabele | Betekenis |
|---|---|
| `z[i,y] ∈ {0,1}` | Voertuig is na de beslissingen aan het begin van jaar y beschikbaar |
| `b[k,o,c,a], n[k,o,c,a,y]` | Aantallen aangekochte/actieve slots per cohort, afgeleid uit z |
| `α[j,i] ∈ {0,1}` | Dienst wordt door dat fysieke voertuig gereden |
| `ξ[j] ∈ {0,1}` | Dienst krijgt expliciet gecontracteerde externe dekking |
| `E[i,t]` | Accu-energie aan het eind van interval t |
| `p[i,r,t], ε[i,s,t]` | Netzijdig depotvermogen en netzijdige energie onderweg |
| `ψ[i,r,t] ∈ {0,1}` | Connectorbezetting, indien omhangen deel is van de variant |
| `u[q,y], g[o,ℓ,y]` | Geplaatste laadinstallaties en gekozen aansluitoptie |
| `Pimp, Pexp, Ppk` | Import, export en werkelijk toepasselijke factuurpiek |

`R[g,o,y]` is een **expliciet afgesproken geheel aantal reservevoertuigen**, geen automatische 5%-factor. Leg ook reserve/charter bij bestaande voertuigen vast. Geen reserve in een voorbeeld betekent dat uitvaldekking nog niet is aangetoond.

## 5. Laag 1: voorbewerking per dienst en voertuigsoort

### 5.1 Energie per tijdstap

Voor segmentkracht F en afstand ℓ in meters:

```math
F = Mg(C_{rr}\cos\vartheta+\sin\vartheta)+\tfrac12\rho C_d A v^2
```
```math
e^{tract}=\frac{\max(F,0)\ell}{3.6\cdot10^6\eta^{aand}},\qquad
e^{recup}=-\frac{\eta^{rec}\max(-F,0)\ell}{3.6\cdot10^6}
```

Positieve arbeid en terugwinning worden dus niet dubbel negatief geteld. Beperk recuperatie op regeneratief vermogen en vrije accuruimte; overige remenergie is warmte. Gemiddelde segmentsnelheid mist acceleraties. Zonder een rijprofiel is een gekalibreerde regressie met foutband een geschiktere benadering dan schijnprecisie.

Tel hulpenergie per **werkelijke activiteit**: `P_hvac × actieve uren`, `P_koel × koeluren` en `P_pto × werkuren`, ook tijdens stops en vóór vertrek. Corrigeer diesel-naar-elektrisch niet nogmaals voor winter/PTO die al in de kalibratie zit. Gebruik scenario-/ontwerpverbruik voor haalbaarheid en verwacht verbruik voor kosten als afzonderlijke, traceerbare reeksen.

### 5.2 Wie mag welke dienst rijden

`φ[j,i,y]=1` alleen bij bevestigde payload/aslasten, opbouw, rijbevoegdheid, leverbaarheid, route-/zonevoorwaarden, planningsgroep en een tijdige laadroute. Een totale dag-energiebovengrens is slechts een snelle filter: de accu kan vóór een laadstop al leeg raken.

### 5.3 Ritgeschiktheid als uitkomst voor het rapport

Rapporteer aantallen gedekte en ongedekte **diensten**, **voertuigdagen** en **vlootdagen** afzonderlijk, met redenen en kosten van nooddekking. Kies de servicenorm met de klant. 97% is geen standaard groen label. Onvoldoende data krijgen de status `nog niet aangetoond`; kritieke externe laadvoorwaarden blijven zichtbaar.

## 6. Doelfunctie

Minimaliseer de NCW van echte kasstromen op hun eigen tijdstip τ:

```math
\min Z=\sum_{\tau}\frac{C_{\tau}^{aankoop}+C_{\tau}^{lease}+C_{\tau}^{bedrijf}+C_{\tau}^{infra}+C_{\tau}^{afkoop}+C_{\tau}^{uitval}-S_{\tau}^{ontvangen}-R_{\tau}^{verkoop}}{(1+r)^{\tau}}-\frac{R_H^{netto}}{(1+r)^H}
```

Beginsaldo en bestaande waarde worden consistent in alle alternatieven behandeld. Een aankoop is geen jaarlijkse afschrijving in deze kasstroomdoelfunctie. Vergelijk een eenvoudige jaar-TCO apart; eis geen gelijkheid met NCW. Nominale bedragen horen bij nominale rente; reële bedragen bij `r_reëel=(1+r_nominaal)/(1+inflatie)-1`. Financieringsrente wordt niet dubbel geteld naast een daarvoor gebruikte vermogenskostenvoet.

Voor verkoop aan het **begin** van jaar y:

```math
v_{i,y}=z_{i,y-1}-z_{i,y},\quad R_y^{verkoop}=\sum_{i\in I_{koop}}RW^{begin}_{i,y}v_{i,y}
```

Dit geldt ook voor y=1, met bekende z0. Nieuwe slots vóór hun aanschaf hebben geen verkoopmutatie; gebruik daar alleen verworven, nog actieve slots. Afkoop van een bestaande lease wordt op dezelfde startmutatie en werkelijke contractdatum gewaardeerd.

Lease bevat alleen de werkelijk overeengekomen componenten. Onderhoud/verzekering worden alleen toegevoegd als zij niet inbegrepen zijn. Terminale waarde is netto realiseerbare waarde plus waarde van resterende gebruiksrechten min resterende verplichtingen/afkoop; een doorlopende lease verdwijnt niet gratis op H.

Reken ERE alleen over aantoonbaar subsidiabele/geregistreerde levering op de juiste meetgrens en met contractueel aan de klant toekomende opbrengst. Voeg een scenario met nul ERE toe. Bestaand gebouwverbruik kan in totale depotkosten staan, maar vergelijkingen en vervoer-CO₂ krijgen een identieke referentie zonder dubbeltelling.

## 7. Restricties: vloot en verwerving

**V1–V2 Beginsituatie en mutaties.** Bestaande voertuigen: z0=1 en `z[i,y]≤z[i,y−1]`. Directe verkoop/afkoop wordt betaald op t=0. Nieuwe slots: nul vóór a, aankoopindicator op a en daarna niet terugkomen na verkoop. `b` en `n` zijn de som van de bijbehorende slotindicatoren.

**V3–V9 Contract, leeftijd en leverbaarheid.** Lease is actief volgens de daadwerkelijke contractperiode; verlenging en vervroegde beëindiging zijn afzonderlijke contractopties met prijs. Koop eindigt uiterlijk op de ingestelde maximale leeftijd. Geen aankoop vóór bevestigde leverbaarheid. Midjaarcontracten vragen maand-/datumkasstromen en werkelijk beschikbare dagen; een jaarafronding is alleen een gemarkeerde screening.

**V10–V11 Aantallen en invoertempo.** Sommeer cohorten per type/depot; begrens aankopen met realistische slots, capaciteit van de organisatie en budget.

**V12 Lease-meerkilometers.** Alleen kilometers gereden door de betreffende leasevoertuigen tellen mee:

```math
XL_{h,y}\ge\sum_{i\in I^{lease}_h}\sum_d w_d\sum_j L_j\alpha_{j,i,y,d}-KM^{contract}_{h,y},\qquad XL_{h,y}\ge0
```

h is één contract of een expliciet toegestane contractpool. Koopkilometers zijn uitgesloten. Minderkilometers, looptijdsaldo en inbegrepen diensten volgen het contract; een vlootgemiddelde mag niet zonder contractgrondslag worden gebruikt.

## 8. Restricties: inzet van diensten

```math
\sum_i\alpha_{j,i}+\xi_j=1,\quad\alpha_{j,i}\le\phi_{j,i,y},\quad\sum_{j\in J_d}\alpha_{j,i}\le z_{i,y}
```

De laatste grens geldt voor dagelijkse diensten die alle ploegen van dat voertuig omvatten; anders zijn niet-overlaprestricties nodig. Groepen en vaste plekken beperken welke voertuigen mogen wisselen.

**D4 Reserve:** dienstcapaciteit wordt begrensd door aanwezige geschikte voertuigen **min het afgesproken gehele aantal reserve**, per compatibele groep. Bij 3 diensten en R=0 zijn 3 voertuigen nodig; bij R=1 zijn het er 4. Reserve kan niet over onverenigbare groepen worden uitgeleend. Toets daarnaast storingsscenario's met de daadwerkelijke reserve-uitvoering.

**Extreme dagen:** `ξ[j]=0` tenzij een concrete fallback met capaciteit, tijdvenster en kosten is toegestaan. Gewicht nul betekent alleen geen bijdrage aan de verwachte jaarenergiekosten, nooit gratis nooddekking. Rapporteer fallbackkosten per gebeurtenis en een apart scenario-/jaaraantal; geef geen robuustheidsclaim als dekking onbekend is.

**D6 Tijd:** gebruik in de pilot alleen bevestigde stilstand. Extra laden/omrijden vereist doorlopende aankomst- en vertrektijdvariabelen en klanttijdvensters. Een grens op totale werktijd alleen is onvoldoende. Een ontbrekende pauzeregistratie wordt geen verzonnen laadstop.

## 9. Restricties: accu en laden

Voor een gekozen fysiek voertuig en een vast traject:

```math
E_{i,t+1}=E_{i,t}+\Delta t_t\sum_r\eta^c_{i,r}p_{i,r,t}+\sum_s\eta^c_{i,s}\varepsilon_{i,s,t}-e_{i,t}
```
```math
u_i^{min}\bar B_{i,t}\le E_{i,t}\le u_i^{max}\bar B_{i,t}
```

Begin-SoC is gemeten of expliciet als aanname vastgezet. In chronologische replay wordt `E[i,d+1,0]=E[i,d,T_d]`, met dezelfde voertuigidentiteit en eind-/startlocatie. Externe overnachtingen, weekenden en rustdagen blijven in de tijdas.

Een vrije cyclische beginlading is **uitsluitend screening van een herhaalde dag**. Zij mag niet als bewijs van een willekeurige reeks dagen worden gerapporteerd. Gebruik voor een doorlopende replay een expliciete eindvoorwaarde; voorkom dat het model het plan kunstmatig goedkoop maakt door de hele eindaccu leeg te rijden.

Per interval en werkelijke connector: vermogen ≤ aanwezigheid × voertuigacceptatie × bezetting. Splits gedeeltelijke intervallen op de echte grens; een fractie bezetting van twee overlappende auto's mag niet als één stekker worden opgeteld. Thuis- en depotladen mogen op verschillende tijdstippen worden gecombineerd als beide locaties en hun capaciteiten bekend zijn; er geldt geen maximum van één laadpunttype per hele dag.

Voor een bevestigde concave vermogensenvelop kunnen lineaire bovengrenzen worden gebruikt. Niet-concave laadcurves vereisen passende segment-/binaire modellering of een aantoonbaar conservatieve envelop. Veroudering, temperatuur, DC-acceptatie en de gekozen uitvoering beïnvloeden het vermogen.

Onderweg zijn gelijktijdige alternatieven uitgesloten. Netzijdige energie is begrensd door werkelijke stopduur, effectief vermogen, vrije accuruimte en een expliciete laadactie. Een 80%-grens geldt alleen wanneer daadwerkelijk wordt geladen; alleen voorbij een laadpaal rijden mag geen kunstmatige 80%-SoC-eis opleveren. Extra wachttijd vergroot geen laadvenster zonder de rest van de planning te verschuiven.

## 10. Restricties: depot, net, laadpunten, batterij en zon

```math
P^{imp}_{o,t}-P^{exp}_{o,t}=\Lambda_{o,t}+\sum_{i,r\in o}p_{i,r,t}+p^{bc}_{o,t}-p^{bd}_{o,t}-PV_{o,t}
```

Import en export zijn elk begrensd door het fysieke én contractuele recht van die locatie en dat tijdstip. Geen gelijktijdige fictieve import/export om prijsverschillen te benutten. Piekvergoeding volgt de echte factuurgrondslag, bijvoorbeeld per maand; een jaarpiek twaalf keer gebruiken is alleen een gemarkeerd conservatief scenario.

Connectoren hebben hun eigen bezetting; het totaalvermogen per kast is afzonderlijk begrensd. Beperk capaciteit niet alleen over alle kasten van hetzelfde type samen: vermogen van de ene kast mag niet virtueel naar een onverbonden connector stromen. Zonder omhangen krijgt ieder gelijktijdig aangesloten voertuig een echte stekker.

Een aansluitupgrade heeft een toegestane overgang, aanvraag, kosten en bevestigde beschikbaarheid. Een kaartindicatie is een scenario, geen transportrecht. Koppel installatie- en voertuiglevering aan de feitelijke beschikbaarheid van het laadplan.

Een stationaire batterij heeft capaciteit, vermogen, rendement, begin/eindinhoud, gebruiksslijtage, levensduur en vervanging. Gebruik ook bij negatieve prijzen een richtingskeuze om ongewenst gelijktijdig laden/ontladen te voorkomen. Zon, batterij en gebouw moeten dezelfde meetgrens gebruiken. De pilotreferentie optimaliseert geen batterij of zon; voor die uitbreiding is een eigen testset verplicht.

## 11. Restricties: subsidie, fiscaal, budget en beleid

### 11.1 AanZET

Een versieerbare regel bepaalt aanspraak per rechtspersoon, voertuig, ronde en datum. Grondslag: chassis plus subsidiabele af-fabrieksopties, exclusief opbouw en btw. Kies AanZET of MIA voor dezelfde investering; operational lease verwerkt aanspraak van de lessor in de offerte.

Aanvraag, nog niet-definitieve overeenkomst, beschikking, definitieve bestelling, levering en betaling worden afzonderlijk vastgelegd. De toekenningsvariabele mag alleen gekoppeld zijn aan een aankoop met geldige datumrelatie, ook als aanvraag en levering verschillende planjaren hebben.

De huidige vierjarige houdverplichting wordt met een minimale aanhoudperiode of expliciete terugbetaling/erkende vervanging gemodelleerd. Verwachte subsidie telt niet als ontvangen geld voor een liquiditeitsgrens. Reken altijd ook zonder toekenning. [RVO AanZET](https://www.rvo.nl/subsidies-financiering/aanzet) en [voorwaarden](https://www.rvo.nl/subsidies-financiering/aanzet/voorwaarden).

### 11.2 MIA en Vamil

Gebruik de code en lijst van het investeringsjaar. **D 3116 heeft in 2026 36% MIA over 90% van de investering en geen Vamil.** Vamil is geen generiek truckvoordeel. Het tijdstip en de benutbaarheid van belastingaftrek volgen de werkelijke fiscale positie. Combineer geen na-belastingvoordeel met een ongemarkeerde voor-belastingvergelijking. [Milieulijst 2026](https://zoek.officielebekendmakingen.nl/stcrt-2025-40676.html).

### 11.3 SPRILA voor laadpunten

Bereken eerst een geldig project per locatie: installatietype/kast, subsidiabele kosten, staatssteunruimte, minimumaanvraag en aanvraagmoment. Trek daarna het toegestane bedrag af op de betaaldatum. Een korting per willekeurig laadpunt is geen volledige regel. [RVO SPRILA](https://www.rvo.nl/subsidies-financiering/laadinfrastructuur/sprila-aanschaf).

### 11.4 Budget

Beperk zowel de bruto financieringsbehoefte op elk beslismoment als de afgesproken jaarinvestering. Gebruik ontvangsten pas wanneer zij beschikbaar zijn. Toon economische NCW, jaarlijkse kasstroom en maximale financieringsbehoefte apart.

### 11.5 Beleid en doelen (optioneel, per klant)

CO₂-plafonds en ZE-aandelen hebben een vaste systeemgrens. Trek voor vervoer-CO₂ bestaand gebouwverbruik af; tel thuis/publiek laden op de juiste metergrens mee. Voertuigen in reserve en externe diensten mogen een ZE-percentage niet ongemerkt mooier maken. Toon kosten en dienstdekking bij ieder doel.

## 12. Uitbreiding: onzekerheid (stochastisch model)

Gebruik eerst een beperkt aantal uitlegbare combinaties: koud/druk, lagere laadprestatie, vertraagde upgrade, andere prijzen, geen ERE/subsidie en gewijzigde vraag. Houd de eerstvolgende investeringen vast bij vergelijking van scenario's.

Een later meerfasenmodel krijgt niet-anticipativiteit op elke informatieknoop. Een tweefasenmodel dat na jaar 1 het volledige tienjaarsprijspad kent is optimistische recourse, geen realistische voorkennis. CVaR en Monte Carlo zijn pas zinvol met verdedigbare gezamenlijke verdelingen en out-of-sample-validatie. 5.000 trekkingen maken een aanname geen gemeten kans. Werk met een rollende horizon en herbereken bij nieuwe informatie.

## 13. Linearisaties en modelleertrucs

Een laad-LP ontstaat pas als voertuigkeuze, connectorbezetting, laadacties en overige discrete keuzes vastliggen. SOS2-belasting en richtingsbinaries kunnen het deelprobleem weer een MIP maken. Energiebelasting wordt op netto relevante jaarvolumes berekend, zonder dezelfde belasting al in een all-in prijs te dubbeltellen.

Geldige sneden moeten voor de gekozen variant bewezen zijn. Een nachtgemiddelde op basis van **alle** dagenergie is ongeldig wanneer een deel overdag geladen wordt. Gebruik alleen energie die aantoonbaar in het betreffende venster moet worden geladen. Breek symmetrie alleen bij werkelijk identieke contracten, restwaarden en eigenschappen.

## 14. Versterkingen (snellere oplossing)

Filter alleen op bevestigde ongeschiktheid; markeer onbekend. Beperk kandidaten met een expliciete scope. Vergelijk eerst concrete plannen met hun laadprobleem. Aggregeer alleen uitwisselbare middelen en behoud contract-/SoC-koppelingen. Benchmark bouwtijd, geheugen, rekentijd en gap op vaste instanties vóór een grotere solver of Benders wordt gekozen.

Schaduwprijzen van een vastgezet MIP zijn lokale gevoeligheden in de eenheid van de doelfunctie, geen globale waarde in euro per jaar. Heroptimaliseer concrete aansluit-/voertuigopties voor klantbesluiten. Een handmatige snede mag geen andere uitvoerbare ritcombinatie verbieden. [Gurobi over duale waarden](https://support.gurobi.com/hc/en-us/articles/360034305272-How-do-I-retrieve-the-dual-Pi-values-for-a-MIP-problem).

## 15. Wat het model bewust niet doet

De pilot plant geen nieuwe routes, personeel of niet-bevestigde laadstops. Internationaal meerdaags werk, thuisladen, meerdere depots, koeling/PTO en zon/batterij zijn alleen toegestaan met de beschreven extra gegevens, chronologie en eigen tests. Een analyse kan daarom eindigen met een meetvraag of een beperktere scope. [05 · Oplossen](05-oplossen.md) beschrijft wat daadwerkelijk uitvoerbaar is en [08](08-correcties-en-acceptatie.md) bewaakt de overgang naar klantwerk.
