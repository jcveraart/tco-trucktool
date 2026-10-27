# 03 · Het wiskundige model

Dit is het volledige optimalisatiemodel achter een vlootanalyse. Het is een **minimalisatie** van de totale contante kosten van de vloot over de planhorizon, als gemengd geheeltallig lineair programma (MILP). Het model is zo opgeschreven dat het één op één in `gurobipy` te bouwen is (zie [05 · Oplossen](05-oplossen.md)). Alle restricties zijn lineair; waar de werkelijkheid niet lineair is (laadcurve, energiebelasting in schijven, accuveroudering) staat erbij hoe we dat lineair maken.

Notatie: verzamelingen in kalligrafische letters ($`\mathcal{J}`$), parameters in gewone letters ($`L_j`$), beslisvariabelen ook in gewone letters maar altijd in de tabel van §4 genoemd. Bedragen in euro excl. btw, energie in kWh, vermogen in kW, afstand in km, tijd in uur.

Inhoud

1. [Opbouw in drie lagen](#1-opbouw-in-drie-lagen)
2. [Verzamelingen en indices](#2-verzamelingen-en-indices)
3. [Parameters](#3-parameters)
4. [Beslisvariabelen](#4-beslisvariabelen)
5. [Laag 1: voorbewerking per dienst en voertuigsoort](#5-laag-1-voorbewerking-per-dienst-en-voertuigsoort)
6. [Doelfunctie](#6-doelfunctie)
7. [Restricties: vloot en verwerving](#7-restricties-vloot-en-verwerving)
8. [Restricties: inzet van diensten](#8-restricties-inzet-van-diensten)
9. [Restricties: accu en laden](#9-restricties-accu-en-laden)
10. [Restricties: depot, net, laadpunten, batterij en zon](#10-restricties-depot-net-laadpunten-batterij-en-zon)
11. [Restricties: subsidie, fiscaal, budget en beleid](#11-restricties-subsidie-fiscaal-budget-en-beleid)
12. [Uitbreiding: onzekerheid (stochastisch model)](#12-uitbreiding-onzekerheid-stochastisch-model)
13. [Linearisaties en modelleertrucs](#13-linearisaties-en-modelleertrucs)
14. [Versterkingen (snellere oplossing)](#14-versterkingen-snellere-oplossing)
15. [Wat het model bewust niet doet](#15-wat-het-model-bewust-niet-doet)

---

## 1. Opbouw in drie lagen

| Laag | Wat | Tijdschaal | Type |
| --- | --- | --- | --- |
| 1. Voorbewerking | Energie per dienst en voertuigsoort, wie mag welke dienst rijden, laadkansen onderweg | per dienst | rekenwerk, geen optimalisatie |
| 2. Operationeel | Welk voertuig rijdt welke dienst, wanneer en waar laadt het, hoeveel vermogen vraagt het depot | kwartier binnen een representatieve dag | MILP (vooral LP) |
| 3. Strategisch | Wat kopen, leasen, verkopen, welke netaansluiting, hoeveel laadpunten, welke subsidie | jaar | MILP |

Laag 2 en 3 vormen samen het **volledige model** dat hieronder staat. Laag 1 levert parameters. Voor grote vloten splitsen we laag 2 en 3 weer met Benders-decompositie (zie [05 · Oplossen](05-oplossen.md#3-decompositie)).

De gedachte erachter: een vloot elektrificeren is geen optelsom van losse voertuigen. Drie dingen bestaan alleen op vlootniveau en maken dit tot een optimalisatieprobleem:

1. **Gedeelde netaansluiting.** Tien auto's die elk prima elektrisch kunnen, kunnen samen te veel vermogen vragen.
2. **Ruilbare diensten.** Als ritten tussen voertuigen te wisselen zijn, gaat de lange rit naar de diesel en de korte naar de elektrische.
3. **Timing.** Subsidierondes, einde leasecontract, wachttijd bij de netbeheerder, budget per jaar en zero-emissiezones bepalen samen het beste vervangjaar per voertuig.

---

## 2. Verzamelingen en indices

| Symbool | Betekenis |
| --- | --- |
| $`y \in \mathcal{Y} = \{1,\dots,H\}`$ | Planjaren. Jaar 1 is het eerste jaar waarin iets kan veranderen. Aankopen vallen aan het begin van een jaar. |
| $`d \in \mathcal{D}`$ | Representatieve dagen (echte historische dagen gekozen uit de data, zie [02 · Data](02-data.md#6-representatieve-dagen)). |
| $`\mathcal{D}^{x} \subseteq \mathcal{D}`$ | Extreme dagen (koudste, drukste, kortste stilstand). Die moeten haalbaar zijn, maar wegen nauwelijks mee in de kosten. |
| $`t \in \mathcal{T} = \{1,\dots,T\}`$ | Tijdstappen binnen een dag van $`\Delta t`$ uur. Standaard kwartier: $`T = 96`$, $`\Delta t = 0{,}25`$. De dag is cyclisch: stap $`0`$ is stap $`T`$. |
| $`o \in \mathcal{O}`$ | Eigen locaties met laadmogelijkheid (depots, vestigingen). |
| $`j \in \mathcal{J}_d`$ | Diensten op dag $`d`$. Een dienst is alles wat één voertuig op één dag doet, inclusief tweede ploeg. $`o(j)`$ is het depot waar de dienst begint en eindigt. |
| $`v \in \mathcal{V}`$ | Bestaande voertuigen (kentekens). $`\mathcal{V}^E \subseteq \mathcal{V}`$: al elektrisch. $`o(v)`$: thuisdepot. |
| $`k \in \mathcal{K}`$ | Kandidaat-voertuigtypen voor aanschaf: merk, model, uitvoering en accu (uit de modellencatalogus). $`\mathcal{K}^E`$ elektrisch, $`\mathcal{K}^D`$ diesel of HVO. |
| $`m \in \mathcal{M} = \mathcal{V} \cup \mathcal{K}`$ | Voertuigsoort voor de inzet. Elk bestaand voertuig is zijn eigen soort (aantal 0 of 1); een nieuw type is een soort met een aantal. $`\mathcal{M}^E = \mathcal{V}^E \cup \mathcal{K}^E`$ elektrisch, $`\mathcal{M}^D = \mathcal{M} \setminus \mathcal{M}^E`$ diesel of HVO. |
| $`c \in \mathcal{C} = \{\text{koop}, \text{lease}\}`$ | Verwervingsvorm. Lease is operational lease met looptijd $`\tau^L_k`$. |
| $`a \in \mathcal{Y}`$ | Aanschafjaar van een cohort nieuwe voertuigen. Cohort $`(k,o,c,a)`$. |
| $`q \in \mathcal{Q}`$ | Laadpunttypen op eigen terrein: AC 11/22 kW, DC 40, DC 90, DC 150, DC 400, MCS. Plus het pseudo-type *thuis* voor thuisladen. |
| $`\ell \in \mathcal{L}_o`$ | Aansluitopties per depot: huidige aansluiting, verzwaringen, flexibele contractvormen, groepscontract. |
| $`s \in \mathcal{S}_j`$ | Laadkansen onderweg in dienst $`j`$: een stop met plaats, tijdstap $`t_s`$, beschikbare stilstand en soort (publiek snelladen, laadhub, bij de klant, ander eigen depot, verplichte pauze). |
| $`n \in \mathcal{N}`$ | Subsidierondes (AanZET), elk in jaar $`y(n)`$. |
| $`\omega \in \Omega`$ | Scenario's (alleen in de stochastische uitbreiding van §12). |

Hulpindicatoren uit de data:

- $`\delta_{j,t} \in \{0,1\}`$: voertuig van dienst $`j`$ staat in tijdstap $`t`$ op zijn depot (en kan dus aan de stekker).
- $`\delta^{\text{thuis}}_{j,t} \in \{0,1\}`$: voertuig staat bij de chauffeur thuis (alleen als thuisladen bestaat).
- $`\mathcal{J}_{d,o} = \{j \in \mathcal{J}_d : o(j) = o\}`$.

---

## 3. Parameters

Standaardwaarden en bronnen staan in [06 · Parameters](06-parameters.md). Hier de betekenis.

### 3.1 Voertuigen

| Symbool | Betekenis | Eenheid |
| --- | --- | --- |
| $`B_m`$ | Bruikbare accucapaciteit nieuw | kWh |
| $`h_m`$ | Ontwerp-gezondheid accu (State of Health) aan het eind van de geplande inzet, bijvoorbeeld 0,85 | – |
| $`\bar B_m = h_m B_m`$ | Ontwerpcapaciteit waarmee we rekenen | kWh |
| $`\underline{u}_m,\ \overline{u}_m`$ | Laagste en hoogste toegestane laadtoestand (fractie van $`\bar B_m`$) | – |
| $`\kappa_m`$ | Knikpunt van de laadcurve: boven deze laadtoestand daalt het laadvermogen lineair | – |
| $`P^{AC}_m,\ P^{DC}_m`$ | Maximaal laadvermogen dat het voertuig accepteert, AC en DC | kW |
| $`G_m`$ | Toegestane maximummassa en $`G^0_m`$ leeggewicht; laadvermogen $`G_m - G^0_m`$ | kg |
| $`\text{Pr}_{k,a}`$ | Aanschafprijs type $`k`$ in jaar $`a`$ | € |
| $`\text{Ls}_{k,a}`$ | Leaseprijs per maand (operational lease, inclusief wat erin zit) | €/maand |
| $`\text{KM}^{L}_k`$ | Contractkilometers per jaar bij lease, $`\text{lm}_k`$ meerkilometerprijs | km, €/km |
| $`\tau^L_k`$ | Leaselooptijd | jaar |
| $`A^{\max}_k`$ | Maximale leeftijd die we toestaan | jaar |
| $`\text{RW}_{k,A}`$ | Restwaarde van type $`k`$ op leeftijd $`A`$ (jaar) | € |
| $`\text{RW}^0_{v,y}`$ | Restwaarde bestaand voertuig $`v`$ bij verkoop eind jaar $`y`$ | € |
| $`\text{Ls}^0_v,\ \epsilon_v,\ \text{BT}_{v,y}`$ | Leaseprijs, contracteinde en boete voor vroeg beëindigen van een bestaand leasevoertuig | €/maand, jaar, € |
| $`F_m`$ | Vaste kosten per jaar: verzekering, motorrijtuigenbelasting, overig | €/jaar |
| $`\text{on}_m`$ | Onderhoud en banden per km | €/km |
| $`y^{\text{lev}}_k`$ | Eerste jaar waarin type $`k`$ leverbaar is (status *komt* in de catalogus) | jaar |
| $`r^{\text{res}}_m`$ | Reservefractie voor onderhoud en storing | – |

### 3.2 Diensten (uit de data)

| Symbool | Betekenis | Eenheid |
| --- | --- | --- |
| $`L_j`$ | Afstand van dienst $`j`$ | km |
| $`L^{H}_j`$ | Deel daarvan op het Nederlandse heffingsnet | km |
| $`L^{\text{tol}}_{j,\text{land}}`$ | Kilometers per buitenlands tolgebied | km |
| $`e_{j,m,t}`$ | Energieverbruik van soort $`m`$ op dienst $`j`$ in tijdstap $`t`$ (laag 1) | kWh |
| $`e_{j,m} = \sum_t e_{j,m,t}`$ | Totaal voor de dienst; bij diesel in liter: $`e^D_{j,m}`$ | kWh of l |
| $`\phi_{j,m,y} \in \{0,1\}`$ | Mag soort $`m`$ dienst $`j`$ in jaar $`y`$ rijden (laadvermogen, carrosserie, ADR, rijbewijs, zero-emissiezone, laag 1) | – |
| $`D_j`$ | Duur van de dienst en $`D^{\max}_j`$ maximale werktijd van de chauffeur | uur |
| $`c^{\text{sub}}_j`$ | Kosten om de dienst uit te besteden aan een charter | € |
| $`\tau_{s},\ t_s`$ | Beschikbare stilstand bij laadkans $`s`$ en de tijdstap waarin die valt | uur, – |
| $`P^{\text{rt}}_{s}`$ | Effectief laadvermogen bij laadkans $`s`$ (na beschikbaarheid en laadcurve) | kW |
| $`\Delta L_s,\ \Delta D_s`$ | Omrijkilometers en omrijtijd om bij laadkans $`s`$ te komen | km, uur |
| $`\chi^{\max}_s`$ | Maximale extra wachttijd bovenop de natuurlijke stilstand | uur |

### 3.3 Energie en prijzen

| Symbool | Betekenis | Eenheid |
| --- | --- | --- |
| $`\pi^{\text{imp}}_{o,y,d,t}`$ | Variabele stroomprijs op het depot: leveringstarief plus energiebelasting plus netbeheerder per kWh (vast of dynamisch per kwartier) | €/kWh |
| $`\pi^{\text{exp}}_{o,y,d,t}`$ | Vergoeding voor teruglevering | €/kWh |
| $`\pi^{\text{rt}}_{s,y}`$ | Prijs laden onderweg bij laadkans $`s`$ | €/kWh |
| $`\pi^{\text{th}}_{y}`$ | Vergoeding per kWh voor thuisladen | €/kWh |
| $`\pi^{D}_y`$ | Dieselprijs (incl. accijns, ETS2 vanaf 2028), $`\pi^{\text{Ad}}_y`$ AdBlue per liter diesel | €/l |
| $`\pi^{\text{ERE}}_y`$ | Opbrengst emissiereductie-eenheden per geleverde kWh aan het voertuig | €/kWh |
| $`\eta^{c}_q`$ | Rendement van net naar accu bij laadpunttype $`q`$ | – |
| $`\eta^{c}_s`$ | Rendement bij laden onderweg | – |
| $`\gamma^{D},\ \gamma^{E}_{o}`$ | CO₂ per liter diesel en per kWh stroom van het depot | kg |

### 3.4 Depot en net

| Symbool | Betekenis | Eenheid |
| --- | --- | --- |
| $`\Lambda_{o,d,t}`$ | Verbruik van het gebouw en andere installaties (zonder laden) | kW |
| $`\bar P_{o,\ell,t}`$ | Beschikbaar afnamevermogen bij aansluitoptie $`\ell`$ in tijdstap $`t`$ (tijdsafhankelijk bij flexibele contracten) | kW |
| $`\bar P^{\text{exp}}_{o,\ell}`$ | Toegestane teruglevering | kW |
| $`I^{\text{net}}_{o,\ell}`$ | Eenmalige kosten om naar optie $`\ell`$ te gaan | € |
| $`F^{\text{net}}_{o,\ell}`$ | Vaste netkosten per jaar bij optie $`\ell`$ | €/jaar |
| $`\theta^{\text{max}}_{o}`$ | Tarief per kW maandmaximum (grootverbruik) | €/kW per maand |
| $`\theta^{\text{ctr}}_{o}`$ | Tarief per kW gecontracteerd transportvermogen | €/kW per jaar |
| $`y^{\min}_{o,\ell}`$ | Eerste jaar waarin optie $`\ell`$ kan (wachtrij netbeheerder) | jaar |
| $`A_{\ell',\ell} \in \{0,1\}`$ | Overstap van optie $`\ell'`$ naar $`\ell`$ toegestaan | – |
| $`\Gamma_{o,d,t}`$ | Opbrengst zon per kWp | kW per kWp |

### 3.5 Laadpunten, batterij, zon

| Symbool | Betekenis | Eenheid |
| --- | --- | --- |
| $`P_q`$ | Vermogen per laadpunt van type $`q`$ | kW |
| $`N^{\text{con}}_q`$ | Aantal stekkers per laadpunt | – |
| $`I^{\text{lp}}_{q,y},\ O^{\text{lp}}_{q}`$ | Investering per laadpunt (incl. installatie en graafwerk) en beheer per jaar | €, €/jaar |
| $`U^{\max}_{o}`$ | Maximaal aantal laadpunten dat fysiek past | – |
| $`I^{\text{bE}},\ I^{\text{bP}}`$ | Batterij: investering per kWh en per kW | € |
| $`\eta^{b}`$ | Rendement van de batterij (enkele richting) | – |
| $`I^{\text{pv}}`$ | Zonnepanelen per kWp | € |
| $`I^{\text{th}}`$ | Thuislader per voertuig | € |

### 3.6 Geld en beleid

| Symbool | Betekenis |
| --- | --- |
| $`r`$ | Rekenrente (gewogen kosten van vermogen). |
| $`\text{DF}_y = (1+r)^{-(y-1)}`$ | Disconteringsfactor voor bedragen aan het begin van jaar $`y`$; $`\text{DF}^{\text{mid}}_y = (1+r)^{-(y-0{,}5)}`$ voor bedragen die gedurende het jaar vallen. |
| $`w_d`$ | Gewicht van representatieve dag $`d`$ (aantal inzetdagen per jaar dat hij vertegenwoordigt). |
| $`S^{AZ}_{k,n},\ \rho_n,\ S^{AZ,\max}_n`$ | AanZET-bedrag per voertuig in ronde $`n`$, kans op toekenning, maximum per aanvrager per ronde. |
| $`V^{\text{MIA}}_{k,a}`$ | Fiscaal voordeel MIA en Vamil per gekocht voertuig (als bedrag, zie §11.2). |
| $`S^{\text{lp}}_{q,y}`$ | Subsidie per laadpunt (SPRILA). |
| $`\text{BU}_y`$ | Investeringsbudget per jaar. |
| $`b^{\max}_{o,y}`$ | Maximaal aantal nieuwe voertuigen per jaar dat de organisatie aankan. |
| $`\lambda^{\text{CO}_2}`$ | Interne CO₂-prijs (optioneel). |
| $`\text{CO}_2^{\max,y},\ \beta^{\text{ZE}}_y`$ | CO₂-plafond of minimaal aandeel zero-emissie per jaar (optioneel, klanteis of eigen doel). |
| $`F^{\text{impl}}_o`$ | Eenmalige invoerkosten bij de eerste elektrische inzet op een depot: training, werkplaats, veiligheid. |
| $`\Omega^{\text{rt}}_{\text{soort}} \in \{0,1\}`$ | Bedrijfsschakelaar: mag deze soort laadkans gebruikt worden (zie [04 · Bedrijfsvarianten](04-bedrijfsvarianten.md)). |

---

## 4. Beslisvariabelen

### 4.1 Strategisch (per jaar)

| Variabele | Domein | Betekenis |
| --- | --- | --- |
| $`z_{v,y}`$ | $`\{0,1\}`$ | Bestaand voertuig $`v`$ is in jaar $`y`$ nog in de vloot. |
| $`b_{k,o,c,a}`$ | $`\mathbb{Z}_{\ge 0}`$ | Aantal nieuwe voertuigen van type $`k`$ voor depot $`o`$, verworven via $`c`$ aan het begin van jaar $`a`$. |
| $`n_{k,o,c,a,y}`$ | $`\mathbb{Z}_{\ge 0}`$ | Aantal uit dat cohort dat in jaar $`y \ge a`$ nog in de vloot is. |
| $`N_{k,o,y}`$ | $`\mathbb{Z}_{\ge 0}`$ | Totaal van type $`k`$ op depot $`o`$ in jaar $`y`$ (hulpvariabele). |
| $`x^{AZ}_{k,o,n}`$ | $`\mathbb{Z}_{\ge 0}`$ | Aantal gekochte voertuigen waarvoor AanZET wordt aangevraagd in ronde $`n`$. |
| $`x^{MIA}_{k,o,a}`$ | $`\mathbb{Z}_{\ge 0}`$ | Aantal gekochte voertuigen waarvoor MIA en Vamil worden gebruikt. |
| $`g_{o,\ell,y}`$ | $`\{0,1\}`$ | Aansluitoptie $`\ell`$ is actief op depot $`o`$ in jaar $`y`$. |
| $`g^{+}_{o,\ell,y}`$ | $`\{0,1\}`$ | Overstap naar optie $`\ell`$ aan het begin van jaar $`y`$. |
| $`P^{\text{ctr}}_{o,y}`$ | $`\mathbb{R}_{\ge 0}`$ | Gecontracteerd transportvermogen. |
| $`u_{o,q,y},\ u^{+}_{o,q,y}`$ | $`\mathbb{Z}_{\ge 0}`$ | Aantal laadpunten van type $`q`$ (totaal en nieuw geplaatst). |
| $`E^{\text{bat}}_{o,y},\ P^{\text{bat}}_{o,y}`$ | $`\mathbb{R}_{\ge 0}`$ | Stationaire batterij: capaciteit (kWh) en vermogen (kW). |
| $`S^{\text{pv}}_{o,y}`$ | $`\mathbb{R}_{\ge 0}`$ | Zonnepanelen (kWp). |
| $`f_{o,y}`$ | $`\{0,1\}`$ | Depot $`o`$ heeft in jaar $`y`$ elektrische voertuigen (voor invoerkosten). |
| $`\text{XL}_{k,y}`$ | $`\mathbb{R}_{\ge 0}`$ | Meerkilometers boven de leasecontracten. |
| $`\text{TH}_y,\ \text{TH}^{+}_y`$ | $`\mathbb{Z}_{\ge 0}`$ | Aantal thuisladers bij chauffeurs (totaal en nieuw geplaatst). Alleen als thuisladen bestaat. |

### 4.2 Operationeel (per jaar $`y`$ en representatieve dag $`d`$)

Indices $`y,d`$ laten we in §8 tot §10 weg waar het duidelijk is.

| Variabele | Domein | Betekenis |
| --- | --- | --- |
| $`\alpha_{j,m}`$ | $`\{0,1\}`$ | Dienst $`j`$ wordt gereden door soort $`m`$. |
| $`\xi_{j}`$ | $`\{0,1\}`$ | Dienst $`j`$ wordt uitbesteed. |
| $`\lambda_{j,m,q}`$ | $`\{0,1\}`$ | Voertuig van dienst $`j`$ (soort $`m`$) laadt op laadpunttype $`q`$. |
| $`p_{j,m,q,t}`$ | $`\mathbb{R}_{\ge 0}`$ | Laadvermogen aan de netkant. |
| $`E_{j,m,t}`$ | $`\mathbb{R}_{\ge 0}`$ | Energie in de accu aan het eind van tijdstap $`t`$. |
| $`\sigma_{j,m,s}`$ | $`\{0,1\}`$ | Laadkans $`s`$ onderweg wordt gebruikt. |
| $`\varepsilon_{j,m,s}`$ | $`\mathbb{R}_{\ge 0}`$ | Energie geladen bij laadkans $`s`$ (netkant). |
| $`\chi_{j,m,s}`$ | $`\mathbb{R}_{\ge 0}`$ | Extra wachttijd bij laadkans $`s`$ bovenop de natuurlijke stilstand. |
| $`P^{\text{imp}}_{o,t},\ P^{\text{exp}}_{o,t}`$ | $`\mathbb{R}_{\ge 0}`$ | Afname en teruglevering van het depot. |
| $`P^{\text{pk}}_{o,y}`$ | $`\mathbb{R}_{\ge 0}`$ | Hoogste afname in het jaar (over alle dagen). |
| $`p^{\text{bc}}_{o,t},\ p^{\text{bd}}_{o,t},\ S^{\text{bat}}_{o,t}`$ | $`\mathbb{R}_{\ge 0}`$ | Batterij laden, ontladen en inhoud. |

Waarom de laadvariabelen per paar $`(j,m)`$ en niet alleen per dienst: accugrootte, laadvermogen en verbruik hangen af van de soort die de dienst rijdt. Met een variabele per paar blijft alles lineair en wordt de LP-relaxatie sterker. Na de voorbewerking blijven per dienst meestal 2 tot 5 elektrische kandidaten over, dus dat is te overzien.

---

## 5. Laag 1: voorbewerking per dienst en voertuigsoort

Deze stap levert $`e_{j,m,t}`$, $`e^D_{j,m}`$, $`\phi_{j,m,y}`$ en de laadkansen $`\mathcal{S}_j`$. De details van de data staan in [02 · Data](02-data.md).

### 5.1 Energie per tijdstap

Fysisch model per ritsegment $`i`$ met lengte $`\ell_i`$, gemiddelde snelheid $`\bar v_i`$, helling $`\vartheta_i`$ en totale massa $`M = G^0_m + \text{lading}_i`$:

```math
F_i = M g \left(C_{rr}\cos\vartheta_i + \sin\vartheta_i\right) + \tfrac12 \rho\, C_d A\, \bar v_i^{\,2}
```

```math
e^{\text{tract}}_i = \frac{F_i\,\ell_i}{3{,}6\cdot 10^{6}\ \eta^{\text{aand}}_m} \quad (\text{kWh, met } \ell_i \text{ in m}), \qquad e^{\text{recup}}_i = -\eta^{\text{rec}}_m \cdot \max(0,\, -F_i)\,\ell_i / 3{,}6\cdot 10^{6}
```

```math
e_{j,m,t} = \sum_{i \in t}\left(e^{\text{tract}}_i + e^{\text{recup}}_i\right) + \left(P^{\text{hvac}}(T^{\text{buiten}}_d) + P^{\text{koel}}_j + P^{\text{pto}}_j + P^{\text{aux}}_m\right)\Delta t^{\text{rij}}_{j,t}
```

Praktisch (als segmenten ontbreken) gebruiken we een gekalibreerd regressiemodel per voertuigsoort:

```math
\frac{e_{j,m}}{L_j} = \beta_{0,m} + \beta_{1,m}\,\bar M_j + \beta_{2,m}\,\bar v_j^{\,2} + \beta_{3,m}\,\frac{\text{stops}_j}{L_j} + \beta_{4,m}\max\!\left(0,\, 15 - T^{\text{buiten}}_d\right) + \beta_{5,m}\,\mathbb{1}[\text{koeling}]
```

Kalibratie: fabrieksopgave (SORT, VECTO of fabrikant) als ankerpunt, praktijkdata van elektrische voertuigen als die er zijn, anders de omrekening uit dieselverbruik van hetzelfde voertuig op dezelfde dienst (zie [02 · Data](02-data.md#7-energiemodel-kalibreren)). Diesel: $`e^D_{j,m}`$ in liter direct uit tankpas of telematica.

### 5.2 Wie mag welke dienst rijden

$`\phi_{j,m,y} = 1`$ alleen als alles waar is:

1. Laadvermogen: $`\max_i \text{lading}_i \le G_m - G^0_m`$ (inclusief de extra massa die voor zero-emissievoertuigen is toegestaan, zie [06 · Parameters](06-parameters.md)).
2. Carrosserie, koeling, laadklep, ADR, assen, trekker of bakwagen passen bij wat de dienst vraagt.
3. Rijbewijs: een bestelbus boven 3.500 kg alleen als de chauffeur het mag.
4. Zero-emissiezone: als de dienst een zone in rijdt, mag $`m`$ daar in jaar $`y`$ nog komen (euroklasse, datum eerste toelating, overgangsregeling; zie de [gids over zero-emissiezones](https://stekkerofdiesel.nl/overstapgids/zero-emissiezones/)).
5. Energie: zelfs met alle toegestane laadkansen onderweg haalt een elektrische $`m`$ de dienst, dus
   ```math
   e_{j,m} \le (\overline{u}_m - \underline{u}_m)\bar B_m + \sum_{s \in \mathcal{S}_j} \Omega^{\text{rt}}_{s}\ \eta^c_s P^{\text{rt}}_s \left(\tau_s + \chi^{\max}_s\right)
   ```
   Dit is een snelle filter; de echte toets doet het model met de accu-restricties van §9.
6. Leverbaarheid: $`m = k`$ met $`y \ge y^{\text{lev}}_k`$.

### 5.3 Ritgeschiktheid als uitkomst voor het rapport

Los van de optimalisatie rapporteren we per dienstsoort en kandidaat de ritgeschiktheid: het percentage historische dagen waarop de dienst past met alleen depotladen, met de toegestane laadkansen, of niet. Dat is de "ritanalyse in vijf punten" (depot, onderweg, zero-emissiezone, snellader, klant) op de vlootanalysepagina.

```math
\text{RG}_{j,m} = \frac{\#\{\text{dagen waarop dienst } j \text{ haalbaar is met } m\}}{\#\{\text{dagen met dienst } j\}}
```

Groen bij $`\text{RG} \ge 97\%`$, oranje bij $`85\%`$ tot $`97\%`$, rood daaronder. De grenzen zijn instelbaar.

---

## 6. Doelfunctie

We minimaliseren de netto contante waarde van alle kosten min alle opbrengsten over de horizon, plus de restwaarde aan het eind als opbrengst. Optioneel komt er een CO₂-prijs bij.

```math
\min\ Z = \sum_{y \in \mathcal{Y}} \Big( \text{DF}_y\, C^{\text{inv}}_y + \text{DF}^{\text{mid}}_y \big( C^{\text{lease}}_y + C^{\text{vast}}_y + C^{\text{rij}}_y + C^{\text{stroom}}_y + C^{\text{net}}_y + C^{\text{lp}}_y + C^{\text{uit}}_y + \lambda^{\text{CO}_2} \text{CO}_{2,y} \big) - \text{DF}_{y+1}\, R^{\text{verkoop}}_y \Big) - \text{DF}_{H+1}\, R^{\text{eind}}
```

De termen, telkens voor jaar $`y`$:

**Investeringen** (begin van het jaar)

```math
C^{\text{inv}}_y = \sum_{k,o}\Big(\text{Pr}_{k,y}\, b_{k,o,\text{koop},y} - \sum_{n: y(n)=y} \rho_n S^{AZ}_{k,n}\, x^{AZ}_{k,o,n} - V^{\text{MIA}}_{k,y}\, x^{MIA}_{k,o,y}\Big) + \sum_{o,q}\left(I^{\text{lp}}_{q,y} - S^{\text{lp}}_{q,y}\right) u^{+}_{o,q,y} + \sum_{o,\ell} I^{\text{net}}_{o,\ell}\, g^{+}_{o,\ell,y}
```
```math
\qquad + \sum_o \Big( I^{\text{bE}} (E^{\text{bat}}_{o,y} - E^{\text{bat}}_{o,y-1}) + I^{\text{bP}} (P^{\text{bat}}_{o,y} - P^{\text{bat}}_{o,y-1}) + I^{\text{pv}} (S^{\text{pv}}_{o,y} - S^{\text{pv}}_{o,y-1}) + F^{\text{impl}}_o (f_{o,y} - f_{o,y-1}) \Big) + I^{\text{th}} \cdot \text{TH}^{+}_y
```

**Lease**

```math
C^{\text{lease}}_y = \sum_{k,o}\sum_{a \le y} 12\,\text{Ls}_{k,a}\, n_{k,o,\text{lease},a,y} + \sum_{v\ \text{lease}} \Big(12\,\text{Ls}^0_v\, z_{v,y} + \text{BT}_{v,y}\,(z_{v,y} - z_{v,y+1})\,\mathbb{1}[y < \epsilon_v]\Big) + \sum_k \text{lm}_k\, \text{XL}_{k,y}
```

**Vaste voertuigkosten**

```math
C^{\text{vast}}_y = \sum_{v} F_v\, z_{v,y} + \sum_{k,o} F_k\, N_{k,o,y}
```

**Rijkosten** (onderhoud, diesel, heffing, tol, laden onderweg, thuisladen, extra chauffeurstijd, uitbesteden)

```math
C^{\text{rij}}_y = \sum_{d} w_d \sum_{j \in \mathcal{J}_d} \Bigg[ \sum_{m} \alpha_{j,m} \Big( \text{on}_m L_j + \tau^{H}_{m,y} L^{H}_j + \sum_{\text{land}} \tau^{\text{tol}}_{m,\text{land},y} L^{\text{tol}}_{j,\text{land}} + \mathbb{1}[m \in \mathcal{M}^D]\,(\pi^D_y + \pi^{\text{Ad}}_y)\, e^D_{j,m} \Big)
```
```math
\qquad + \sum_{m \in \mathcal{M}^E}\sum_{s \in \mathcal{S}_j} \Big( \pi^{\text{rt}}_{s,y}\, \varepsilon_{j,m,s} + (\text{on}_m \Delta L_s + c^{\text{chf}} \Delta D_s)\, \sigma_{j,m,s} + c^{\text{chf}}\, \chi_{j,m,s} \Big) + \sum_{m \in \mathcal{M}^E}\sum_t \pi^{\text{th}}_y\, p_{j,m,\text{thuis},t}\,\Delta t + c^{\text{sub}}_j\, \xi_j \Bigg]
```

$`c^{\text{chf}}`$ is de kostprijs van een chauffeursuur (alleen de extra tijd telt; de normale diensttijd is voor diesel en elektrisch gelijk).

**Stroom op het depot** (afname min teruglevering min ERE)

```math
C^{\text{stroom}}_y = \sum_{o}\sum_{d} w_d \sum_{t} \Delta t \Big( \pi^{\text{imp}}_{o,y,d,t} P^{\text{imp}}_{o,t} - \pi^{\text{exp}}_{o,y,d,t} P^{\text{exp}}_{o,t} - \pi^{\text{ERE}}_y \sum_{j \in \mathcal{J}_{d,o}}\sum_{m \in \mathcal{M}^E}\sum_{q \ne \text{thuis}} \eta^c_q\, p_{j,m,q,t} \Big)
```

Energiebelasting in schijven maakt de prijs per kWh afhankelijk van het jaarverbruik; zie §13.3 voor de exacte modellering.

**Netkosten**

```math
C^{\text{net}}_y = \sum_o \Big( 12\,\theta^{\max}_o\, P^{\text{pk}}_{o,y} + \theta^{\text{ctr}}_o\, P^{\text{ctr}}_{o,y} + \sum_\ell F^{\text{net}}_{o,\ell}\, g_{o,\ell,y} \Big)
```

Dit is behoudend: we rekenen het jaarmaximum voor alle twaalf maanden. Met representatieve dagen per seizoen kan het per maandtype (zie §13.4).

**Laadpunten, batterij en zon: beheer**

```math
C^{\text{lp}}_y = \sum_{o,q} O^{\text{lp}}_q\, u_{o,q,y} + \sum_o \left( O^{\text{bat}} E^{\text{bat}}_{o,y} + O^{\text{pv}} S^{\text{pv}}_{o,y} \right)
```

**Opbrengst verkoop** (eind jaar $`y`$)

```math
R^{\text{verkoop}}_y = \sum_{v\ \text{koop}} \text{RW}^0_{v,y}\,(z_{v,y} - z_{v,y+1}) + \sum_{k,o}\sum_{a \le y} \text{RW}_{k,\,y-a+1}\,(n_{k,o,\text{koop},a,y} - n_{k,o,\text{koop},a,y+1})
```

**Restwaarde aan het eind van de horizon** (voorkomt dat het model in de laatste jaren niets meer koopt omdat de baten na de horizon vallen)

```math
R^{\text{eind}} = \sum_{v\ \text{koop}} \text{RW}^0_{v,H}\, z_{v,H} + \sum_{k,o}\sum_{a} \text{RW}_{k,\,H-a+1}\, n_{k,o,\text{koop},a,H} + \sum_{o,q,y} \frac{\max(0,\ \text{LT}_q - (H - y + 1))}{\text{LT}_q} I^{\text{lp}}_{q,y} u^{+}_{o,q,y} + \dots
```

Afspraak aan de rand van de horizon: $`z_{v,H+1} \equiv z_{v,H}`$ en $`n_{k,o,c,a,H+1} \equiv n_{k,o,c,a,H}`$. Zo telt $`R^{\text{verkoop}}_H`$ niets en zit alles wat aan het eind nog rijdt in $`R^{\text{eind}}`$, zonder dubbeltelling en zonder onterechte leaseboete.

Laadpunten, netverzwaring, batterij en zon krijgen dezelfde lineaire restwaarde naar resterende levensduur $`\text{LT}`$. (Bij een netverzwaring is de restwaarde discutabel; standaard nemen we die 0 en melden we dat.)

**CO₂** (voor de optionele prijs of het plafond)

```math
\text{CO}_{2,y} = \sum_d w_d \sum_j \Big( \sum_{m \in \mathcal{M}^D} \gamma^D e^D_{j,m} \alpha_{j,m} \Big) + \sum_o \gamma^E_o \sum_d w_d \sum_t P^{\text{imp}}_{o,t}\Delta t + \sum_d w_d\sum_j\sum_{m,s} \gamma^E \varepsilon_{j,m,s}
```

Met eigen zonnestroom of een groen contract kan $`\gamma^E_o`$ lager. In tonnen: delen door 1000.

---

## 7. Restricties: vloot en verwerving

**(V1) Bestaande voertuigen gaan alleen de vloot uit, nooit terug in.**
```math
z_{v,y+1} \le z_{v,y} \qquad \forall v,\ y < H
```

**(V2) Beginsituatie.** $`z_{v,1} \le 1`$; een voertuig dat al verkocht is staat niet in $`\mathcal{V}`$.

**(V3) Lease loopt af.** Zonder verlengoptie: $`z_{v,y} = 0`$ voor $`y > \epsilon_v`$. Met verlengoptie: $`z_{v,y} \le z^{\text{verl}}_v`$ voor $`y > \epsilon_v`$, met een binaire $`z^{\text{verl}}_v`$ en een eigen verlengprijs.

**(V4) Maximale leeftijd bestaand voertuig.** $`z_{v,y} = 0`$ als de leeftijd in jaar $`y`$ boven $`A^{\max}_v`$ komt.

**(V5) Cohort begint met de aanschaf.**
```math
n_{k,o,c,a,a} = b_{k,o,c,a} \qquad \forall k,o,c,a
```

**(V6) Gekochte voertuigen kunnen verkocht worden, niet terugkomen.**
```math
n_{k,o,\text{koop},a,y+1} \le n_{k,o,\text{koop},a,y} \qquad \forall y \ge a
```

**(V7) Lease: precies de looptijd.**
```math
n_{k,o,\text{lease},a,y} = b_{k,o,\text{lease},a}\ \ \text{voor } a \le y < a + \tau^L_k, \qquad n_{k,o,\text{lease},a,y} = 0\ \ \text{voor } y \ge a + \tau^L_k
```

**(V8) Maximale leeftijd nieuw.** $`n_{k,o,c,a,y} = 0`$ als $`y - a \ge A^{\max}_k`$.

**(V9) Leverbaarheid.** $`b_{k,o,c,a} = 0`$ als $`a < y^{\text{lev}}_k`$.

**(V10) Totaal per type.**
```math
N_{k,o,y} = \sum_{c}\sum_{a \le y} n_{k,o,c,a,y}
```

**(V11) Organisatie kan per jaar een beperkt aantal voertuigen invoeren.**
```math
\sum_{k,c} b_{k,o,c,y} \le b^{\max}_{o,y}
```

**(V12) Meerkilometers bij lease.**
```math
\text{XL}_{k,y} \ge \sum_d w_d \sum_{j} \alpha_{j,k,y,d} L_j - \text{KM}^L_k \sum_{o}\sum_{a} n_{k,o,\text{lease},a,y}
```
(Dit is een vlootgemiddelde. Wie per voertuig wil afrekenen, splitst het type in leasevoertuigen met een eigen index.)

---

## 8. Restricties: inzet van diensten

**(D1) Elke dienst wordt gereden of uitbesteed.**
```math
\sum_{m \in \mathcal{M}} \alpha_{j,m} + \xi_j = 1 \qquad \forall j \in \mathcal{J}_d,\ \forall d, y
```

**(D2) Alleen toegestane combinaties.**
```math
\alpha_{j,m,y,d} \le \phi_{j,m,y}
```

**(D3) Een bestaand voertuig rijdt hoogstens één dienst per dag, en alleen als het er nog is.**
```math
\sum_{j \in \mathcal{J}_d} \alpha_{j,v,y,d} \le z_{v,y} \qquad \forall v, d, y
```

**(D4) Nieuwe voertuigen: niet meer diensten dan beschikbare voertuigen, met reserve.**
```math
\sum_{j \in \mathcal{J}_{d,o}} \alpha_{j,k,y,d} \le (1 - r^{\text{res}}_k)\, N_{k,o,y} \qquad \forall k, o, d, y
```

**(D5) Bedrijven met vaste koppeling voertuig en dienst** (zie [04 · Bedrijfsvarianten](04-bedrijfsvarianten.md#3-vaste-of-flexibele-planning)): elke dienst hoort bij een *plek* $`\pi(j)`$ in de vloot en mag alleen gereden worden door het voertuig of het nieuwe type dat op die plek staat. Dan wordt (D3) en (D4) vervangen door een toewijzing per plek.

**(D6) Werktijd van de chauffeur.**
```math
D_j + \sum_{m \in \mathcal{M}^E}\sum_{s \in \mathcal{S}_j} \left( \Delta D_s\, \sigma_{j,m,s} + \chi_{j,m,s} \right) \le D^{\max}_j
```

---

## 9. Restricties: accu en laden

Alle restricties in deze paragraaf gelden voor elke $`y, d`$, elke $`j \in \mathcal{J}_d`$, elke $`m \in \mathcal{M}^E`$ met $`\phi_{j,m,y} = 1`$ en elke $`t \in \mathcal{T}`$.

**(A1) Energiebalans van de accu.**
```math
E_{j,m,t} = E_{j,m,t-1} + \Delta t \sum_{q} \eta^c_q\, p_{j,m,q,t} + \sum_{s \in \mathcal{S}_j:\ t_s = t} \eta^c_s\, \varepsilon_{j,m,s} - e_{j,m,t}\,\alpha_{j,m}
```

**(A2) Cyclisch: de volgende ochtend is de accu minstens zo vol als vandaag.**
```math
E_{j,m,T} \ge E_{j,m,0}
```
(Met $`E_{j,m,0} \equiv E_{j,m,T}`$ als gelijkheid wordt het een echte periodieke dag. De ongelijkheid is iets ruimer en numeriek prettiger.)

**(A3) Grenzen van de laadtoestand.** Als de dienst niet door $`m`$ wordt gereden, is alles nul.
```math
\underline{u}_m \bar B_m\, \alpha_{j,m} \le E_{j,m,t} \le \overline{u}_m \bar B_m\, \alpha_{j,m}
```

**(A4) Één laadpunttype per voertuig op het depot.**
```math
\sum_{q \in \mathcal{Q}} \lambda_{j,m,q} \le \alpha_{j,m}
```

**(A5) Alleen laden als het voertuig er staat en aan dat type laadpunt hangt.**
```math
p_{j,m,q,t} \le \delta_{j,t}\ \min(P_q,\ P^{\text{acc}}_{m,q})\ \lambda_{j,m,q} \qquad (q \ne \text{thuis})
```
met $`P^{\text{acc}}_{m,q} = P^{AC}_m`$ voor AC-laadpunten en $`P^{DC}_m`$ voor DC. Voor thuisladen dezelfde restrictie met $`\delta^{\text{thuis}}_{j,t}`$.

**(A6) Laadcurve: boven het knikpunt neemt het vermogen lineair af.** Dit is een lineaire bovengrens die onder het knikpunt vanzelf niet bindt:
```math
\eta^c_q\, p_{j,m,q,t} \le \frac{\min(P_q, P^{\text{acc}}_{m,q})}{(\overline{u}_m - \kappa_m)}\ \left( \overline{u}_m\, \alpha_{j,m} - \frac{E_{j,m,t-1}}{\bar B_m} \right)
```
Voor een nauwkeuriger curve: meerdere segmenten, elk een eigen lineaire ongelijkheid. Omdat een laadcurve concaaf afnemend is, blijft het toegestane gebied convex en zijn geen extra binaire variabelen nodig.

**(A7) Laden onderweg: alleen als die laadkans gekozen is, binnen stilstand plus extra wachttijd.**
```math
\varepsilon_{j,m,s} \le P^{\text{rt}}_s \left( \tau_s\, \sigma_{j,m,s} + \chi_{j,m,s} \right), \qquad \chi_{j,m,s} \le \chi^{\max}_s\, \sigma_{j,m,s}, \qquad \sigma_{j,m,s} \le \alpha_{j,m}, \qquad \sigma_{j,m,s} \le \Omega^{\text{rt}}_{s}
```

**(A8) Laden onderweg begrensd door de accu op dat moment.** Volgt al uit (A1) en (A3) in tijdstap $`t_s`$. Voor laadkansen die meerdere kwartieren duren verdelen we $`\varepsilon`$ over die kwartieren met een eigen variabele per kwartier en dezelfde restricties.

**(A9) Laadcurve onderweg.** Snelladen boven 80% gaat traag. Als bovengrens:
```math
\eta^c_s\, \varepsilon_{j,m,s} \le \left(\overline{u}^{\text{rt}}_m\, \bar B_m\, \alpha_{j,m} - E_{j,m,t_s-1}\right) + M\,(1 - \sigma_{j,m,s})
```
met $`\overline{u}^{\text{rt}}_m \approx 0{,}8`$. (Het is gebruikelijk onderweg tot 80% te laden; de rest van de curve is niet de moeite.)

---

## 10. Restricties: depot, net, laadpunten, batterij en zon

Voor elk depot $`o`$, jaar $`y`$, dag $`d`$ en tijdstap $`t`$.

**(N1) Vermogensbalans op het depot.**
```math
P^{\text{imp}}_{o,t} - P^{\text{exp}}_{o,t} = \Lambda_{o,d,t} + \sum_{j \in \mathcal{J}_{d,o}}\sum_{m \in \mathcal{M}^E}\sum_{q \ne \text{thuis}} p_{j,m,q,t} + p^{\text{bc}}_{o,t} - p^{\text{bd}}_{o,t} - \Gamma_{o,d,t}\, S^{\text{pv}}_{o,y}
```

**(N2) Niet meer afnemen dan de aansluiting toelaat.** Bij flexibele contracten is $`\bar P_{o,\ell,t}`$ per tijdstap anders (bijvoorbeeld minder vermogen in de avondpiek).
```math
P^{\text{imp}}_{o,t} \le \sum_{\ell} \bar P_{o,\ell,t}\, g_{o,\ell,y}, \qquad P^{\text{exp}}_{o,t} \le \sum_\ell \bar P^{\text{exp}}_{o,\ell}\, g_{o,\ell,y}
```

**(N3) Jaarpiek en gecontracteerd vermogen.**
```math
P^{\text{pk}}_{o,y} \ge P^{\text{imp}}_{o,t,y,d} \quad \forall d,t, \qquad P^{\text{ctr}}_{o,y} \ge P^{\text{pk}}_{o,y}
```

**(N4) Precies één aansluitoptie per jaar; overstappen alleen waar toegestaan; niet vóór de wachttijd.**
```math
\sum_{\ell} g_{o,\ell,y} = 1, \qquad g^{+}_{o,\ell,y} \ge g_{o,\ell,y} - g_{o,\ell,y-1}, \qquad g_{o,\ell,y} \le \sum_{\ell'} A_{\ell',\ell}\, g_{o,\ell',y-1}, \qquad g_{o,\ell,y} = 0 \ \text{ als } y < y^{\min}_{o,\ell}
```

**(N5) Laadpunten: aantal stekkers.** Zonder omhangen ('s nachts voertuigen wisselen) hangt elk elektrisch voertuig de hele tijd dat het op het depot staat aan zijn eigen stekker:
```math
\sum_{j \in \mathcal{J}_{d,o}}\sum_{m \in \mathcal{M}^E} \delta_{j,t}\, \lambda_{j,m,q} \le N^{\text{con}}_q\, u_{o,q,y} \qquad \forall q, t
```
Met omhangen zie [04 · Bedrijfsvarianten](04-bedrijfsvarianten.md#7-omhangen-van-stekkers).

**(N6) Gedeeld vermogen per laadpunt** (een laadpaal met twee stekkers deelt zijn vermogen, een DC-kast deelt over satellieten):
```math
\sum_{j \in \mathcal{J}_{d,o}}\sum_{m} p_{j,m,q,t} \le P_q\, u_{o,q,y} \qquad \forall q, t
```

**(N7) Laadpunten: cumulatief en ruimte.**
```math
u_{o,q,y} = u_{o,q,y-1} + u^{+}_{o,q,y}, \qquad \sum_q u_{o,q,y} \le U^{\max}_o
```

**(N8) Stationaire batterij.**
```math
S^{\text{bat}}_{o,t} = S^{\text{bat}}_{o,t-1} + \Delta t\left(\eta^b p^{\text{bc}}_{o,t} - p^{\text{bd}}_{o,t}/\eta^b\right), \quad 0 \le S^{\text{bat}}_{o,t} \le E^{\text{bat}}_{o,y}, \quad p^{\text{bc}}_{o,t},\ p^{\text{bd}}_{o,t} \le P^{\text{bat}}_{o,y}, \quad S^{\text{bat}}_{o,T} \ge S^{\text{bat}}_{o,0}
```
Plus $`E^{\text{bat}}_{o,y} \ge E^{\text{bat}}_{o,y-1}`$ en idem voor vermogen en zon (geen verwijdering binnen de horizon).

**(N9) Invoer van elektrisch op een depot.**
```math
\sum_{k \in \mathcal{K}^E} N_{k,o,y} + \sum_{v \in \mathcal{V}^E: o(v) = o} z_{v,y} \le M_o\, f_{o,y}, \qquad f_{o,y} \le f_{o,y+1}
```

**(N10) Thuisladers.** Elke dienst die thuis laadt, heeft een thuislader nodig; thuisladers blijven staan.
```math
\sum_{j \in \mathcal{J}_d}\sum_{m \in \mathcal{M}^E} \lambda_{j,m,\text{thuis},y,d} \le \text{TH}_y \quad \forall d, \qquad \text{TH}_y = \text{TH}_{y-1} + \text{TH}^{+}_y
```

---

## 11. Restricties: subsidie, fiscaal, budget en beleid

### 11.1 AanZET

**(S1) Alleen voor gekochte zero-emissievrachtwagens, en niet samen met MIA.**
```math
\sum_{n: y(n) = a} x^{AZ}_{k,o,n} + x^{MIA}_{k,o,a} \le b_{k,o,\text{koop},a} \qquad \forall k \in \mathcal{K}^E,\ o,\ a
```

**(S2) Maximum per aanvrager per ronde.**
```math
\sum_{k,o} S^{AZ}_{k,n}\, x^{AZ}_{k,o,n} \le S^{AZ,\max}_n
```

**(S3) Bedrag per voertuig** (zoals de calculator rekent): $`S^{AZ}_{k,n} = \min(\text{pct}_{\text{klasse},\text{grootte}} \cdot \text{Pr}_{k}, \ \max_{\text{klasse},\text{grootte}})`$, met klasse N2 of N3 en de bedrijfsgrootte van de klant.

**Timing.** AanZET vraag je aan vóór je de koopovereenkomst tekent. In het model betekent dat: een aankoop in jaar $`a`$ kan alleen subsidie krijgen uit een ronde in jaar $`a`$ (of het jaar ervoor, als $`y(n) = a - 1`$ en de levertijd dat toelaat). De kans $`\rho_n`$ vangt op dat rondes overtekend raken; in de stochastische versie wordt toekenning een scenario.

Bij operational lease vraagt de leasemaatschappij de subsidie aan; die zit dan in $`\text{Ls}_{k,a}`$ en niet in het model.

### 11.2 MIA en Vamil

De calculator rekent het MIA-voordeel als $`0{,}9 \cdot \text{Pr}_k \cdot 0{,}36 \cdot t^{\text{Vpb}}`$ met $`t^{\text{Vpb}}`$ het marginale tarief (19% of 25,8%). Vamil (willekeurig afschrijven) geeft een rentevoordeel: de belastingbesparing komt eerder. In contante waarde:
```math
V^{\text{MIA}}_{k,a} = 0{,}9\,\text{Pr}_{k,a} \cdot 0{,}36 \cdot t^{\text{Vpb}} + t^{\text{Vpb}}\,\text{Pr}_{k,a}\Big( \underbrace{v^{\text{vamil}}}_{\text{direct}} + \sum_{i=1}^{N^{\text{afs}}} \frac{(1 - v^{\text{vamil}})/N^{\text{afs}}}{(1+r)^{i}} - \sum_{i=1}^{N^{\text{afs}}} \frac{1/N^{\text{afs}}}{(1+r)^{i}} \Big)
```
De eerste term is het MIA-voordeel; de tweede het verschil in contante waarde van de belastingbesparing door afschrijving met en zonder Vamil. Of een voertuig op de Milieulijst staat, verschilt per jaar (elektrische bestelbussen stonden er in 2026 niet op); dan is $`V^{\text{MIA}} = 0`$.

### 11.3 SPRILA voor laadpunten

$`S^{\text{lp}}_{q,y}`$ is het vaste bedrag per laadpunt van de regeling, begrensd op een percentage van de kosten (zie [06 · Parameters](06-parameters.md)). Omdat beide per laadpunt gelden, blijft het lineair.

### 11.4 Budget

**(B1) Netto investering per jaar.**
```math
C^{\text{inv}}_y \le \text{BU}_y
```
Als de klant met leningen werkt, kan dit een grens op het geleende bedrag zijn in plaats van op de investering.

### 11.5 Beleid en doelen (optioneel, per klant)

**(P1) CO₂-plafond.** $`\text{CO}_{2,y} \le \text{CO}_2^{\max,y}`$.

**(P2) Minimaal aandeel zero-emissie in de vloot.**
```math
\sum_{k \in \mathcal{K}^E, o} N_{k,o,y} + \sum_{v \in \mathcal{V}^E} z_{v,y} \ge \beta^{\text{ZE}}_y \Big( \sum_{k,o} N_{k,o,y} + \sum_v z_{v,y} \Big)
```

**(P3) Minimaal aandeel zero-emissie-kilometers** (bijvoorbeeld een klant die dat in een aanbesteding eist):
```math
\sum_d w_d \sum_j \sum_{m \in \mathcal{M}^E} L_j\,\alpha_{j,m} \ge \beta^{\text{km}}_y \sum_d w_d \sum_j L_j
```

**Pareto.** Door (P1) of (P2) voor een reeks waarden op te lossen (epsilon-constraint-methode) krijgen we de afweging kosten tegen CO₂: wat kost elke extra ton besparing. Dat is een sterke grafiek voor het rapport.

---

## 12. Uitbreiding: onzekerheid (stochastisch model)

Dieselprijs, stroomprijs, restwaarde van elektrische vrachtwagens, subsidietoekenning en netaansluiting zijn onzeker. Twee manieren:

### 12.1 Tweefasen stochastisch programma

Scenario's $`\omega \in \Omega`$ met kans $`p_\omega`$ geven prijspaden $`\pi^D_{y,\omega}`$, $`\pi^{\text{imp}}_{\cdot,\omega}`$, restwaarden $`\text{RW}_{k,A,\omega}`$, toekenning AanZET $`\rho_{n,\omega} \in \{0,1\}`$ en de datum waarop een netverzwaring klaar is $`y^{\min}_{o,\ell,\omega}`$.

- **Eerste fase** (nu beslissen, gelijk in alle scenario's): alle strategische variabelen voor de jaren $`y \le Y_1`$ (meestal $`Y_1 = 1`$ of $`2`$): wat bestellen we nu, welke netverzwaring vragen we nu aan.
- **Tweede fase** (per scenario): alles daarna en alle operationele variabelen.

Elke variabele krijgt een index $`\omega`$, plus de niet-anticipatieve restricties
```math
X_{y,\omega} = X_{y,\omega'} \qquad \forall \omega, \omega',\ y \le Y_1
```
en de doelfunctie wordt de verwachte waarde
```math
\min \sum_{\omega} p_\omega\, Z_\omega
```

### 12.2 Risico meenemen (CVaR)

Een ondernemer wil vaak niet alleen de laagste verwachte kosten, maar ook geen grote tegenvaller. Met Conditional Value at Risk op niveau $`\beta`$ (bijvoorbeeld 0,9: het gemiddelde van de duurste 10% van de scenario's), lineair volgens Rockafellar en Uryasev:
```math
\min\ (1 - \mu) \sum_\omega p_\omega Z_\omega + \mu \Big( \zeta + \frac{1}{1 - \beta}\sum_\omega p_\omega\, \nu_\omega \Big), \qquad \nu_\omega \ge Z_\omega - \zeta,\ \ \nu_\omega \ge 0
```
$`\mu \in [0,1]`$ is de risicohouding van de klant.

### 12.3 Robuuste haalbaarheid

Voor de ritten willen we geen verwachting maar zekerheid: de extreme dagen $`\mathcal{D}^x`$ moeten in elk scenario haalbaar zijn. Dat zit al in het model doordat (D1) en §9 ook voor die dagen gelden, terwijl $`w_d`$ klein is.

### 12.4 Monte Carlo achteraf

Simpeler en voor het rapport vaak genoeg: los het deterministische model op, houd het plan vast en reken het door in 5.000 getrokken scenario's. Dan zie je in hoeveel procent van de scenario's het plan goedkoper is dan alles diesel laten, en de bandbreedte van de besparing.

---

## 13. Linearisaties en modelleertrucs

### 13.1 Product van binair en continu

Overal waar een grens alleen moet gelden als een binaire variabele 1 is, vermenigvuldigen we de grens met die variabele (A3, A5, A7). Dat is exact zolang de grens een parameter is. Waar twee variabelen vermenigvuldigd zouden worden (bijvoorbeeld laadvermogen maal "staat aan stekker"), voorkomen we dat door de variabelen per paar $`(j,m)`$ en per type $`q`$ te maken.

### 13.2 Laadcurve

Concaaf afnemend vermogen boven het knikpunt is een snijpunt van lineaire bovengrenzen (A6). Geen binaire variabelen nodig.

### 13.3 Energiebelasting in schijven

Energiebelasting per kWh daalt per schijf jaarverbruik. Kosten als functie van jaarverbruik $`W_{o,y}`$ zijn dan concaaf; dat kan bij minimalisatie niet zonder binaire variabelen. Exact met SOS2 (Gurobi ondersteunt dat direct):
```math
W_{o,y} = \sum_d w_d\sum_t P^{\text{imp}}_{o,t}\Delta t = \sum_{i} \lambda^{EB}_{o,y,i}\, W_i, \qquad \text{EB}_{o,y} = \sum_i \lambda^{EB}_{o,y,i}\, \text{EB}(W_i), \qquad \sum_i \lambda^{EB}_{o,y,i} = 1,\ \ \lambda^{EB} \in \text{SOS2}
```
met $`W_i`$ de schijfgrenzen. In de praktijk weet je vooraf in welke schijf een depot valt; dan is een vaste marginale prijs per kWh exact genoeg en houden we het model lineair. We controleren dat achteraf.

### 13.4 Maandpieken

Als de representatieve dagen per seizoen gekozen zijn, met $`\mathcal{D}_{\mu}`$ de dagen die maand(type) $`\mu`$ vertegenwoordigen:
```math
P^{\text{pk}}_{o,y,\mu} \ge P^{\text{imp}}_{o,t,y,d}\quad \forall d \in \mathcal{D}_\mu,\ t, \qquad C^{\text{net}} \ni \sum_\mu n_\mu\, \theta^{\max}_o P^{\text{pk}}_{o,y,\mu}
```
met $`n_\mu`$ het aantal maanden van dat type.

### 13.5 Accuveroudering

Standaard rekenen we met de ontwerpcapaciteit $`\bar B_m = h_m B_m`$ (bijvoorbeeld 85% van nieuw). Dat is behoudend: als de rit dan nog past, past hij het hele voertuigleven. Nauwkeuriger, per cohort: een capaciteit die met de leeftijd afneemt,
```math
\bar B_{k,A} = B_k \left(1 - \delta^{\text{kal}}_k\,A - \delta^{\text{cyc}}_k\, \text{FEC}_{k,A}\right)
```
met FEC het aantal volledige laadcycli. Dan wordt de inzet per cohort gemodelleerd (de soort $`m`$ krijgt een leeftijd). Dat maakt het model groter en voegt voor de beslissing zelden iets toe.

### 13.6 Gelijktijdig laden en ontladen van de batterij

Bij positieve prijzen doet een optimale oplossing dat niet. Bij negatieve stroomprijzen wel (energie weggooien via verliezen). Als dat ongewenst is: een binaire variabele per tijdstap die één van beide toestaat.

### 13.7 Leeftijdsafhankelijke onderhoudskosten

Als onderhoud per km stijgt met leeftijd, zit dat in $`\text{on}_m`$ per bestaand voertuig en per cohortleeftijd (de rijkosten worden dan per cohort uitgesplitst). Lineair, alleen meer indices.

---

## 14. Versterkingen (snellere oplossing)

1. **Voorbewerking schrappen.** Alleen paren $`(j,m)`$ met $`\phi_{j,m,y} = 1`$ bestaan als variabele. Dat scheelt vaak meer dan de helft.
2. **Dominantie.** Als type $`k`$ duurder is én op alle eigenschappen slechter dan $`k'`$ (accu, laadvermogen, verbruik, laadvermogen kg), dan valt $`k`$ weg.
3. **Symmetrie.** Nieuwe voertuigen zijn al geaggregeerd per type (geen individuele variabelen). Voor identieke bestaande voertuigen: $`z_{v,y} \ge z_{v',y}`$ als $`v`$ en $`v'`$ identiek zijn en $`v`$ de hogere restwaarde heeft (het model verkoopt eerst de oudste).
4. **Geldige ongelijkheid voor de piek.** Wat 's nachts geladen moet worden, moet door de aansluiting:
   ```math
   P^{\text{pk}}_{o,y} \ge \frac{1}{|\mathcal{T}^{\text{nacht}}|\,\Delta t}\Big( \sum_{j \in \mathcal{J}_{d,o}}\sum_{m}\frac{e_{j,m}\,\alpha_{j,m} - \sum_s \eta^c_s \varepsilon_{j,m,s}}{\max_q \eta^c_q} + \sum_{t \in \mathcal{T}^{\text{nacht}}} \Lambda_{o,d,t}\Delta t \Big) - \Gamma^{\text{nacht}}
   ```
5. **Startoplossing.** Heuristiek: rangschik diensten op besparing per dienst (calculator per voertuig), elektrificeer in die volgorde zolang het laadschema (een LP) haalbaar blijft. Geef dat als `Start` aan Gurobi.
6. **Tijdresolutie.** Strategisch rekenen met uurstappen, het gekozen plan daarna per kwartier controleren.

---

## 15. Wat het model bewust niet doet

- **Ritplanning zelf.** We nemen de diensten zoals ze zijn. Ritten opnieuw opknippen (vehicle routing) kan meer elektrisch mogelijk maken, maar is een ander vak en een ander gesprek met de klant. Wel kunnen we diensten wisselen tussen voertuigen (D3/D4).
- **Wachtrij bij snelladers.** We nemen een effectief laadvermogen $`P^{\text{rt}}_s`$ dat beschikbaarheid meeneemt, geen wachtrijmodel.
- **Netcongestie op wijkniveau.** De netbeheerder bepaalt of verzwaring kan; wij nemen $`y^{\min}_{o,\ell}`$ en $`\bar P_{o,\ell,t}`$ als gegeven per scenario.
- **Btw.** Alles is exclusief btw, zoals in de calculator. Voor een vrijgestelde ondernemer kan btw een kostenpost zijn; dat is een parameteraanpassing.
- **Personeel.** Chauffeurs en planners zitten niet als variabele in het model, alleen als extra tijd en invoerkosten.
