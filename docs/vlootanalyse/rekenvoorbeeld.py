"""Fictieve herhaalde-dagscreening, stresscases en eenvoudige kostenvergelijking.

Geen bewijs van optimale aankoop, reserve, subsidie, contract of echte klantinzet.
Run: python docs/vlootanalyse/rekenvoorbeeld.py
"""
from referentie import laadplan, reservebehoefte
import json

DIENSTEN={'D1':(6.,15.,180,None),'D2':(5.,17.,260,(10.5,11.25)),'D3':(7.,16.,120,None)}


def voorbeeld(diensten=('D1','D2','D3'), onderweg=True, verbruik=1.2, weg_kw=120, depot_kw=22, soh=.85, pauze_min=45):
    dt=.25; n=96
    data={'dt':[dt]*n,'gebouw_kw':[20. if 7<=t*dt<18 else 5. for t in range(n)],
          'net_kw':[55.]*n,'kasten':[],'voertuigen':[]}
    for naam in diensten:
        vertrek,terug,km,pauze=DIENSTEN[naam]
        pauze=(pauze[0],pauze[0]+pauze_min/60) if pauze else None
        if pauze and (pauze[0]%dt or pauze[1]%dt):
            raise ValueError('Voorbeeldpauze moet op intervalgrenzen vallen; splits anders de tijdas')
        weg=[vertrek<=t*dt<terug for t in range(n)]
        laden=[bool(pauze and pauze[0]<=t*dt<pauze[1]) for t in range(n)]
        rijden=[w and not l for w,l in zip(weg,laden)]
        data['kasten'].append({'id':naam,'kw':depot_kw})
        data['voertuigen'].append({'id':naam,'kast':naam,'connector':naam+'_stekker',
            'capaciteit':300*soh,'reserve':.1,'eta_depot':.92,'eta_weg':.95,'weg_soc_max':.8,
            'depot_kw':[depot_kw if not w else 0 for w in weg],
            'weg_kw':[weg_kw if onderweg and l else 0 for l in laden],
            'verbruik_kwh':[km*verbruik/sum(rijden) if r else 0 for r in rijden]})
    return data


def jaarvergelijking(aanzet=True, ere=.10):
    """Eenvoudige jaar-TCO, geen NCW: vaste jaarlijkse inzet en 0 reservevoertuigen."""
    besparing=0.
    for km_dag in (180,260,120):
        km=km_dag*250
        diesel=95000*.8/7+km*.25*2.03+km*.10+4500+km*.8*.182
        weg_accu=max(0,km_dag-229.5); depot_accu=km_dag-weg_accu
        elektrisch=(240000-(69600 if aanzet else 0)-48000)/7
        elektrisch+=250*(depot_accu*.25/.92+weg_accu*.55/.95-depot_accu*ere)
        elektrisch+=km*.06+6500+km*.8*.037
        besparing+=diesel-elektrisch
    return besparing-2250 # drie fictieve AC-laadpunten en beheer


def resultaten():
    cases=[('A: D1 en D3, geen onderweg laden',dict(diensten=('D1','D3'),onderweg=False)),
           ('B: alle drie, bevestigde pauze',{}),('D2 zonder onderweg laden',dict(diensten=('D2',),onderweg=False)),
           ('B: 1% extra ontwerpverbruik',dict(verbruik=1.212)),('B: 20% minder snellaadvermogen',dict(weg_kw=96)),
           ('B: 30 minuten laden',dict(pauze_min=30)),('B: 83% SoH',dict(soh=.83)),('B: 11 kW depot',dict(depot_kw=11))]
    out=[]
    for naam,args in cases:
        r=laadplan(voorbeeld(**args),modus='cyclische_screening')
        out.append({'scenario':naam,'status':r['status'],'piek_kw':r.get('piek_kw')})
    return {'status':'fictieve_screening_geen_klantadvies','reserve':{'afgesproken':0,'nodig_bij_een_reserve':reservebehoefte(3,1)},
            'cases':out,'jaarvoordeel_eur':{'met_aanzet_en_ere':jaarvergelijking(),
              'met_aanzet_zonder_ere':jaarvergelijking(ere=0),'zonder_aanzet_en_ere':jaarvergelijking(False,0)}}


if __name__=='__main__':
    print(json.dumps(resultaten(),indent=2,ensure_ascii=False))

