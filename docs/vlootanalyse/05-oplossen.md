# 05 · Oplossen met Gurobi

Hoe het model uit [03 · Model](03-model.md) in code komt, hoe groot het wordt, hoe we het oplosbaar houden en wat eruit komt. De code hieronder is een skelet om mee te beginnen, geen geteste implementatie.

---

## 1. Solver en modelleertaal

| Keuze | Advies |
| --- | --- |
| Solver | **Gurobi** voor klantwerk. Voor ontwikkelen en testen kan het open-source **HiGHS** (gratis, ook commercieel). |
| Licentie | `pip install gurobipy` bevat een beperkte licentie voor kleine modellen (enkele duizenden variabelen en restricties), genoeg voor tests en het [rekenvoorbeeld](07-rekenvoorbeeld.md). Academische licenties zijn alleen voor onderwijs en onderzoek; voor betaalde klantopdrachten is een commerciële licentie nodig. Vraag Gurobi naar de mogelijkheden voor een kleine onderneming of gebruik per rekenuur in de cloud. |
| Modelleertaal | Direct in `gurobipy`. Dat geeft toegang tot alles wat we nodig hebben: SOS2 (§13.3 van het model), lazy constraints voor Benders, `Start` voor een startoplossing, `fixed()` voor schaduwprijzen, multi-scenario en multi-objective. Wil je solveronafhankelijk blijven, dan kan `linopy` of `pyomo`, met iets meer bouwtijd. |
| Taal | Python 3.11 of nieuwer, pandas voor data, numpy voor de voorbewerking. |

Bewaar de modelcode in een **privé** repository; deze repository is openbaar en voedt de website.

---

## 2. Hoe groot wordt het model

De operationele laag domineert. Aantal continue variabelen ongeveer:

```math
\#\text{var} \approx |\mathcal{Y}| \cdot |\mathcal{D}| \cdot \sum_{j} |\mathcal{M}^E_j| \cdot T \cdot (1 + |\mathcal{Q}_j|)
```

met $`|\mathcal{M}^E_j|`$ het aantal elektrische kandidaten per dienst na de voorbewerking en $`|\mathcal{Q}_j|`$ het aantal laadpunttypen dat voor die dienst in aanmerking komt.

| Vloot | Kandidaten per dienst | Laadpunttypen | Dagen | Tijdstap | Jaren | Continue variabelen | Binaire variabelen |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 bestelbussen | 2 | 1 | 6 | uur | 8 | ca. 46.000 | ca. 7.000 |
| 15 bakwagens | 3 | 2 | 10 | kwartier | 10 | ca. 1,3 miljoen | ca. 38.000 |
| 15 bakwagens | 3 | 2 | 6 | uur | 10 | ca. 190.000 | ca. 23.000 |
| 50 trekkers | 3 | 2 | 8 | uur | 10 | ca. 860.000 | ca. 240.000 |

Binair telt vooral $`\alpha`$: bij flexibele planning kan elke dienst naar elk bestaand voertuig van zijn depot plus elk nieuw type. Groepeer daarom gelijke bestaande voertuigen (zelfde soort, leeftijdsklasse en contract) tot één soort met een aantal; bij 50 trekkers scheelt dat al snel een factor 5 tot 10.

Dit zijn ordes van grootte. Tot een paar honderdduizend variabelen lost Gurobi het volledige model doorgaans direct op; daarboven gebruiken we de trucs van §3 en §4. Meet de rekentijd bij de eerste klanten en stel deze tabel bij.

---

## 3. Decompositie

### 3.1 Benders: strategisch boven, laden onder

Het laadschema per depot, jaar en dag is een LP zodra vastligt welke diensten elektrisch zijn, welke laadpunten er staan en welke aansluiting er is. Alle koppelingen met de strategische laag zitten in het rechterlid van die LP: (A3), (A5), (N2), (N3), (N5). Dat is precies de vorm waarvoor klassieke Benders-decompositie werkt.

**Hoofdprobleem (master):** alle strategische variabelen, plus $`\alpha`$, $`\lambda`$, $`\sigma`$ en per $`(o,y,d)`$ een variabele $`\theta_{o,y,d}`$ voor de stroomkosten van die dag. Plus deze geldige ongelijkheden zodat het hoofdprobleem niet te optimistisch is:

```math
\text{(M1)}\quad e_{j,m}\,\alpha_{j,m} - \sum_{s}\eta^c_s\,\varepsilon_{j,m,s} \le (\overline{u}_m - \underline{u}_m)\bar B_m\,\alpha_{j,m} + \sum_q \eta^c_q \min(P_q, P^{\text{acc}}_{m,q})\,|W_j|\,\Delta t\ \lambda_{j,m,q}
```
```math
\text{(M2)}\quad \sum_{j \in \mathcal{J}_{d,o}}\sum_m \frac{e_{j,m}\alpha_{j,m} - \sum_s \eta^c_s \varepsilon_{j,m,s}}{\eta^c} \le \sum_{t} \Big(\sum_\ell \bar P_{o,\ell,t}\, g_{o,\ell,y} - \Lambda_{o,d,t}\Big)\Delta t + (\text{batterij en zon})
```

met $`W_j`$ de tijdstappen dat het voertuig op het depot staat. (M1) zegt: wat de dienst verbruikt, moet uit de accu plus het depotladen komen. (M2) zegt: alles wat op het depot geladen wordt, moet over de dag door de aansluiting.

**Deelproblemen:** per $`(o,y,d)`$ de LP van §9 en §10 van het model met de waarden uit het hoofdprobleem vast. Dat zijn kleine LP's, onafhankelijk van elkaar, dus parallel op te lossen.

- **Ondoenlijk** (het laadschema past niet): de Farkas-duale geeft een **haalbaarheidssnede** in de variabelen van het hoofdprobleem.
- **Doenlijk** met kosten hoger dan $`\theta_{o,y,d}`$: de duale oplossing geeft een **optimaliteitssnede** $`\theta_{o,y,d} \ge \dots`$.

**In Gurobi:** het hoofdprobleem met `LazyConstraints = 1` en een callback die bij elke nieuwe gehele oplossing (`MIPSOL`) de deelproblemen oplost en sneden toevoegt met `cbLazy`. Een snelle variant: alleen bij gehele oplossingen sneden toevoegen, en de deelproblemen hergebruiken (alleen het rechterlid aanpassen en opnieuw oplossen; Gurobi start dan warm).

### 3.2 Handmatige variant voor de eerste klanten

Voor kleine vloten en de eerste klanten is volledig Benders niet nodig. Dezelfde gedachte met de hand:

1. Los het strategische model op met (M1) en (M2) in plaats van het volledige laadschema (geen tijdstappen, dus klein en snel).
2. Reken het gekozen plan na met de laad-LP per depot, jaar en representatieve dag, op kwartierniveau.
3. Past een dag niet: voeg een snede toe die die combinatie verbiedt (bijvoorbeeld "niet meer dan zoveel elektrische diensten op dit depot zonder verzwaring") en los opnieuw op.
4. Meestal klaar na 1 tot 3 rondes.

---

## 4. Andere manieren om het klein te houden

1. **Uur in plaats van kwartier** voor de strategische beslissing; het gekozen plan op kwartier narekenen (factor 4 minder).
2. **Minder representatieve dagen** in de strategische run (6) en meer (12 plus extremen) in de controle.
3. **Jaren groeperen.** Als prijzen en regels tussen jaren weinig verschillen, kunnen jaren met dezelfde vloot één operationeel blok delen. Alternatief: rollende horizon, waarbij jaren 1 tot 3 in detail en 4 tot 10 grof worden gerekend, en het venster daarna opschuift.
4. **Voorbewerking streng.** Paren $`(j,m)`$ die nooit kunnen, bestaan niet als variabele. Gedomineerde typen eruit.
5. **Diensten groeperen.** Diensten met bijna hetzelfde profiel (vertrek, terugkomst, energie binnen 5%) en dezelfde eisen samenvoegen tot een dienst met een aantal. Dan wordt $`\alpha`$ een geheel getal in plaats van binair.

---

## 5. Codeskelet in gurobipy

De structuur van de code volgt het model. `I` is een instantie-object dat de data-stap ([02 · Data](02-data.md)) en de configuratie ([04 · Bedrijfsvarianten](04-bedrijfsvarianten.md#20-klantconfiguratie-in-één-bestand)) samen leveren: verzamelingen als lijsten en tupels, parameters als dicts.

```python
import gurobipy as gp
from gurobipy import GRB, quicksum


def bouw_model(I):
    M = gp.Model("vlootplan")
    Y, T, dt = I.Y, I.T, I.dt          # Y = [1, ..., H], T = 96, dt = 0.25

    # ---------- strategische variabelen (model §4.1)
    z = M.addVars(I.V, Y, vtype=GRB.BINARY, name="z")
    b = M.addVars(I.KOCA, vtype=GRB.INTEGER, name="b")        # sleutel (k, o, c, a)
    n = M.addVars(I.KOCAY, vtype=GRB.INTEGER, name="n")       # sleutel (k, o, c, a, y), y >= a
    N = M.addVars(I.K, I.O, Y, vtype=GRB.INTEGER, name="N")
    g = M.addVars(I.OL, Y, vtype=GRB.BINARY, name="g")        # sleutel (o, l, y)
    gplus = M.addVars(I.OL, Y, vtype=GRB.BINARY, name="gplus")
    u = M.addVars(I.O, I.Q, Y, vtype=GRB.INTEGER, name="u")
    uplus = M.addVars(I.O, I.Q, Y, vtype=GRB.INTEGER, name="uplus")
    Ppk = M.addVars(I.O, Y, name="Ppk")
    Pctr = M.addVars(I.O, Y, name="Pctr")

    # ---------- operationele variabelen (model §4.2), alleen toegestane paren
    alpha = M.addVars(I.YDJM, vtype=GRB.BINARY, name="alpha")   # (y, d, j, m)
    xi = M.addVars(I.YDJ, vtype=GRB.BINARY, name="xi")          # (y, d, j)
    lam = M.addVars(I.YDJMQ, vtype=GRB.BINARY, name="lam")      # (y, d, j, m, q), m elektrisch
    p = M.addVars(I.YDJMQT, name="p")                           # (y, d, j, m, q, t)
    E = M.addVars(I.YDJMT0, name="E")                           # (y, d, j, m, t), t = 0..T
    sig = M.addVars(I.YDJMS, vtype=GRB.BINARY, name="sig")      # laadkans gebruikt
    eps = M.addVars(I.YDJMS, name="eps")                        # geladen energie onderweg
    chi = M.addVars(I.YDJMS, name="chi")                        # extra wachttijd
    Pimp = M.addVars(I.YDOT, name="Pimp")                       # (y, d, o, t)
    Pexp = M.addVars(I.YDOT, name="Pexp")

    # ---------- vloot (model §7)
    M.addConstrs((z[v, y + 1] <= z[v, y] for v in I.V for y in Y[:-1]), name="V1")
    M.addConstrs((n[k, o, c, a, a] == b[k, o, c, a] for (k, o, c, a) in I.KOCA), name="V5")
    for (k, o, c, a, y) in I.KOCAY:
        if c == "koop" and (k, o, c, a, y + 1) in n:
            M.addConstr(n[k, o, c, a, y + 1] <= n[k, o, c, a, y], name=f"V6[{k},{o},{a},{y}]")
        if c == "lease":
            if y < a + I.tauL[k]:
                M.addConstr(n[k, o, c, a, y] == b[k, o, c, a], name=f"V7a[{k},{o},{a},{y}]")
            else:
                M.addConstr(n[k, o, c, a, y] == 0, name=f"V7b[{k},{o},{a},{y}]")
    for (k, o, c, a) in I.KOCA:
        if a < I.y_lev[k]:
            M.addConstr(b[k, o, c, a] == 0, name=f"V9[{k},{o},{c},{a}]")
    M.addConstrs((N[k, o, y] == quicksum(n[key] for key in I.cohorten_in_jaar[k, o, y])
                  for k in I.K for o in I.O for y in Y), name="V10")

    for (y, d) in I.YD:
        # ---------- inzet (model §8)
        for j in I.J[d]:
            M.addConstr(quicksum(alpha[y, d, j, m] for m in I.M_toegestaan[y, j]) + xi[y, d, j] == 1,
                        name=f"D1[{y},{d},{j}]")
        for v in I.V:
            M.addConstr(quicksum(alpha[key] for key in I.diensten_van[y, d, v]) <= z[v, y],
                        name=f"D3[{y},{d},{v}]")
        for k in I.K:
            for o in I.O:
                M.addConstr(quicksum(alpha[key] for key in I.diensten_van_type[y, d, k, o])
                            <= (1 - I.res[k]) * N[k, o, y], name=f"D4[{y},{d},{k},{o}]")

        # ---------- accu en laden (model §9)
        for (j, m) in I.paren_E[y, d]:
            B = I.Bbar[m]
            a_ = alpha[y, d, j, m]
            for t in range(1, T + 1):
                depot = dt * quicksum(I.eta[q] * p[y, d, j, m, q, t] for q in I.Q_paar[j, m])
                onderweg = quicksum(I.eta_rt * eps[y, d, j, m, s] for s in I.S_in_stap[j, t])
                M.addConstr(E[y, d, j, m, t] == E[y, d, j, m, t - 1] + depot + onderweg
                            - I.e[j, m][t - 1] * a_, name=f"A1[{y},{d},{j},{m},{t}]")
                M.addConstr(E[y, d, j, m, t] >= I.umin[m] * B * a_, name=f"A3l[{y},{d},{j},{m},{t}]")
                M.addConstr(E[y, d, j, m, t] <= I.umax[m] * B * a_, name=f"A3u[{y},{d},{j},{m},{t}]")
            M.addConstr(E[y, d, j, m, T] >= E[y, d, j, m, 0], name=f"A2[{y},{d},{j},{m}]")
            M.addConstr(quicksum(lam[y, d, j, m, q] for q in I.Q_paar[j, m]) <= a_,
                        name=f"A4[{y},{d},{j},{m}]")
            for q in I.Q_paar[j, m]:
                Pmax = min(I.Pq[q], I.Pacc[m, q])
                knik = Pmax / (I.umax[m] - I.knik[m])
                for t in range(1, T + 1):
                    M.addConstr(p[y, d, j, m, q, t] <= I.delta[j, t] * Pmax * lam[y, d, j, m, q],
                                name=f"A5[{y},{d},{j},{m},{q},{t}]")
                    M.addConstr(I.eta[q] * p[y, d, j, m, q, t]
                                <= knik * (I.umax[m] * a_ - E[y, d, j, m, t - 1] / B),
                                name=f"A6[{y},{d},{j},{m},{q},{t}]")
            for s in I.S[j]:
                M.addConstr(eps[y, d, j, m, s] <= I.Prt[s] * (I.tau[s] * sig[y, d, j, m, s] + chi[y, d, j, m, s]),
                            name=f"A7a[{y},{d},{j},{m},{s}]")
                M.addConstr(chi[y, d, j, m, s] <= I.chi_max[s] * sig[y, d, j, m, s])
                M.addConstr(sig[y, d, j, m, s] <= a_ * I.toegestaan_rt[s])

        # ---------- depot en net (model §10)
        for o in I.O:
            for t in range(1, T + 1):
                laad = quicksum(p[key] for key in I.p_op_depot[y, d, o, t])
                M.addConstr(Pimp[y, d, o, t] - Pexp[y, d, o, t] == I.gebouw[o, d, t] + laad,
                            name=f"N1[{y},{d},{o},{t}]")
                M.addConstr(Pimp[y, d, o, t] <= quicksum(I.Pcap[o, l, t] * g[o, l, y] for l in I.L[o]),
                            name=f"N2[{y},{d},{o},{t}]")
                M.addConstr(Ppk[o, y] >= Pimp[y, d, o, t], name=f"N3[{y},{d},{o},{t}]")
                for q in I.Q:
                    M.addConstr(quicksum(I.delta[j, t] * lam[key] for (j, key) in I.lam_op_depot[y, d, o, q])
                                <= I.Ncon[q] * u[o, q, y], name=f"N5[{y},{d},{o},{q},{t}]")
                    M.addConstr(quicksum(p[key] for key in I.p_op_type[y, d, o, q, t])
                                <= I.Pq[q] * u[o, q, y], name=f"N6[{y},{d},{o},{q},{t}]")

    for o in I.O:
        for y in Y:
            M.addConstr(g.sum(o, "*", y) == 1, name=f"N4a[{o},{y}]")
            M.addConstr(Pctr[o, y] >= Ppk[o, y], name=f"N3b[{o},{y}]")
            for l in I.L[o]:
                vorige = g[o, l, y - 1] if y > Y[0] else I.g0[o, l]
                M.addConstr(gplus[o, l, y] >= g[o, l, y] - vorige, name=f"N4b[{o},{l},{y}]")
                if y < I.y_min[o, l]:
                    M.addConstr(g[o, l, y] == 0, name=f"N4c[{o},{l},{y}]")
            for q in I.Q:
                vorige = u[o, q, y - 1] if y > Y[0] else I.u0[o, q]
                M.addConstr(u[o, q, y] == vorige + uplus[o, q, y], name=f"N7[{o},{q},{y}]")

    # ---------- doelfunctie (model §6), bedragen in duizend euro voor de numeriek
    DF = {y: (1 + I.r) ** -(y - Y[0]) for y in Y}
    DFm = {y: (1 + I.r) ** -(y - Y[0] + 0.5) for y in Y}
    inv = (quicksum(DF[a] * I.prijs[k, a] * b[k, o, c, a] for (k, o, c, a) in I.KOCA if c == "koop")
           + quicksum(DF[y] * (I.I_lp[q, y] - I.S_lp[q, y]) * uplus[o, q, y]
                      for o in I.O for q in I.Q for y in Y)
           + quicksum(DF[y] * I.I_net[o, l] * gplus[o, l, y] for (o, l) in I.OL for y in Y))
    lease = quicksum(DFm[y] * 12 * I.leaseprijs[k, a] * n[k, o, c, a, y]
                     for (k, o, c, a, y) in I.KOCAY if c == "lease")
    vast = (quicksum(DFm[y] * I.F[v] * z[v, y] for v in I.V for y in Y)
            + quicksum(DFm[y] * I.F[k] * N[k, o, y] for k in I.K for o in I.O for y in Y))
    rij = (quicksum(DFm[y] * I.w[d] * I.rijkosten[y, j, m] * alpha[y, d, j, m] for (y, d, j, m) in I.YDJM)
           + quicksum(DFm[y] * I.w[d] * I.pi_rt[s, y] * eps[y, d, j, m, s] for (y, d, j, m, s) in I.YDJMS)
           + quicksum(DFm[y] * I.w[d] * I.c_chf * chi[y, d, j, m, s] for (y, d, j, m, s) in I.YDJMS)
           + quicksum(DFm[y] * I.w[d] * I.c_sub[j] * xi[y, d, j] for (y, d, j) in I.YDJ))
    stroom = quicksum(DFm[y] * I.w[d] * dt * (I.pi_imp[o, y, d, t] * Pimp[y, d, o, t]
                                              - I.pi_exp[o, y, d, t] * Pexp[y, d, o, t])
                      for (y, d, o, t) in I.YDOT)
    ere = quicksum(DFm[y] * I.w[d] * dt * I.pi_ere[y] * I.eta[q] * p[y, d, j, m, q, t]
                   for (y, d, j, m, q, t) in I.YDJMQT if q != "thuis")
    net = quicksum(DFm[y] * (12 * I.th_max[o] * Ppk[o, y] + I.th_ctr[o] * Pctr[o, y]) for o in I.O for y in Y)
    verkoop = quicksum(DF[y] * I.rw0[v, y] * (z[v, y] - z[v, y + 1]) for v in I.V_koop for y in Y[:-1])
    eind = (quicksum(DF[Y[-1]] / (1 + I.r) * I.rw0[v, Y[-1]] * z[v, Y[-1]] for v in I.V_koop)
            + quicksum(DF[Y[-1]] / (1 + I.r) * I.rw[k, Y[-1] - a + 1] * n[k, o, c, a, Y[-1]]
                       for (k, o, c, a, y) in I.KOCAY if c == "koop" and y == Y[-1]))
    # Nog toevoegen: verkoop van nieuwe cohorten, subsidies (model §11), batterij en zon, CO2-prijs.
    M.setObjective(inv + lease + vast + rij + stroom - ere + net - verkoop - eind, GRB.MINIMIZE)
    return M


def los_op(M, tijdslimiet_s=3600):
    M.Params.MIPGap = 0.01          # 1% optimaliteitsgat is ruim genoeg voor dit soort advies
    M.Params.TimeLimit = tijdslimiet_s
    M.Params.NumericFocus = 1       # bedragen en kWh lopen uiteen; schaal ook naar k€
    M.Params.MIPFocus = 1           # eerst snel een goede oplossing
    M.optimize()
    return M
```

### 5.1 Schaduwprijzen

Duale waarden bestaan alleen voor een LP. Zet daarom na het oplossen alle gehele variabelen vast en los opnieuw op:

```python
vast = M.fixed()
vast.optimize()
# Waarde van 1 kW extra aansluiting op depot o in jaar y, over alle dagen en kwartieren opgeteld
# (bij een <=-restrictie in een minimalisatie is Pi <= 0; -Pi is de besparing).
def waarde_kw(o, y):
    return -sum(c.Pi for c in vast.getConstrs() if c.ConstrName.startswith(f"N2[{y},") and f",{o}," in c.ConstrName)
```

Op dezelfde manier: de duale waarde van (D4) is wat een extra voertuig van type $`k`$ waard is; die van (A3, bovengrens) wat een grotere accu waard is.

### 5.2 Nuttige Gurobi-functies

| Functie | Gebruik |
| --- | --- |
| `Start` op variabelen | Startoplossing uit de heuristiek (model §14.5). |
| `setObjectiveN` | Kosten en CO₂ hiërarchisch of gewogen: eerst minimale kosten, dan binnen 1% daarvan minimale CO₂. |
| Multi-scenario (`NumScenarios`, `ScenNObj`, `ScenNRHS`) | Gevoeligheid voor prijzen en wachttijden in één run. |
| `addGenConstrPWL` of `addSOS` | Energiebelasting in schijven (model §13.3). |
| `computeIIS()` | Als het model ondoenlijk is: welke restricties botsen. Vaak een dienst die met geen enkel type kan en waar uitbesteden uit staat. |
| `grbtune` | Automatisch zoeken naar betere solverinstellingen op een paar klantmodellen. |

---

## 6. Wat het model oplevert

| Uitvoer | Uit welke variabelen | In het rapport |
| --- | --- | --- |
| Vervangplan per jaar | $`z, b, n`$ | Tabel: per jaar welke voertuigen eruit, welke erin, koop of lease |
| Welke dienst door welk voertuig | $`\alpha`$ | Ritanalyse met kleuren |
| Laadpunten en aansluiting | $`u, g, P^{\text{ctr}}`$ | Hoeveel laadpunten van welk type, wanneer verzwaren |
| Laadprofiel van het depot | $`P^{\text{imp}}, p`$ | Grafiek gewone dag en zware dag, met de grens van de aansluiting |
| Kosten per jaar per post | De termen van de doelfunctie | Gestapelde staafgrafiek, kasstroom |
| Subsidies | $`x^{AZ}, x^{MIA}`$ | Welke ronde, hoeveel |
| CO₂ per jaar | $`\text{CO}_{2,y}`$ | Lijn tegen alles diesel |
| Waarde van een kW extra | duale van (N2) | "Een verzwaring van 100 kW is je zoveel per jaar waard" |
| Waarde van een extra voertuig of grotere accu | duale van (D4), (A3) | Onderbouwing bij een keuze tussen uitvoeringen |
| Bandbreedte | Scenario's en Monte Carlo | Kans dat het plan goedkoper is dan alles diesel |

---

## 7. Controleren en valideren

1. **Eenheidstoetsen op mini-instanties** met een bekende uitkomst:
   - één voertuig, één dienst, alles vast: de jaarkosten moeten gelijk zijn aan wat de calculator geeft met dezelfde invoer;
   - een dienst die net niet past: model kiest diesel of laden onderweg, nooit een ondoenlijk laadschema;
   - aansluiting op nul: geen elektrische inzet;
   - het [rekenvoorbeeld](07-rekenvoorbeeld.md) moet de daar genoemde uitkomsten geven.
2. **Terugtoets op alle historische dagen**, niet alleen de representatieve: het plan moet op minstens 97% van de dagen passen. Wat niet past, gaat met reden in het rapport.
3. **Plausibiliteit:** besparing per elektrische wagen vergelijken met de calculator; grote afwijkingen verklaren (bijvoorbeeld door netkosten die de calculator niet kent).
4. **Gevoeligheid:** een tornadografiek over de tien belangrijkste parameters (dieselprijs, stroomprijs, restwaarde elektrisch, aanschafprijs, verbruik, heffing, rente, subsidie, kosten verzwaring, wachttijd netbeheerder).
5. **Optimaliteitsgat** rapporteren als het boven 1% blijft.

---

## 8. Voorstel voor de codestructuur (privé repository)

```text
vlootmodel/
  config/                 # klantconfiguraties (YAML), standaardparameters
  data/                   # inlezen sjablonen, RDW, KNMI, prijzen
  voorbewerking/
    diensten.py           # ritten naar diensten, delta, laadkansen
    energie.py            # verbruiksmodel en kalibratie
    dagen.py              # representatieve dagen (k-medoids)
    geschiktheid.py       # phi en ritgeschiktheid
  model/
    instantie.py          # alle verzamelingen en parameters in één object
    strategisch.py        # variabelen en restricties §7, §11
    operationeel.py       # §8 tot §10
    doel.py               # §6
    benders.py            # §3 van dit document
  oplossen/
    heuristiek.py         # startoplossing
    scenario.py           # stochastisch en Monte Carlo
    duaal.py              # schaduwprijzen
  rapport/
    grafieken.py
    rapport.py            # pdf in de stijl van de calculator
  tests/
    test_rekenvoorbeeld.py
    test_calculator_gelijk.py
```

De rekenkern van de calculator (in `index.html`) is de bron voor de kosten per voertuig. Zet die formules één keer om naar `kosten.py` en toets met `test_calculator_gelijk.py` dat beide hetzelfde geven, zodat site en vlootanalyse nooit uit elkaar lopen.
