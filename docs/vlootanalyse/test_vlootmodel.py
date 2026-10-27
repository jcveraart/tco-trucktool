"""Small, known-answer model tests; embedded and executed in the notebook too."""
import copy, math, tempfile, unittest
from pathlib import Path
from vlootmodel import *


def micro_case(demand=(0.,60.),depart=1,arrive=2,initial=.1):
    d=demo_data(1,False); T=len(demand)
    a=copy.deepcopy(next(a for a in d['assets'] if a['id']=='ev_0_0_buy'))
    a.update(id='ev',existing=True,exclusive_group=None,capacity_kwh=[100.],initial_soc=initial,
             terminal_soc=.1,ac_kw=100.,fixed_cost=[0.],sale_value=[0.],terminal_value=0.,maintenance_per_km=0.)
    d['assets']=[a]; d['energy_modules']=[]; d['minimum_ze_km_share']=[0.]
    d['sites'][0].update(grid_levels=[{'id':'current','import_kw':100.,'export_kw':100.,'annual_fixed':0.,'available_from':0}],
        grid_transitions=[{'from':'current','to':'current','cost':0.}],peak_kw_fee=0.,contract_kw_fee=0.)
    c=d['cabinets'][0]; c.update(existing=True,kw=100.,investment=0.,annual_cost=0.,terminal_value=0.)
    c['connectors']=[{'id':'plug','kind':'AC','kw':100.}]
    p=d['periods'][0]; start=datetime(2026,1,1,tzinfo=timezone.utc)
    p.update(mode='full_chronology',repeat=1.,duration_years=T/8760.,timestamps=[(start+timedelta(hours=t)).isoformat() for t in range(T+1)])
    op=d['scenarios'][0]['operations'][0]; j=op['duties'][0]
    j.update(depart=depart,arrive=arrive,latest_arrive=arrive,km=10.)
    j['variants']=[{'arrive':arrive,'work_hours':arrive-depart,'extra_cost':0.,'schedule_confirmed':True,'energy':{'ev_van':list(demand)},'road_windows':[]}]
    op['duties']=[j]; op['billing_bucket']=['one']*T; op['billing_multipliers']={'one':1}
    op['sites']['depot']={'building_kw':0.,'price_import':.1,'price_export':0.,'grid_co2':.3,'pv_per_kw':0.,'crew_capacity':2.}
    return d


def small_case(H=1):
    d=demo_data(H,False); d['energy_modules']=[]
    for g in d['sites'][0]['grid_levels']: g['import_kw']=100.
    d['sites'][0]['peak_kw_fee']=0.
    return d


def run_model(d,fixed=None):
    m=FleetModel(d,fixed); r=m.solve(15,.01)
    if r['feasible']: m.verify_physics()
    return m,r


class WholeFleetTests(unittest.TestCase):
    def test_known_chronological_energy(self):
        m,r=run_model(micro_case())
        self.assertTrue(r['feasible']); self.assertTrue(r['optimal'])
        self.assertAlmostEqual(r['expected_npv'],60/.92*.1/(1.04)**(1/8760),places=4)

    def test_no_daily_reset_between_periods(self):
        d=micro_case(); p=copy.deepcopy(d['periods'][0]); start=utc(p['timestamps'][-1])
        p['timestamps']=[(start+timedelta(hours=t)).isoformat() for t in range(3)]; p['label']='next'
        d['periods'].append(p)
        for a in d['assets']:
            a['capacity_kwh']=[100.,100.]; a['end_period']=2
            for k in ('fixed_cost','sale_value','normal_tax_shield','contract_km','lease_cost','exit_penalty'): a[k]=[at(a[k],0)]*2
        d['cabinets'][0]['end_period']=2
        op=copy.deepcopy(d['scenarios'][0]['operations'][0]); j=op['duties'][0]
        j['depart']=0; j['arrive']=1; j['latest_arrive']=1
        j['variants'][0].update(arrive=1,work_hours=1,energy={'ev_van':[60.,0.]})
        d['scenarios'][0]['operations'].append(op)
        d['annual_capex_limit']*=2; d['max_acquisitions']*=2; d['minimum_ze_km_share']=[0.,0.]
        m,r=run_model(d); self.assertFalse(r['feasible'])

    def test_all_purchase_and_lease_choices_are_decisions(self):
        d=small_case(); m,r=run_model(d)
        self.assertTrue(r['feasible'])
        buys={a['id']:m.buy[a['id']].value(r['values']) for a in d['assets'] if not a['existing']}
        self.assertAlmostEqual(sum(buys.values()),1)
        self.assertTrue(any('buy' in k and v>.5 for k,v in buys.items()))

    def test_ten_period_horizon(self):
        d=micro_case((0.,0.)); p=copy.deepcopy(d['periods'][0]); op=copy.deepcopy(d['scenarios'][0]['operations'][0])
        d['periods']=[]
        for y in range(10):
            q=copy.deepcopy(p); q.update(label=str(2026+y),duration_years=1.,mode='repeated_block',repeat=250.)
            q['timestamps']=[(datetime(2026+y,1,1,tzinfo=timezone.utc)+timedelta(hours=t)).isoformat() for t in range(3)]
            d['periods'].append(q)
        d['scenarios'][0]['operations']=[copy.deepcopy(op) for _ in range(10)]
        for a in d['assets']:
            a['end_period']=10
            for k,v in list(a.items()):
                if isinstance(v,list) and len(v)==1 and k not in ('ac_curve','dc_curve','incentives'): a[k]=v*10
        d['cabinets'][0]['end_period']=10
        for k in ('annual_capex_limit','max_acquisitions','minimum_ze_km_share'): d[k]*=10
        m,r=run_model(d); self.assertTrue(r['feasible']); self.assertEqual(len(m.d['periods']),10)
        self.assertEqual(m.d['horizon'],10.)

    def test_no_lease_mileage_on_owned_vehicle(self):
        m,r=run_model(micro_case())
        self.assertFalse(any(k[0]=='excess_km' for k in m.v))

    def test_operational_lease_tail_is_charged(self):
        d=small_case(); lease=next(a for a in d['assets'] if a['contract']=='operational_lease')
        fixed={str(('buy',lease['id'])):1.}
        m,r=run_model(d,fixed); self.assertTrue(r['feasible'])
        tail=lease['terminal_lease_liability']; self.assertGreater(tail,0)
        e=copy.deepcopy(d); next(a for a in e['assets'] if a['id']==lease['id'])['terminal_lease_liability']=0.
        n,s=run_model(e,fixed)
        self.assertAlmostEqual(r['expected_npv']-s['expected_npv'],tail/1.04,places=3)

    def test_initial_sale_is_in_cash_ledger(self):
        m,r=run_model(small_case()); self.assertTrue(r['feasible'])
        sales=[x for x in r['cashflows']['base'] if x['category']=='vehicle_sale' and x['time_years']==0]
        self.assertLess(sum(x['eur'] for x in sales),0)

    def test_explicit_reserve_keeps_third_vehicle(self):
        d=small_case(); d['reserves']=[{'site':'depot','group':'delivery','count':1}]
        m,r=run_model(d); self.assertTrue(r['feasible'])
        self.assertAlmostEqual(sum(z.value(r['values']) for (a,y),z in m.z.items()),3)

    def test_future_subsidy_cannot_pay_upfront(self):
        d=small_case(); a=next(a for a in d['assets'] if a['id']=='ev_0_0_buy')
        a['incentives']=[{'id':'verified_demo','kind':'grant','source':'synthetic test','confirmed':True,
             'hold_years':0.,'payments':[(.5,20000.)],'terminal_liability':0.}]
        d['capital_funding_limit']=1000.
        m,r=run_model(d,{str(('buy',a['id'])):1.}); self.assertFalse(r['feasible'])

    def test_incentive_holding_period(self):
        d=small_case(2); a=next(a for a in d['assets'] if a['id']=='ev_0_0_buy')
        a['incentives']=[{'id':'hold','kind':'grant','source':'synthetic test','confirmed':True,
             'hold_years':4.,'payments':[(0.,10000.)],'terminal_liability':5000.}]
        fixed={str(('buy',a['id'])):1.,str(('incentive',a['id'],'hold')):1.,str(('active',a['id'],1)):0.}
        m,r=run_model(d,fixed); self.assertFalse(r['feasible'])

    def test_tax_basis_and_vamil_validation(self):
        d=small_case(); a=next(a for a in d['assets'] if a['id']=='ev_0_0_buy')
        a['incentives']=[{'id':'tax','kind':'tax','source':'test','confirmed':True,'code':'D3116','year':2026,'vamil':.75}]
        with self.assertRaises(ValueError): validate(d)
        d['tax_basis']='after_tax'
        with self.assertRaises(ValueError): validate(d)

    def test_physical_grid_lead_time(self):
        d=small_case(); a=next(a for a in d['assets'] if a['id']=='ev_0_0_buy')
        d['sites'][0]['grid_levels'][0]['import_kw']=0.
        d['sites'][0]['grid_levels'][1]['available_from']=1
        self.assertFalse(run_model(d,{str(('buy',a['id'])):1.})[1]['feasible'])
        d['sites'][0]['grid_levels'][1]['available_from']=0
        self.assertTrue(run_model(d,{str(('buy',a['id'])):1.})[1]['feasible'])

    def test_public_charging_and_station_outage(self):
        d=micro_case((0,50,50,0),0,4,.7)
        d['road_stations']=[{'id':'road','kw':100.,'connectors':1,'price':.5,'co2':.3}]
        j=d['scenarios'][0]['operations'][0]['duties'][0]
        j['variants'][0]['road_windows']=[{'station':'road','start':1,'end':2,'kw':100.}]
        self.assertTrue(run_model(d)[1]['feasible'])
        d['scenarios'][0]['road_factors']={'road':0.}
        self.assertFalse(run_model(d)[1]['feasible'])

    def test_unused_road_stop_does_not_impose_80_percent(self):
        d=micro_case((0.,0.),0,2,.95)
        d['road_stations']=[{'id':'road','kw':100.,'connectors':1,'price':.5,'co2':.3}]
        d['scenarios'][0]['operations'][0]['duties'][0]['variants'][0]['road_windows']=[{'station':'road','start':0,'end':1,'kw':100.}]
        self.assertTrue(run_model(d)[1]['feasible'])

    def test_regen_can_be_curtailed_in_full_battery(self):
        d=micro_case((-10.,0.),0,2,1.)
        m,r=run_model(d); self.assertTrue(r['feasible'])
        self.assertGreater(m.v['regen_spill','base',0,'ev',0].value(r['values']),9.99)

    def test_switching_requires_staff(self):
        d=micro_case(); d['plug_policy']='switched'
        d['scenarios'][0]['operations'][0]['sites']['depot']['crew_capacity']=0.
        self.assertFalse(run_model(d)[1]['feasible'])
        d['scenarios'][0]['operations'][0]['sites']['depot']['crew_capacity']=1.
        self.assertTrue(run_model(d)[1]['feasible'])

    def test_pv_storage_and_negative_prices_are_physical(self):
        d=micro_case((0,0,50,0),2,3,.7)
        d['energy_modules']=demo_data(1,False)['energy_modules']
        profile=d['scenarios'][0]['operations'][0]['sites']['depot']
        profile.update(price_import=[-.1,.1,.4,.1],price_export=.2,pv_per_kw=[0,1,0,0])
        fixed={str(('module','pv',0)):1.,str(('module','battery',0)):1.}
        m,r=run_model(d,fixed); self.assertTrue(r['feasible'])
        for t in range(4):
            im=m.v['import','base',0,'depot',t].value(r['values']); ex=m.v['export','base',0,'depot',t].value(r['values'])
            self.assertLess(min(im,ex),1e-6)

    def test_energy_tax_uses_adjacent_segment(self):
        d=micro_case(); d['sites'][0]['energy_tax_breakpoints']=[(0.,0.),(10.,1.),(100.,5.5),(1000.,40.)]
        m,r=run_model(d); self.assertTrue(r['feasible'])
        volume=sum(m.v['import','base',0,'depot',t].value(r['values']) for t in range(2))
        points=d['sites'][0]['energy_tax_breakpoints']
        actual=sum(points[k][1]*m.v['tax_lambda','base',0,'depot',k].value(r['values']) for k in range(len(points)))
        expected=1+(volume-10)*.05
        self.assertAlmostEqual(actual,expected,places=5)

    def test_zero_weight_stress_has_no_free_charter(self):
        d=micro_case(); s=copy.deepcopy(d['scenarios'][0]); s.update(id='stress',probability=0.,charter_limit=1)
        d['scenarios'].append(s)
        with self.assertRaises(ValueError): validate(d)

    def test_cvar_and_fixed_plan_replay(self):
        d=micro_case(); s=copy.deepcopy(d['scenarios'][0]); s.update(id='expensive',probability=.5)
        s['operations'][0]['sites']['depot']['price_import']=1.
        d['scenarios'][0]['probability']=.5; d['scenarios'].append(s); d['risk_weight']=.5
        m,r=run_model(d); self.assertTrue(r['feasible']); self.assertGreaterEqual(r['objective']+1e-6,r['expected_npv'])
        n,q=fixed_plan_replay(d,r['decisions']); self.assertTrue(q['feasible'])

    def test_meter_gaps_and_customer_export(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'meter.csv'
            p.write_text('start,end,value,unit\n2026-01-01T00:00:00Z,2026-01-01T00:15:00Z,5,kWh\n',encoding='utf8')
            self.assertEqual(read_meter_csv(p)['intervals'][0]['kw'],20)
            p.write_text('start,end,value,unit\n2026-01-01T00:00:00,2026-01-01T00:15:00,5,kWh\n',encoding='utf8')
            with self.assertRaises(ValueError): read_meter_csv(p)
            m,r=run_model(micro_case()); m.d['data_kind']='customer'
            with self.assertRaises(ValueError): export_results(m,tmp)

    def test_mutated_solution_fails_independent_verifier(self):
        m,r=run_model(micro_case()); column=next(iter(m.soc['base',0,'ev'][1].c))
        r['values'][column]+=2
        with self.assertRaises(AssertionError): m.verify_physics()

    def test_segment_recuperation_and_stop_auxiliaries(self):
        downhill=segment_energy(3500,1000,10,-.1,regen_kw=2.,duration_hours=.1)
        self.assertAlmostEqual(downhill,-.2)
        self.assertGreater(segment_energy(3500,1000,10,.1),0)
        self.assertEqual(energy_from_activities([0.],[0.],[2.],.3,hvac_kw=1.,pto_hours=[1.],pto_kw=3.,
                         cooling_hours=[2.],cooling_kw=2.),[9.])

    def test_multiple_depots_keep_physical_location(self):
        d=micro_case((0.,10.,0.,10.),1,2,.7)
        other=copy.deepcopy(d['sites'][0]); other['id']='other'; d['sites'].append(other)
        op=d['scenarios'][0]['operations'][0]; op['sites']['other']=copy.deepcopy(op['sites']['depot'])
        first=op['duties'][0]; first['destination']='other'; first['day']='day_1'
        second=copy.deepcopy(first); second.update(id='return',day='day_2',origin='other',destination='depot',depart=3,arrive=4,latest_arrive=4)
        second['variants'][0].update(arrive=4,work_hours=1,energy={'ev_van':[0.,0.,0.,10.]})
        op['duties'].append(second)
        self.assertTrue(run_model(d)[1]['feasible'])
        second['origin']='depot'
        self.assertFalse(run_model(d)[1]['feasible'])

    def test_cabinet_grant_requires_new_equipment(self):
        d=micro_case((0.,0.)); d['infrastructure_grants']=[{'id':'project','confirmed':True,'source':'synthetic test',
             'period':0,'required_cabinets':['cab_0'],'payments':[(0.,1000.)]}]
        fixed={str(('infrastructure_grant','project')):1.}
        self.assertFalse(run_model(d,fixed)[1]['feasible'])
        d['cabinets'][0]['existing']=False
        self.assertTrue(run_model(d,fixed)[1]['feasible'])

    def test_duplicate_ports_and_bad_efficiency_rejected(self):
        d=micro_case(); d['cabinets'][0]['connectors']*=2
        with self.assertRaises(ValueError): validate(d)
        d=micro_case(); d['assets'][0]['eta_charge']=1.1
        with self.assertRaises(ValueError): validate(d)

    def test_asset_outage_needs_real_charter(self):
        d=micro_case((0.,0.)); sc=d['scenarios'][0]; sc['disabled_assets']=['ev']
        self.assertFalse(run_model(d)[1]['feasible'])
        sc['charter_limit']=1; j=sc['operations'][0]['duties'][0]; j.update(charter_allowed=True,charter_cost=500.)
        m,r=run_model(d); self.assertTrue(r['feasible']); self.assertGreater(r['expected_npv'],499.)

    def test_ere_cannot_exceed_net_import(self):
        d=micro_case(); d['sites'][0].update(ere_price=.01,ere_meter_factor=.92)
        m,r=run_model(d); self.assertTrue(r['feasible'])
        self.assertAlmostEqual(m.v['ere_kwh','base',0,'depot'].value(r['values']),60.,places=4)

    def test_existing_storage_preserves_terminal_energy(self):
        d=micro_case((0.,0.)); tech=copy.deepcopy(demo_data(1,False)['energy_modules'][1])
        tech.update(existing_units=1,existing_remaining_periods=3,existing_soc_kwh=10.,install_periods=[])
        d['energy_modules']=[tech]
        m,r=run_model(d); self.assertTrue(r['feasible'])
        E=m.storage['base',0,'depot','battery',-1]
        self.assertGreaterEqual(E[-1].value(r['values']),10.-1e-5)

    def test_charge_curve_is_limited_at_both_interval_boundaries(self):
        d=micro_case((0.,0.),initial=.5)
        d['assets'][0].update(ac_curve=[(1.,-1.)],terminal_soc=.8)
        self.assertFalse(run_model(d)[1]['feasible'])
        d['assets'][0]['terminal_soc']=.7
        self.assertTrue(run_model(d)[1]['feasible'])


if __name__=='__main__': unittest.main()
