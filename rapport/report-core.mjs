// Shared, deterministic presentation calculations. No new optimization takes
// place in the reader's browser; every selectable plan was solved in the app.
// Older personal links predate the explicit report type and retain their texts.
export function analysisTexts(report, variant, scenario = null) {
  return !scenario && (report.report_type == null || report.report_type === 'gemini') ? variant.texts || {} : {};
}
export function adviceSummary(report, variant, fallback, scenario = null) {
  const ai = analysisTexts(report, variant, scenario);
  return ai.ai_edit_samenvatting ?? variant.texts?.samenvatting ?? ai.ai_samenvatting ?? fallback;
}
export const totalYear = row => Object.entries(row || {}).reduce((sum, [k, v]) => sum + (k !== 'jaar' && typeof v === 'number' ? v : 0), 0);
export const cumulative = values => { let sum = 0; return values.map(x => sum += x); };
export function reference(report, variant) {
  return report.variants.find(x => x.referentie && x !== variant && Number.isFinite(x.ncw)) || null;
}
export function metrics(report, variant, ref = reference(report, variant)) {
  const end = variant.aantallen?.at(-1) || { elektrisch: 0, diesel: 0 };
  const saving = ref ? ref.ncw - variant.ncw : null;
  const uncertainty = ref ? Math.abs(variant.ncw) * (variant.gap || 0) + Math.abs(ref.ncw) * (ref.gap || 0) : 0;
  const baseCO2 = ref?.co2?.at(-1), co2 = variant.co2?.at(-1);
  let payback = null;
  if (ref) {
    const differences = variant.per_jaar.map((row, i) => totalYear(ref.per_jaar[i]) - totalYear(row));
    const sums = cumulative(differences);
    // The crossing must remain nonnegative through the horizon.
    payback = sums.findIndex((v, i) => v >= 0 && sums.slice(i).every(x => x >= 0));
    payback = payback < 0 ? null : payback + 1;
  }
  return { ref, end, saving, uncertainty, inconclusive: saving !== null && uncertainty > 0 && Math.abs(saving) < uncertainty,
    co2, baseCO2, co2Saving: baseCO2 == null || co2 == null ? null : baseCO2 - co2,
    co2Pct: baseCO2 ? (baseCO2 - co2) / baseCO2 : null, payback };
}
export function costRows(variant, ref) {
  const posts = new Map();
  for (const x of variant.kosten || []) posts.set(x.post, { name: x.post, plan: x.ncw, base: 0 });
  for (const x of ref?.kosten || []) { if (!posts.has(x.post)) posts.set(x.post, { name: x.post, plan: 0, base: 0 }); posts.get(x.post).base = x.ncw; }
  return [...posts.values()].map(x => ({ ...x, saving: ref ? x.base - x.plan : null })).sort((a, b) => Math.abs(b.plan) - Math.abs(a.plan));
}
export function fleetSlots(variant) {
  const slots = new Map();
  for (const v of variant.vloot || []) {
    const key = v.plek || v.id;
    if (!slots.has(key)) slots.set(key, []);
    slots.get(key).push(v);
  }
  // A solver's candidate slot is not necessarily a one-to-one successor to the
  // existing vehicle with that label. Keep concurrent assets on separate rows.
  const tracks = [];
  for (const slot of slots.values()) {
    const lanes = [];
    for (const vehicle of slot.sort((a, b) => Number(b.bestaand) - Number(a.bestaand))) {
      const lane = lanes.find(row => !row.some(other => vehicle.actief.some((active, p) => active && other.actief[p])));
      if (lane) lane.push(vehicle); else lanes.push([vehicle]);
    }
    tracks.push(...lanes);
  }
  return tracks.sort((a, b) => String(a[0].groep).localeCompare(String(b[0].groep)) || String(a[0].naam).localeCompare(String(b[0].naam)));
}
export function steps(report, variant, period) {
  const items = [];
  const added = variant.vloot.filter(v => !v.bestaand && v.start === variant.jaren[period]);
  const counts = new Map();
  for (const v of added) { const key = `${v.naam} · ${v.contract === 'lease' ? 'lease' : 'koop'}`; counts.set(key, (counts.get(key) || 0) + 1); }
  for (const [name, n] of counts) items.push(`${n}× ${name} in gebruik nemen.`);
  for (const charger of variant.laadpunten || []) {
    const existing = report.chargers?.find(c => c.naam === charger.naam)?.bestaand || 0;
    const added = charger.aantal[period] - (period ? charger.aantal[period - 1] : existing);
    if (added > 0) items.push(`${added}× ${charger.naam} plaatsen.`);
  }
  const oldKW = period ? variant.net_kw[period - 1] : report.depot.aansluiting_kw;
  if (variant.net_kw[period] > oldKW) items.push(`Netaansluiting naar ${variant.net_kw[period]} kW voorbereiden.`);
  return items;
}
export function validateReport(data) {
  if (!data || data.schema_version !== 1 || !Array.isArray(data.variants) || !data.variants.length || !data.settings || !data.client) throw new Error('Dit rapport heeft een onbekend formaat. Vraag om een nieuwe link.');
  for (const v of data.variants) {
    if (!Number.isFinite(v.ncw) || !Array.isArray(v.jaren) || !v.jaren.length || !Array.isArray(v.per_jaar) || !Array.isArray(v.vloot) || !Array.isArray(v.dagen) || v.dagen.length !== v.jaren.length) throw new Error('Het rapport is onvolledig. Vraag om een nieuwe versie.');
  }
  return data;
}

// Battery aging made visible: the solver already ages the battery
// (settings.accu_veroudering per year), but the report only listed it as an
// assumption. Here the chosen electric candidates get a SoH/range path and a
// margin against the longest regular day trip in their group.
export function batteryAging(report, plan) {
  const rate = report.settings.accu_veroudering || 0;
  const horizon = report.settings.jaren || plan.jaren.length;
  const socMin = report.settings.soc_min ?? .1, socStart = report.settings.begin_soc ?? .9;
  const window = Math.max(.05, socStart - socMin);
  const longest = new Map();
  for (const t of report.trips || []) if (!t.piek) longest.set(t.groep, Math.max(longest.get(t.groep) || 0, +t.km || 0));
  const chosen = new Map();
  for (const v of plan.vloot || []) {
    if (v.bestaand || v.aandrijving !== 'electric') continue;
    const cand = (report.candidates || []).find(x => x.naam === v.naam && x.aandrijving === 'electric');
    if (cand && cand.accu_kwh > 0 && cand.verbruik_kwh100 > 0) chosen.set(cand.id, cand);
  }
  return [...chosen.values()].map(cand => {
    const rangeNew = Math.round(cand.accu_kwh / cand.verbruik_kwh100 * 100);
    const years = [];
    for (let age = 0; age <= horizon; age++) {
      const soh = Math.pow(1 - rate, age);
      years.push({ age, soh, range: Math.round(rangeNew * soh), usable: Math.round(rangeNew * soh * window) });
    }
    const trip = longest.get(cand.groep) || 0;
    const tightYear = years.find(y => trip > 0 && y.usable < trip)?.age ?? null;
    return { name: cand.naam, group: cand.groep, batteryKwh: cand.accu_kwh, useKwh100: cand.verbruik_kwh100,
      rangeNew, longestTrip: trip, years, tightYear, endSoh: years.at(-1).soh };
  });
}
// Charging infrastructure totals at the end of the plan, from the chargers
// the solver picked (laadpunten per period) and the depot connection path.
export function chargingSummary(report, plan) {
  const types = new Map((report.chargers || []).map(x => [x.naam, x]));
  let pointsEnd = 0, installedKw = 0;
  for (const l of plan.laadpunten || []) {
    const end = l.aantal?.at(-1) || 0, spec = types.get(l.naam);
    pointsEnd += end;
    if (spec) installedKw += end * (spec.kast_kw || (spec.kw_per_connector || 0) * (spec.connectoren || 1));
  }
  const connectionEnd = plan.net_kw?.at(-1) ?? report.depot.aansluiting_kw;
  return { pointsEnd, installedKw, connectionStart: report.depot.aansluiting_kw, connectionEnd,
    upgradeNeeded: connectionEnd > (report.depot.aansluiting_kw || 0) };
}
// Years per decision period (the last period can be shorter).
export function periodYears(report, variant) {
  const pj = report.settings.periode_jaren || 1, Y = report.settings.jaren;
  return variant.jaren.map((_, p) => Math.max(1, Math.min(pj, Y - p * pj)));
}
// A precalculated scenario replaces the advice and its diesel reference by their own solved plans.
// Only the main advice ('basis') has scenarios; other variants are shown as calculated.
export function scenarioPlans(report, variant, key) {
  const ref = reference(report, variant);
  const outcome = key && variant.variant === 'basis' ? report.scenarios?.outcomes?.[key] : null;
  if (!outcome) return { plan: variant, ref, key: null };
  return { plan: { ...variant, ...outcome.advies, texts: {}, notices: [] }, ref: ref ? { ...ref, ...outcome.diesel, texts: {} } : null, key };
}
export function scenarioLevel(report, key) {
  if (!key) return null;
  const [axis, level] = key.split(':'), a = report.scenarios?.axes?.find(x => x.id === axis);
  const l = a?.levels.find(x => x.id === level);
  return a && l ? { axis: a, level: l } : null;
}
// Kilometres per working day in a period, from the trips actually assigned (growth copies carry '~n').
export function dayKm(report, variant, period) {
  const km = new Map((report.trips || []).map(t => [t.id, +t.km || 0]));
  return (variant.dagen?.[period]?.toewijzing || []).reduce((sum, t) => sum + (km.get(String(t.rit_id).split('~')[0]) || 0), 0);
}
export function totalKm(report, variant) {
  const days = report.settings.inzetdagen || 0;
  return periodYears(report, variant).reduce((sum, n, p) => sum + dayKm(report, variant, p) * days * n, 0);
}
