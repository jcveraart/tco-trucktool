import copy
from datetime import datetime, timedelta, timezone
import math
import unittest
from referentie import (reservebehoefte, lease_meerkosten, tractie_kwh, hulpenergie_kwh,
    startmutatie, contante_kosten, reele_rente, aanzet_bedrag, fiscale_regel,
    controle_subsidies, fallback, normaliseer_meter, gegevensniveau, laadplan, controleer_plan)
from rekenvoorbeeld import voorbeeld, jaarvergelijking


def klein(vraag=(0,60), laden=(60,0), begin=10):
    n=len(vraag); start=datetime(2026,1,1,tzinfo=timezone.utc)
    return {'dt':[1.]*n,'tijdstippen':[(start+timedelta(hours=t)).isoformat() for t in range(n+1)],
        'gebouw_kw':[0.]*n,'net_kw':[100.]*n,'kasten':[{'id':'c','kw':100.}],
        'voertuigen':[{'id':'v','kast':'c','connector':'s1','capaciteit':100.,'reserve':.1,
            'eta_depot':1.,'eta_weg':1.,'weg_soc_max':.8,'begin_kwh':begin,
            'depot_kw':list(laden),'weg_kw':[0.]*n,'verbruik_kwh':list(vraag)}]}


class KostenEnRegels(unittest.TestCase):
    def test_reserve_is_een_bewuste_hele_wagen(self):
        for n in (1,3,10,20):
            self.assertEqual(reservebehoefte(n),n)
            self.assertEqual(reservebehoefte(n,1),n+1)
        for x in (.05,-1,True):
            with self.assertRaises(ValueError): reservebehoefte(3,x)

    def test_koop_en_financial_lease_geen_fictieve_km(self):
        for kind in ('koop','financial_lease'):
            self.assertEqual(lease_meerkosten(50000,kind,0,.05),0)
        self.assertEqual(lease_meerkosten(60000,'operational_lease',50000,.05),500)
        self.assertEqual(lease_meerkosten(40000,'operational_lease',50000,.05),0)

    def test_regeneratie_is_niet_dubbel(self):
        self.assertAlmostEqual(tractie_kwh(-1000,1000),-.7/3.6)
        self.assertAlmostEqual(tractie_kwh(1000,1000),1/(3.6*.9))
        self.assertEqual(tractie_kwh(0,1000),0)

    def test_koeling_en_pto_ook_bij_stilstand(self):
        self.assertEqual(hulpenergie_kwh(koel_kw=3,koel_uren=12,pto_kw=10,pto_uren=2),56)

    def test_directe_verkoop_en_leaseafkoop(self):
        self.assertEqual(startmutatie('koop',True,False,40000),{'verkoop':40000.,'afkoop':0.})
        self.assertEqual(startmutatie('operational_lease',True,False,40000,6000),{'verkoop':0.,'afkoop':6000.})
        self.assertEqual(startmutatie('koop',True,True,40000)['verkoop'],0)

    def test_tijdstip_nul_en_horizonverplichtingen(self):
        self.assertEqual(contante_kosten([(0,100000),(0,-40000)],.05),60000)
        self.assertAlmostEqual(contante_kosten([], .05,12000,2000,10),10000/1.05**10)
        with self.assertRaises(ValueError): contante_kosten([], .05,12000)

    def test_rente_reel_nominaal(self):
        self.assertAlmostEqual((1+reele_rente(.056,.02))*1.02,1.056)

    def test_aanzet_grondslag_zonder_opbouw(self):
        self.assertAlmostEqual(aanzet_bedrag(200000,10000,30000,.29,115200),60900)
        self.assertEqual(aanzet_bedrag(500000,0,30000,.29,115200),115200)

    def test_mia_2026_geen_vamil_en_geen_toekomst_gokken(self):
        self.assertEqual(fiscale_regel('D3116',2026),{'grondslag_fractie':.9,'mia':.36,'vamil':0.})
        with self.assertRaises(ValueError): fiscale_regel('D3116',2027)

    def test_subsidie_niet_stapelen_of_te_vroeg_verkopen(self):
        with self.assertRaises(ValueError): controle_subsidies(True,True,4)
        with self.assertRaises(ValueError): controle_subsidies(True,False,3)
        with self.assertRaises(ValueError): controle_subsidies(True,False)
        controle_subsidies(True,False,4)

    def test_extreme_dag_fallback_blijft_geprijsd(self):
        r=fallback(True,True,True,900)
        self.assertEqual(r['kosten_per_gebeurtenis'],900)
        self.assertIsNone(r['jaarkosten'])
        self.assertEqual(fallback(True,True,True,900,2)['jaarkosten'],1800)
        with self.assertRaises(ValueError): fallback(True,True,False,900)

    def test_jaarbedragen_en_onzekere_voordelen(self):
        self.assertAlmostEqual(jaarvergelijking(),37605.844638770825)
        self.assertAlmostEqual(jaarvergelijking(ere=0),24368.34463877083)
        self.assertAlmostEqual(jaarvergelijking(False,0),-5460.226789800588)

    def test_ongeldige_getallen_niet_doorgerekend(self):
        for waarde in (float('nan'),float('inf'),-1,True,None):
            with self.assertRaises(ValueError): lease_meerkosten(waarde,'koop')


class DataKwaliteit(unittest.TestCase):
    def test_kwh_naar_kw_en_omgekeerd(self):
        r={'start':'2026-01-01T00:00:00Z','eind':'2026-01-01T00:15:00Z','waarde':5}
        self.assertEqual(normaliseer_meter([r],'kWh')['intervallen'][0]['kw'],20)
        self.assertEqual(normaliseer_meter([r],'kW')['intervallen'][0]['kwh'],1.25)
        with self.assertRaises(ValueError): normaliseer_meter([r],'onbekend')

    def test_gaten_worden_geen_nulverbruik(self):
        rows=[{'start':'2026-01-01T00:00:00Z','eind':'2026-01-01T00:15:00Z','waarde':5},
              {'start':'2026-01-01T00:30:00Z','eind':'2026-01-01T00:45:00Z','waarde':5}]
        r=normaliseer_meter(rows,'kWh')
        self.assertFalse(r['volledig']); self.assertEqual(len(r['issues']),1)
        self.assertEqual(len(r['intervallen']),2)

    def test_dubbele_intervallen_en_tijdzone_geweigerd(self):
        r={'start':'2026-01-01T00:00:00Z','eind':'2026-01-01T00:15:00Z','waarde':5}
        with self.assertRaises(ValueError): normaliseer_meter([r,r],'kWh')
        r['start']='2026-01-01T00:00:00'
        with self.assertRaises(ValueError): normaliseer_meter([r],'kWh')

    def test_zomer_en_winterdag_zonder_96_aanname(self):
        for begin,eind,aantal in [('2026-03-29T00:00:00+01:00','2026-03-30T00:00:00+02:00',92),
                                ('2026-10-25T00:00:00+02:00','2026-10-26T00:00:00+01:00',100)]:
            a=datetime.fromisoformat(begin).astimezone(timezone.utc); b=datetime.fromisoformat(eind).astimezone(timezone.utc)
            rows=[]
            while a<b:
                stop=a+timedelta(minutes=15)
                rows.append({'start':a.isoformat(),'eind':stop.isoformat(),'waarde':1}); a=stop
            r=normaliseer_meter(rows,'kWh')
            self.assertTrue(r['volledig']); self.assertEqual(len(r['intervallen']),aantal)

    def test_onvoldoende_data_beperkt_conclusie(self):
        self.assertEqual(gegevensniveau(False,False,False,False),'alleen_kostenbandbreedte')
        self.assertEqual(gegevensniveau(True,True,True,False),'geschiktheid_niet_aangetoond')
        self.assertEqual(gegevensniveau(True,False,True,True),'ritscreening_geen_depotbewijs')


class LaadControle(unittest.TestCase):
    def test_oorspronkelijke_pieken(self):
        for args,piek in [({'diensten':('D1','D3'),'onderweg':False},32.620289855),({},49.576923077)]:
            with self.subTest(args=args):
                data=voorbeeld(**args); r=laadplan(data,'cyclische_screening')
                self.assertEqual(r['status'],'haalbaar'); self.assertAlmostEqual(r['piek_kw'],piek,places=5)
                self.assertTrue(controleer_plan(data,r))

    def test_grensrit_stresscases(self):
        for args in ({'diensten':('D2',),'onderweg':False},{'verbruik':1.212},{'weg_kw':96},
                     {'pauze_min':30},{'soh':.83},{'depot_kw':11}):
            with self.subTest(args=args): self.assertEqual(laadplan(voorbeeld(**args),'cyclische_screening')['status'],'ondoenlijk')

    def test_losse_dagen_zijn_geen_chronologisch_bewijs(self):
        self.assertEqual(laadplan(klein((0,60),(60,0)),'cyclische_screening')['status'],'haalbaar')
        self.assertEqual(laadplan(klein((60,0),(0,60)),'cyclische_screening')['status'],'haalbaar')
        self.assertEqual(laadplan(klein((0,60,60,0),(60,0,0,60)),'cyclische_screening')['status'],'ondoenlijk')
        self.assertEqual(laadplan(klein((60,0),(0,60),10))['status'],'ondoenlijk')
        self.assertEqual(laadplan(klein((60,0),(0,60),70))['status'],'haalbaar')

    def test_geen_onbekende_beginlading_of_datagat(self):
        d=klein(); del d['voertuigen'][0]['begin_kwh']
        with self.assertRaises(ValueError): laadplan(d)
        d=klein(); d['tijdstippen'][1]='2026-01-01T00:30:00Z'
        with self.assertRaises(ValueError): laadplan(d)

    def test_onbekende_varianten_niet_stilzwijgend_genegeerd(self):
        d=klein(); d['batterij_kwh']=200
        with self.assertRaises(ValueError): laadplan(d)
        d=klein(); d['voertuigen'][0]['extra_wachttijd']=.5
        with self.assertRaises(ValueError): laadplan(d)

    def test_ongebruikte_wegstop_dwingt_geen_80_procent(self):
        d=klein((0,),(0,),90); v=d['voertuigen'][0]; v['weg_kw']=[20]
        r=laadplan(d)
        self.assertEqual(r['status'],'haalbaar'); self.assertAlmostEqual(r['voertuigen']['v']['r'][0],0)

    def test_netgrens_en_werkelijke_kast(self):
        d=klein(); d['kasten'][0]['kw']=30
        self.assertEqual(laadplan(d)['status'],'ondoenlijk')
        d=klein(); d['net_kw']=[30,30]
        self.assertEqual(laadplan(d)['status'],'ondoenlijk')

    def test_gedeeld_kastvermogen(self):
        d=klein((0,40),(40,0)); v=copy.deepcopy(d['voertuigen'][0]); v['id']='v2'; v['connector']='s2'
        d['voertuigen'].append(v); d['kasten'][0]['kw']=60
        self.assertEqual(laadplan(d)['status'],'ondoenlijk')
        d['kasten'][0]['kw']=80
        self.assertEqual(laadplan(d)['status'],'haalbaar')

    def test_connectoren_en_onbevestigd_wegdelen_geweigerd(self):
        d=klein(); v=copy.deepcopy(d['voertuigen'][0]); v['id']='v2'; d['voertuigen'].append(v)
        with self.assertRaises(ValueError): laadplan(d)
        v['connector']='s2'
        for x in d['voertuigen']: x['depot_kw']=[0,0]; x['weg_kw']=[20,0]
        with self.assertRaises(ValueError): laadplan(d)

    def test_onafhankelijke_controle_vangt_beschadigde_uitvoer(self):
        d=klein(); r=laadplan(d); r['voertuigen']['v']['E'][1]+=2
        with self.assertRaisesRegex(ValueError,'energiebalans'): controleer_plan(d,r)
        r=laadplan(d); r['net_kw'][0]+=10
        with self.assertRaisesRegex(ValueError,'netafname'): controleer_plan(d,r)


if __name__=='__main__': unittest.main()
