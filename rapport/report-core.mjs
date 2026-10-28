// Shared, deterministic presentation calculations. No new optimization takes
// place in the reader's browser; every selectable plan was solved in the app.
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
  return { plan: { ...variant, ...outcome.advies, notices: [] }, ref: ref ? { ...ref, ...outcome.diesel } : null, key };
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
