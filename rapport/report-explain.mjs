// Plain-language explanations of the calculated plan. Everything is derived from the
// solved plan and the saved inputs; nothing here changes a number.
import { fleetSlots, totalYear, periodYears } from './report-core.mjs';

const nf = d => new Intl.NumberFormat('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = (x, d = 0) => x == null || !Number.isFinite(x) ? '—' : `${x < 0 ? '−' : ''}€ ${nf(d).format(Math.abs(x))}`;
const round = x => Math.abs(x) >= 10000 ? Math.round(x / 1000) * 1000 : Math.abs(x) >= 1000 ? Math.round(x / 100) * 100 : Math.round(x);
const pct = x => x == null || !Number.isFinite(x) ? '—' : `${nf(0).format(x * 100)}%`;
const list = xs => xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} en ${xs.at(-1)}`;
const hour = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
const isEV = v => v.aandrijving === 'electric';
const baseTrip = id => String(id).split('~')[0];

// When does the existing vehicle reach the end of its life or contract (period index)?
function naturalEnd(report, plan, f) {
  const pj = report.settings.periode_jaren || 1;
  return Math.min(plan.jaren.length, Math.round((+f.resterende_jaren || 0) / pj));
}
function tripsOf(report, plan, id) {
  const names = new Map();
  plan.dagen?.forEach(d => d.toewijzing.forEach(t => { if (t.voertuig_id === id) names.set(baseTrip(t.rit_id), t.rit); }));
  return [...names.keys()].map(k => report.trips.find(t => t.id === k)).filter(Boolean);
}
function noEvTrips(plan) {
  return (plan.waarschuwingen || []).filter(w => /haalt geen elektrisch model/.test(w)).map(w => w.split(':')[0]);
}

export function moves(report, plan) {
  // Every change in the fleet, in order: which current vehicle, what replaces it, when.
  const lanes = fleetSlots(plan), out = [];
  for (const lane of lanes) {
    const old = lane.find(v => v.bestaand);
    for (const v of lane.filter(x => !x.bestaand)) out.push({ vehicle: v, old, period: plan.jaren.indexOf(v.start) });
  }
  return out.sort((a, b) => a.period - b.period || String(a.vehicle.groep).localeCompare(String(b.vehicle.groep)));
}

export function reasonFor(report, plan, move) {
  const { vehicle: v, old, period } = move, why = [];
  const f = old && report.fleet.find(x => x.id === old.id);
  const trips = tripsOf(report, plan, v.id);
  const ze = trips.filter(t => t.ze_vanaf);
  const start = report.settings.startjaar + period * (report.settings.periode_jaren || 1);
  if (f) {
    const end = naturalEnd(report, plan, f);
    if (end <= period) why.push(f.contract === 'lease' ? `het leasecontract van ${f.naam} loopt dan af` : `${f.naam} is dan aan vervanging toe`);
    else if (isEV(v)) why.push(`eerder vervangen loont: de lagere kosten per kilometer verdienen de aanschaf terug`);
    else why.push(`eerder vervangen is hier goedkoper dan doorrijden`);
  } else why.push(report.choices?.groei_pct > 0 ? 'er komen ritten bij door de groei' : 'er is een extra wagen nodig voor de ritten');
  if (isEV(v)) {
    if (ze.length) why.push(`${list(ze.map(t => t.naam))} ${ze.length === 1 ? 'moet' : 'moeten'} vanaf ${Math.min(...ze.map(t => t.ze_vanaf))} zero-emissie rijden`);
    else if (report.goals?.ze_doel_pct > 0 && start >= (report.goals.ze_doel_jaar || 0)) why.push(`het draagt bij aan uw doel van ${report.goals.ze_doel_pct}% zero-emissie`);
    if (trips.length) why.push(`hij rijdt ${list(trips.map(t => `${t.naam} (${Math.round(t.km)} km)`))}, dat haalt de accu`);
  } else {
    const blocked = trips.filter(t => noEvTrips(plan).includes(t.naam));
    if (blocked.length) why.push(`geen elektrisch model haalt ${list(blocked.map(t => `${t.naam} (${Math.round(t.km)} km)`))} zonder laadstop`);
    else if (report.choices?.elektrisch === false) why.push('elektrisch stond uit in uw keuzes');
    else why.push('voor deze rit is elektrisch over de looptijd nog duurder');
  }
  why.push(v.contract === 'lease' ? 'leasen is voor deze wagen goedkoper dan kopen' : report.choices?.lease === false ? 'leasen stond uit, dus kopen' : 'kopen is over de looptijd goedkoper dan leasen');
  return why;
}

export function stays(report, plan) {
  // Current vehicles that keep driving to the end of the horizon.
  const P = plan.jaren.length;
  return fleetSlots(plan).map(l => l.find(v => v.bestaand)).filter(v => v && v.actief[P - 1] && v.actief.every(Boolean));
}

export function verdict(report, plan, ref, m) {
  const e = m.end.elektrisch, n = m.end.elektrisch + m.end.diesel;
  const evMoves = moves(report, plan).filter(x => isEV(x.vehicle));
  const steps = new Set(evMoves.map(x => x.period)).size;
  const when = steps ? ` in ${steps === 1 ? 'één stap' : `${steps} stappen`}` : '';
  if (plan.referentie) return 'Doorgaan op diesel, als vergelijking';
  if (!e) return 'Blijf voorlopig rijden op diesel';
  if (e === n) return `Rijd in ${plan.jaren.at(-1).slice(0, 4)} volledig elektrisch${when}`;
  return `Stap over op elektrisch met ${e} van de ${n} wagens${when}`;
}

export function pillars(report, plan, ref, m) {
  const mv = moves(report, plan), ev = mv.filter(x => isEV(x.vehicle)), dsl = mv.filter(x => !isEV(x.vehicle));
  const stay = stays(report, plan).length;
  const points = (plan.laadpunten || []).reduce((s, l) => s + Math.max(0, ...l.aantal), 0);
  const kw0 = report.depot.aansluiting_kw, up = plan.net_kw.findIndex(k => k > kw0);
  const Y = report.settings.jaren, years = periodYears(report, plan);
  const co2 = ref && ref !== plan && ref.co2 ? ref.co2.reduce((s, v, p) => s + (v - plan.co2[p]) * years[p], 0) : null;
  return [
    { key: 'Voertuigen', big: `${m.end.elektrisch} van ${m.end.elektrisch + m.end.diesel}`, unit: 'elektrisch',
      text: [ev.length ? `${ev.length} nieuwe elektrische` : null, dsl.length ? `${dsl.length} nieuwe diesel` : null, stay ? `${stay} ${stay === 1 ? 'huidige blijft' : 'huidige blijven'}` : null].filter(Boolean).join(' · ') },
    { key: 'Laden', big: points ? `${points}` : '—', unit: points === 1 ? 'laadpunt' : 'laadpunten',
      text: up >= 0 ? `aansluiting naar ${Math.round(plan.net_kw[up])} kW in ${plan.jaren[up]}` : `past op de huidige ${Math.round(kw0)} kW` + (plan.thuisladers?.length ? ` · ${plan.thuisladers.length} laden thuis` : '') },
    { key: 'Geld', big: ref && ref !== plan ? money(round(m.saving / Y)) : money(round(plan.ncw / Y)), unit: ref && ref !== plan ? (m.saving >= 0 ? 'voordeel per jaar' : 'extra per jaar') : 'per jaar',
      text: `investering ${money(round(plan.investering))}` + (m.payback ? ` · terugverdiend in ${report.settings.startjaar + m.payback - 1}` : '') },
    { key: 'Uitstoot', big: m.co2Pct != null ? `−${pct(Math.max(0, m.co2Pct))}` : '—', unit: 'CO₂',
      text: (co2 != null ? `${nf(0).format(co2 / 1000)} ton minder in ${Y} jaar · ` : '') + `${pct(plan.ze_aandeel?.at(-1))} van de km elektrisch` },
  ];
}

export function differenceStory(plan, ref, rows, Y) {
  const plus = rows.filter(r => r.saving > 0).sort((a, b) => b.saving - a.saving), min = rows.filter(r => r.saving < 0).sort((a, b) => a.saving - b.saving);
  const out = [];
  if (plus[0]) out.push(`Het grootste voordeel zit in ${plus[0].name.toLowerCase()}: ${money(round(plus[0].saving / Y))} per jaar minder dan bij diesel blijven.`);
  if (plus[1]) out.push(`Daarnaast scheelt ${plus[1].name.toLowerCase()} ${money(round(plus[1].saving / Y))} per jaar.`);
  if (min[0]) out.push(`Daartegenover staat ${min[0].name.toLowerCase()}: ${money(round(-min[0].saving / Y))} per jaar meer${min[1] ? `, en ${min[1].name.toLowerCase()} ${money(round(-min[1].saving / Y))}` : ''}.`);
  const tot = ref.ncw - plan.ncw;
  out.push(tot >= 0 ? `Per saldo is het plan ${money(round(tot / Y))} per jaar goedkoper.` : `Per saldo kost het plan ${money(round(-tot / Y))} per jaar meer.`);
  return out;
}

export function yearsStory(plan, ref, m) {
  if (!ref || ref === plan) return [];
  const a = plan.per_jaar.map(totalYear), b = ref.per_jaar.map(totalYear), out = [];
  const peak = a.indexOf(Math.max(...a.map((x, i) => x - b[i]).map((d, i) => d === Math.max(...a.map((x, j) => x - b[j])) ? a[i] : -Infinity)));
  const extra = a.map((x, i) => x - b[i]);
  const worst = extra.indexOf(Math.max(...extra));
  if (extra[worst] > 0) out.push(`In ${plan.per_jaar[worst].jaar} kost het plan ${money(round(extra[worst]))} meer dan diesel blijven, vooral door de aanschaf van nieuwe wagens.`);
  const cheaper = extra.map((x, i) => x < 0 ? plan.per_jaar[i].jaar : null).filter(Boolean);
  if (cheaper.length) out.push(`In ${list(cheaper)} is het plan goedkoper, doordat stroom en onderhoud minder kosten dan diesel.`);
  if (m.payback) out.push(`Opgeteld is het verschil in ${plan.per_jaar[m.payback - 1].jaar} terugverdiend.`);
  if (plan.per_jaar.at(-1) && totalYear(plan.per_jaar.at(-1)) < 0) out.push('Het laatste jaar is negatief omdat de restwaarde van het wagenpark dan wordt meegeteld.');
  void peak;
  return out;
}

export function chargingStory(report, plan) {
  const out = [], s = report.settings, kw0 = report.depot.aansluiting_kw;
  const up = plan.net_kw.findIndex(k => k > kw0);
  const peak = Math.max(...plan.dagen.map(d => Math.max(...d.net)));
  if (up >= 0) out.push(`De netaansluiting gaat in ${plan.jaren[up]} naar ${Math.round(plan.net_kw[up])} kW. Zonder verzwaring past het laden van alle wagens niet naast het gebouw.`);
  else if (plan.laadpunten?.length) out.push(`Alle wagens laden binnen de huidige aansluiting van ${Math.round(kw0)} kW. De hoogste afname is ${Math.round(peak)} kW, dus verzwaren is niet nodig.`);
  if (report.choices?.netverzwaring === false) out.push('Netverzwaring stond uit in uw keuzes.');
  for (const l of plan.laadpunten || []) {
    const c = report.chargers?.find(x => x.naam === l.naam);
    out.push(`${Math.max(...l.aantal)}× ${l.naam}${c?.investering ? ` (${money(c.investering)} per stuk)` : ''}: genoeg om de wagens op tijd vol te krijgen, niet meer dan nodig.`);
  }
  // Share of depot charging inside the off-peak window
  let dal = 0, all = 0;
  const lo = s.dal_van ?? 22, hi = s.dal_tot ?? 7, inDal = h => lo > hi ? (h >= lo || h < hi) : (h >= lo && h < hi);
  const day = plan.dagen.at(-1), ax = plan.tijdas;
  day?.laden.forEach((kw, i) => { const e = kw * (ax[i + 1] - ax[i]) / 60; all += e; if (inDal((ax[i] + ax[i + 1]) / 120)) dal += e; });
  if (all > 0) out.push(`${pct(dal / all)} van het laden op het depot valt in het daltarief (${hour(lo)}–${hour(hi)}), omdat stroom dan goedkoper is.`);
  if (day?.onderweg_kwh_pj) out.push(`Onderweg wordt ${nf(0).format(day.onderweg_kwh_pj / 1000)} MWh per jaar snelgeladen, alleen waar de accu anders niet genoeg is.`);
  if (day?.thuis_kwh_pj) out.push(`Thuis laden ${plan.thuisladers?.length || 0} wagens ${nf(0).format(day.thuis_kwh_pj / 1000)} MWh per jaar.`);
  return out;
}

export function robustness(report, base, ref) {
  const sc = report.scenarios; if (!sc || !ref) return [];
  const rows = sc.axes.flatMap(a => a.levels.filter(l => l.id !== 'basis').map(l => ({ a, l, o: sc.outcomes[`${a.id}:${l.id}`] }))).filter(x => x.o);
  const good = rows.filter(x => x.o.diesel.ncw - x.o.advies.ncw > 0), bad = rows.filter(x => x.o.diesel.ncw - x.o.advies.ncw <= 0);
  const out = [];
  out.push(bad.length ? `In ${good.length} van de ${rows.length} scenario’s blijft het advies goedkoper dan diesel blijven.` : `In alle ${rows.length} scenario’s blijft het advies goedkoper dan diesel blijven. Het advies is daarmee robuust.`);
  if (bad.length) out.push(`Bij ${list(bad.map(x => `${x.a.name.toLowerCase()} ${x.l.label}`))} is diesel blijven voordeliger.`);
  const spread = rows.map(x => ({ x, s: x.o.diesel.ncw - x.o.advies.ncw })).sort((p, q) => Math.abs(q.s - (ref.ncw - base.ncw)) - Math.abs(p.s - (ref.ncw - base.ncw)))[0];
  if (spread) out.push(`De ${spread.x.a.name.toLowerCase()} heeft de meeste invloed: bij ${spread.x.l.label} wordt het voordeel ${money(round(spread.s))}.`);
  const fleetChange = rows.filter(x => x.o.advies.aantallen?.at(-1)?.elektrisch !== base.aantallen?.at(-1)?.elektrisch);
  if (fleetChange.length) out.push(`Het aantal elektrische wagens verandert bij ${list(fleetChange.map(x => `${x.a.name.toLowerCase()} ${x.l.label} (${x.o.advies.aantallen.at(-1).elektrisch})`))}.`);
  else out.push('In elk scenario blijft het aantal elektrische wagens gelijk.');
  return out;
}

// Every choice and setting, with what it means. [group, label, format, explanation]
export const CHOICES = {
  koop: ['Aanschaf', 'Kopen', 'bool', 'Nieuwe wagens mogen worden gekocht.'],
  lease: ['Aanschaf', 'Leasen', 'bool', 'Nieuwe wagens mogen worden geleased. Het model kiest per wagen wat goedkoper is.'],
  elektrisch: ['Aanschaf', 'Elektrisch', 'bool', 'Elektrische modellen doen mee in de vergelijking.'],
  nieuwe_diesel: ['Aanschaf', 'Nieuwe diesels', 'bool', 'Een wagen die op is mag worden vervangen door een nieuwe diesel.'],
  subsidies: ['Aanschaf', 'Subsidies', 'text', 'Welke subsidies meetellen: geen, alleen toegekende, of alle als aanname.'],
  eerder_vervangen: ['Aanschaf', 'Eerder vervangen', 'bool', 'Een wagen mag worden vervangen voordat hij op is, als dat goedkoper is.'],
  max_leeftijd: ['Aanschaf', 'Maximale leeftijd', 'jaar', 'Eigen wagens gaan uiterlijk op deze leeftijd de deur uit.'],
  lease_eerder_stoppen: ['Aanschaf', 'Lease eerder stoppen', 'bool', 'Een lopend leasecontract mag eerder stoppen, tegen afkoop.'],
  lease_boete_maanden: ['Aanschaf', 'Afkoop lease', 'mnd', 'Aantal maanden leasetermijn dat de afkoop kost.'],
  max_investering_pj: ['Budget', 'Investering per jaar', 'eur', 'Hoeveel er per jaar hooguit wordt geïnvesteerd in wagens, laden en net.'],
  max_kapitaal: ['Budget', 'Kapitaalbehoefte', 'eur', 'Hoeveel geld er op enig moment hooguit vastzit in het plan.'],
  max_lease_pm: ['Budget', 'Lease per maand', 'eur', 'Het maximale leasebedrag per maand voor de hele vloot.'],
  max_nieuw_pj: ['Budget', 'Nieuwe wagens per jaar', 'int', 'Hoeveel nieuwe wagens er per jaar hooguit instromen.'],
  reserve_per_groep: ['Inzet', 'Reservewagens per groep', 'int', 'Wagens die achter de hand blijven voor pech of onderhoud.'],
  meerdere_ritten: ['Inzet', 'Meerdere ritten per wagen', 'bool', 'Een wagen mag na terugkomst op het depot nog een rit rijden.'],
  piek_weken: ['Inzet', 'Drukke weken per jaar', 'int', 'Weken met extra ritten, als apart scenario meegerekend.'],
  groei_pct: ['Inzet', 'Groei of krimp per jaar', 'pctnum', 'Het aantal ritten per dag groeit of krimpt met dit percentage per jaar.'],
  groei_vanaf: ['Inzet', 'Groei vanaf', 'year', 'Het eerste jaar waarin de groei meetelt.'],
  ze_doel_pct: ['Doelen', 'Zero-emissie kilometers', 'pctnum', 'Dit deel van de kilometers moet elektrisch worden gereden.'],
  ze_doel_jaar: ['Doelen', 'Zero-emissie vanaf', 'year', 'Vanaf dit jaar geldt het zero-emissiedoel.'],
  co2_prijs_ton: ['Doelen', 'Interne CO₂-prijs', 'eurton', 'Een prijs per ton CO₂ die in de kosten meetelt, om uitstoot zwaarder te laten wegen.'],
  netverzwaring: ['Laden', 'Netverzwaring', 'bool', 'Een zwaardere netaansluiting mag worden aangevraagd.'],
  laden_onderweg: ['Laden', 'Laden onderweg', 'bool', 'Snelladen tijdens een rit telt mee.'],
  omhangen: ['Laden', 'Stekkers omhangen', 'bool', 'Iemand mag ’s nachts stekkers verwisselen, zodat minder laadpunten nodig zijn.'],
  omhang_personeel: ['Laden', 'Mensen voor omhangen', 'int', 'Hoeveel mensen tegelijk stekkers kunnen verwisselen.'],
  pv_batterij: ['Laden', 'Zon en batterij', 'bool', 'Zonnepanelen en een batterij op het depot mogen meedoen.'],
  ere_prijs: ['Laden', 'ERE-opbrengst', 'eurkwh', 'Opbrengst per kWh uit emissiereductie-eenheden.'],
  winter: ['Risico', 'Winterscenario', 'bool', 'In de winter verbruiken elektrische wagens meer; het plan moet ook dan werken.'],
  winter_kans: ['Risico', 'Deel van het jaar winter', 'pct', 'Het aandeel van het jaar met winterverbruik.'],
  winter_extra: ['Risico', 'Meer verbruik in de winter', 'pct', 'Hoeveel meer stroom een elektrische wagen in de winter gebruikt.'],
  risicoweging: ['Risico', 'Weging slechtste uitkomst', 'pct', 'Hoe zwaar een ongunstige uitkomst meeweegt naast de gemiddelde.'],
};
export const SETTINGS = {
  startjaar: ['Looptijd', 'Startjaar', 'year', 'Het eerste jaar van het plan.'],
  jaren: ['Looptijd', 'Looptijd', 'jaren', 'Over zoveel jaar zijn alle kosten bij elkaar opgeteld.'],
  periode_jaren: ['Looptijd', 'Beslissen per', 'jaren', 'Hoe vaak het model kan kiezen: elk jaar of elke twee jaar.'],
  rekenrente: ['Geld', 'Rekenrente', 'pct1', 'Toekomstige kosten tellen minder zwaar dan kosten nu. Zo zijn bedragen uit verschillende jaren eerlijk op te tellen.'],
  inzetdagen: ['Inzet', 'Werkdagen per jaar', 'int', 'Hoe vaak de representatieve werkdag per jaar voorkomt.'],
  dieselprijs: ['Prijzen', 'Dieselprijs', 'eurl', 'Prijs per liter, zonder btw.'],
  diesel_stijging: ['Prijzen', 'Stijging dieselprijs', 'pct1', 'Hoeveel de dieselprijs per jaar stijgt.'],
  stroom_dal: ['Prijzen', 'Stroom daltarief', 'eurkwh', 'Prijs per kWh in de daluren.'],
  stroom_piek: ['Prijzen', 'Stroom normaaltarief', 'eurkwh', 'Prijs per kWh overdag.'],
  dal_van: ['Prijzen', 'Daltarief vanaf', 'hour', 'Begin van de daluren.'],
  dal_tot: ['Prijzen', 'Daltarief tot', 'hour', 'Einde van de daluren.'],
  teruglevering: ['Prijzen', 'Teruglevering', 'eurkwh', 'Opbrengst per kWh die het depot teruglevert.'],
  piektarief_kw_maand: ['Prijzen', 'Piektarief', 'eurkwm', 'Netkosten per kW van de hoogste afname, per maand.'],
  ev_prijsdaling: ['Prijzen', 'Prijsdaling elektrisch', 'pct1', 'Hoeveel goedkoper elektrische wagens elk jaar worden.'],
  co2_diesel: ['Uitstoot', 'CO₂ diesel', 'kgl', 'Uitstoot per liter diesel, van bron tot wiel.'],
  co2_stroom: ['Uitstoot', 'CO₂ stroom', 'kgkwh', 'Uitstoot per kWh stroom uit het net.'],
  soc_min: ['Accu', 'Accu nooit onder', 'pct', 'De accu zakt nooit onder dit deel, als buffer.'],
  begin_soc: ['Accu', 'Accu bij de start van de dag', 'pct', 'Hoe vol de accu’s aan het begin van de dag zijn.'],
  accu_veroudering: ['Accu', 'Accuveroudering', 'pct1', 'Hoeveel capaciteit een accu per jaar verliest.'],
};
export function formatValue(fmt, v) {
  if (v === null || v === undefined || v === '') return fmt === 'bool' ? 'nee' : fmt === 'year' ? '—' : 'geen grens';
  switch (fmt) {
    case 'bool': return v ? 'ja' : 'nee';
    case 'eur': return money(+v);
    case 'eurton': return `${money(+v)} per ton`;
    case 'eurl': return `${money(+v, 2)} per liter`;
    case 'eurkwh': return `${money(+v, 2)} per kWh`;
    case 'eurkwm': return `${money(+v, 2)} per kW per maand`;
    case 'pct': return pct(+v);
    case 'pct1': return `${nf(1).format(+v * 100)}%`;
    case 'pctnum': return `${nf(0).format(+v)}%`;
    case 'jaar': return `${v} jaar`;
    case 'jaren': return `${v} ${+v === 1 ? 'jaar' : 'jaar'}`;
    case 'mnd': return `${v} maanden`;
    case 'hour': return hour(+v);
    case 'kgl': return `${nf(2).format(+v)} kg per liter`;
    case 'kgkwh': return `${nf(2).format(+v)} kg per kWh`;
    case 'year': case 'int': return String(v);
    case 'text': return ({ geen: 'niet meenemen', bevestigd: 'alleen toegekend', alle: 'alle, als aanname' })[v] || String(v);
    default: return String(v);
  }
}
export const GLOSSARY = [
  ['Contante waarde', 'Alle kosten over de looptijd, teruggerekend naar vandaag met de rekenrente. Een euro over vijf jaar telt minder dan een euro nu.'],
  ['Diesel blijven', 'Het plan waarin u op diesel doorrijdt en wagens alleen door een nieuwe diesel vervangt. Dit is de vergelijking voor het advies.'],
  ['Omslagpunt', 'Het jaar waarin het plan, opgeteld, goedkoper is geworden dan diesel blijven.'],
  ['Representatieve werkdag', 'Een gewone werkdag met al uw ritten. Het model rekent deze dag door en herhaalt hem voor alle werkdagen.'],
  ['Daltarief', 'Goedkopere stroom in de nacht. Het model laadt zoveel mogelijk in deze uren.'],
  ['Netaansluiting', 'Het maximale vermogen dat het depot tegelijk uit het net kan halen, voor gebouw en laden samen.'],
  ['Zero-emissiezone', 'Een gebied in een stad waar vanaf een bepaald jaar alleen nog uitstootvrije bedrijfswagens in mogen.'],
  ['Restwaarde', 'Wat een wagen aan het einde van de looptijd nog waard is. Die waarde telt als opbrengst mee.'],
  ['Optimalisatiemarge', 'Hoe dicht het plan bij het best denkbare plan zit. Bij 2% kan geen ander plan meer dan 2% goedkoper zijn.'],
  ['Scenario', 'Hetzelfde vraagstuk met een andere dieselprijs, stroomprijs of groei. Elk scenario is apart doorgerekend.'],
];
