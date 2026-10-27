"""Rekenvoorbeeld bij 07-rekenvoorbeeld.md: laadschema van drie bakwagens op een depot met 3x80A.

Lost per scenario het laad-LP van model §9 en §10 op voor de zware winterdag (kwartieren),
en vergelijkt slim laden met dom laden (vol vermogen vanaf aankomst).
Draaien: pip install highspy numpy && python rekenvoorbeeld.py
"""
import highspy
import numpy as np

T, DT = 96, 0.25                      # kwartieren
AANSLUITING = 55.0                    # kW, 3x80A
ETA_DEPOT, ETA_ONDERWEG = 0.92, 0.95  # net naar accu
P_LAADPUNT = 22.0                     # kW, AC
B_ONTWERP = 300 * 0.85                # kWh: bruikbaar 300, ontwerp-SoH 85%
U_MIN, U_MAX, U_ONDERWEG_MAX = 0.10, 1.00, 0.80
VERBRUIK = 1.20                       # kWh/km, zware winterdag incl. 10% marge
P_SNELLADER = 120.0                   # kW effectief


def uur(t):
    return t * DT


GEBOUW = np.array([20.0 if 7 <= uur(t) < 18 else 5.0 for t in range(T)])

# dienst: vertrek, terug (uur), km, pauze met snellader (start, eind) of None
DIENSTEN = {
    "D1": (6.0, 15.0, 180, None),
    "D2": (5.0, 17.0, 260, (10.5, 11.25)),
    "D3": (7.0, 16.0, 120, None),
}


def profiel(dienst):
    vertrek, terug, km, pauze = DIENSTEN[dienst]
    weg = np.array([vertrek <= uur(t) < terug for t in range(T)])
    in_pauze = np.array([pauze is not None and pauze[0] <= uur(t) < pauze[1] for t in range(T)])
    rijden = weg & ~in_pauze
    e = np.where(rijden, km * VERBRUIK / rijden.sum(), 0.0)
    return ~weg, in_pauze, e


def laadschema(diensten, onderweg_laden=True, minimaliseer_piek=True):
    h = highspy.Highs()
    h.setOptionValue("output_flag", False)
    piek = h.addVariable(lb=0, ub=AANSLUITING if not minimaliseer_piek else highspy.kHighsInf)
    imp = [h.addVariable(lb=0) for _ in range(T)]
    laad = {}
    for d in diensten:
        op_depot, in_pauze, e = profiel(d)
        p = [h.addVariable(lb=0, ub=P_LAADPUNT if op_depot[t] else 0) for t in range(T)]
        eps = [h.addVariable(lb=0, ub=(P_SNELLADER * DT if (in_pauze[t] and onderweg_laden) else 0)) for t in range(T)]
        E = [h.addVariable(lb=U_MIN * B_ONTWERP, ub=U_MAX * B_ONTWERP) for _ in range(T + 1)]
        for t in range(T):
            # (A1) accubalans
            h.addConstr(E[t + 1] - E[t] - ETA_DEPOT * DT * p[t] - ETA_ONDERWEG * eps[t] == -e[t])
            # (A9) onderweg tot 80%
            if in_pauze[t]:
                h.addConstr(E[t + 1] <= U_ONDERWEG_MAX * B_ONTWERP)
        h.addConstr(E[T] - E[0] >= 0)    # (A2) cyclisch
        laad[d] = (p, eps)
    for t in range(T):
        # (N1) en (N3)
        h.addConstr(imp[t] - sum(laad[d][0][t] for d in diensten) == GEBOUW[t])
        h.addConstr(piek - imp[t] >= 0)
    h.minimize(piek)
    if h.getModelStatus() != highspy.HighsModelStatus.kOptimal:
        return None
    sol = h.getSolution().col_value
    onderweg = sum(sol[v.index] for d in diensten for v in laad[d][1])
    return sol[piek.index], onderweg


def dom_laden(diensten):
    """Iedereen laadt op vol vermogen vanaf aankomst tot vol; geeft de piekafname."""
    belasting = GEBOUW.copy()
    for d in diensten:
        vertrek, terug, km, pauze = DIENSTEN[d]
        _, in_pauze, e = profiel(d)
        nodig = e.sum() / ETA_DEPOT
        if pauze is not None:
            nodig -= min(P_SNELLADER * DT * in_pauze.sum() * ETA_ONDERWEG, e.sum()) / ETA_DEPOT
        t = int(terug / DT)
        while nodig > 1e-9:
            stap = min(P_LAADPUNT * DT, nodig)
            belasting[t % T] += stap / DT
            nodig -= stap
            t += 1
    return belasting.max()


if __name__ == "__main__":
    for naam, diensten, onderweg in [
        ("A: geen onderweg laden, D1 en D3 elektrisch", ["D1", "D3"], False),
        ("B: laden in de pauze, alle drie elektrisch", ["D1", "D2", "D3"], True),
        ("D2 elektrisch zonder onderweg laden", ["D2"], False),
    ]:
        r = laadschema(diensten, onderweg)
        if r is None:
            print(f"{naam}: ONDOENLIJK")
            continue
        piek, kwh_onderweg = r
        print(f"{naam}: minimale piek {piek:.1f} kW (grens {AANSLUITING:.0f}), "
              f"onderweg geladen {kwh_onderweg:.1f} kWh (netkant), dom laden piek {dom_laden(diensten):.1f} kW")
