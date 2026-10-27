# 04 · Wat per bedrijf anders is

Geen twee vloten zijn gelijk. Het model in [03 · Model](03-model.md) is één kern; per klant zetten we schakelaars aan of uit en vullen we andere parameters in. Dit document beschrijft per situatie wat er in de praktijk speelt, wat je in de kennismaking vraagt en wat er in het model verandert.

Onderaan staat een [voorbeeld van een klantconfiguratie](#20-klantconfiguratie-in-één-bestand) waarin alle schakelaars samenkomen.

---

## 1. Onderweg laden

De belangrijkste vraag na de actieradius. Veel bedrijven willen het niet ("mijn chauffeur gaat niet wachten bij een laadpaal"), anderen doen het al tijdens de pauze.

| Variant | Wat het betekent | Modelinstelling |
| --- | --- | --- |
| **A. Nooit** | Alleen laden op eigen terrein. | $`\Omega^{\text{rt}} = 0`$ voor alle laadkansen: $`\mathcal{S}_j`$ is leeg. |
| **B. Alleen tijdens de verplichte pauze** | Na 4,5 uur rijden is 45 minuten pauze verplicht (rij- en rusttijden). Als er dan een snellader is, kost laden geen extra tijd. | Laadkansen alleen op pauzemomenten met een snellader binnen de omrijgrens; $`\chi^{\max}_s = 0`$, $`\tau_s = 0{,}75`$ uur. |
| **C. Pauze plus beperkt bijladen** | Pauze, en als het nodig is maximaal 15 tot 30 minuten extra. | Als B, met $`\chi^{\max}_s > 0`$ en kosten $`c^{\text{chf}}`$ per extra uur. Restrictie (D6) bewaakt de werktijd. |
| **D. Vrij publiek snelladen** | Laden waar het uitkomt. | Alle snelladers langs de route binnen de omrijgrens worden laadkans, met prijs $`\pi^{\text{rt}}`$ per aanbieder. |
| **E. Bij de klant** | Tijdens laden en lossen (vaak 30 tot 90 minuten) op een laadpaal van de klant. Vraagt een afspraak met de klant. | Laadkans op de stop bij die klant, $`\tau_s`$ = laad- en lostijd, $`P^{\text{rt}}_s`$ = vermogen bij de klant (vaak 22 tot 50 kW), eigen prijs. |
| **F. Ander eigen depot** | Een rit eindigt of pauzeert bij een andere eigen vestiging. | Laadkans met depotprijs; het vermogen telt mee in (N1) van dat andere depot (dan wordt de laadkans een depot-laadmoment voor dat depot). |
| **G. Laadhub met reservering** | Truckladers met gegarandeerd tijdslot. | Als D, maar met hoger effectief vermogen (geen wachtrij) en een hogere prijs of abonnement als vaste kosten. |

**Effectief vermogen.** Een snellader van 400 kW levert gemiddeld minder: de laadcurve van het voertuig, het delen van een kast en de kans dat hij bezet is. We nemen $`P^{\text{rt}}_s = \min(P^{\text{lader}}, P^{DC}_m) \cdot f^{\text{curve}} \cdot f^{\text{beschikbaar}}`$, met bijvoorbeeld $`f^{\text{curve}} \approx 0{,}8`$ tussen 20% en 80% en $`f^{\text{beschikbaar}}`$ van 0,7 (druk, geen reservering) tot 1,0 (gereserveerd).

**Wat je vraagt:** mag de chauffeur onderweg laden, en zo ja, alleen in de pauze of ook daarbuiten? Welke klanten hebben laadpalen? Welke pauzeplekken gebruiken chauffeurs nu?

**Waarom het ertoe doet.** In het [rekenvoorbeeld](07-rekenvoorbeeld.md) haalt een vloot van drie bakwagens zonder onderweg laden twee van de drie elektrisch, met laden in de pauze alle drie. Laat het rapport altijd beide zien: de klant kiest.

---

## 2. Thuisladen

Bij bestelbussen neemt de chauffeur de bus vaak mee naar huis. Dan laadt hij thuis, niet op het depot.

- **Model:** laadpunttype *thuis* met $`\delta^{\text{thuis}}_{j,t}`$ (bus staat thuis), vermogen 11 kW, prijs $`\pi^{\text{th}}`$ (de vergoeding per kWh aan de chauffeur), thuislader $`I^{\text{th}}`$ per voertuig. Thuisladen belast het depot niet (geen bijdrage aan N1).
- **Mengvorm:** sommige bussen thuis, sommige op het depot. Het model kiest via $`\lambda_{j,m,q}`$.
- **Let op:** de chauffeur moet thuis een oprit of eigen parkeerplek hebben. Vraag dat per chauffeur (zonder namen, alleen ja of nee per voertuig).
- **Vergoeding:** de kostprijs van stroom thuis plus een opslag; ook de manier van vergoeden (vast bedrag of per gemeten kWh) staat in de configuratie.

---

## 3. Vaste of flexibele planning

| Variant | Praktijk | Model |
| --- | --- | --- |
| **Flexibel** | De planner kan diensten per dag aan elk geschikt voertuig geven. | (D3) en (D4) zoals in het model: de optimalisatie kiest welke dienst elektrisch wordt. |
| **Vast** | Elke chauffeur heeft zijn eigen wagen en vaste route. | Elke dienst hoort bij een plek $`\pi(j)`$. Per plek kiest het model een voertuig: $`\alpha_{j,m} = \alpha_{\pi(j),m}`$ voor alle diensten van die plek. Een nieuw voertuig vervangt een bestaand voertuig op zijn plek. |
| **Deels** | Wisselen kan binnen een groep (zelfde depot, zelfde soort werk). | Plekken met een groep: flexibel binnen de groep, vast daarbuiten. |

Flexibel levert bijna altijd meer elektrische inzet op dan vast, omdat de lange ritten naar de diesel kunnen. Dat verschil is een mooie bevinding voor het rapport: "als je de ritten slim verdeelt, kunnen er nu al vijf elektrisch in plaats van drie".

**Model voor vast**, per plek $`\pi`$:
```math
\sum_{m} \alpha^{\text{plek}}_{\pi,m,y} = 1, \qquad \alpha_{j,m,y,d} = \alpha^{\text{plek}}_{\pi(j),m,y}\ \ \forall j, d, \qquad \alpha^{\text{plek}}_{\pi,v,y} \le z_{v,y}
```
en $`\sum_\pi \alpha^{\text{plek}}_{\pi,k,y} \le N_{k,o,y}`$ per depot. De plekvariabele is per jaar, dus voor alle representatieve dagen gelijk.

---

## 4. Ploegendiensten en 24/7

Een trekker die twee of drie ploegen rijdt, staat kort stil. Dan is 's nachts laden niet genoeg.

- **Model:** de dienst van een dag bevat beide ploegen met de wisseltijd als depotmoment ($`\delta_{j,t} = 1`$ tijdens de wissel). De accubalans (A1) loopt de hele dag door; het model ziet zelf of de wissel lang genoeg is.
- **Opties:** snelladen op het depot (DC 150 tot 400 kW of MCS), een groter accupakket, laden onderweg, of het voertuig niet elektrificeren.
- **Kosten:** hoog vermogen in korte tijd drukt op de piek $`P^{\text{pk}}`$; een stationaire batterij kan dan lonen. Het model weegt dat af.

---

## 5. Meerdere depots

- Elk depot een eigen $`o`$ met eigen aansluiting, gebouwverbruik, laadpunten en netbeheerder.
- Diensten horen bij hun startdepot $`o(j)`$. Een dienst die bij een ander depot eindigt, laadt daar (variant F hierboven) en de volgende dag start hij daar.
- Voertuigen kunnen tussen depots verschuiven tussen jaren: geef $`N_{k,o,y}`$ dan een overdrachtsvariabele $`\Delta N_{k,o\to o',y}`$ met kosten (meestal niet nodig).
- Investeringen per depot hebben vaak verschillende wachttijden voor netverzwaring: het model elektrificeert dan eerst het depot waar het kan.

---

## 6. Netcongestie en flexibele contracten

In grote delen van Nederland is er een wachtrij voor zwaardere aansluitingen (zie de [gids over netcongestie](https://stekkerofdiesel.nl/overstapgids/netcongestie/)). Dat is voor veel klanten de echte beperking.

Wat in het model zit:

| Optie | Model |
| --- | --- |
| Huidige aansluiting | $`\ell_0`$, geen kosten, direct. |
| Verzwaring kleinverbruik naar grootverbruik, of grootverbruik naar hoger | $`\ell`$ met $`I^{\text{net}}`$, $`F^{\text{net}}`$, $`\theta`$ tarieven en $`y^{\min}_{o,\ell}`$ = jaar waarin de netbeheerder verwacht te kunnen leveren. |
| Flexibel of tijdsgebonden transportrecht | $`\bar P_{o,\ell,t}`$ verschilt per tijdstap: bijvoorbeeld volledig 's nachts, beperkt overdag of in de avondpiek. Vaak sneller beschikbaar en goedkoper. Welke vormen er zijn, verschilt per netbeheerder: navragen. |
| Groepscontract met buren of een energiehub | Een gezamenlijke grens over meerdere aansluitingen: $`\sum_{o \in \text{groep}} P^{\text{imp}}_{o,t} \le \bar P^{\text{groep}}_t`$. |
| Stationaire batterij | $`E^{\text{bat}}`$, $`P^{\text{bat}}`$ in het model: vlakt pieken af binnen de bestaande aansluiting. |
| Zonnepanelen | $`S^{\text{pv}}`$; helpt overdag, niet 's nachts. Vooral nuttig in combinatie met een batterij of dagladen. |

**Schaduwprijs.** De duale waarde van restrictie (N2) zegt hoeveel euro per jaar één kW extra aansluiting op elk moment waard is. Dat is precies het getal waarmee je bij de netbeheerder of bij de keuze voor een batterij aan tafel zit. Zie [05 · Oplossen](05-oplossen.md#6-wat-het-model-oplevert).

**Wat je vraagt:** EAN-code en netbeheerder, huidige aansluitwaarde (bijvoorbeeld 3x80A of een kVA-waarde), gecontracteerd vermogen, kwartierdata van het verbruik (bij grootverbruik via het meetbedrijf), of er al een aanvraag loopt en wat de netbeheerder heeft gezegd.

---

## 7. Omhangen van stekkers

Minder laadpunten dan voertuigen kan, als iemand 's nachts voertuigen omhangt of de laadpalen automatisch wisselen (sommige systemen hebben meerdere kabels per lader die om de beurt laden).

**Model.** Een nieuwe binaire variabele $`\psi_{j,m,q,t}`$: voertuig hangt in tijdstap $`t`$ aan een stekker van type $`q`$. Dan vervangen we (A5) en (N5) door:
```math
p_{j,m,q,t} \le \min(P_q, P^{\text{acc}}_{m,q})\ \psi_{j,m,q,t}, \qquad \psi_{j,m,q,t} \le \delta_{j,t}\,\lambda_{j,m,q}, \qquad \sum_{j,m} \psi_{j,m,q,t} \le N^{\text{con}}_q u_{o,q,y}
```
en tellen we het aantal keer aansluiten:
```math
\nu_{j,m,q,t} \ge \psi_{j,m,q,t} - \psi_{j,m,q,t-1}, \qquad \nu_{j,m,q,t} \le \text{pers}_{o,t}, \qquad \sum_t \nu_{j,m,q,t} \le \nu^{\max}
```
waarbij $`\text{pers}_{o,t} = 1`$ als er iemand aanwezig is om om te hangen en $`\nu^{\max}`$ het maximaal aantal keer aansluiten per voertuig per dag. Elke keer omhangen kost $`c^{\text{om}}`$ (arbeidstijd) in de rijkosten.

Bij automatisch wisselende laders is $`\text{pers}_{o,t} = 1`$ altijd en $`c^{\text{om}} = 0`$, maar het vermogen wordt gedeeld (N6).

---

## 8. Geen eigen terrein of huurlocatie

- **Huurlocatie:** laadpunten plaatsen vraagt toestemming van de verhuurder; netverzwaring vaak niet mogelijk. Model: $`U^{\max}_o`$ klein of nul, alleen $`\ell_0`$.
- **Charging as a service:** een partij plaatst en beheert de laadpunten voor een vast bedrag per maand of een opslag per kWh. Model: $`I^{\text{lp}} = 0`$, $`O^{\text{lp}}`$ = maandbedrag × 12, stroomprijs met opslag.
- **Geen eigen terrein:** voertuigen staan bij chauffeurs of op een openbaar terrein. Dan wordt alle laden thuis of onderweg (varianten 1 en 2).

---

## 9. Koel- en vriestransport

- Een elektrische koelunit (TRU) gebruikt energie uit de tractie-accu of een eigen accu. Verbruik hangt af van buitentemperatuur, deuropeningen en ingestelde temperatuur.
- **Model:** $`P^{\text{koel}}_j`$ in het energiemodel (§5.1 van het model), per representatieve dag afhankelijk van de temperatuur. Op het depot kan een koelunit voorkoelen aan de stekker: een extra vaste belasting in (N1) in de uren vóór vertrek.
- **Diesel-koelunits** vallen ook onder zero-emissiezone-regels in sommige gemeenten: navragen.

---

## 10. Werk met aftakas (bouw, afval, kraan)

- PTO-verbruik (aftakas voor kraan, pers, kipper, betonmixer) komt bovenop het rijden. Afvalinzameling heeft veel stops: meer terugwinning, maar ook veel PTO.
- **Model:** $`P^{\text{pto}}_j`$ per stop of per uur werk, uit telematica of uit een opgave van de klant.
- Bouwplaatsen hebben soms een eigen bouwstroomaansluiting: een laadkans van soort F.

---

## 11. Seizoenen en pieken

- Bloemen, bouw, pakketten in december, landbouw in de oogst: de vloot is in de piek groter dan de rest van het jaar.
- **Model:** representatieve dagen per seizoen met eigen gewicht; de piekdag als extreme dag.
- **Optie:** in de piek extra voertuigen huren of charteren in plaats van kopen. Model: $`\xi_j`$ met $`c^{\text{sub}}_j`$ of een huurtype in $`\mathcal{K}`$ met alleen variabele kosten en een maximum aantal huurdagen.

---

## 12. Internationaal

- Tol in het buitenland verschilt sterk voor elektrisch (in Duitsland tot 1 juli 2031 vrijgesteld, zie de calculator). Model: $`L^{\text{tol}}_{j,\text{land}}`$ en $`\tau^{\text{tol}}_{m,\text{land},y}`$.
- Laden in het buitenland: andere prijzen en dekking. Model: laadkansen met eigen $`\pi^{\text{rt}}_s`$.
- Lange internationale ritten zijn vaak (nog) niet elektrisch te doen zonder MCS of veel onderweg laden: de voorbewerking filtert ze en het rapport noemt ze apart.

---

## 13. Lease of eigendom

- **Bestaande leasecontracten:** einddatum $`\epsilon_v`$ is vaak het natuurlijke vervangmoment. Vroeg beëindigen kost een boete $`\text{BT}_{v,y}`$.
- **Nieuwe voertuigen:** het model kiest zelf tussen koop en lease ($`c`$), met leaseprijs uit offerte of de schatting uit de calculator (afschrijving plus rente plus 7% opslag).
- **Financial lease:** behandelen als koop met een lening (rente in de rekenrente of als aparte kostenregel).
- **Onderhoud in de lease:** dan is $`\text{on}_m = 0`$ voor dat leasetype; verzekering idem als die erin zit.

---

## 14. Charter en onderaannemers

- Diensten die nu al uitbesteed worden, zitten niet in de eigen vloot maar kunnen wel in het rapport ("jouw charters rijden ook in de zone; vraag ze naar hun plannen").
- In het model is uitbesteden de veiligheidsklep: $`\xi_j`$ met $`c^{\text{sub}}_j`$. Zet de prijs realistisch (offerte of tarief per uur of km), dan kiest het model het alleen als het echt goedkoper is.

---

## 15. Bedrijfsgrootte en rechtsvorm

| Kenmerk | Gevolg |
| --- | --- |
| Klein, middelgroot of groot (FTE en omzet) | AanZET-percentage en maximum per voertuig verschillen sterk (zie [06 · Parameters](06-parameters.md#subsidies-en-fiscaal)); SPRILA-bedrag per laadpunt ook. |
| BV (vennootschapsbelasting) | MIA-voordeel met 19% of 25,8%. |
| Eenmanszaak of vof (inkomstenbelasting) | MIA werkt via het IB-tarief van de ondernemer; vul het marginale tarief in. |
| Non-profit | Vaak geen winstbelasting: MIA en Vamil leveren niets op, AanZET wel (als non-profit behandeld als klein). |

---

## 16. Doelen en klanteisen

- Eigen duurzaamheidsdoel ("in 2030 de helft elektrisch"): restrictie (P2).
- Klant die zero-emissie eist in een contract of aanbesteding: restrictie (P3) voor de diensten van die klant, of $`\phi_{j,m,y} = 0`$ voor diesel op die diensten vanaf het jaar van het contract.
- CO₂-rapportage (bijvoorbeeld voor grote opdrachtgevers): rapporteer $`\text{CO}_{2,y}`$ per jaar uit het plan.
- Interne CO₂-prijs: $`\lambda^{\text{CO}_2}`$ in de doelfunctie.

---

## 17. Energiecontract, zon en batterij

| Contract | Model |
| --- | --- |
| Vaste prijs | $`\pi^{\text{imp}}`$ gelijk over alle tijdstappen. Slim laden levert dan alleen piekbesparing op. |
| Dag en nacht | Twee prijzen per tijdstap. |
| Dynamisch (per uur of kwartier) | Prijsprofiel per representatieve dag uit historische marktprijzen plus opslagen. Slim laden verschuift naar goedkope uren. |

Zon en batterij staan als investeringsbeslissing in het model; zet ze uit ($`S^{\text{pv}} = E^{\text{bat}} = 0`$) als de klant daar niet over wil praten.

---

## 18. Bestelbussen

- Geen kilometerheffing en geen AanZET; wel zero-emissiezones met eigen overgangsregels.
- Rijbewijs B: elektrische bestelbussen tot 4.250 kg mogen onder voorwaarden met rijbewijs B (zie de [gids over regels](https://stekkerofdiesel.nl/overstapgids/regels/)); voeg de rijbewijsvoorwaarde toe aan $`\phi`$.
- Thuisladen (variant 2) komt veel voor.
- Grote aantallen gelijke voertuigen: aggregeren werkt goed, het model blijft klein.

---

## 19. Bussen

- Lijnbus: vaste omlopen, laden bij het eindpunt (pantograaf) is een laadkans van soort F met hoog vermogen en korte stilstand.
- Touringcar: lange dagen, wisselende routes; lijkt meer op internationaal vervoer.
- Concessie-eisen kunnen zero-emissie voorschrijven: (P3).

---

## 20. Klantconfiguratie in één bestand

Alle keuzes van dit document per klant in één bestand, dat de code inleest. Voorbeeld:

```yaml
klant: "Voorbeeld Distributie BV"
horizon_jaren: 10
startjaar: 2027
rekenrente: 0.056          # 80% lening tegen 6%, 20% eigen geld tegen 4%
tijdstap_minuten: 15
representatieve_dagen: 8
extreme_dagen: [koudste, drukste, kortste_stilstand]

bedrijf:
  grootte: klein            # klein | middelgroot | groot
  rechtsvorm: bv            # bv | ib | non_profit
  vpb_tarief: 0.19

planning: flexibel          # flexibel | vast | groepen
onderweg_laden:
  pauze: true               # variant B
  extra_wachttijd_min: 15   # variant C
  publiek_vrij: false       # variant D
  bij_klant: [klant_42]     # variant E
  andere_depots: true       # variant F
thuisladen: false
omhangen:
  toegestaan: false
  max_aansluitingen_per_nacht: 2

depots:
  - id: tilburg
    netbeheerder: Enexis
    aansluiting_huidig_kw: 55
    opties:
      - {id: gv_160, kw: 160, kosten: 18000, vast_per_jaar: 2400, vanaf: 2029}
      - {id: flex_250, kw_nacht: 250, kw_dag: 60, kosten: 9000, vanaf: 2027}
    batterij_toestaan: true
    zon_toestaan: true
    max_laadpunten: 12
    energiecontract: dynamisch

beleid:
  aandeel_ze_min: {2030: 0.5}
  co2_prijs_per_ton: 0
  budget_per_jaar: 400000
  max_nieuwe_voertuigen_per_jaar: 4

onzekerheid:
  scenario_s: 200
  eerste_fase_jaren: 1
  cvar: {beta: 0.9, gewicht: 0.2}
```

De standaardwaarden voor alles wat hier niet staat, komen uit [06 · Parameters](06-parameters.md).
