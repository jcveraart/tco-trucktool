"""Geteste deelregels en vast laadplan; geen productie-vervangingsoptimizer.

Eén depot, toegewezen connectoren zonder omhangen, bevestigde vaste laadvensters.
Geen klantdata, geen automatische voertuigselectie of subsidieaanvraag.
"""
from datetime import datetime, timezone
import math


def getal(x, naam, minimum=0, maximum=math.inf):
    if isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) or not minimum <= x <= maximum:
        raise ValueError(f'{naam}: eindig getal tussen {minimum} en {maximum} vereist')
    return float(x)


def reservebehoefte(diensten, reserve=0):
    for x in (diensten, reserve):
        if isinstance(x, bool) or not isinstance(x, int) or x < 0:
            raise ValueError('Diensten en afgesproken reserve zijn gehele aantallen')
    return diensten + reserve


def lease_meerkosten(km, eigendom, contract_km=0, tarief=0):
    km = getal(km, 'kilometers')
    if eigendom in ('koop', 'financial_lease'):
        return 0.0
    if eigendom != 'operational_lease':
        raise ValueError('Onbekende verwervingsvorm')
    return max(0, km - getal(contract_km, 'contractkilometers')) * getal(tarief, 'meerkilometertarief')


def tractie_kwh(kracht_n, afstand_m, rendement=.9, recuperatie=.7):
    kracht_n = getal(kracht_n, 'kracht', -math.inf)
    afstand_m = getal(afstand_m, 'afstand')
    rendement = getal(rendement, 'aandrijfrendement', 1e-9, 1)
    recuperatie = getal(recuperatie, 'recuperatierendement', 0, 1)
    return (max(kracht_n, 0) / rendement - recuperatie * max(-kracht_n, 0)) * afstand_m / 3.6e6


def hulpenergie_kwh(hvac_kw=0, hvac_uren=0, koel_kw=0, koel_uren=0, pto_kw=0, pto_uren=0):
    return sum(getal(p, 'hulpvermogen') * getal(t, 'activiteitsduur')
               for p, t in [(hvac_kw, hvac_uren), (koel_kw, koel_uren), (pto_kw, pto_uren)])


def startmutatie(eigendom, aanwezig_voor, aanwezig_na, verkoopwaarde=0, afkoop=0):
    if eigendom not in ('koop', 'financial_lease', 'operational_lease'):
        raise ValueError('Onbekende verwervingsvorm')
    if type(aanwezig_voor) is not bool or type(aanwezig_na) is not bool:
        raise ValueError('Aanwezigheid moet expliciet waar/onwaar zijn')
    weg = aanwezig_voor and not aanwezig_na
    return {'verkoop':getal(verkoopwaarde, 'verkoopwaarde') if weg and eigendom != 'operational_lease' else 0.,
            'afkoop':getal(afkoop, 'afkoop') if weg and eigendom == 'operational_lease' else 0.}


def contante_kosten(kasstromen, rente, terminale_verplichtingen=0, terminale_waarde=0, horizon=None):
    rente = getal(rente, 'rente', -.99)
    totaal = sum(getal(bedrag, 'kasstroom', -math.inf) / (1+rente)**getal(t, 'tijdstip') for t, bedrag in kasstromen)
    if terminale_verplichtingen or terminale_waarde:
        if horizon is None:
            raise ValueError('Horizon vereist bij terminale waarde/verplichtingen')
        totaal += (getal(terminale_verplichtingen, 'verplichtingen') - getal(terminale_waarde, 'terminale waarde')) / (1+rente)**getal(horizon, 'horizon')
    return totaal


def reele_rente(nominaal, inflatie):
    return (1+getal(nominaal,'nominale rente',-.99))/(1+getal(inflatie,'inflatie',-.99))-1


def aanzet_bedrag(chassis, fabrieksopties, opbouw, percentage, maximum):
    """Bedrag na extern bevestigde aanspraak; opbouw bewust buiten grondslag."""
    getal(opbouw, 'opbouw')
    return min((getal(chassis,'chassis')+getal(fabrieksopties,'fabrieksopties')) *
               getal(percentage,'subsidiepercentage',0,1), getal(maximum,'maximum'))


def fiscale_regel(code, jaar):
    if code == 'D3116' and jaar == 2026:
        return {'grondslag_fractie':.9, 'mia':.36, 'vamil':0.}
    raise ValueError('Geen bevestigde regel voor code en investeringsjaar; broncontrole vereist')


def controle_subsidies(aanzet=False, mia=False, houd_jaren=None, erkende_uitzondering=False):
    if aanzet and mia:
        raise ValueError('AanZET en MIA niet voor dezelfde investering')
    if aanzet and not erkende_uitzondering and (houd_jaren is None or getal(houd_jaren,'houdperiode') < 4):
        raise ValueError('Vier jaar aanhouden of terugbetaling/erkende uitzondering uitwerken')


def fallback(extreem, toegestaan, capaciteit_bevestigd, prijs, jaargebeurtenissen=None):
    """Geen daggewicht als argument: gewicht nul maakt nooddekking niet gratis."""
    if not toegestaan or not capaciteit_bevestigd:
        raise ValueError('Geen bevestigde externe dekking; eigen plan moet haalbaar zijn')
    kosten = getal(prijs, 'fallbackprijs')
    return {'extreme_dag':bool(extreem), 'kosten_per_gebeurtenis':kosten,
            'jaarkosten':None if jaargebeurtenissen is None else kosten*getal(jaargebeurtenissen,'gebeurtenissen')}


def tijdstip(s):
    try:
        d = datetime.fromisoformat(s.replace('Z','+00:00'))
    except (ValueError, AttributeError) as e:
        raise ValueError('ISO-datum/tijd met UTC-offset vereist') from e
    if d.tzinfo is None or d.utcoffset() is None:
        raise ValueError('Tijdzone ontbreekt; geen lokale tijd gokken')
    return d.astimezone(timezone.utc)


def normaliseer_meter(records, eenheid):
    if eenheid not in ('kWh', 'kW'):
        raise ValueError('Expliciete eenheid kWh of gemiddeld kW vereist')
    rows, issues = [], []
    for r in records:
        start, eind = tijdstip(r['start']), tijdstip(r['eind'])
        uren = (eind-start).total_seconds()/3600
        if uren <= 0:
            raise ValueError('Interval moet positieve werkelijke duur hebben')
        waarde = getal(r['waarde'],'meterwaarde')
        rows.append({'start':start.isoformat(), 'eind':eind.isoformat(), 'uren':uren,
                     'kwh':waarde if eenheid=='kWh' else waarde*uren,
                     'kw':waarde/uren if eenheid=='kWh' else waarde})
    rows.sort(key=lambda r:r['start'])
    for a,b in zip(rows,rows[1:]):
        if b['start'] < a['eind']:
            raise ValueError('Dubbel of overlappend meterinterval')
        if b['start'] > a['eind']:
            issues.append({'type':'ontbrekend_interval','van':a['eind'],'tot':b['start']})
    return {'intervallen':rows, 'issues':issues, 'volledig':bool(rows) and not issues}


def gegevensniveau(ritten, meter, contract, uitvoering):
    if not ritten:
        return 'alleen_kostenbandbreedte'
    if not uitvoering:
        return 'geschiktheid_niet_aangetoond'
    if not meter or not contract:
        return 'ritscreening_geen_depotbewijs'
    return 'klaar_voor_chronologische_toets'


def _invoer(data, modus):
    if set(data)-{'dt','tijdstippen','gebouw_kw','net_kw','kasten','voertuigen'}:
        raise ValueError('Onbekende modeloptie; niet stilzwijgend genegeerd')
    if modus not in ('cyclische_screening','chronologisch'):
        raise ValueError('Onbekende modus')
    dt = [getal(x,'intervalduur',1e-9) for x in data['dt']]
    if not dt:
        raise ValueError('Lege tijdreeks')
    n=len(dt)
    if modus=='chronologisch':
        tijden=[tijdstip(x) for x in data.get('tijdstippen',[])]
        if len(tijden)!=n+1 or any(abs((b-a).total_seconds()/3600-dt[t])>1e-9 for t,(a,b) in enumerate(zip(tijden,tijden[1:]))):
            raise ValueError('Doorlopende UTC-tijdas ontbreekt of bevat gaten/overlap')
    def reeks(xs, naam):
        if len(xs)!=n:
            raise ValueError(f'{naam}: lengte wijkt af van tijdas')
        return [getal(x,naam) for x in xs]
    gebouw = reeks(data['gebouw_kw'],'gebouwbelasting')
    grens = reeks(data['net_kw'],'netgrens')
    groups={}
    for g in data['kasten']:
        if not g['id'] or g['id'] in groups:
            raise ValueError('Dubbele/lege kast-ID')
        groups[g['id']]=getal(g['kw'],'kastvermogen',1e-9)
    ids, connectors, vehicles = set(),set(),[]
    for raw in data['voertuigen']:
        if set(raw)-{'id','kast','connector','capaciteit','reserve','eta_depot','eta_weg','weg_soc_max','depot_kw','weg_kw','verbruik_kwh','begin_kwh','eind_min_kwh'}:
            raise ValueError('Onbekende voertuigoptie; variant eerst expliciet implementeren')
        v=dict(raw)
        if not v['id'] or v['id'] in ids:
            raise ValueError('Dubbele/lege voertuig-ID')
        ids.add(v['id'])
        if v['kast'] not in groups or not v['connector'] or v['connector'] in connectors:
            raise ValueError('Eigen fysieke connector en bekende kast vereist; omhangen niet ondersteund')
        connectors.add(v['connector'])
        v['capaciteit']=getal(v['capaciteit'],'bevestigde ontwerpcapaciteit',1e-9)
        v['reserve']=getal(v['reserve'],'reservefractie',0,.999)
        v['eta_depot']=getal(v['eta_depot'],'depotrendement',1e-9,1)
        v['eta_weg']=getal(v['eta_weg'],'wegrendement',1e-9,1)
        v['weg_soc_max']=getal(v['weg_soc_max'],'SoC-grens onderweg',v['reserve'],1)
        for key in ('depot_kw','weg_kw','verbruik_kwh'):
            v[key]=reeks(v[key],key)
        if any(a>0 and b>0 for a,b in zip(v['depot_kw'],v['weg_kw'])):
            raise ValueError('Depot- en weglaadvensters overlappen; splits/controleer locatie')
        if modus=='chronologisch':
            v['begin_kwh']=getal(v.get('begin_kwh'),'expliciete beginlading',v['reserve']*v['capaciteit'],v['capaciteit'])
        if v.get('eind_min_kwh') is not None:
            v['eind_min_kwh']=getal(v['eind_min_kwh'],'eindvoorwaarde',v['reserve']*v['capaciteit'],v['capaciteit'])
        else:
            v.pop('eind_min_kwh',None)
        vehicles.append(v)
    if not vehicles:
        raise ValueError('Geen voertuigen')
    # De referentie deelt geen ongereserveerd publiek laadpunt tussen voertuigen.
    # Voor zo'n plan zijn stationbezetting en een aanvullende planning vereist.
    for t in range(n):
        if sum(v['weg_kw'][t]>0 for v in vehicles)>1:
            raise ValueError('Meerdere gelijktijdige weglaadacties vragen bevestigde stationcapaciteit; buiten referentiescope')
    return dt,gebouw,grens,groups,vehicles


def laadplan(data, modus='chronologisch'):
    """Minimaliseer depotpiek voor vast plan; weg-80%-grens alleen bij werkelijk laden.

    Een gedeelde openbare-laderplanning, extra wachttijd, zonnepanelen, thuisladen,
    batterij en volledige laadcurves zijn geen stilzwijgend ondersteunde features.
    Per interval opgegeven vermogen moet voor de concrete uitvoering bevestigd zijn.
    """
    dt,gebouw,grens,groups,vehicles=_invoer(data,modus)
    import highspy
    h=highspy.Highs(); h.setOptionValue('output_flag',False)
    peak=h.addVariable(lb=0)
    var={}; n=len(dt)
    for v in vehicles:
        B=v['capaciteit']; lo=B*v['reserve']
        E=[h.addVariable(lb=lo,ub=B) for _ in range(n+1)]
        p=[h.addVariable(lb=0,ub=x) for x in v['depot_kw']]
        r=[h.addVariable(lb=0,ub=x) for x in v['weg_kw']]
        for t in range(n):
            h.addConstr(E[t+1]==E[t]+dt[t]*(v['eta_depot']*p[t]+v['eta_weg']*r[t])-v['verbruik_kwh'][t])
            if v['weg_kw'][t]>0:
                on=h.addVariable(lb=0,ub=1,type=highspy.HighsVarType.kInteger)
                h.addConstr(r[t]<=v['weg_kw'][t]*on)
                h.addConstr(E[t+1]<=B*v['weg_soc_max']+B*(1-on))
        if modus=='cyclische_screening':
            h.addConstr(E[-1]==E[0])
        else:
            h.addConstr(E[0]==v['begin_kwh'])
            # Zonder aparte target blijft na de replay de beginlading beschikbaar.
            h.addConstr(E[-1]>=v.get('eind_min_kwh',v['begin_kwh']))
        var[v['id']]={'E':E,'p':p,'r':r}
    for t in range(n):
        load=gebouw[t]+sum(var[v['id']]['p'][t] for v in vehicles)
        h.addConstr(load<=grens[t]); h.addConstr(peak>=load)
        for g,kw in groups.items():
            leden=[v for v in vehicles if v['kast']==g]
            if leden:
                h.addConstr(sum(var[v['id']]['p'][t] for v in leden)<=kw)
    h.minimize(peak)
    if h.getModelStatus()!=highspy.HighsModelStatus.kOptimal:
        if h.getModelStatus()==highspy.HighsModelStatus.kInfeasible:
            return {'status':'ondoenlijk','modus':modus}
        raise RuntimeError(f'Geen bewezen optimale laadoplossing: {h.getModelStatus()}')
    sol=h.getSolution().col_value
    result={'status':'haalbaar','modus':modus,'piek_kw':sol[peak.index],
            'voertuigen':{v['id']:{key:[sol[x.index] for x in var[v['id']][key]] for key in ('E','p','r')} for v in vehicles}}
    result['net_kw']=[gebouw[t]+sum(result['voertuigen'][v['id']]['p'][t] for v in vehicles) for t in range(n)]
    controleer_plan(data,result)
    return result


def controleer_plan(data, result, tol=1e-5):
    """Onafhankelijke reconstructie van fysische grenzen; accepteert geen solverstatus alleen."""
    if result['status']!='haalbaar':
        raise ValueError('Geen uitvoerbaar plan om te controleren')
    dt,gebouw,grens,groups,vehicles=_invoer(data,result['modus'])
    def eis(ok,tekst):
        if not ok:
            raise ValueError('Onafhankelijke controle: '+tekst)
    for v in vehicles:
        r=result['voertuigen'][v['id']]; B=v['capaciteit']; n=len(dt)
        eis(len(r['E'])==n+1 and len(r['p'])==n and len(r['r'])==n,'tijdas')
        eis(all(math.isfinite(x) for key in ('E','p','r') for x in r[key]),'niet-eindige uitvoer')
        eis(all(B*v['reserve']-tol<=x<=B+tol for x in r['E']),'accugrens')
        if result['modus']=='chronologisch':
            eis(abs(r['E'][0]-v['begin_kwh'])<=tol,'beginlading')
            eis(r['E'][-1]+tol>=v.get('eind_min_kwh',v['begin_kwh']),'eindlading')
        else:
            eis(abs(r['E'][-1]-r['E'][0])<=tol,'cyclische screening')
        for t in range(n):
            eis(-tol<=r['p'][t]<=v['depot_kw'][t]+tol,'depotvenster/vermogen')
            eis(-tol<=r['r'][t]<=v['weg_kw'][t]+tol,'wegvenster/vermogen')
            verw=r['E'][t]+dt[t]*(v['eta_depot']*r['p'][t]+v['eta_weg']*r['r'][t])-v['verbruik_kwh'][t]
            eis(abs(verw-r['E'][t+1])<=tol,'energiebalans')
            if r['r'][t]>tol:
                eis(r['E'][t+1]<=B*v['weg_soc_max']+tol,'laadgrens onderweg')
    for t in range(len(dt)):
        load=gebouw[t]+sum(result['voertuigen'][v['id']]['p'][t] for v in vehicles)
        eis(abs(load-result['net_kw'][t])<=tol,'gereconstrueerde netafname')
        eis(load<=grens[t]+tol and load<=result['piek_kw']+tol,'netgrens/piek')
        for g,kw in groups.items():
            eis(sum(result['voertuigen'][v['id']]['p'][t] for v in vehicles if v['kast']==g)<=kw+tol,'vermogenskast')
    return True
