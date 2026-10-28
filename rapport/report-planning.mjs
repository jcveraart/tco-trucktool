// Presentation of saved decisions only. No new fleet optimization in the browser.
export function fleetLifecycle(report, plan) {
  const P = plan.jaren.length, saved = report.fleet || [], solved = plan.vloot || [];
  const current = saved.map(f => ({ ...f, ...solved.find(v => v.id === f.id), bestaand: true }));
  const orphan = solved.filter(v => v.bestaand && !saved.some(f => f.id === v.id));
  const added = solved.filter(v => !v.bestaand);
  const rows = [...current, ...orphan, ...added].map((vehicle, i) => {
    const active = Array.from({ length: P }, (_, p) => !!vehicle.actief?.[p]);
    const first = active.indexOf(true), last = active.lastIndexOf(true);
    const events = [];
    if (!vehicle.bestaand && first >= 0) events.push({ period: first, kind: 'start', label: vehicle.contract === 'lease' ? 'Lease start' : 'Aankoop' });
    if (vehicle.bestaand && last < 0 || last >= 0 && last < P - 1) {
      events.push({ period: last + 1, kind: 'exit', label: vehicle.contract === 'lease' ? 'Uit lease' : 'Verkocht' });
    }
    return { id: vehicle.id, vehicle, existing: !!vehicle.bestaand, active, first, last, events,
      label: vehicle.naam || vehicle.kenteken || `Voertuig ${i + 1}` };
  });
  const names = new Map();
  rows.forEach(r => names.set(r.label, (names.get(r.label) || 0) + 1));
  const index = new Map();
  rows.forEach(r => { const n = (index.get(r.label) || 0) + 1; index.set(r.label, n); if (names.get(r.label) > 1) r.label += ` · ${n}`; });
  return rows;
}

export function periodChanges(report, plan, period) {
  const rows = fleetLifecycle(report, plan);
  const events = rows.flatMap(row => row.events.filter(e => e.period === period).map(event => ({ ...event, row })));
  const start = report.settings.startjaar + period * (report.settings.periode_jaren || 1);
  const end = Math.min(report.settings.startjaar + report.settings.jaren, start + (report.settings.periode_jaren || 1));
  const annual = (plan.per_jaar || []).filter(r => +r.jaar >= start && +r.jaar < end);
  const chargers = (plan.laadpunten || []).map(c => ({ name: c.naam,
    added: c.aantal[period] - (period ? c.aantal[period - 1] : report.chargers?.find(x => x.naam === c.naam)?.bestaand || 0) })).filter(c => c.added > 0);
  return { events, bought: events.filter(e => e.kind === 'start'), sold: events.filter(e => e.kind === 'exit'), chargers,
    count: plan.aantallen?.[period], investment: annual.reduce((s, r) => s + (r.investering || 0), 0),
    grid: plan.net_kw?.[period], co2: plan.co2?.[period] };
}

export const completePlan = p => !!p && Number.isFinite(p.ncw) && Array.isArray(p.jaren) && p.jaren.length > 0
  && Array.isArray(p.vloot) && Array.isArray(p.per_jaar) && Array.isArray(p.dagen) && p.dagen.length === p.jaren.length;

export function scenarioCatalogue(report) {
  const checks = report.scenario_checks ?? (report.scenarios?.axes || []).flatMap(a => a.levels.filter(l => l.id !== 'basis').map(l => {
    const key = `${a.id}:${l.id}`, o = report.scenarios.outcomes[key];
    return { id: key, axis: a.id, name: a.name, level: l.id, label: l.label, roles: o || {}, changes: {} };
  }));
  return checks.map(c => {
    const outcome = report.scenarios?.outcomes?.[c.id];
    const advice = c.roles?.advies || {}, diesel = c.roles?.diesel || {};
    return { ...c, advice, diesel, outcome,
      saving: Number.isFinite(advice.ncw) && Number.isFinite(diesel.ncw) ? diesel.ncw - advice.ncw : null,
      explorable: completePlan(outcome?.advies) && completePlan(outcome?.diesel) && report.variants.some(v => v.variant === 'basis') };
  });
}

export const statusLabel = p => Number.isFinite(p?.ncw) ? p.status === 'optimaal' ? 'Optimaal' : 'Berekend, met marge' :
  ({ onhaalbaar: 'Niet haalbaar', invoerfout: 'Invoer niet geldig', gestopt: 'Gestopt', fout: 'Berekening mislukt', tijdslimiet: 'Geen oplossing binnen rekentijd' }[p?.status] || 'Geen uitkomst beschikbaar');

// Apply saved input changes to the explanatory context without changing solved numbers.
export function presentationContext(source, variant, scenario = null) {
  const change = scenario ? source.scenario_checks?.find(c => c.id === scenario)?.changes || {} : variant.wijzigingen || {};
  const settings = { ...source.settings }, choices = { ...source.choices }, business = { ...source.business }, goals = { ...source.goals };
  for (const [key, value] of Object.entries(change)) {
    const [scope, field] = key.split('.');
    if (scope === 'instellingen') settings[field] = value;
    if (scope === 'wensen') { choices[field] = value; if (field in business) business[field] = value; if (field in goals) goals[field] = value; }
  }
  const priceFactor = change['factor.ev_prijs'];
  let candidates = priceFactor == null ? source.candidates : (source.candidates || []).map(c => c.aandrijving === 'electric' ?
    { ...c, prijs: c.prijs * priceFactor, lease_pj: c.lease_pj == null ? c.lease_pj : c.lease_pj * priceFactor } : c);
  const levy = change['factor.heffing'];
  let fleet = source.fleet;
  if (levy != null) {
    candidates = (candidates || []).map(c => ({ ...c, heffing_km: (c.heffing_km || 0) * levy }));
    fleet = (fleet || []).map(v => ({ ...v, heffing_km: (v.heffing_km || 0) * levy }));
  }
  const delay = change['factor.net_jaren'];
  const depot = delay == null ? source.depot : { ...source.depot, netopties: (source.depot.netopties || []).map(n => ({ ...n,
    vanaf_jaar: Math.max(settings.startjaar, +(n.vanaf_jaar || settings.startjaar) + delay),
    kw_per_jaar: Object.fromEntries(Object.entries(n.kw_per_jaar || {}).map(([year, kw]) => [+year + delay, kw])) })) };
  return { ...source, settings, choices, business, goals, candidates, fleet, depot, view_changes: change };
}
