import { totalYear, cumulative, metrics, costRows, fleetSlots, steps, validateReport, periodYears, scenarioPlans, scenarioLevel, dayKm, totalKm, analysisTexts, adviceSummary } from './report-core.mjs';
import { moves, reasonFor, stays, verdict, pillars, differenceStory, yearsStory, chargingStory, robustness, CHOICES, SETTINGS, formatValue, GLOSSARY } from './report-explain.mjs';
import { fleetLifecycle, periodChanges, scenarioCatalogue, statusLabel, presentationContext } from './report-planning.mjs';

const API = 'https://zarvyblveyomngypwvhw.supabase.co/rest/v1/rpc/fleet_report_read';
const APIKEY = 'sb_publishable_srfj19l9xWDSkdirFz6RtQ_RperxnNH';
const q = s => document.querySelector(s);
const nf = d => new Intl.NumberFormat('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d });
const num = (x, d = 0) => x == null || !Number.isFinite(x) ? '—' : nf(d).format(x);
const money = (x, d = 0) => x == null || !Number.isFinite(x) ? '—' : `${x < 0 ? '−' : ''}€ ${nf(d).format(Math.abs(x))}`;
const round = x => Math.abs(x) >= 10000 ? Math.round(x / 1000) * 1000 : Math.abs(x) >= 1000 ? Math.round(x / 100) * 100 : Math.round(x);
const pct = (x, d = 0) => x == null || !Number.isFinite(x) ? '—' : `${num(x * 100, d)}%`;
const compact = x => { const a = Math.abs(x); return a >= 1e6 ? `€ ${num(x / 1e6, a >= 1e7 ? 0 : 1)} mln` : a >= 1e4 ? `€ ${num(x / 1e3)}k` : money(x); };
function ticks(lo, hi, n = 4) {
  const raw = (hi - lo) / n, mag = 10 ** Math.floor(Math.log10(raw || 1)), step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => s >= raw) || raw;
  const out = []; for (let v = Math.floor(lo / step) * step; v <= hi + step * .001; v += step) out.push(+v.toFixed(6));
  if (out.at(-1) < hi) out.push(out.at(-1) + step);
  return out;
}
// Charts are drawn at their real width, so text keeps its size on every screen.
const full = () => Math.max(320, Math.min(1240, innerWidth - 32));
const half = () => innerWidth > 820 ? Math.round(full() / 2 - 44) : full();
const tons = kg => `${num(kg / 1000, kg < 10000 ? 1 : 0)} t`;
const clock = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
const date = x => x ? new Date(x).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const E = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || (v === false && !k.startsWith('aria-'))) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else if (k === 'style') for (const [sk, sv] of Object.entries(v)) sk.startsWith('--') ? node.style.setProperty(sk, sv) : node.style[sk] = sv;
    else node.setAttribute(k, v === true && !k.startsWith('aria-') ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) node.append(c.nodeType ? c : document.createTextNode(String(c)));
  return node;
};
const NS = 'http://www.w3.org/2000/svg';
const V = (tag, attrs = {}, ...children) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) { if (k.startsWith('on')) node.addEventListener(k.slice(2), v); else node.setAttribute(k, String(v)); }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) node.append(c.nodeType ? c : document.createTextNode(String(c)));
  return node;
};
const ICONS = {
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', print: 'M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z', play: 'm8 5 11 7-11 7z', pause: 'M8 5v14M16 5v14',
  close: 'M6 6l12 12M18 6 6 18', mail: 'M3 6h18v12H3zm0 0 9 7 9-7', bolt: 'm13 2-8 12h6l-1 8 8-12h-6z', arrow: 'M4 12h16m-6-6 6 6-6 6',
};
const icon = n => V('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, V('path', { d: ICONS[n] }));
const VEHICLE = {
  trekker: 'M2 7h11v8H2zM13 9h4l3 3v3h-7M5 17.5a1.5 1.5 0 1 0 0 .1M16 17.5a1.5 1.5 0 1 0 0 .1M20 15h2',
  bakwagen: 'M2 5h12v10H2zM14 8h4l3 3v4h-7M5 17.5a1.5 1.5 0 1 0 0 .1M17 17.5a1.5 1.5 0 1 0 0 .1',
  bus: 'M3 5h18v11H3zM3 10h18M6 18a1.5 1.5 0 1 0 0 .1M18 18a1.5 1.5 0 1 0 0 .1',
  bestel: 'M2 7h11v9H2zM13 9h5l3 4v3h-8M5 17.5a1.5 1.5 0 1 0 0 .1M17 17.5a1.5 1.5 0 1 0 0 .1',
};
const vehicleIcon = (kind, cls = '') => V('svg', { class: `vicon ${cls}`, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, V('path', { d: VEHICLE[kind] || VEHICLE.bestel }));
const mark = () => V('svg', { class: 'bmark', viewBox: '2 16 60 32', 'aria-hidden': 'true' }, V('rect', { class: 'bt', x: 2, y: 16, width: 60, height: 32, rx: 16 }),
  V('g', { transform: 'translate(46 32)' }, V('circle', { r: 11, fill: '#fff' }), V('path', { class: 'bb', d: 'M1.6 -7.5L-4.2 1.6H-0.2L-1.6 7.5L4.2 -1.6H0.2Z' })));

// Explanations per cost post, shown on hover in "Waar zit het verschil".
const POSTS = {
  'Brandstof, stroom, onderhoud, heffing': 'Diesel of stroom, onderhoud per kilometer en de vrachtwagenheffing.',
  'Aanschaf voertuigen': 'Koopprijs van nieuwe voertuigen, op het moment van aanschaf.',
  'Verkoop voertuigen': 'Opbrengst van voertuigen die binnen de looptijd worden verkocht.',
  'Restwaarde einde horizon': 'Wat het wagenpark aan het einde nog waard is.',
  'Lease': 'Leasetermijnen van huidige en nieuwe leasevoertuigen.',
  'Verzekering en vaste kosten': 'Verzekering, motorrijtuigenbelasting en andere vaste kosten per voertuig.',
  'Laadpunten': 'Aanschaf en installatie van laadpunten op het depot.',
  'Netverzwaring': 'Eenmalige kosten voor een zwaardere netaansluiting.',
  'Vaste netkosten': 'Vaste jaarlijkse kosten van de netaansluiting.',
  'Gecontracteerd vermogen': 'Kosten voor het gecontracteerde en piekvermogen.',
  'Subsidie': 'Toegekende of verwachte subsidie op elektrische voertuigen.',
  'Thuisladen, vergoeding stroom': 'Vergoeding aan chauffeurs voor stroom die thuis wordt geladen.',
  'Laadpalen thuis': 'Laadpalen bij chauffeurs thuis.',
  'Onderhoud laadpunten': 'Jaarlijks onderhoud en abonnementen van de laadpunten.',
  'Restwaarde laadpunten': 'Wat de laadpunten aan het einde nog waard zijn.',
  'Afkoop lease': 'Kosten om een leasecontract eerder te beëindigen.',
  'Meerkilometers lease': 'Kilometers boven het leasecontract.',
  'CO₂-prijs': 'De interne CO₂-prijs die u heeft meegegeven.',
  'Zon en batterij': 'Zonnepanelen en een batterij op het depot.',
};
const SCENARIO_TEXT = {
  diesel: 'Een lagere of hogere dieselprijs, bijvoorbeeld door accijns of door ETS2, de CO₂-heffing op brandstof vanaf 2028.',
  stroom: 'Dal- en normaaltarief allebei hoger of lager.',
  groei: 'Meer of minder ritten per dag, met de vloot die daarbij past.',
  net: 'De netbeheerder levert de verzwaring eerder of later dan gepland. Door netcongestie zijn wachttijden van jaren gewoon.',
  evprijs: 'Elektrische wagens worden sneller of minder snel goedkoper.',
  subsidie: 'Zonder subsidie, of met alle aangevraagde subsidie toegekend.',
  rente: 'Een lagere of hogere rekenrente: geld lenen wordt goedkoper of duurder.',
  heffing: 'De vrachtwagenheffing gaat omhoog of omlaag. Elektrische vrachtwagens betalen een lager tarief.',
};
const KIND = { investering: 'Investeringen', voertuig: 'Lease en vaste kosten', gebruik: 'Brandstof, stroom en onderhoud', laden: 'Laden en net', overig: 'Overig' };
const KIND_COLOR = { investering: '#15171A', voertuig: '#7A8188', gebruik: '#F2A33A', laden: '#0A8F5B', overig: '#C3C3BD' };

let report, sourceReport;
const state = { variant: 0, scenario: null, period: 0, costMode: 'cum', diffMode: 'jaar', clock: 28, playing: null, planPlaying: null, vehicle: null, compare: true, open: new Set(), fleetFilter: 'all', scenarioFilter: 'all', scenarioSort: 'axis', inspect: null };
const params = new URLSearchParams(location.search);

async function load() {
  try {
    let response;
    if (params.has('preview')) {
      const ids = params.get('preview').split('/');
      if (ids.length !== 2 || ids.some(x => !/^[A-Za-z0-9_-]{1,40}$/.test(x))) throw new Error('Dit voorbeeldadres is ongeldig. Open het rapport vanuit de app.');
      const query = new URLSearchParams({ variant: params.get('variant') || '', kentekens: params.get('kentekens') || '0', titel: params.get('titel') || '', varianten: params.get('varianten') || '', rapporttype: params.get('rapporttype') || 'standaard' });
      response = await fetch(`/api/klanten/${ids[0]}/berekeningen/${ids[1]}/online?${query}`, { cache: 'no-store' });
    } else if (params.get('demo') === '1') response = await fetch('./demo.json', { cache: 'no-store' });
    else {
      const token = location.hash.slice(1);
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('Open dit rapport via de persoonlijke link die u van ons heeft ontvangen.');
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map(x => x.toString(16).padStart(2, '0')).join('');
      response = await fetch(API, { method: 'POST', headers: { apikey: APIKEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token_hash: hash }), cache: 'no-store', referrerPolicy: 'no-referrer' });
    }
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.fout || 'Het rapport kan nu niet worden geladen. Probeer het later opnieuw.');
    const data = await response.json();
    if (!data) throw new Error('Deze link is verlopen, ingetrokken of niet gevonden. Vraag ons om een nieuwe link.');
    sourceReport = report = validateReport(data);
    state.variant = Math.max(0, report.variants.findIndex(x => x.variant === report.selected_variant));
    state.period = 0;
    document.title = `${report.client.name} · ${(report.title || 'Vlootadvies').replace(/\.$/, '')} · Stekker of Diesel`;
    render();
    addEventListener('scroll', spy, { passive: true });
    addEventListener('beforeprint', () => { stopPlan(); stopDay(); document.querySelectorAll('details.app').forEach(d => { d.open = true; }); });
    let w = innerWidth, t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(innerWidth - w) > 40) { w = innerWidth; render(); } }, 200); });
  } catch (error) {
    q('#app').replaceChildren(E('main', { class: 'failed' }, E('a', { class: 'brand', href: 'https://stekkerofdiesel.nl/' }, mark(), 'Stekker of Diesel'),
      E('h1', {}, 'Uw rapport is persoonlijk'), E('p', {}, error.message), E('a', { class: 'btn dark', href: 'mailto:info@stekkerofdiesel.nl' }, icon('mail'), 'info@stekkerofdiesel.nl')));
    q('#app').setAttribute('aria-busy', 'false');
  }
}

// ---------------------------------------------------------------- state
function current() {
  const variant = report.variants[state.variant];
  const { plan, ref, key } = scenarioPlans(report, variant, state.scenario);
  return { plan, ref, key, m: metrics(report, plan, ref), years: periodYears(report, plan) };
}
function set(patch, focus) {
  if (patch.scenario) {
    const check = scenarioCatalogue(sourceReport).find(c => c.id === patch.scenario);
    if (!check?.explorable) return;
    patch.variant = sourceReport.variants.findIndex(v => v.variant === 'basis');
  }
  if ('period' in patch || 'scenario' in patch || 'variant' in patch) stopPlan();
  if ('scenario' in patch || 'variant' in patch) { stopDay(); patch.vehicle = null; }
  Object.assign(state, patch);
  const r = report.variants[state.variant];
  state.period = Math.min(state.period, r.jaren.length - 1);
  render();
  if (focus) document.getElementById(focus)?.focus({ preventScroll: true });
}
function stopDay() { clearInterval(state.playing); state.playing = null; }
function stopPlan() { clearInterval(state.planPlaying); state.planPlaying = null; }
function playPlan() {
  if (state.planPlaying) { stopPlan(); render(); return; }
  stopDay();
  state.vehicle = null;
  if (state.period === current().plan.jaren.length - 1) state.period = 0;
  state.planPlaying = setInterval(() => {
    if (state.period >= current().plan.jaren.length - 1) stopPlan(); else state.period++;
    render();
  }, 2400);
  render();
}

// ---------------------------------------------------------------- building blocks
const section = (id, title, ...children) => E('section', { class: 'section', id, 'aria-label': title }, title ? E('div', { class: 'section-head' }, E('h2', {}, title), children[0]?.isHead ? children.shift().node : null) : null, ...children);
const head = node => ({ isHead: true, node });
const segmented = (options, value, onpick, label) => E('div', { class: 'seg', role: 'group', 'aria-label': label },
  options.map(([v, l]) => E('button', { type: 'button', 'aria-pressed': String(v === value), onclick: () => onpick(v) }, l)));
const periodPicker = (r, onpick = p => set({ period: p })) => segmented(r.jaren.map((j, i) => [i, j]), state.period, onpick, 'Periode');
const tile = (label, value, note, cls = '') => E('div', { class: `tile ${cls}` }, E('span', {}, label), E('b', {}, value), note ? E('small', {}, note) : null);
const prose = text => text ? E('p', { class: 'prose' }, text) : null;
const list = xs => xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} en ${xs.at(-1)}`;
const sentence = x => x ? x[0].toUpperCase() + x.slice(1) + (/[.!?)]$/.test(x) ? '' : '.') : x;
// "Waarom": the reasoning behind a chapter, in plain sentences.
const why = (lines, title = 'Waarom') => { const l = (lines || []).filter(Boolean); return l.length ? E('div', { class: 'why' }, E('b', {}, title), E('ul', {}, l.map(x => E('li', {}, sentence(x))))) : null; };
// Analyse met Gemini: teksten horen bij de gekozen variant en gelden voor de basis, dus niet bij een scenario.
const aiTexts = () => analysisTexts(report, report.variants[state.variant], state.scenario);
const aiNote = id => { const t = aiTexts()[`ai_h_${id}`]; return t && !state.scenario ? E('p', { class: 'ai-note' }, E('b', {}, 'Analyse'), t) : null; };
const aiLines = s => (s || '').split('\n').map(x => x.trim()).filter(Boolean).map(x => { const i = x.indexOf(': '); return i > 0 && i < 90 ? [x.slice(0, i), x.slice(i + 2)] : [null, x]; });
const legend = items => E('div', { class: 'legend' }, items.map(([label, color, dash]) => E('span', {}, E('i', { style: dash ? { borderTop: `2px dashed ${color}`, background: 'none', height: 0 } : { background: color } }), label)));
const kindOf = v => v.soort || report.fleet.find(f => f.groep === v.groep)?.soort || (v.groep in VEHICLE ? v.groep : 'bestel');
const isEV = v => v.aandrijving === 'electric';

function tooltip(chart) {
  let tip = chart.querySelector('.tip');
  if (!tip) { tip = E('div', { class: 'tip', role: 'presentation' }); chart.append(tip); }
  return {
    show(x, y, content) { tip.replaceChildren(...content); tip.classList.add('on'); const w = chart.clientWidth; tip.style.left = `${Math.min(Math.max(x, 70), w - 70)}px`; tip.style.top = `${y}px`; },
    hide() { tip.classList.remove('on'); },
  };
}

// Line chart with crosshair; series: [{ name, values, color, dash }]
function lineChart(series, labels, { height = 300, width = full(), format = money, axis = compact, marker } = {}) {
  const W = width, H = height, L = 78, R = 18, T = 28, B = 32;
  const all = series.flatMap(s => s.values).filter(Number.isFinite);
  const tk = ticks(Math.min(0, ...all), Math.max(1, ...all)), lo = tk[0], hi = tk.at(-1);
  const X = i => L + (labels.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (labels.length - 1)), Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const svg = V('svg', { viewBox: `0 0 ${W} ${H}`, class: 'svgchart', role: 'img', 'aria-label': series.map(s => `${s.name}: ${labels.map((l, i) => `${l} ${format(s.values[i])}`).join(', ')}`).join('. ') });
  for (const v of tk) svg.append(V('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: v ? 'gridline' : 'zeroline' }), V('text', { x: L - 12, y: Y(v) + 4, 'text-anchor': 'end', class: 'axis' }, axis(v)));
  labels.forEach((l, i) => svg.append(V('text', { x: X(i), y: H - 8, 'text-anchor': 'middle', class: 'axis' }, l)));
  for (const s of series) {
    const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${X(i)},${Y(v)}`).join('');
    if (s.area) svg.append(V('path', { d: `${d}L${X(s.values.length - 1)},${Y(Math.max(lo, 0))}L${X(0)},${Y(Math.max(lo, 0))}Z`, fill: s.area }));
    svg.append(V('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': s.dash || null }));
    s.values.forEach((v, i) => svg.append(V('circle', { cx: X(i), cy: Y(v), r: 3.5, fill: '#fff', stroke: s.color, 'stroke-width': 2 })));
  }
  if (marker != null) { const mx = Math.min(W - R - 62, Math.max(L + 62, X(marker.i)));
    svg.append(V('g', { class: 'marker' }, V('line', { x1: X(marker.i), x2: X(marker.i), y1: T, y2: H - B }), V('rect', { x: mx - 62, y: T - 24, width: 124, height: 24, rx: 12 }), V('text', { x: mx, y: T - 8, 'text-anchor': 'middle' }, marker.label))); }
  const cross = V('line', { class: 'cross', x1: 0, x2: 0, y1: T, y2: H - B, opacity: 0 });
  svg.append(cross);
  const box = E('div', { class: 'chart' }, svg);
  const tip = tooltip(box);
  const hit = V('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'transparent',
    onpointermove: e => {
      const rect = svg.getBoundingClientRect(), x = (e.clientX - rect.left) / rect.width * W;
      const i = Math.max(0, Math.min(labels.length - 1, Math.round((x - L) / ((W - L - R) / Math.max(1, labels.length - 1)))));
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('opacity', 1);
      tip.show(X(i) / W * rect.width, 8, [E('b', {}, labels[i]), ...series.map(s => E('div', {}, E('i', { style: { background: s.color } }), s.name, E('strong', {}, format(s.values[i]))))]);
    },
    onpointerleave: () => { cross.setAttribute('opacity', 0); tip.hide(); } });
  svg.append(hit);
  return box;
}

// Stacked bars per label; stacks: [{ name, color, values }]
function stackChart(stacks, labels, { height = 300, width = full(), format = money, axis = compact, compare } = {}) {
  const W = width, H = height, L = 78, R = 18, T = 14, B = 32;
  const tot = labels.map((_, i) => stacks.reduce((s, x) => s + Math.max(0, x.values[i] || 0), 0));
  const neg = labels.map((_, i) => stacks.reduce((s, x) => s + Math.min(0, x.values[i] || 0), 0));
  const tk = ticks(Math.min(0, ...neg, ...(compare?.values || [])), Math.max(1, ...tot, ...(compare?.values || []))), lo = tk[0], hi = tk.at(-1);
  const Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B), band = (W - L - R) / labels.length, bw = Math.min(56, band * .56);
  const svg = V('svg', { viewBox: `0 0 ${W} ${H}`, class: 'svgchart', role: 'img', 'aria-label': labels.map((l, i) => `${l}: ${format(tot[i] + neg[i])}`).join(', ') });
  for (const v of tk) svg.append(V('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: v ? 'gridline' : 'zeroline' }), V('text', { x: L - 12, y: Y(v) + 4, 'text-anchor': 'end', class: 'axis' }, axis(v)));
  const box = E('div', { class: 'chart' }, svg), tip = tooltip(box);
  labels.forEach((l, i) => {
    const x = L + band * i + (band - bw) / 2;
    let up = 0, down = 0;
    const g = V('g', { class: 'bar' });
    for (const s of stacks) {
      const v = s.values[i] || 0; if (!v) continue;
      const y0 = v > 0 ? up : down, y1 = y0 + v;
      g.append(V('rect', { x, width: bw, y: Y(Math.max(y0, y1)), height: Math.max(.5, Math.abs(Y(y0) - Y(y1))), fill: s.color, rx: 2 }));
      if (v > 0) up = y1; else down = y1;
    }
    if (compare) {
      const v = compare.values[i];
      g.append(V('line', { x1: x - 6, x2: x + bw + 6, y1: Y(v), y2: Y(v), stroke: compare.color, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    }
    g.append(V('rect', { x: L + band * i, width: band, y: T, height: H - T - B, fill: 'transparent',
      onpointerenter: () => { g.classList.add('hover'); const rect = svg.getBoundingClientRect();
        tip.show((x + bw / 2) / W * rect.width, 8, [E('b', {}, l), ...stacks.filter(s => s.values[i]).map(s => E('div', {}, E('i', { style: { background: s.color } }), s.name, E('strong', {}, format(s.values[i])))),
          E('div', { class: 'tot' }, 'Totaal', E('strong', {}, format(tot[i] + neg[i]))), compare ? E('div', {}, E('i', { style: { background: compare.color } }), compare.name, E('strong', {}, format(compare.values[i]))) : null]); },
      onpointerleave: () => { g.classList.remove('hover'); tip.hide(); } }));
    svg.append(g, V('text', { x: x + bw / 2, y: H - 8, 'text-anchor': 'middle', class: 'axis' }, l));
  });
  return box;
}

// ---------------------------------------------------------------- top
function topbar() {
  return E('header', { class: 'top' }, E('div', { class: 'wrap top-in' },
    E('a', { class: 'brand', href: 'https://stekkerofdiesel.nl/', 'aria-label': 'Stekker of Diesel' }, mark(), 'Stekker of Diesel'),
    E('div', { class: 'top-actions' },
      E('button', { class: 'btn ghost', type: 'button', onclick: downloadCsv }, icon('download'), E('span', {}, 'Cijfers')),
      E('button', { class: 'btn dark', type: 'button', onclick: () => print() }, icon('print'), E('span', {}, 'Bewaar als pdf')))));
}
const SECTIONS = [['overzicht', 'Overzicht'], ['vlootplan', 'Vlootplan'], ['scenarios', 'Scenario’s'], ['analyse', 'Analyse'], ['verschil', 'Kosten'], ['jaren', 'Door de jaren'], ['kansen', 'Kansen'], ['keuzes', 'Keuzes'], ['wagens', 'Per wagen'],
  ['investeringen', 'Investering'], ['laden', 'Laden'], ['werkdag', 'Werkdag'], ['uitstoot', 'Uitstoot'], ['varianten', 'Plannen'], ['stappen', 'Stappen'], ['verantwoording', 'Aannames'], ['bijlage', 'Bijlage']];
function nav(c) {
  const lvl = scenarioLevel(report, c.key);
  return E('nav', { class: 'nav', 'aria-label': 'Hoofdstukken' }, E('div', { class: 'wrap nav-in' },
    E('div', { class: 'nav-links' }, SECTIONS.filter(([id]) => id !== 'scenarios' || scenarioCatalogue(report).length).filter(([id]) => id !== 'kansen' || report.opportunities?.items?.length || report.opportunities?.checks?.length).filter(([id]) => id !== 'analyse' || aiTexts().ai_kern || aiTexts().ai_samenvatting).filter(([id]) => id !== 'varianten' || report.variants.length > 2 || report.variant_checks?.some(v => !Number.isFinite(v.ncw)))
      .map(([id, label, group]) => [group ? E('span', { class: 'nav-group' }, group) : null, E('a', { href: `#${id}`, 'data-id': id, onclick: e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } }, label)])),
    lvl ? E('button', { class: 'chip', type: 'button', onclick: () => set({ scenario: null }), 'aria-label': 'Terug naar de basis' }, `${lvl.axis.name} ${lvl.level.label}`, icon('close')) : null));
}
function spy() {
  const links = document.querySelectorAll('.nav-links a'); let active = null;
  for (const a of links) { const s = document.getElementById(a.dataset.id); if (s && s.getBoundingClientRect().top < 160) active = a; }
  links.forEach(a => a.classList.toggle('on', a === active));
  if (active && !active.dataset.seen) { active.dataset.seen = 1; active.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}

function kernStrip() {
  const k = report.kerncijfers;
  if (!k) return null;
  const tiles = [];
  if (k.break_even_jaar) tiles.push(tile('Break-even', `in ${k.break_even_jaar}`, null, 'green'));
  if (k.ncw_voordeel > 0) tiles.push(tile('Voordeel t.o.v. diesel', money(k.ncw_voordeel), null, 'green'));
  if (k.co2_besparing_ton > 0) tiles.push(tile('CO2-besparing', `${num(k.co2_besparing_ton)} ton`, null, 'green'));
  if (k.bomen_per_jaar > 0) tiles.push(tile('Komt overeen met', `${num(k.bomen_per_jaar)} bomen`, 'die dit per jaar opnemen'));
  const laad = (k.laadvermogen || []).filter(x => x.verschil_kg < 0).sort((a, b) => a.verschil_kg - b.verschil_kg)[0];
  if (laad) tiles.push(tile('Laadvermogen ' + laad.soort, `${num(laad.verschil_kg)} kg`, `elektrisch ${num(laad.elektrisch_kg)} vs diesel ${num(laad.diesel_kg)} kg`));
  if (k.netpiek_max && k.netpiek_max.benutting_pct != null) tiles.push(tile('Hoogste netpiek', `${num(k.netpiek_max.piek_kw)} kW`, `${k.netpiek_max.benutting_pct}% van de aansluiting (${num(k.netpiek_max.grens_kw)} kW) in ${k.netpiek_max.periode}`));
  if (!tiles.length) return null;
  return E('div', { class: 'block' }, E('div', { class: 'block-head' }, E('h3', {}, 'De vijf kerncijfers')),
    E('div', { class: 'tiles four' }, tiles));
}

// ---------------------------------------------------------------- 1 overzicht
function overview(c) {
  const { plan, ref, m } = c, Y = report.settings.jaren, years = `${report.settings.startjaar}–${report.settings.startjaar + Y - 1}`;
  const groups = [...new Set(report.fleet.map(v => v.soort || v.groep))];
  const trips = report.trips.filter(t => !t.piek).length;
  const lvl = scenarioLevel(report, c.key);
  const left = E('div', { class: 'id' }, E('div', { class: 'eyebrow' }, vehicleIcon(groups[0] || 'bestel'), E('span', {}, report.client.name)),
    E('h1', { class: 'verdict' }, `Vlootplan ${years}`),
    E('p', {}, [`${report.fleet.length} voertuigen`, `${trips} ritten per dag`, years, report.client.place].filter(Boolean).join(' · ')));
  let headline;
  const ze = report.trips.some(t => t.ze_vanaf) || (report.goals?.ze_doel_pct > 0);
  if (ref && m.saving > 0) headline = [E('h2', { class: 'headline' }, plan.naam === 'Advies' ? 'Ons advies is ' : `${plan.naam} is `, E('em', {}, money(round(m.saving))), ' goedkoper'),
    E('p', { class: 'sub' }, `dan diesel blijven · ${money(round(m.saving / Y))} per jaar · ${Y} jaar, contante waarde`)];
  else if (ref && !plan.referentie && ze) headline = [E('h2', { class: 'headline' }, 'Zero-emissie rijden kost ', E('em', { class: 'amber' }, money(round(-m.saving))), ' extra'), E('p', { class: 'sub' }, `ten opzichte van diesel blijven, dat de zero-emissie-eisen niet haalt · ${Y} jaar`)];
  else if (ref && !plan.referentie) headline = [E('h2', { class: 'headline' }, 'Diesel blijven is ', E('em', { class: 'amber' }, money(round(-m.saving))), ' goedkoper'), E('p', { class: 'sub' }, `${Y} jaar, contante waarde`)];
  else headline = [E('h2', { class: 'headline' }, 'Totale kosten ', E('em', {}, money(round(plan.ncw)))), E('p', { class: 'sub' }, `${Y} jaar, contante waarde`)];
  const right = E('div', { class: 'claim' }, lvl ? E('span', { class: 'tag' }, `Scenario · ${lvl.axis.name.toLowerCase()} ${lvl.level.label}`) : null, headline);

  // Totale kosten (bars) and per km
  const rows = ref && ref !== plan ? [[ref.naam, ref.ncw, 'amber'], [plan.naam, plan.ncw, 'green']] : [[plan.naam, plan.ncw, 'green']];
  const max = Math.max(...rows.map(x => x[1]));
  const km = totalKm(report, plan), kmRef = ref ? totalKm(report, ref) : 0;
  const kmTiles = km > 0 ? E('div', { class: 'tiles three' }, ref && ref !== plan ? tile('Diesel blijven per km', money(ref.ncw / kmRef, 2)) : null, tile(`${plan.naam} per km`, money(plan.ncw / km, 2)),
    ref && ref !== plan ? tile('Verschil per km', money(ref.ncw / kmRef - plan.ncw / km, 2), null, 'green') : null) : null;
  const totals = E('div', { class: 'block' }, E('div', { class: 'block-head' }, E('h3', {}, state.diffMode === 'jaar' ? 'Totale kosten per jaar' : `Totale kosten in ${Y} jaar`),
    segmented([['jaar', 'Per jaar'], ['totaal', `In ${Y} jaar`]], state.diffMode, v => set({ diffMode: v }), 'Per jaar of totaal')),
    E('div', { class: 'bars' }, rows.map(([label, v, cls]) => E('div', { class: 'barrow' }, E('span', {}, label), E('div', { class: 'track' }, E('i', { class: cls, style: { width: `${Math.max(2, v / max * 100)}%` } })),
      E('b', {}, money(state.diffMode === 'jaar' ? v / Y : v))))), kmTiles);
  return section('overzicht', null,
    E('div', { class: 'hero' }, left, right),
    fleetPlan(c),
    E('p', { class: 'plan-conclusion' }, verdict(report, plan, ref, m)),
    E('div', { class: 'pillars' }, pillars(report, plan, ref, m).map(x => E('div', { class: 'pillar' }, E('span', {}, x.key), E('b', {}, x.big, E('small', {}, x.unit)), E('p', {}, x.text)))),
    E('div', { class: 'split' }, totals, whatIf(c)),
    kernStrip(),
    advice(c));
}

function fleetPlan(c) {
  const { plan } = c, rows = fleetLifecycle(report, plan), changes = periodChanges(report, plan, state.period);
  const visible = rows.filter(r => state.fleetFilter === 'all' || (state.fleetFilter === 'electric' ? isEV(r.vehicle) : !isEV(r.vehicle)));
  // The story of the plan in one line: where the fleet starts, where it ends, how much moves.
  const mix = plan.jaren.map((_, p) => plan.aantallen?.[p] || { elektrisch: rows.filter(r => r.active[p] && isEV(r.vehicle)).length, diesel: rows.filter(r => r.active[p] && !isEV(r.vehicle)).length });
  const endMix = mix.at(-1) || { elektrisch: 0, diesel: 0 }, endTotal = endMix.elektrisch + endMix.diesel;
  const nowEV = report.fleet.filter(isEV).length;
  const story = [`Van ${nowEV} van de ${report.fleet.length} elektrisch nu`, `naar ${endTotal ? `${endMix.elektrisch} van de ${endTotal}` : '—'} elektrisch in ${plan.jaren.at(-1)}`,
    `${rows.filter(r => !r.existing && r.first >= 0).length} nieuwe voertuigen erbij`, `${rows.filter(r => r.events.some(e => e.kind === 'exit')).length} eruit`].join(' · ') + '.';
  const lifecycleText = row => {
    if (row.first < 0) return 'Meteen uit de vloot';
    const exit = row.events.find(e => e.kind === 'exit');
    const from = row.existing ? 'Nu' : plan.jaren[row.first];
    return exit ? `${from} – ${plan.jaren[row.last]}` : `${from} – einde looptijd`;
  };
  const pick = (id, period, focus) => {
    set({ vehicle: id === state.vehicle && period === state.period ? null : id, period }, focus);
    if (state.vehicle) document.querySelector('.fleet-detail')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  };
  const cols = plan.jaren.length + 2;
  const groups = [[true, 'Huidige voertuigen'], [false, 'Nieuwe voertuigen']].map(([existing, title]) => {
    const group = visible.filter(r => r.existing === existing);
    return group.length ? [E('tr', { class: 'fleet-group' }, E('th', { colspan: cols, scope: 'colgroup' }, title, E('span', {}, `${group.length}`))), group.map(row => {
      const v = row.vehicle, exit = row.events.find(e => e.kind === 'exit');
      return E('tr', { class: row.id === state.vehicle ? 'selected' : '' },
        E('th', { scope: 'row', class: 'fleet-name' }, E('button', { type: 'button', onclick: () => pick(row.id, Math.max(0, row.first), `fleet-row-${row.id}`), id: `fleet-row-${row.id}` },
          vehicleIcon(kindOf(v), isEV(v) ? 'e' : 'd'), E('span', {}, E('b', {}, row.label), E('small', {}, [isEV(v) ? 'Elektrisch' : 'Diesel', v.kenteken].filter(Boolean).join(' · ')), E('small', { class: 'fleet-life' }, lifecycleText(row))))),
        E('td', { class: 'fleet-now' }, row.existing ? E('span', { class: 'fleet-current' }, 'In uw vloot') : E('span', { class: 'fleet-muted' }, '—')),
        plan.jaren.map((j, p) => {
          const event = row.events.find(e => e.period === p);
          const label = event?.label || (row.active[p] ? 'Rijdt door' : exit && p > exit.period ? 'Uit vloot' : 'Nog niet in vloot');
          const id = `fleet-cell-${row.id}-${p}`;
          const seg = row.active[p] ? p === row.first && p === row.last ? ' seg-single' : p === row.first ? ' seg-first' : p === row.last ? ' seg-last' : ' seg-mid' : '';
          return E('td', { class: p === state.period ? 'period-on' : '' }, E('button', { id, type: 'button',
            class: `fleet-cell ${row.active[p] ? isEV(v) ? 'electric' : 'diesel' : 'inactive'}${seg}${event?.kind === 'exit' ? ' exit' : ''}${event?.kind === 'start' ? ' arrival' : ''}`,
            'aria-label': `${row.label}, ${j}: ${label}`, 'aria-pressed': row.id === state.vehicle && p === state.period,
            onclick: () => pick(row.id, p, id) },
            event ? E('span', { class: 'fleet-event' }, E('i', { 'aria-hidden': 'true' }, event.kind === 'exit' ? '↗' : '+'), event.label) :
              E('span', { class: 'fleet-bar', 'aria-hidden': 'true' })));
        }));
    })] : null;
  });
  const selected = rows.find(r => r.id === state.vehicle);
  const planPicker = E('label', { class: 'plan-picker' }, E('span', {}, 'Bekijk plan'), E('select', { id: 'plan-picker', onchange: e => set({ variant: +e.target.value, scenario: null, inspect: null }, 'plan-picker') },
    report.variants.map((v, i) => E('option', { value: i, selected: i === state.variant }, v.naam))));
  const catalogue = scenarioCatalogue(report), checked = catalogue.length;
  return E('div', { id: 'vlootplan', class: 'fleet-planner' },
    E('div', { class: 'planner-heading' }, E('div', {}, E('h2', {}, 'Uw vloot, van nu tot straks'), E('p', { class: 'fleet-story' }, story), E('p', { class: 'fleet-hint' }, 'Klik op een jaar, balk of voertuig voor de keuze, de kosten en de inzet.')), planPicker),
    E('div', { class: 'fleet-mix', role: 'group', 'aria-label': 'Vlootmix per periode' }, plan.jaren.map((j, p) => {
      const m = mix[p], total = m.elektrisch + m.diesel;
      return E('button', { type: 'button', class: `mix-year${p === state.period ? ' on' : ''}`, 'aria-pressed': p === state.period, 'aria-label': `${j}: ${m.elektrisch} elektrisch, ${m.diesel} diesel. Bekijk periode`, onclick: () => set({ period: p }, `fleet-period-${p}`) },
        E('span', { class: 'mix-top' }, E('b', {}, j), E('span', {}, total ? `${m.elektrisch}/${total} elektrisch` : '—')),
        E('span', { class: 'mix-bar', 'aria-hidden': 'true' }, total ? [E('i', { class: 'e', style: { width: `${m.elektrisch / total * 100}%` } }), E('i', { class: 'd', style: { width: `${m.diesel / total * 100}%` } })] : null),
        E('span', { class: 'mix-sub', 'aria-hidden': 'true' }, total ? `${m.elektrisch} elektrisch · ${m.diesel} diesel` : 'geen voertuigen'));
    })),
    c.key ? E('div', { class: 'scenario-context', role: 'status' }, E('span', {}, E('b', {}, `Scenario: ${scenarioLevel(report, c.key)?.axis.name || ''} · ${scenarioLevel(report, c.key)?.level.label || ''}`), 'Dit hele rapport toont de uitkomst van dit scenario.'),
      E('button', { class: 'btn small', onclick: () => set({ scenario: null }, 'plan-picker') }, 'Terug naar basis')) : null,
    E('div', { class: 'planner-toolbar' }, E('div', { class: 'fleet-key' }, E('span', {}, E('i', { class: 'electric' }), 'Elektrisch'), E('span', {}, E('i', { class: 'diesel' }), 'Diesel'), E('span', {}, E('i', { class: 'start' }, '+'), 'Nieuw erbij'), E('span', {}, E('i', { class: 'sale' }, '↗'), 'Uit de vloot')),
      segmented([['all', 'Alle'], ['electric', 'Elektrisch'], ['diesel', 'Diesel']], state.fleetFilter, v => set({ fleetFilter: v, vehicle: null }), 'Voertuigen filteren')),
    E('p', { class: 'fleet-mobile-hint' }, 'Veeg naar links om alle jaren te bekijken →'),
    E('div', { class: 'fleet-scroll', id: 'fleet-scroll', tabindex: 0, role: 'region', 'aria-label': 'Interactieve vlootplanning, horizontaal en verticaal te scrollen' },
      E('table', { class: 'fleet-matrix', style: { '--periods': plan.jaren.length } }, E('caption', { class: 'sr-only' }, 'Vlootplanning: huidige vloot, aanschaf, inzet en verkoop per periode'),
        E('thead', {}, E('tr', {}, E('th', { scope: 'col' }, 'Voertuig'), E('th', { scope: 'col', class: 'fleet-now' }, 'Nu'),
          plan.jaren.map((j, p) => E('th', { scope: 'col', class: p === state.period ? 'period-on' : '' }, E('button', { type: 'button', id: `fleet-period-${p}`, 'aria-pressed': p === state.period, onclick: () => set({ period: p }, `fleet-period-${p}`) }, j, E('small', {}, `${mix[p].elektrisch}/${mix[p].elektrisch + mix[p].diesel} elektrisch`)))))),
        E('tbody', {}, groups, visible.length ? null : E('tr', {}, E('td', { colspan: cols, class: 'fleet-empty' }, 'Geen voertuigen met dit filter.'))))),
    E('div', { class: 'planner-footer' }, E('span', {}, '↗ Uit de vloot staat bij de start van de periode waarin het voertuig vertrekt.'), E('span', {}, 'Licht spoor: nog niet of niet meer in de vloot.')),
    selected ? fleetVehicleDetail(plan, selected) : null,
    E('div', { class: 'period-detail', 'aria-live': 'polite' }, E('div', { class: 'period-heading' }, E('span', { class: 'eyebrow' }, 'Op dit beslismoment'), E('h3', {}, plan.jaren[state.period]),
      E('div', { class: 'period-arrows' }, plan.jaren.length > 1 ? E('button', { class: 'btn small ghost', type: 'button', id: 'plan-play', onclick: playPlan, 'aria-label': state.planPlaying ? 'Vlootplan pauzeren' : 'Vlootplan afspelen' }, icon(state.planPlaying ? 'pause' : 'play'), state.planPlaying ? 'Pauze' : 'Speel plan') : null,
        E('button', { class: 'btn small ghost', type: 'button', id: 'plan-prev', disabled: state.period === 0, 'aria-label': 'Vorige periode', onclick: () => set({ period: state.period - 1 }, state.period === 1 ? 'plan-next' : 'plan-prev') }, '←'),
        E('button', { class: 'btn small ghost', type: 'button', id: 'plan-next', disabled: state.period === plan.jaren.length - 1, 'aria-label': 'Volgende periode', onclick: () => set({ period: state.period + 1 }, state.period === plan.jaren.length - 2 ? 'plan-prev' : 'plan-next') }, '→'))),
      E('div', { class: 'period-actions' }, ...[
        [changes.bought.length, changes.bought.length === 1 ? 'nieuw voertuig' : 'nieuwe voertuigen', changes.bought.map(e => `${e.row.label} · ${e.label.toLowerCase()}`)],
        [changes.sold.length, 'voertuigen uit de vloot', changes.sold.map(e => `${e.row.label} · ${e.label.toLowerCase()}`)],
        [changes.chargers.reduce((s, x) => s + x.added, 0), changes.chargers.reduce((s, x) => s + x.added, 0) === 1 ? 'nieuw laadpunt' : 'nieuwe laadpunten', changes.chargers.map(x => `${x.added}× ${x.name}`)],
      ].map(([n, title, lines]) => E('div', {}, E('b', {}, n), E('span', {}, title), E('p', {}, lines.length ? lines.join(' · ') : 'Geen wijziging')))),
      E('div', { class: 'period-facts' }, E('span', {}, 'Vloot dan ', E('b', {}, `${mix[state.period].elektrisch} elektrisch · ${mix[state.period].diesel} diesel`)), E('span', {}, 'Net ', E('b', {}, `${num(changes.grid)} kW`)), E('span', { title: 'Saldo van aanschaf en opbrengsten in deze periode, inclusief de restwaarde aan het einde van de looptijd.' }, 'Investeringen en opbrengsten ', E('b', {}, money(changes.investment)), ' · incl. eindrestwaarde'), E('span', {}, 'CO₂ per jaar ', E('b', {}, tons(changes.co2))))),
    checked ? E('button', { class: 'scenario-jump', type: 'button', onclick: () => document.getElementById('scenarios')?.scrollIntoView({ behavior: 'smooth' }) },
      E('span', {}, E('b', {}, `${checked} scenario’s onderzocht`), 'Ontdek wat prijzen, groei of een andere aansluiting veranderen.'), icon('arrow')) : null);
}

function fleetVehicleDetail(plan, row) {
  const v = row.vehicle, trips = plan.dagen?.[state.period]?.toewijzing?.filter(t => t.voertuig_id === row.id) || [];
  const start = row.existing ? 'Nu in uw vloot' : row.first >= 0 ? `${v.contract === 'lease' ? 'Lease vanaf' : 'Aankoop in'} ${plan.jaren[row.first]}` : 'Niet ingezet';
  const exit = row.events.find(e => e.kind === 'exit');
  const f = report.fleet.find(f => f.id === row.id);
  return E('div', { class: 'fleet-detail', role: 'region', 'aria-labelledby': 'fleet-detail-title' }, E('div', { class: 'fleet-detail-head' }, vehicleIcon(kindOf(v), isEV(v) ? 'e' : 'd'), E('div', {}, E('span', { class: 'eyebrow' }, 'Dit gebeurt met dit voertuig'), E('h3', { id: 'fleet-detail-title' }, row.label)),
    E('button', { class: 'btn small ghost', type: 'button', onclick: () => set({ vehicle: null }), 'aria-label': 'Voertuigdetails sluiten' }, icon('close'))),
    E('div', { class: 'fleet-detail-facts' }, tile('Begin', start), tile('Einde', exit ? `${exit.label} in ${plan.jaren[exit.period]}` : 'Blijft binnen de looptijd in de vloot'),
      tile(row.existing ? 'Huidig contract' : v.contract === 'lease' ? 'Lease per maand' : 'Aanschaf', row.existing ? f?.contract === 'lease' ? 'Lease' : 'Eigendom' : v.contract === 'lease' ? money((v.lease_pj || 0) / 12) : money(v.prijs))),
    E('p', {}, E('b', {}, `Inzet in ${plan.jaren[state.period]}: `), trips.length ? trips.map(t => t.rit).join(' · ') : row.active[state.period] ? 'In de vloot; geen vaste rit toegewezen in deze werkdag.' : 'Niet in gebruik in deze periode.'),
    !row.existing ? why(reasonFor(report, plan, moveOf(plan, v))) : null);
}
// The plan at a glance: per decision moment what changes, and the main reason.
function route(c) {
  const { plan } = c, mv = moves(report, plan), P = plan.jaren.length;
  const now = { e: report.fleet.filter(isEV).length, d: report.fleet.filter(v => !isEV(v)).length };
  const cols = plan.jaren.map((j, p) => {
    const here = mv.filter(x => x.period === p);
    const extra = steps(report, plan, p).filter(s => !/in gebruik nemen/.test(s));
    const n = plan.aantallen[p];
    return E('li', { class: 'stop' + (here.length || extra.length ? '' : ' quiet') }, E('div', { class: 'stop-h' }, E('b', {}, j), E('span', {}, `${n.elektrisch} elektrisch · ${n.diesel} diesel`)),
      here.length ? E('ul', { class: 'moves' }, here.map(x => {
        const r = reasonFor(report, plan, x).slice(0, 2).map(sentence).join(' ');
        return E('li', {}, E('button', { type: 'button', class: 'move ' + (isEV(x.vehicle) ? 'e' : 'd'), onclick: () => { set({ vehicle: x.vehicle.id }); document.getElementById('vlootplan')?.scrollIntoView({ behavior: 'smooth' }); } },
          vehicleIcon(kindOf(x.vehicle)), E('span', {}, E('b', {}, x.old ? `${x.old.naam} → ${x.vehicle.naam}` : `Erbij: ${x.vehicle.naam}`), E('small', {}, r))));
      })) : null,
      extra.map(s => E('p', { class: 'stop-x' }, icon('bolt'), s.replace(/\.$/, ''))),
      !here.length && !extra.length ? E('p', { class: 'stop-x' }, 'Niets veranderen') : null);
  });
  return E('div', { class: 'route' }, E('h3', {}, 'Het plan in stappen'), E('ol', { class: 'stops-row', style: { '--n': P + 1 } },
    E('li', { class: 'stop start' }, E('div', { class: 'stop-h' }, E('b', {}, 'Nu'), E('span', {}, `${now.e} elektrisch · ${now.d} diesel`)), E('p', { class: 'stop-x' }, `${report.fleet.length} voertuigen, ${num(report.depot.aansluiting_kw)} kW aansluiting`)), cols));
}
function whatIf(c) {
  const axes = report.scenarios?.axes || [];
  const basis = report.variants[state.variant].variant === 'basis';
  if (!axes.length || !basis) return E('div', { class: 'block whatif' }, E('div', { class: 'block-head' }, E('h3', {}, 'Wat er gebeurt')), timeline(c));
  return E('div', { class: 'block whatif' }, E('div', { class: 'block-head' }, E('h3', {}, 'Wat als')),
    axes.map(a => {
      const cur = c.key?.startsWith(a.id + ':') ? c.key.split(':')[1] : 'basis';
      const i = Math.max(0, a.levels.findIndex(l => l.id === cur)), n = a.levels.length - 1;
      const value = E('b', {}, a.levels[i].label);
      const input = E('input', { type: 'range', id: `wi-${a.id}`, min: 0, max: n, step: 1, value: i, 'aria-label': a.name, 'aria-valuetext': a.levels[i].label, style: { '--f': n ? i / n : 0 },
        oninput: e => { const l = a.levels[+e.target.value]; value.textContent = l.label; e.target.style.setProperty('--f', n ? +e.target.value / n : 0); },
        onchange: e => { const l = a.levels[+e.target.value]; set({ scenario: l.id === 'basis' ? null : `${a.id}:${l.id}` }, `wi-${a.id}`); } });
      return E('label', { class: 'slider' + (cur !== 'basis' ? ' active' : '') }, E('div', {}, E('span', {}, a.name), value), input,
        E('div', { class: 'stops' }, a.levels.map(l => E('span', {}, l.id === 'basis' ? 'nu' : l.id))));
    }));
}
function timeline(c) {
  const { plan } = c;
  return E('ol', { class: 'mini-steps' }, plan.jaren.map((j, p) => {
    const s = steps(report, plan, p);
    return E('li', {}, E('b', {}, j), E('span', {}, s.length ? s.slice(0, 2).join(' ') + (s.length > 2 ? ` En ${s.length - 2} meer.` : '') : 'Geen wijzigingen.'));
  }));
}
function advice(c) {
  const { plan, ref, m } = c, t = plan.texts || {};
  const nieuw = plan.vloot.filter(v => !v.bestaand);
  const ev = nieuw.filter(isEV), dsl = nieuw.filter(v => !isEV(v));
  const first = ev.length ? Math.min(...ev.map(v => plan.jaren.indexOf(v.start)).filter(i => i >= 0)) : -1;
  const auto = [];
  if (ev.length) auto.push(`${ev.length} elektrische ${ev.length === 1 ? 'wagen' : 'wagens'} in gebruik nemen, de eerste in ${plan.jaren[first] ?? plan.jaren[0]}.`);
  if (dsl.length) auto.push(`${dsl.length} ${dsl.length === 1 ? 'rit blijft' : 'ritten blijven'} voorlopig diesel, met een nieuwe diesel waar de huidige wagen op is.`);
  const netUp = plan.net_kw.findIndex((k, p) => k > (p ? plan.net_kw[p - 1] : report.depot.aansluiting_kw));
  if (netUp >= 0) auto.push(`De netaansluiting naar ${num(plan.net_kw[netUp])} kW in ${plan.jaren[netUp]}.`);
  else if (plan.laadpunten?.length) auto.push(`Laden past op de huidige aansluiting van ${num(report.depot.aansluiting_kw)} kW.`);
  if (m.co2Saving > 0) auto.push(`De CO₂-uitstoot daalt met ${pct(m.co2Pct)} ten opzichte van diesel blijven.`);
  const kans = report.opportunities?.items?.find(x => x.kind !== 'eis' && x.gain >= Math.max(1000, Math.abs(report.opportunities.base_ncw) * .0025));
  if (kans && plan.variant === 'basis') auto.push(`Grootste kans: ${kans.title.toLowerCase()} levert nog ${money(round(kans.gain))} op.`);
  const points = Object.keys(t).filter(k => /^advies\d+$/.test(k)).sort().map(k => t[k]);
  const notices = [...(plan.notices || []), ...(plan.budget_over || [])];
  return E('div', { class: 'advice' }, E('div', {}, E('h3', {}, 'Ons advies'), prose(adviceSummary(report, plan, defaultSummary(c), state.scenario)), notices.length ? E('ul', { class: 'notices' }, notices.map(n => E('li', {}, n))) : null),
    E('ol', { class: 'points' }, (points.length ? points : auto).map(p => E('li', {}, p))));
  function defaultSummary() {
    if (!ref || plan === ref) return `Dit plan kost ${money(plan.ncw)} over ${report.settings.jaren} jaar.`;
    return m.saving > 0 ? `Met dit plan rijdt ${report.client.name} over ${report.settings.jaren} jaar ${money(round(m.saving))} goedkoper dan met alleen diesel. In ${plan.jaren.at(-1)} rijden ${m.end.elektrisch} van de ${m.end.elektrisch + m.end.diesel} voertuigen elektrisch.`
      : `Doorgaan op diesel is in deze situatie het voordeligst. Elektrisch rijden wordt interessant als prijzen of ritten veranderen.`;
  }
}

// ---------------------------------------------------------------- analyse
function analysis() {
  const t = aiTexts();
  if (!t.ai_kern && !t.ai_samenvatting) return null;
  const part = (key, title) => t[key] ? E('div', { class: 'ai-part' }, E('h3', {}, title), E('ul', {}, aiLines(t[key]).map(([a, b]) => E('li', {}, a ? E('b', {}, a) : null, b)))) : null;
  const sources = aiLines(t.ai_bronnen).map(([, x]) => x.split(' | ')).filter(([, url]) => /^https:\/\//.test(url || ''));
  return section('analyse', 'Analyse',
    t.ai_kern ? E('p', { class: 'ai-lead' }, t.ai_kern) : null,
    t.ai_samenvatting && report.variants[state.variant].texts?.samenvatting ? E('div', { class: 'ai-prose' }, t.ai_samenvatting.split(/\n{2,}/).map(x => E('p', {}, x))) : null,
    E('div', { class: 'ai-grid' }, part('ai_punten', 'Kernpunten'), part('ai_stappen', 'Stappen'), part('ai_kansen', 'Kansen'), part('ai_risicos', 'Risico’s')),
    t.ai_context ? E('div', { class: 'why' }, E('b', {}, 'Wat er in Nederland speelt'), E('p', {}, t.ai_context)) : null,
    part('ai_vragen', 'Wat we nog van u willen weten'),
    E('p', { class: 'ai-by' }, `Aanvullende duiding op basis van deze berekening · ${t.ai_model || 'Gemini'}${t.ai_datum ? ' · ' + date(t.ai_datum) : ''}.`,
      sources.length ? [' Bronnen: ', sources.flatMap(([name, url], i) => [i ? ', ' : '', E('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, name)])] : null));
}

// ---------------------------------------------------------------- 2 verschil
function difference(c) {
  const { plan, ref } = c, Y = report.settings.jaren;
  if (!ref || ref === plan) return null;
  const div = state.diffMode === 'jaar' ? Y : 1;
  const rows = costRows(plan, ref).filter(r => Math.abs(r.saving) >= .5).sort((a, b) => Math.abs(b.saving) - Math.abs(a.saving));
  const max = Math.max(1, ...rows.map(r => Math.abs(r.saving)));
  const info = E('div', { class: 'diff-info' }, E('b', {}, 'Totaal'), E('span', {}, `${money((ref.ncw - plan.ncw) / div)} ${ref.ncw >= plan.ncw ? 'voordeel' : 'nadeel'}`));
  const table = E('div', { class: 'diff' }, E('div', { class: 'diff-row head' }, E('span', {}, ''), E('span', {}, ref.naam), E('span', {}, plan.naam), E('span', { class: 'mid' }, E('em', {}, 'duurder'), E('em', {}, 'goedkoper'))),
    rows.map(r => {
      const s = r.saving / div, w = Math.abs(r.saving) / max * 50;
      return E('div', { class: 'diff-row', tabindex: 0, onpointerenter: () => explain(r), onfocus: () => explain(r), onpointerleave: () => explain(null) },
        E('span', {}, r.name), E('span', { class: 'n' }, money(r.base / div)), E('span', { class: 'n' }, money(r.plan / div)),
        E('span', { class: 'mid' }, E('i', { class: s >= 0 ? 'pos' : 'neg', style: s >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` } }), E('b', { class: s >= 0 ? 'pos' : 'neg' }, `${s >= 0 ? '+' : '−'}${money(Math.abs(s)).slice(2)}`)));
    }));
  function explain(r) { info.replaceChildren(E('b', {}, r ? r.name : 'Totaal'), E('span', {}, r ? POSTS[r.name] || '' : `${money((ref.ncw - plan.ncw) / div)} ${ref.ncw >= plan.ncw ? 'voordeel' : 'nadeel'}`)); }
  return section('verschil', `Waar zit het verschil · ${state.diffMode === 'jaar' ? 'per jaar' : `in ${Y} jaar`}`,
    head(segmented([['jaar', 'Per jaar'], ['totaal', `In ${Y} jaar`]], state.diffMode, v => set({ diffMode: v }), 'Per jaar of totaal')), table, info, why(differenceStory(plan, ref, rows, Y)), aiNote('verschil'), prose(plan.texts?.kosten));
}

// ---------------------------------------------------------------- waar zit de winst
// Every opportunity was solved separately, starting from the advice, and only loosens a limit: the gain is never negative.
function opportunities(c) {
  const o = report.opportunities;
  if (!o || !o.items?.length && !o.checks?.length) return null;
  const Y = report.settings.jaren, base = report.variants.find(v => v.variant === 'basis');
  const small = x => x.gain < Math.max(1000, Math.abs(o.base_ncw) * .0025);
  const real = o.items.filter(x => !small(x)), none = o.items.filter(small);
  const max = Math.max(1, ...real.map(x => x.gain));
  const unit = x => x.unit && x.gain ? (x.gain / x.unit.aantal < 10 ? `€ ${num(x.gain / x.unit.aantal, 2)}` : money(round(x.gain / x.unit.aantal))) + ` per ${x.unit.per}` : null;
  const change = x => {
    const out = [], e0 = base?.aantallen?.at(-1)?.elektrisch, e1 = x.aantallen?.at(-1)?.elektrisch;
    if (e0 != null && e1 != null && e0 !== e1) out.push(`${e1 > e0 ? '+' : '−'}${Math.abs(e1 - e0)} elektrisch`);
    if (base && Math.abs((x.investering || 0) - base.investering) > 500) out.push(`investering ${x.investering > base.investering ? '+' : '−'}${money(round(Math.abs(x.investering - base.investering))).slice(2)}`);
    if (base && x.net_kw && x.net_kw.join() !== base.net_kw.join()) out.push(`net ${x.net_kw.map(k => num(k)).join(' → ')} kW`);
    if (base && x.co2 && base.co2 && Math.abs(x.co2.at(-1) - base.co2.at(-1)) > 500) out.push(`CO₂ ${x.co2.at(-1) < base.co2.at(-1) ? '−' : '+'}${tons(Math.abs(x.co2.at(-1) - base.co2.at(-1)))}`);
    return out;
  };
  const list_ = (items, title) => items.length ? E('div', { class: 'block' }, E('h3', {}, title), E('div', { class: 'kansen' }, items.map(x => E('div', { class: 'kans', tabindex: 0 },
    E('div', { class: 'kans-h' }, E('b', {}, x.title), E('span', { class: 'kans-n' }, money(round(x.gain)), E('small', {}, `${money(round(x.gain / Y))} per jaar`))),
    E('div', { class: 'kans-bar' }, E('i', { class: x.kind === 'eis' ? 'eis' : '', style: { width: `${Math.max(1.5, x.gain / max * 100)}%` } })),
    E('p', {}, [x.text, unit(x), ...change(x)].filter(Boolean).join(' · ')))))) : null;
  const top = real[0], eisen = real.filter(x => x.kind === 'eis'), kansen = real.filter(x => x.kind !== 'eis');
  const reasons = [
    top ? `het grootste knelpunt is ${top.title.toLowerCase()}: dat levert ${money(round(top.gain))} op over ${Y} jaar, ${money(round(top.gain / Y))} per jaar` : 'geen enkele kleine verandering levert iets wezenlijks op: het advies zit niet vast op budget, net of laden',
    real[1] ? `daarna komt ${real[1].title.toLowerCase()} met ${money(round(real[1].gain))}` : null,
    none.length ? `${list(none.map(x => x.title.toLowerCase()))} ${none.length === 1 ? 'levert' : 'leveren'} weinig of niets op; dat ${none.length === 1 ? 'is' : 'zijn'} geen knelpunt${none.length === 1 ? '' : 'en'}` : null,
    'elke verandering is apart doorgerekend, vanaf het advies; met meer rekentijd kan de opbrengst iets hoger uitvallen, nooit lager dan nul',
  ];
  const failed = (o.checks || []).filter(x => !Number.isFinite(x.ncw));
  return section('kansen', 'Waar zit de winst', E('div', { class: 'split' }, list_(kansen, 'Wat u kunt doen'), list_(eisen, 'Wat uw eisen kosten') || (o.items.length ? why(reasons, 'Wat dit zegt') : null)),
    eisen.length ? why(reasons, 'Wat dit zegt') : null,
    none.length ? E('details', { class: 'sensitivity' }, E('summary', {}, `Ook doorgerekend: ${none.length} veranderingen met weinig of geen voordeel`), list_(none, 'Volledige uitkomsten')) : null,
    failed.length ? E('div', { class: 'unavailable-plans' }, E('h3', {}, 'Onderzocht zonder berekende uitkomst'), failed.map(x => E('div', {}, E('b', {}, x.title), E('span', {}, statusLabel(x))))) : null, aiNote('kansen'));
}

// ---------------------------------------------------------------- 3 door de jaren
function years(c) {
  const { plan, ref, m } = c;
  const labels = plan.per_jaar.map(x => x.jaar);
  const a = plan.per_jaar.map(totalYear), b = ref && ref !== plan ? ref.per_jaar.map(totalYear) : null;
  let chart;
  if (state.costMode === 'cum') {
    const s = [{ name: plan.naam, values: cumulative(a), color: '#0A8F5B', area: '#0A8F5B10' }];
    if (b) s.unshift({ name: ref.naam, values: cumulative(b), color: '#F2A33A' });
    chart = lineChart(s, labels, { marker: m.payback ? { i: m.payback - 1, label: `Omslagpunt ${labels[m.payback - 1]}` } : null });
  } else {
    const kinds = Object.keys(KIND).filter(k => plan.per_jaar.some(r => r[k]));
    chart = stackChart(kinds.map(k => ({ name: KIND[k], color: KIND_COLOR[k], values: plan.per_jaar.map(r => r[k] || 0) })), labels,
      { compare: b ? { name: ref.naam, color: '#F2A33A', values: b } : null });
  }
  const cumA = cumulative(a), cumB = b ? cumulative(b) : null;
  return section('jaren', 'Kosten door de jaren',
    head(segmented([['cum', 'Opgeteld'], ['jaar', 'Per jaar']], state.costMode, v => set({ costMode: v }), 'Weergave')), chart,
    state.costMode === 'cum' ? legend([[ref && ref !== plan ? ref.naam : null, '#F2A33A'], [plan.naam, '#0A8F5B']].filter(x => x[0])) : legend([...Object.keys(KIND).filter(k => plan.per_jaar.some(r => r[k])).map(k => [KIND[k], KIND_COLOR[k]]), ...(b ? [[ref.naam, '#F2A33A']] : [])]),
    E('div', { class: 'tablewrap' }, E('table', { class: 'tbl' }, E('thead', {}, E('tr', {}, E('th', {}, ''), labels.map(l => E('th', { class: 'n' }, l)))),
      E('tbody', {}, b ? E('tr', {}, E('td', {}, ref.naam), b.map(v => E('td', { class: 'n' }, money(v)))) : null, E('tr', {}, E('td', {}, plan.naam), a.map(v => E('td', { class: 'n' }, money(v)))),
        b ? E('tr', { class: 'sum' }, E('td', {}, 'Verschil opgeteld'), cumB.map((v, i) => E('td', { class: 'n ' + (v - cumA[i] >= 0 ? 'pos' : 'neg') }, money(v - cumA[i])))) : null))),
    why(yearsStory(plan, ref, m)), aiNote('jaren'), prose(plan.texts?.financiering));
}

// ---------------------------------------------------------------- 4 vlootplan
function fleetRationale(c) {
  const { plan } = c;
  const counts = plan.aantallen;
  const maxN = Math.max(1, ...counts.map(x => x.elektrisch + x.diesel));
  const bars = E('div', { class: 'counts' }, counts.map((x, p) => E('button', { type: 'button', class: 'count' + (p === state.period ? ' on' : ''), onclick: () => set({ period: p }), 'aria-label': `${plan.jaren[p]}: ${x.elektrisch} elektrisch, ${x.diesel} diesel` },
    E('div', { class: 'stack' }, E('i', { class: 'd', style: { height: `${x.diesel / maxN * 100}%` } }), E('i', { class: 'e', style: { height: `${x.elektrisch / maxN * 100}%` } })),
    E('b', {}, `${x.elektrisch} / ${x.elektrisch + x.diesel}`), E('span', {}, plan.jaren[p]))));
  const st = stays(report, plan), mv = moves(report, plan), ch = report.choices || {};
  const reasons = [
    mv.length ? 'het model kiest voor elke wagen het goedkoopste moment om te vervangen: nu, aan het einde van zijn leven of contract, of zodra een zone of doel ingaat' : 'vervangen is in geen enkel jaar goedkoper dan doorrijden',
    st.length ? `${list(st.map(v => v.naam))} ${st.length === 1 ? 'rijdt' : 'rijden'} door tot het einde, omdat vervangen voor ${st.length === 1 ? 'deze wagen' : 'deze wagens'} nog niet loont` : null,
    ch.max_nieuw_pj ? `er komen hooguit ${ch.max_nieuw_pj} nieuwe wagens per jaar bij, zoals u heeft aangegeven` : null,
    ch.reserve_per_groep ? `per groep blijven ${ch.reserve_per_groep} reservewagens achter de hand` : null,
    ch.groei_pct ? `de ritten ${ch.groei_pct > 0 ? 'groeien' : 'krimpen'} met ${Math.abs(ch.groei_pct)}% per jaar${ch.groei_vanaf ? ` vanaf ${ch.groei_vanaf}` : ''}, de vloot groeit of krimpt mee` : null,
  ];
  return section('keuzes', 'De keuzes achter uw vlootplan', bars, why(reasons), route(c), aiNote('vlootplan'), prose(plan.texts?.vlootplan));
}
function moveOf(plan, v) {
  return moves(report, plan).find(x => x.vehicle.id === v.id) || { vehicle: v, old: null, period: plan.jaren.indexOf(v.start) };
}

// ---------------------------------------------------------------- 5 per wagen
function perVehicle(c) {
  const { plan } = c, lanes = fleetSlots(plan);
  const cards = report.fleet.map(f => {
    const lane = lanes.find(l => l.some(v => v.id === f.id));
    const own = lane?.find(v => v.id === f.id);
    const until = own ? own.actief.lastIndexOf(true) : -1;
    const next = lane?.filter(v => !v.bestaand && v.id !== f.id) || [];
    const ev = f.aandrijving === 'electric';
    let line;
    if (!own || until < 0) line = next.length ? `Wordt direct vervangen.` : 'Gaat bij de start de deur uit.';
    else if (until === plan.jaren.length - 1 && !next.length) line = `Blijft rijden tot het einde van de looptijd.`;
    else line = `Rijdt tot en met ${plan.jaren[until]}.`;
    return E('article', { class: 'wagen', tabindex: 0, onclick: () => { set({ vehicle: (next[0] || own)?.id || null }); document.getElementById('vlootplan')?.scrollIntoView({ behavior: 'smooth' }); } },
      E('div', { class: 'wagen-h' }, vehicleIcon(f.soort || 'bestel', ev ? 'e' : 'd'), E('div', {}, E('b', {}, f.naam || f.kenteken || 'Voertuig'), E('span', {}, [ev ? 'elektrisch' : 'diesel', f.bouwjaar, f.contract === 'lease' ? 'lease' : null].filter(Boolean).join(' · ')))),
      E('p', {}, line),
      next.map(v => [E('div', { class: 'wagen-next' }, icon('arrow'), E('span', { class: isEV(v) ? 'e' : 'd' }, v.naam), E('small', {}, `${v.start} · ${v.contract === 'lease' ? `lease ${money((v.lease_pj || 0) / 12)} p/m` : `koop ${money(v.prijs)}`}`)),
        E('ul', { class: 'wagen-why' }, reasonFor(report, plan, moveOf(plan, v)).map(r => E('li', {}, sentence(r))))]),
      !next.length && own && until === plan.jaren.length - 1 ? E('ul', { class: 'wagen-why' }, E('li', {}, 'Vervangen is binnen de looptijd nog niet goedkoper dan doorrijden.')) : null);
  });
  const extra = plan.vloot.filter(v => !v.bestaand && !lanes.find(l => l.some(x => x.bestaand) && l.includes(v)));
  return section('wagens', 'Wat er met elke wagen gebeurt', E('div', { class: 'wagens' }, cards,
    extra.length ? E('article', { class: 'wagen extra' }, E('div', { class: 'wagen-h' }, vehicleIcon('bestel', 'e'), E('div', {}, E('b', {}, 'Extra voertuigen'), E('span', {}, `${extra.length} erbij`))),
      extra.map(v => E('div', { class: 'wagen-next' }, icon('arrow'), E('span', { class: isEV(v) ? 'e' : 'd' }, v.naam), E('small', {}, `${v.start} · ${v.contract === 'lease' ? 'lease' : `koop ${money(v.prijs)}`}`)))) : null),
    prose(plan.texts?.perwagen));
}

// ---------------------------------------------------------------- 6 investeringen
function investments(c) {
  const { plan, ref } = c;
  const labels = plan.per_jaar.map(x => x.jaar);
  const nieuw = plan.vloot.filter(v => !v.bestaand);
  const koop = nieuw.filter(v => v.contract !== 'lease'), lease = nieuw.filter(v => v.contract === 'lease');
  const sub = (plan.kosten || []).find(k => k.post === 'Subsidie');
  const rows = [
    ['Voertuigen kopen', `${koop.length}×`, money(koop.reduce((s, v) => s + (v.prijs || 0), 0))],
    ['Voertuigen leasen', `${lease.length}×`, lease.length ? `${money(lease.reduce((s, v) => s + (v.lease_pj || 0), 0) / 12)} per maand` : '—'],
    ...(plan.laadpunten || []).map(l => [l.naam, `${Math.max(...l.aantal)}×`, '']),
    ...(plan.energie || []).map(e => [e.soort, e.omvang, '']),
  ];
  return section('investeringen', 'Investeringen en financiering',
    E('div', { class: 'tiles four' }, tile('Investering totaal', money(plan.investering)), tile('Hoogste kapitaalbehoefte', money(plan.kapitaal)),
      tile('Subsidie', sub ? money(-sub.ncw) : '—', sub ? 'contante waarde' : null), tile('Nieuwe voertuigen', String(nieuw.length), `${koop.length} koop · ${lease.length} lease`)),
    E('div', { class: 'split' }, E('div', { class: 'block' }, E('h3', {}, 'Investeringen per jaar'),
      stackChart([{ name: 'Investeringen', color: '#15171A', values: plan.per_jaar.map(r => Math.max(0, r.investering || 0)) }], labels,
        { height: 300, width: half(), compare: ref && ref !== plan ? { name: ref.naam, color: '#F2A33A', values: ref.per_jaar.map(r => Math.max(0, r.investering || 0)) } : null })),
      E('div', { class: 'block' }, E('h3', {}, 'Wat er wordt aangeschaft'), E('table', { class: 'tbl' }, E('tbody', {}, rows.map(r => E('tr', {}, E('td', {}, r[0]), E('td', { class: 'n' }, r[1]), E('td', { class: 'n' }, r[2]))))))),
    why(investReasons()), aiNote('investeringen'), prose(plan.texts?.investering));
  function investReasons() {
    const ch = report.choices || {}, m = metrics(report, plan, ref);
    return [
      koop.length && lease.length ? `${koop.length} ${koop.length === 1 ? 'wagen wordt' : 'wagens worden'} gekocht en ${lease.length} geleased: per wagen is gekozen wat over de looptijd goedkoper is` :
        lease.length ? 'alle nieuwe wagens worden geleased, omdat dat hier goedkoper is dan kopen, ook na aftrek van de restwaarde' :
        koop.length ? (ch.lease === false ? 'leasen stond uit in uw keuzes, dus worden alle nieuwe wagens gekocht' : 'kopen is voor elke nieuwe wagen goedkoper dan leasen, omdat de restwaarde aan het einde terugkomt') : null,
      plan.budget_over?.length ? null : ch.max_investering_pj ? `de investering blijft binnen uw grens van ${money(ch.max_investering_pj)} per jaar` : null,
      ch.max_kapitaal && !plan.budget_over?.length ? `er zit nooit meer dan ${money(ch.max_kapitaal)} vast, uw grens voor de kapitaalbehoefte` : null,
      sub ? `de subsidie van ${money(-sub.ncw)} telt mee` : ch.subsidies === 'geen' ? 'subsidies zijn niet meegenomen' : ch.subsidies === 'bevestigd' ? 'alleen al toegekende subsidies tellen mee' : null,
      m.payback ? `opgeteld is de investering in ${report.settings.startjaar + m.payback - 1} terugverdiend` : null,
    ];
  }
}

// ---------------------------------------------------------------- 7 laden
function charging(c) {
  const { plan } = c;
  const rows = [
    ['Netaansluiting', plan.net_kw.map(k => `${num(k)} kW`)],
    ...(plan.laadpunten || []).map(l => [l.naam, l.aantal.map(a => a ? `${a}×` : '—')]),
    ['Kilometers elektrisch', (plan.ze_aandeel || []).map(z => pct(z))],
    ['Laden onderweg', plan.dagen.map(d => d.onderweg_kwh_pj ? `${num(d.onderweg_kwh_pj / 1000, 1)} MWh/jr` : '—')],
    ...(plan.thuisladers?.length ? [['Thuisladen', plan.dagen.map(d => d.thuis_kwh_pj ? `${num(d.thuis_kwh_pj / 1000, 1)} MWh/jr` : '—')]] : []),
  ];
  const pol = report.policies || [];
  const depotText = p => p.depot === 'nooit' ? 'niet op het depot' : p.depot === 'venster' ? `depot ${clock(p.van * 60)}–${clock(p.tot * 60)}` : 'depot, als hij er staat';
  const maxKw = Math.max(1, ...plan.net_kw, report.depot.aansluiting_kw || 0);
  return section('laden', 'Laden en netaansluiting',
    plan.net_kw.some(k => k !== report.depot.aansluiting_kw) && E('div', { class: 'netbars' }, plan.net_kw.map((k, p) => E('div', { class: 'netbar' }, E('div', { class: 'nb-track' }, E('i', { style: { height: `${k / maxKw * 100}%` } }),
      E('em', { style: { bottom: `${(report.depot.aansluiting_kw || 0) / maxKw * 100}%` } })), E('b', {}, `${num(k)} kW`), E('span', {}, plan.jaren[p])))),
    E('div', { class: 'tablewrap' }, E('table', { class: 'tbl' }, E('thead', {}, E('tr', {}, E('th', {}, ''), plan.jaren.map(j => E('th', { class: 'n' }, j)))),
      E('tbody', {}, rows.map(([l, vals]) => E('tr', {}, E('td', {}, l), vals.map(v => E('td', { class: 'n' }, v))))))),
    pol.length ? E('div', { class: 'policies' }, pol.map(p => E('div', { class: 'policy' }, E('b', {}, p.group), E('span', {}, [depotText(p), p.laad_tot < 1 ? `tot ${pct(p.laad_tot)}` : null, p.vertrek_min ? `vertrek ≥ ${pct(p.vertrek_min)}` : null, p.thuis ? 'thuisladen' : null, p.snelladen_depot === false ? 'geen snelladen' : null].filter(Boolean).join(' · '))))) : null,
    why(chargingStory(report, plan)), aiNote('laden'), prose(plan.texts?.laden));
}

// ---------------------------------------------------------------- 8 werkdag
function workday(c) {
  const { plan } = c, day = plan.dagen[state.period], axis = plan.tijdas, T = axis.length - 1;
  const at = minutes => Math.max(0, axis.findIndex((a, i) => a <= minutes && minutes < axis[i + 1]));
  const W = innerWidth > 820 ? full() - 300 : full(), H = innerWidth > 820 ? 300 : 230, L = 44, R = 12, Tp = 12, B = 30;
  const upper = Math.max(1, day.grens || 0, ...day.net, ...day.laden.map((v, i) => v + (Array.isArray(day.gebouw) ? day.gebouw[i] : day.gebouw || 0))) * 1.12;
  const X = m => L + m / 1440 * (W - L - R), Y = kw => Tp + (1 - kw / upper) * (H - Tp - B);
  const geb = i => Array.isArray(day.gebouw) ? day.gebouw[i] : day.gebouw || 0;
  const svg = V('svg', { viewBox: `0 0 ${W} ${H}`, class: 'svgchart', role: 'img', 'aria-label': `Vermogen op het depot op een werkdag in ${plan.jaren[state.period]}` });
  for (let i = 0; i <= 4; i++) { const v = upper * i / 4; svg.append(V('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'gridline' }), V('text', { x: L - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'axis' }, num(v))); }
  for (let h = 0; h <= 24; h += W < 600 ? 6 : 3) svg.append(V('text', { x: X(h * 60), y: H - 8, 'text-anchor': 'middle', class: 'axis' }, `${String(h).padStart(2, '0')}:00`));
  const step = (vals, base) => { let d = ''; for (let i = 0; i < T; i++) d += `${i ? 'L' : 'M'}${X(axis[i])},${Y(vals(i) + (base ? base(i) : 0))}L${X(axis[i + 1])},${Y(vals(i) + (base ? base(i) : 0))}`; return d; };
  const area = (vals, base, fill) => { const top = step(vals, base); let back = ''; for (let i = T - 1; i >= 0; i--) back += `L${X(axis[i + 1])},${Y(base ? base(i) : 0)}L${X(axis[i])},${Y(base ? base(i) : 0)}`; svg.append(V('path', { d: top + back + 'Z', fill })); };
  area(geb, null, '#E4E4DF'); area(i => day.laden[i], geb, '#3FA87766');
  if (day.zon?.some(v => v > 0)) svg.append(V('path', { d: step(i => day.zon[i]), fill: 'none', stroke: '#E8B33A', 'stroke-width': 2 }));
  svg.append(V('path', { d: step(i => day.net[i]), fill: 'none', stroke: '#15171A', 'stroke-width': 2.2 }));
  if (day.grens) svg.append(V('line', { x1: L, x2: W - R, y1: Y(day.grens), y2: Y(day.grens), stroke: '#B8700E', 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }));
  const now = V('line', { x1: X(state.clock * 30), x2: X(state.clock * 30), y1: Tp, y2: H - B, stroke: '#0A8F5B', 'stroke-width': 2 });
  svg.append(now);

  // Wie rijdt wanneer
  const trips = new Map(report.trips.map(t => [t.id, t]));
  const byVehicle = new Map();
  for (const t of day.toewijzing) { const k = t.voertuig_id || `inhuur-${t.rit_id}`; if (!byVehicle.has(k)) byVehicle.set(k, { name: t.voertuig, kind: t.aandrijving, trips: [] }); byVehicle.get(k).trips.push(t); }
  const soc = new Map((day.accu || []).map(a => [a.id, a]));
  const rows = [...byVehicle.entries()].sort((a, b) => a[1].kind.localeCompare(b[1].kind) || a[1].name.localeCompare(b[1].name));
  const gantt = E('div', { class: 'dg' }, E('div', { class: 'dg-axis' }, E('span', {}), E('div', {}, [0, 6, 12, 18, 24].map(h => E('em', { style: { left: `${h / 24 * 100}%` } }, `${String(h).padStart(2, '0')}:00`)))),
    rows.map(([id, v]) => {
      const a = soc.get(id);
      const lane = E('div', { class: 'dg-lane' }, E('i', { class: 'dg-now', style: { left: `${state.clock * 30 / 1440 * 100}%` } }));
      if (a) {
        const pts = a.kwh.map((k, i) => `${axis[i] / 1440 * 100},${100 - k / a.capaciteit * 100}`).join(' ');
        lane.append(V('svg', { class: 'dg-soc', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, V('polyline', { points: pts, fill: 'none', stroke: '#0A8F5B', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' })));
      }
      for (const t of v.trips) {
        const trip = trips.get(String(t.rit_id).split('~')[0]); if (!trip) continue;
        const s = trip.vertrek * 60, e = trip.aankomst * 60;
        lane.append(E('span', { class: `dg-trip ${v.kind === 'electric' ? 'e' : v.kind === 'diesel' ? 'd' : 'c'}`, style: { left: `${s / 1440 * 100}%`, width: `${(e - s) / 1440 * 100}%` }, title: `${t.rit} · ${clock(s)}–${clock(e)} · ${num(trip.km)} km` }, t.rit));
      }
      const k = a ? a.kwh[Math.min(a.kwh.length - 1, at(state.clock * 30))] : null;
      return E('div', { class: 'dg-row' }, E('div', { class: 'dg-name' }, E('b', {}, v.name), E('small', {}, a ? `${pct(k / a.capaciteit)} accu` : v.kind === 'diesel' ? 'diesel' : v.kind === 'charter' ? 'inhuur' : '')), lane);
    }));
  const i = at(state.clock * 30);
  const onRoad = day.toewijzing.filter(t => { const tr = trips.get(String(t.rit_id).split('~')[0]); return tr && tr.vertrek * 60 <= state.clock * 30 && state.clock * 30 < tr.aankomst * 60; }).length;
  const slider = E('input', { type: 'range', id: 'day-clock', min: 0, max: 47, step: 1, value: state.clock, 'aria-label': 'Tijdstip', style: { '--f': state.clock / 47 },
    oninput: e => { stopDay(); set({ clock: +e.target.value }, 'day-clock'); } });
  const play = E('button', { class: 'btn ghost small', type: 'button', id: 'day-play', onclick: () => {
    stopPlan();
    if (state.playing) { stopDay(); set({}, 'day-play'); return; }
    state.playing = setInterval(() => set({ clock: (state.clock + 1) % 48 }), 450); set({}, 'day-play');
  } }, icon(state.playing ? 'pause' : 'play'), state.playing ? 'Pauze' : 'Afspelen');
  const peak = Math.max(...day.net);
  return section('werkdag', 'Een werkdag', head(periodPicker(plan, p => { stopDay(); set({ period: p }); })),
    E('div', { class: 'day' }, E('div', { class: 'day-main' }, E('div', { class: 'chart' }, svg),
      legend([['Gebouw', '#E4E4DF'], ['Laden', '#3FA87799'], ['Van het net', '#15171A'], ['Aansluiting', '#B8700E', true], ...(day.zon?.some(v => v > 0) ? [['Zon', '#E8B33A']] : [])])),
      E('aside', { class: 'day-side' }, E('div', { class: 'big-clock' }, clock(state.clock * 30)), slider, play,
        E('dl', {}, E('dt', {}, 'Van het net'), E('dd', {}, `${num(day.net[i], 1)} kW`), E('dt', {}, 'Laden'), E('dd', {}, `${num(day.laden[i], 1)} kW`),
          E('dt', {}, 'Onderweg'), E('dd', {}, `${onRoad} ${onRoad === 1 ? 'wagen' : 'wagens'}`), E('dt', {}, 'Hoogste afname'), E('dd', {}, `${num(peak, 0)} kW`),
          E('dt', {}, 'Ruimte op aansluiting'), E('dd', {}, `${num((day.grens || 0) - peak, 0)} kW`)))),
    gantt, why(dayReasons()), aiNote('werkdag'), prose(plan.texts?.werkdag));
  function dayReasons() {
    const pk = day.net.indexOf(peak), low = (day.accu || []).filter(a => a.capaciteit).map(a => Math.min(...a.kwh) / a.capaciteit);
    const evening = day.laden.reduce((s, kw, j) => s + ((axis[j] >= 17 * 60 || axis[j] < 7 * 60) ? kw * (axis[j + 1] - axis[j]) : 0), 0), all = day.laden.reduce((s, kw, j) => s + kw * (axis[j + 1] - axis[j]), 0);
    return [
      `de hoogste afname is ${num(peak)} kW, om ${clock(axis[pk])}${day.grens ? `, onder de grens van ${num(day.grens)} kW` : ''}`,
      low.length ? `de laagste accustand van de dag is ${pct(Math.min(...low))}; onder ${pct(report.settings.soc_min)} komt geen accu` : null,
      all > 0 ? `${pct(evening / all)} van het laden gebeurt tussen 17:00 en 07:00, als de wagens terug zijn en de stroom goedkoper is` : null,
      day.toewijzing.some(t => t.aandrijving === 'charter') ? 'een deel van de ritten wordt ingehuurd, omdat een eigen wagen daarvoor duurder is' : null,
    ];
  }
}

// ---------------------------------------------------------------- 9 uitstoot
function emissions(c) {
  const { plan, ref, years, m } = c;
  const has = ref && ref !== plan && ref.co2;
  const saved = has ? ref.co2.reduce((s, v, p) => s + (v - plan.co2[p]) * years[p], 0) : null;
  const W = full(), H = 280, L = 62, R = 14, T = 12, B = 32, P = plan.jaren.length;
  const hi = Math.max(1, ...plan.co2, ...(has ? ref.co2 : [])) * 1.1, Y = v => T + (1 - v / hi) * (H - T - B), band = (W - L - R) / P, bw = Math.min(46, band * .22);
  const svg = V('svg', { viewBox: `0 0 ${W} ${H}`, class: 'svgchart', role: 'img', 'aria-label': plan.jaren.map((j, p) => `${j}: ${tons(plan.co2[p])}`).join(', ') });
  for (let i = 0; i <= 4; i++) { const v = hi * i / 4; svg.append(V('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'gridline' }), V('text', { x: L - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'axis' }, tons(v))); }
  plan.jaren.forEach((j, p) => {
    const x = L + band * p + band / 2;
    if (has) svg.append(V('rect', { x: x - bw - 3, width: bw, y: Y(ref.co2[p]), height: Y(0) - Y(ref.co2[p]), fill: '#F2A33A', rx: 2 }));
    svg.append(V('rect', { x: has ? x + 3 : x - bw / 2, width: bw, y: Y(plan.co2[p]), height: Y(0) - Y(plan.co2[p]), fill: '#0A8F5B', rx: 2 }));
    svg.append(V('text', { x, y: H - 8, 'text-anchor': 'middle', class: 'axis' }, j));
  });
  return section('uitstoot', 'Uitstoot en zero-emissie',
    E('div', { class: 'tiles four' }, tile('CO₂ minder over de looptijd', saved != null ? tons(saved) : '—', saved != null ? 'ten opzichte van diesel blijven' : null, 'green'),
      tile(`CO₂ in ${plan.jaren.at(-1)}`, tons(plan.co2.at(-1)), 'per jaar'), tile('Minder dan diesel blijven', m.co2Pct != null ? pct(m.co2Pct) : '—'),
      tile('Kilometers elektrisch', pct(plan.ze_aandeel?.at(-1)), `in ${plan.jaren.at(-1)}`)),
    E('div', { class: 'chart' }, svg), legend([...(has ? [[ref.naam, '#F2A33A']] : []), [plan.naam, '#0A8F5B']]),
    zeTrips(plan), why(co2Reasons()), aiNote('uitstoot'), prose(plan.texts?.co2));
  function co2Reasons() {
    const g = report.goals || {}, s = report.settings, ze = report.trips.filter(t => t.ze_vanaf);
    return [
      ze.length ? `${ze.length} ${ze.length === 1 ? 'rit komt' : 'ritten komen'} in een zero-emissiezone; vanaf ${Math.min(...ze.map(t => t.ze_vanaf))} rijdt daar een elektrische wagen` : null,
      g.ze_doel_pct ? `uw doel is ${g.ze_doel_pct}% zero-emissie kilometers${g.ze_doel_jaar ? ` vanaf ${g.ze_doel_jaar}` : ''}; het plan haalt ${pct(plan.ze_aandeel?.at(-1))} in ${plan.jaren.at(-1)}` : null,
      g.co2_prijs_ton ? `een interne CO₂-prijs van ${money(g.co2_prijs_ton)} per ton telt mee in de kosten, waardoor uitstoot zwaarder weegt` : null,
      s.co2_diesel ? `CO₂ is gerekend met ${num(s.co2_diesel, 2)} kg per liter diesel en ${num(s.co2_stroom, 2)} kg per kWh stroom, van bron tot wiel` : null,
    ];
  }
}
function zeTrips(plan) {
  const ze = report.trips.filter(t => t.ze_vanaf);
  if (!ze.length) return null;
  return E('div', { class: 'block', style: { marginTop: '36px' } }, E('h3', {}, 'Ritten in zero-emissiezones'), E('table', { class: 'tbl' }, E('tbody', {}, ze.map(t => E('tr', {}, E('td', {}, t.naam), E('td', { class: 'n' }, `vanaf ${t.ze_vanaf}`), E('td', { class: 'n' }, `${num(t.km)} km`))))));
}

// ---------------------------------------------------------------- 10 scenario's
function scenarioSensitivity(c) {
  const sc = report.scenarios;
  if (!sc?.axes?.length) return null;
  const base = report.variants.find(v => v.variant === 'basis'), ref = report.variants.find(v => v.referentie);
  if (!base || !ref) return null;
  const saving = key => { const o = key ? sc.outcomes[key] : null; return o ? o.diesel.ncw - o.advies.ncw : ref.ncw - base.ncw; };
  const all = sc.axes.flatMap(a => a.levels.map(l => saving(l.id === 'basis' ? null : `${a.id}:${l.id}`)));
  const lo = Math.min(0, ...all), hi = Math.max(1, ...all), span = hi - lo || 1, pos = v => 5 + (v - lo) / span * 90;
  const b0 = saving(null);
  const tornado = E('div', { class: 'tornado' }, E('div', { class: 'tor-axis' }, E('span', {}), E('div', {}, E('em', { style: { left: `${pos(b0)}%` } }, `basis ${money(round(b0))}`), lo < 0 ? E('em', { class: 'zero', style: { left: `${pos(0)}%` } }, '€ 0') : null)),
    sc.axes.map(a => {
      const vals = a.levels.map(l => ({ l, key: l.id === 'basis' ? null : `${a.id}:${l.id}`, v: saving(l.id === 'basis' ? null : `${a.id}:${l.id}`) }));
      const min = Math.min(...vals.map(x => x.v)), max = Math.max(...vals.map(x => x.v));
      return E('div', { class: 'tor-row' }, E('b', {}, a.name), E('div', { class: 'tor-track' }, E('i', { class: 'tor-base', style: { left: `${pos(b0)}%` } }),
        E('span', { class: 'tor-bar', style: { left: `${pos(min)}%`, width: `${Math.max(.5, pos(max) - pos(min))}%` } }),
        vals.filter(x => x.l.id !== 'basis').map(x => E('button', { type: 'button', class: 'tor-dot' + (state.scenario === x.key ? ' on' : '') + (pos(x.v) < 14 ? ' l' : pos(x.v) > 86 ? ' r' : ''), style: { left: `${pos(x.v)}%` },
          onclick: () => set({ scenario: state.scenario === x.key ? null : x.key }), 'aria-label': `${a.name} ${x.l.label}: voordeel ${money(round(x.v))}` }, E('span', {}, E('b', {}, money(round(x.v))), x.l.label)))));
    }));
  return E('details', { class: 'sensitivity' }, E('summary', {}, 'Welke aanname maakt het meeste verschil?'), prose('De punten tonen het voordeel van het scenario ten opzichte van de eigen dieselvergelijking. Klik op een punt om dat scenario in het rapport te bekijken.'), tornado, why(robustness(report, base, ref), 'Wat dit zegt'));
  function endCount(v) { const e = v.aantallen?.at(-1); return e ? `${e.elektrisch} van ${e.elektrisch + e.diesel}` : '—'; }
}

function scenarios(c) {
  const all = scenarioCatalogue(report);
  if (!all.length) return null;
  const base = report.variants.find(v => v.variant === 'basis'), ref = report.variants.find(v => v.referentie);
  const baseSaving = base && ref ? ref.ncw - base.ncw : null;
  const names = [...new Map(all.map(x => [x.axis, x.name]))];
  const visible = all.filter(x => state.scenarioFilter === 'all' || x.axis === state.scenarioFilter).sort((a, b) => {
    if (state.scenarioSort === 'saving') return (b.saving ?? -Infinity) - (a.saving ?? -Infinity) || a.name.localeCompare(b.name);
    if (state.scenarioSort === 'cost') return (a.advice.ncw ?? Infinity) - (b.advice.ncw ?? Infinity) || a.name.localeCompare(b.name);
    return all.indexOf(a) - all.indexOf(b);
  });
  const openScenario = check => {
    const baseIndex = report.variants.findIndex(v => v.variant === 'basis');
    set({ variant: baseIndex, scenario: check.id, inspect: check.id }, `inspect-${check.id}`);
    document.getElementById('vlootplan')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const checksDone = all.filter(x => x.saving != null).length;
  return section('scenarios', 'Hoe stevig staat uw plan?',
    E('div', { class: 'scenario-intro' }, E('p', {}, `We hebben ${all.length} scenario’s voor deze berekening onderzocht. Bekijk de uitkomsten naast elkaar en open een scenario om het volledige vlootplan, de kosten en de werkdag te verkennen.`),
      E('div', { class: 'scenario-tally' }, E('b', {}, all.length), E('span', {}, 'scenario’s'), E('small', {}, `${checksDone} met een kostenvergelijking · ${all.length - checksDone} zonder volledige vergelijking`))),
    E('div', { class: 'scenario-toolbar' }, E('div', { class: 'scenario-filters', role: 'group', 'aria-label': 'Scenario’s filteren' }, [['all', 'Alle scenario’s'], ...names].map(([key, label]) =>
      E('button', { class: 'scenario-filter', type: 'button', 'aria-pressed': key === state.scenarioFilter, id: `scenario-filter-${key}`, onclick: () => set({ scenarioFilter: key }, `scenario-filter-${key}`) }, label))),
      E('label', { class: 'scenario-sort' }, 'Sorteer op', E('select', { id: 'scenario-sort', onchange: e => set({ scenarioSort: e.target.value }, 'scenario-sort') },
        [['axis', 'Onderwerp'], ['saving', 'Grootste voordeel'], ['cost', 'Laagste kosten']].map(([v, label]) => E('option', { value: v, selected: state.scenarioSort === v }, label))))),
    E('div', { class: 'scenario-list-head', 'aria-hidden': 'true' }, E('span', {}, 'Doorgerekende aanname'), E('span', {}, 'Advies'), E('span', {}, 'Diesel blijven'), E('span', {}, 'Voordeel t.o.v. diesel'), E('span', {}, '')),
    E('div', { class: 'scenario-list' }, visible.map(check => {
      const expanded = state.inspect === check.id, active = state.scenario === check.id;
      const end = check.advice.aantallen?.at(-1), delta = baseSaving != null && check.saving != null ? check.saving - baseSaving : null;
      const openId = `scenario-details-${check.id}`;
      const controls = E('button', { class: 'scenario-case', type: 'button', id: `inspect-${check.id}`, 'aria-expanded': expanded, 'aria-controls': openId,
        onclick: () => set({ inspect: expanded ? null : check.id }, `inspect-${check.id}`) },
        E('span', { class: 'case-name' }, E('b', {}, check.name), E('span', {}, check.label), active ? E('small', { class: 'case-active' }, 'U bekijkt dit scenario') : null),
        E('span', { class: 'case-value', 'data-label': 'Advies' }, E('b', {}, money(check.advice.ncw)), E('small', {}, statusLabel(check.advice))),
        E('span', { class: 'case-value', 'data-label': 'Diesel blijven' }, E('b', {}, money(check.diesel.ncw)), E('small', {}, statusLabel(check.diesel))),
        E('span', { class: 'case-value ' + (check.saving == null ? '' : check.saving >= 0 ? 'positive' : 'negative'), 'data-label': 'Voordeel' }, E('b', {}, money(check.saving)), E('small', {}, check.saving == null ? 'Geen volledige vergelijking' : 'contante waarde')),
        E('span', { class: 'case-chevron', 'aria-hidden': 'true' }, expanded ? '−' : '+'));
      return E('article', { class: `scenario-item${active ? ' active' : ''}${expanded ? ' expanded' : ''}` }, controls,
        expanded ? E('div', { class: 'scenario-details', id: openId }, E('p', {}, SCENARIO_TEXT[check.axis] || 'Deze aanname is afzonderlijk doorgerekend.'),
          Object.keys(check.changes || {}).length ? E('div', { class: 'scenario-assumptions' }, E('b', {}, 'Dit hebben we aangepast'), E('ul', {}, inputChanges(check.changes).map(x => E('li', {}, x)))) : null,
          E('div', { class: 'scenario-detail-metrics' }, tile('Advies, contante waarde', money(check.advice.ncw)), tile('Voordeel t.o.v. eigen diesel', money(check.saving)),
            tile('Verschil in voordeel t.o.v. basis', delta == null ? '—' : money(delta), 'elk scenario heeft een eigen dieselvergelijking'),
            tile('Elektrisch aan het einde', end ? `${end.elektrisch} van ${end.elektrisch + end.diesel}` : '—')),
          E('div', { class: 'scenario-detail-bottom' }, E('p', {}, check.explorable ? 'Open deze uitkomst: de planning, grafieken, bedragen en werkdag in het hele rapport volgen dan dit scenario.' : check.saving == null ? 'Voor dit scenario is geen volledige kostenvergelijking beschikbaar. Een ontbrekende uitkomst wordt niet als nul of als besparing weergegeven.' : 'De kosten zijn bewaard. Dit scenario kan in deze gedeelde versie niet als volledig rapport worden geopend.'),
            check.explorable ? E('button', { class: 'btn dark', type: 'button', onclick: () => openScenario(check) }, 'Bekijk dit scenario in het rapport', icon('arrow')) : null)) : null);
    })),
    E('p', { class: 'scenario-method' }, 'Elk scenario verandert één aanname en heeft een eigen doorgerekend advies en dieselvergelijking. Scenario’s combineren we hier niet: daarvoor is een nieuwe berekening nodig.'),
    scenarioSensitivity(c), aiNote('scenarios'));
}

function inputChanges(changes) {
  return Object.entries(changes || {}).map(([key, value]) => {
    const [scope, name] = key.split('.'), def = (scope === 'instellingen' ? SETTINGS : CHOICES)[name];
    if (def) return `${def[1]}: ${formatValue(def[2], value)}`;
    if (key === 'factor.ev_prijs') return `Aanschafprijs elektrische voertuigen: ${pct(value - 1)} ten opzichte van basis`;
    if (key === 'factor.heffing') return `Vrachtwagenheffing: ${pct(value - 1)} ten opzichte van basis`;
    if (key === 'factor.net_jaren') return `Netaansluiting beschikbaar: ${Math.abs(value)} jaar ${value < 0 ? 'eerder' : 'later'}`;
    return `${name.replaceAll('_', ' ')}: ${typeof value === 'boolean' ? value ? 'ja' : 'nee' : value}`;
  });
}

// ---------------------------------------------------------------- 11 varianten
function variants(c) {
  const unavailable = (report.variant_checks || []).filter(v => !Number.isFinite(v.ncw));
  if (report.variants.length < 3 && !unavailable.length) return null;
  const ref = report.variants.find(v => v.referentie), adv = report.variants.find(v => v.variant === 'basis');
  const max = Math.max(1, ...report.variants.map(v => ref ? Math.abs(ref.ncw - v.ncw) : 0));
  const reasons = [ref ? 'Diesel blijven rijdt alleen op diesel en vervangt wagens door een nieuwe diesel; zero-emissie-eisen tellen daar niet mee. Het is de vergelijking voor alle andere plannen' : null,
    ...(adv ? report.variants.filter(v => v !== adv && !v.referentie).map(v => {
      const d = v.ncw - adv.ncw, what = changes(v);
      if (Math.abs(d) < 500) return `${v.naam}${what ? ` (${what})` : ''} kost even veel als het advies: die keuze speelt in dit plan geen rol`;
      return `${v.naam}${what ? ` (${what})` : ''} kost ${money(round(Math.abs(d)))} ${d >= 0 ? 'meer' : 'minder'} dan het advies` + (d < 0 ? ', binnen de optimalisatiemarge van het advies' : d > 0 && what ? ': die beperking maakt het plan duurder' : '');
    }) : [])];
  return section('varianten', 'Varianten vergelijken', E('div', { class: 'variants' }, report.variants.map((v, i) => {
    const e = v.aantallen?.at(-1);
    return E('button', { type: 'button', class: 'variant' + (i === state.variant ? ' on' : '') + (v.referentie ? ' ref' : ''), onclick: () => set({ variant: i, scenario: null, vehicle: null }) },
      E('b', {}, v.naam, changes(v) ? E('em', {}, changes(v)) : null), E('div', { class: 'vtrack' }, ref && !v.referentie ? E('i', { class: ref.ncw >= v.ncw ? 'pos' : 'neg', style: ref.ncw >= v.ncw ? { left: '50%', width: `${(ref.ncw - v.ncw) / max * 50}%` } : { right: '50%', width: `${(v.ncw - ref.ncw) / max * 50}%` } }) : null),
      E('span', { class: 'n' }, money(v.ncw)), E('small', {}, v.referentie ? 'referentie' : ref ? `${money(ref.ncw - v.ncw)} ${ref.ncw >= v.ncw ? 'voordeel' : 'nadeel'}` : ''),
      E('small', {}, e ? `${e.elektrisch} van ${e.elektrisch + e.diesel} elektrisch` : ''));
  })), unavailable.length ? E('div', { class: 'unavailable-plans' }, E('h3', {}, 'Ook onderzocht'), unavailable.map(v => E('div', {}, E('b', {}, v.naam || 'Alternatief plan'), E('span', {}, statusLabel(v)), E('small', {}, 'Geen berekend plan om te openen.')))) : null,
    why(reasons), prose(report.variants[state.variant].texts?.varianten));
}
// What a variant changes, in words: "leasen: nee".
function changes(v) {
  if (v.referentie) return '';
  return Object.entries(v.wijzigingen || {}).map(([k, val]) => {
    const [scope, key] = k.split('.'), d = (scope === 'wensen' ? CHOICES : SETTINGS)[key];
    return d ? `${d[1].toLowerCase()}: ${formatValue(d[2], val)}` : null;
  }).filter(Boolean).join(', ');
}

// ---------------------------------------------------------------- 12 stappenplan
function roadmap(c) {
  const { plan } = c, t = plan.texts || {};
  const generic = ['stap0', 'stap1', 'stap2', 'stap3', 'stap4'].map(k => t[k]).filter(Boolean);
  const defaults = generic.length ? generic : ['Ritgegevens toetsen met een maand echte ritregistratie of telematica.', 'Offertes opvragen voor de nieuwe voertuigen en de laadpunten.',
    'Subsidies en fiscale regelingen aanvragen vóór het tekenen van een koopovereenkomst.', 'Chauffeurs en planning voorbereiden: laadmomenten, laadpassen en wie de stekkers verwisselt.'];
  return section('stappen', 'Stappenplan', E('ol', { class: 'road' }, E('li', { class: 'now' }, E('b', {}, 'Nu'), E('ul', {}, defaults.map(s => E('li', {}, s)))),
    plan.jaren.map((j, p) => { const exits = periodChanges(report, plan, p).sold.map(e => `${e.row.label}: ${e.label.toLowerCase()}.`), s = [...exits, ...steps(report, plan, p)]; return s.length ? E('li', {}, E('b', {}, j), E('ul', {}, s.map(x => E('li', {}, x)))) : null; })));
}

// ---------------------------------------------------------------- 13 verantwoording
function accountability(c) {
  const { plan } = c, s = report.settings, t = plan.texts || {};
  const facts = [['Looptijd', `${s.startjaar}–${s.startjaar + s.jaren - 1}`], ['Beslissen per', `${s.periode_jaren || 1} jaar`], ['Rekenrente', pct(s.rekenrente, 1)], ['Werkdagen per jaar', num(s.inzetdagen)],
    ['Dieselprijs', `${money(s.dieselprijs, 2)} per liter`], ['Stijging diesel', `${pct(s.diesel_stijging, 1)} per jaar`], ['Stroom dal', `${money(s.stroom_dal, 2)} per kWh`], ['Stroom piek', `${money(s.stroom_piek, 2)} per kWh`],
    ['Accu ondergrens', pct(s.soc_min)], ['Accuveroudering', `${pct(s.accu_veroudering, 1)} per jaar`], ['Netaansluiting nu', `${num(report.depot.aansluiting_kw)} kW`], ['Berekend', date(report.calculated_at)]];
  const b = report.business || {};
  const choices = [b.meerdere_ritten ? 'Een wagen mag meerdere ritten per dag rijden.' : null, b.eerder_vervangen === false ? 'Wagens worden pas vervangen als ze op zijn.' : null,
    b.max_leeftijd ? `Eigen wagens hooguit ${b.max_leeftijd} jaar oud.` : null, b.lease_eerder_stoppen ? 'Lease mag eerder stoppen tegen afkoop.' : null].filter(Boolean);
  return section('verantwoording', 'Uitgangspunten en verantwoording',
    Object.keys(report.view_changes || {}).length ? why(inputChanges(report.view_changes), 'Aangepast voor het plan dat u bekijkt') : null,
    E('div', { class: 'facts' }, facts.map(([k, v]) => E('div', {}, E('span', {}, k), E('b', {}, v)))),
    E('div', { class: 'split' }, E('div', { class: 'block' }, E('h3', {}, 'Aannames'), E('ul', { class: 'list' }, [...(plan.aannames || []), ...choices].map(a => E('li', {}, a)))),
      E('div', { class: 'block' }, E('h3', {}, 'Let op'), E('ul', { class: 'list' }, [...(plan.waarschuwingen || []), ...(plan.notices || [])].map(a => E('li', {}, a))),
        E('p', { class: 'method' }, `Het plan is berekend met een optimalisatiemodel dat voertuigen, ritten, laden, net en kosten over de hele dag en alle jaren tegelijk afweegt. ${plan.controle?.cashflow_npv_reconciled ? 'Accu, netbelasting en kasstromen zijn na afloop los nagerekend.' : ''}${plan.gap ? ` Optimalisatiemarge ${pct(plan.gap, 1)}.` : ''}`))),
    prose(t.over), prose(t.disclaimer || 'Dit advies is gebaseerd op de gegevens die u heeft aangeleverd en op prijzen en regelingen zoals die bij het opstellen bekend waren. Vraag altijd offertes op voordat u beslist.'));
}

// ---------------------------------------------------------------- 14 bijlage
// Cells are plain values, or { v, cls } for a coloured value; columns listed in `right` are numbers.
const cell = x => x && typeof x === 'object' && !x.nodeType && 'v' in x ? x : { v: x, cls: '' };
const table = (heads, rows, right = []) => E('div', { class: 'tablewrap' }, E('table', { class: 'tbl' },
  E('thead', {}, E('tr', {}, heads.map((h, i) => E('th', { class: right.includes(i) ? 'n' : '' }, h)))),
  E('tbody', {}, rows.map(r => E('tr', {}, r.map((x, i) => E('td', { class: [right.includes(i) ? 'n' : '', cell(x).cls].filter(Boolean).join(' ') }, cell(x).v)))))));
// Definition list: label, value and what it means.
const defs = items => E('div', { class: 'defs' }, items.map(([label, value, text]) => E('div', { class: 'def' }, E('span', {}, label), E('b', {}, value), text ? E('p', {}, text) : null)));
const yesno = v => v ? 'ja' : 'nee';
// A value per year of the horizon; years without their own value show the default.
function yearRow(title, values, fallback, fmt) {
  if (!values || !Object.values(values).some(v => v !== null && v !== '')) return null;
  const s = report.settings, years = Array.from({ length: s.jaren }, (_, i) => s.startjaar + i);
  return E('div', { class: 'defgroup' }, E('h4', {}, title), table(years, [years.map(j => values[j] != null && values[j] !== '' ? { v: fmt(+values[j]), cls: 'b' } : fallback(j))], years.map((_, i) => i)));
}
const hours = h => h == null ? '—' : clock(h * 60);
function appendix(c) {
  const { plan, ref } = c, s = report.settings, ch = report.choices || {}, groupsOf = d => [...new Set(Object.values(d).map(x => x[0]))];
  const parts = [];
  // A. Keuzes
  const choiceItems = Object.entries(CHOICES).filter(([k]) => k in ch);
  if (choiceItems.length) parts.push(['a', 'Uw keuzes', `${choiceItems.length} keuzes`, groupsOf(CHOICES).map(g => {
    const items = choiceItems.filter(([, d]) => d[0] === g);
    return items.length ? E('div', { class: 'defgroup' }, E('h4', {}, g), defs(items.map(([k, d]) => [d[1], formatValue(d[2], ch[k]), d[3]]))) : null;
  }), yearRow('Investeringsbudget per jaar', ch.budget_per_jaar, j => ch.max_investering_pj ? money(ch.max_investering_pj) : 'geen grens', money)]);
  // B. Per groep
  const groups = [...new Set([...report.fleet.map(v => v.groep || v.soort), ...report.trips.map(t => t.groep)].filter(Boolean))];
  const pol = report.policies || [];
  const depotText = p => p.depot === 'nooit' ? 'niet' : p.depot === 'venster' ? `${hours(p.van)}–${hours(p.tot)}` : 'als hij er staat';
  parts.push(['b', 'Laden en vloot per groep', `${groups.length} ${groups.length === 1 ? 'groep' : 'groepen'}`, [
    pol.length ? table(['Groep', 'Laden op depot', 'Laden tot', 'Vertrek minstens', 'Nooit onder', 'Snelladen depot', 'Onderweg', 'Thuis', 'Max kW'],
      pol.map(p => [p.group, depotText(p), pct(p.laad_tot ?? 1), p.vertrek_min ? pct(p.vertrek_min) : '—', p.nooit_onder ? pct(p.nooit_onder) : '—', yesno(p.snelladen_depot !== false), yesno(p.onderweg !== false), yesno(p.thuis), p.max_kw ? `${num(p.max_kw)} kW` : '—'])) : null,
    table(['Groep', 'Wagens nu', 'Ritten per dag', 'Vlootgrootte', 'Groei per jaar'], groups.map(g => {
      const vg = ch.vlootgrootte?.[g] || {}, gr = ch.groei_groep?.[g];
      return [g, report.fleet.filter(v => (v.groep || v.soort) === g).length, report.trips.filter(t => t.groep === g && !t.piek).length,
        vg.min != null || vg.max != null ? `${vg.min ?? 0} tot ${vg.max ?? '∞'}` : 'vrij', `${num(gr ?? ch.groei_pct ?? 0)}%`];
    }), [1, 2]),
    report.home_charging?.kw ? defs([['Thuisladen', `${num(report.home_charging.kw)} kW`, `Laadpaal ${money(report.home_charging.investering)}, vergoeding ${money(report.home_charging.prijs, 2)} per kWh, van ${hours(report.home_charging.van)} tot ${hours(report.home_charging.tot)}.`]]) : null]]);
  // C. Uitgangspunten
  const settingItems = Object.entries(SETTINGS).filter(([k]) => s[k] != null);
  parts.push(['c', 'Uitgangspunten', `${settingItems.length} waarden`, groupsOf(SETTINGS).map(g => {
    const items = settingItems.filter(([, d]) => d[0] === g);
    return items.length ? E('div', { class: 'defgroup' }, E('h4', {}, g), defs(items.map(([k, d]) => [d[1], formatValue(d[2], s[k]), d[3]]))) : null;
  })]);
  // D. Huidige vloot
  parts.push(['d', 'Huidige vloot', `${report.fleet.length} voertuigen`, table(['Voertuig', 'Groep', 'Aandrijving', 'Bouwjaar', 'Contract', 'Nog', 'Verbruik', 'Laadvermogen', 'Vaste kosten', 'Verkoopwaarde'],
    report.fleet.map(f => [[f.naam, f.kenteken ? ` · ${f.kenteken}` : ''].join(''), f.groep || f.soort, isEV(f) ? 'elektrisch' : 'diesel', f.bouwjaar || '—', f.contract === 'lease' ? `lease ${money((f.lease_pj || 0) / 12)} p/m` : 'eigendom',
      f.resterende_jaren != null ? `${num(f.resterende_jaren)} jaar` : '—', isEV(f) ? `${num(f.verbruik_kwh100, 1)} kWh/100 km` : `${num(f.verbruik_l100, 1)} l/100 km`, f.laadvermogen_kg ? `${num(f.laadvermogen_kg)} kg` : '—',
      f.vaste_kosten_pj ? `${money(f.vaste_kosten_pj)} per jaar` : '—', f.verkoopwaarde ? money(f.verkoopwaarde) : '—']), [3, 5, 6, 7, 8, 9])]);
  // E. Ritten
  const nameOf = id => report.fleet.find(f => f.id === id)?.naam || '';
  parts.push(['e', 'Ritten', `${report.trips.length} ritten`, table(['Rit', 'Groep', 'Tijd', 'Km', 'Lading', 'Zero-emissie', 'Stops', 'Bijzonder'],
    report.trips.map(t => [t.naam, t.groep, `${hours(t.vertrek)}–${hours(t.aankomst)}`, num(t.km), t.laadvermogen_kg ? `${num(t.laadvermogen_kg)} kg` : '—', t.ze_vanaf ? `vanaf ${t.ze_vanaf}` : '—',
      t.stops?.length ? t.stops.map(x => `${hours(x.van)}–${hours(x.tot)}`).join(', ') : '—',
      [t.piek ? 'alleen drukke weken' : null, t.vaste_wagen ? `vaste wagen ${nameOf(t.vaste_wagen)}` : null, t.charter ? `inhuur mag (${money(t.charter_kosten)})` : null, t.vereist?.length ? t.vereist.join(', ') : null].filter(Boolean).join(' · ') || '—']), [3, 4])]);
  // F. Modellen
  const chosen = n => plan.vloot.filter(v => !v.bestaand && v.naam === n).length;
  const cands = report.candidates || [];
  if (cands.length) parts.push(['f', 'Vergeleken modellen', `${cands.length} modellen`, table(['Model', 'Groep', 'Aandrijving', 'Prijs', 'Lease', 'Accu', 'Bereik', 'Verbruik', 'Subsidie', 'Gekozen'],
    cands.map(k => [k.naam, k.groep || k.soort, k.aandrijving === 'electric' ? 'elektrisch' : 'diesel', k.koop !== false ? money(k.prijs) : '—', k.lease !== false && k.lease_pj ? `${money(k.lease_pj / 12)} p/m` : '—',
      k.accu_kwh && k.aandrijving === 'electric' ? `${num(k.accu_kwh)} kWh` : '—', k.accu_kwh && k.verbruik_kwh100 && k.aandrijving === 'electric' ? `${num(k.accu_kwh / k.verbruik_kwh100 * 100 * (1 - (s.soc_min || 0)))} km` : '—',
      k.aandrijving === 'electric' ? `${num(k.verbruik_kwh100, 1)} kWh` : `${num(k.verbruik_l100, 1)} l`, k.subsidie?.bedrag ? `${money(k.subsidie.bedrag)}${k.subsidie.bevestigd ? '' : ' (verwacht)'}` : '—',
      chosen(k.naam) ? { v: `${chosen(k.naam)}×`, cls: 'pos' } : '—']), [3, 4, 5, 6, 7, 8, 9])]);
  // G. Laden, net en energie
  const d = report.depot, got = n => Math.max(0, ...(plan.laadpunten?.find(l => l.naam === n)?.aantal || [0]));
  parts.push(['g', 'Laadpunten, net en energie', null, [
    report.chargers?.length ? table(['Laadpunt', 'Type', 'Vermogen', 'Investering', 'Per jaar', 'Levensduur', 'Hooguit', 'Gekozen'],
      report.chargers.map(x => [x.naam, x.type, `${x.connectoren || 1}× ${num(x.kw_per_connector || x.kast_kw)} kW`, money(x.investering), money(x.jaarkosten), x.levensduur ? `${x.levensduur} jaar` : '—', x.max_aantal ?? '—', got(x.naam) ? { v: `${got(x.naam)}×`, cls: 'pos' } : '—']), [2, 3, 4, 5, 6, 7]) : null,
    table(['Netaansluiting', 'Vermogen', 'Eenmalig', 'Per jaar', 'Vanaf'], [['Huidig', `${num(d.aansluiting_kw)} kW`, '—', money(d.aansluiting_jaarkosten), '—'],
      ...(d.netopties || []).map(o => [o.naam, `${num(o.kw)} kW`, money(o.kosten), money(o.jaarkosten), o.vanaf_jaar || 'direct'])], [1, 2, 3, 4]),
    yearRow('Huidige aansluiting per jaar', d.aansluiting_per_jaar, () => `${num(d.aansluiting_kw)} kW`, k => `${num(k)} kW`),
    (d.netopties || []).map(o => yearRow(`${o.naam} per jaar`, o.kw_per_jaar, j => j >= (+o.vanaf_jaar || s.startjaar) ? `${num(o.kw)} kW` : '—', k => k ? `${num(k)} kW` : '—')),
    defs([['Gebouw overdag', `${num(d.gebouw_dag_kw)} kW`, 'Wat het gebouw zelf gebruikt, naast het laden.'], ['Gebouw ’s nachts', `${num(d.gebouw_nacht_kw)} kW`, null],
      d.laad_max_kw ? ['Laden hooguit', `${num(d.laad_max_kw)} kW`, d.laad_max_van != null ? `Van ${hours(d.laad_max_van)} tot ${hours(d.laad_max_tot)}.` : null] : null,
      d.pv?.kwp ? ['Zonnepanelen', `${num(d.pv.kwp)} kWp per blok, hooguit ${d.pv.max}`, `${money(d.pv.investering)} per blok. Gekozen: ${plan.energie?.find(e => /zon/i.test(e.soort))?.omvang || 'geen'}.`] : null,
      d.batterij?.kwh ? ['Batterij', `${num(d.batterij.kwh)} kWh per blok, hooguit ${d.batterij.max}`, `${money(d.batterij.investering)} per blok. Gekozen: ${plan.energie?.find(e => /batter/i.test(e.soort))?.omvang || 'geen'}.`] : null].filter(Boolean)),
    report.stations?.length ? table(['Laadstation onderweg', 'Vermogen', 'Prijs'], report.stations.map(x => [x.naam, `${x.connectoren || 1}× ${num(x.kw)} kW`, `${money(x.prijs, 2)} per kWh`]), [1, 2]) : null]]);
  // H. Wie rijdt wat
  const tripRows = report.trips.filter(t => plan.dagen.some(dg => dg.toewijzing.some(x => String(x.rit_id).split('~')[0] === t.id)));
  parts.push(['h', 'Wie rijdt welke rit', `${plan.jaren.length} perioden`, table(['Rit', ...plan.jaren], tripRows.map(t => [t.naam, ...plan.dagen.map(dg => {
    const a = dg.toewijzing.filter(x => String(x.rit_id).split('~')[0] === t.id);
    return a.length ? { v: a.map(x => x.voertuig || 'inhuur').join(', '), cls: a.every(x => x.aandrijving === 'electric') ? 'pos' : a.some(x => x.aandrijving === 'charter') ? '' : 'neg' } : '—';
  })]))]);
  // I. Kosten
  const kinds = Object.keys(KIND).filter(k => plan.per_jaar.some(r => r[k]) || ref?.per_jaar.some(r => r[k]));
  const yearTable = v => table(['Jaar', ...kinds.map(k => KIND[k]), 'Totaal'], v.per_jaar.map(r => [r.jaar, ...kinds.map(k => money(r[k] || 0)), { v: money(totalYear(r)), cls: 'b' }]), kinds.map((_, i) => i + 1).concat(kinds.length + 1));
  parts.push(['i', 'Kosten per jaar en per post', null, [E('h4', {}, plan.naam), yearTable(plan), ref && ref !== plan ? [E('h4', {}, ref.naam), yearTable(ref)] : null,
    E('h4', {}, 'Per post, contante waarde'), table(['Post', plan.naam, ...(ref && ref !== plan ? [ref.naam, 'Verschil'] : [])],
      costRows(plan, ref && ref !== plan ? ref : null).map(r => [r.name, money(r.plan), ...(ref && ref !== plan ? [money(r.base), { v: money(r.saving), cls: r.saving >= 0 ? 'pos' : 'neg' }] : [])]), [1, 2, 3])]]);
  // J. Scenario's
  const checkedScenarios = scenarioCatalogue(report);
  if (checkedScenarios.length) parts.push(['j', 'Alle onderzochte scenario’s', `${checkedScenarios.length} scenario’s`, [
    table(['Scenario', 'Status advies', 'Status diesel', 'Advies', 'Diesel blijven', 'Voordeel', 'Investering'], checkedScenarios.map(x =>
      [`${x.name} · ${x.label}`, statusLabel(x.advice), statusLabel(x.diesel), money(x.advice.ncw), money(x.diesel.ncw), money(x.saving), money(x.advice.investering)]), [3, 4, 5, 6])]]);
  // K. Begrippen
  parts.push(['k', 'Begrippen', `${GLOSSARY.length} begrippen`, defs(GLOSSARY.map(([k, v]) => [k, null, v]))]);
  // L. Rekenmethode
  const ctl = plan.controle || {};
  parts.push(['l', 'Rekenmethode en controles', null, [
    E('p', { class: 'prose' }, `Het plan is berekend met een wiskundig optimalisatiemodel. Het weegt alle voertuigen, ritten, laadmomenten, de netaansluiting en alle kosten over ${s.jaren} jaar tegelijk af, en zoekt het plan met de laagste totale kosten dat aan al uw keuzes voldoet. Elke variant en elk scenario is apart doorgerekend; in dit rapport wordt niets bijgeschat.`),
    defs([['Berekend', date(report.calculated_at), null], ['Optimalisatiemarge', plan.gap != null ? pct(plan.gap, 1) : '—', 'Geen ander plan kan meer dan dit percentage goedkoper zijn.'],
      ctl.physical_intervals_checked ? ['Nagerekend', `${num(ctl.physical_intervals_checked)} tijdvakken`, 'Accu, laden en netbelasting zijn na afloop per tijdvak los gecontroleerd.'] : null,
      ctl.cashflow_npv_reconciled ? ['Kasstromen', 'sluiten', 'De contante waarde is uit de kasstromen per jaar opnieuw opgeteld en klopt.'] : null,
      ctl.matrix_rows_checked ? ['Modelregels', num(ctl.matrix_rows_checked), 'Zoveel voorwaarden zijn in het model gecontroleerd.'] : null].filter(Boolean)),
    plan.aannames?.length ? [E('h4', {}, 'Aannames'), E('ul', { class: 'list' }, plan.aannames.map(a => E('li', {}, a)))] : null,
    plan.waarschuwingen?.length ? [E('h4', {}, 'Let op'), E('ul', { class: 'list' }, plan.waarschuwingen.map(a => E('li', {}, a)))] : null]]);

  return section('bijlage', 'Bijlage', head(E('button', { class: 'btn ghost small', type: 'button', onclick: () => { const all = state.open.size < parts.length; state.open = new Set(all ? parts.map(p => p[0]) : []); render(); } },
    state.open.size < parts.length ? 'Alles openen' : 'Alles sluiten')),
    // Letters follow the parts that are present, so a report without scenarios has no gap.
    E('div', { class: 'appendix' }, parts.map(([id, title, count, body], n) => E('details', { class: 'app', id: `bijlage-${id}`, open: state.open.has(id),
      ontoggle: e => { e.target.open ? state.open.add(id) : state.open.delete(id); } },
      E('summary', {}, E('span', { class: 'al' }, String.fromCharCode(65 + n)), E('b', {}, title), count ? E('small', {}, count) : null), E('div', { class: 'app-body' }, body)))));
}

function footer() {
  return E('footer', { class: 'foot' }, E('div', { class: 'wrap foot-in' }, E('div', {}, E('a', { class: 'brand', href: 'https://stekkerofdiesel.nl/' }, mark(), 'Stekker of Diesel'),
    E('p', {}, `Opgesteld voor ${report.client.name} · ${date(report.created_at)}${report.report_type === 'gemini' ? ' · Met Gemini-analyse' : ''}${report.publication ? ` · versie ${report.publication.revision}` : ''}`)),
    E('a', { class: 'btn dark', href: `mailto:${report.author?.email || 'info@stekkerofdiesel.nl'}?subject=${encodeURIComponent('Vlootadvies ' + report.client.name)}` }, icon('mail'), 'Vragen? Mail ons')));
}

// ---------------------------------------------------------------- render
function render() {
  report = presentationContext(sourceReport, sourceReport.variants[state.variant], state.scenario);
  const y = scrollY, activeId = document.activeElement?.id, fleetScroll = document.getElementById('fleet-scroll'), savedScroll = [fleetScroll?.scrollLeft || 0, fleetScroll?.scrollTop || 0], c = current();
  q('#app').replaceChildren(
    report.demo ? E('div', { class: 'demo' }, 'Voorbeeldrapport · fictieve organisatie') : null,
    topbar(), nav(c),
    E('main', { id: 'inhoud', class: 'wrap' }, overview(c), scenarios(c), analysis(c), difference(c), years(c), opportunities(c), fleetRationale(c), perVehicle(c), investments(c), charging(c), workday(c), emissions(c), variants(c), roadmap(c), accountability(c), appendix(c)),
    footer());
  q('#app').setAttribute('aria-busy', 'false');
  const restored = document.getElementById('fleet-scroll');
  if (restored) { restored.scrollLeft = savedScroll[0]; restored.scrollTop = savedScroll[1]; }
  scrollTo(0, y); spy();
  if (activeId) document.getElementById(activeId)?.focus({ preventScroll: true });
}

function downloadCsv() {
  const { plan, ref } = current();
  const rows = [['Jaar', ...Object.values(KIND).map(k => `${plan.naam} · ${k}`), `${plan.naam} · totaal`, ...(ref && ref !== plan ? [`${ref.naam} · totaal`] : [])]];
  plan.per_jaar.forEach((r, i) => rows.push([r.jaar, ...Object.keys(KIND).map(k => r[k] || 0), totalYear(r), ...(ref && ref !== plan ? [totalYear(ref.per_jaar[i])] : [])]));
  rows.push([]); rows.push(['Post', `${plan.naam} (contante waarde)`, ...(ref && ref !== plan ? [`${ref.naam} (contante waarde)`] : [])]);
  costRows(plan, ref).forEach(r => rows.push([r.name, Math.round(r.plan), ...(ref && ref !== plan ? [Math.round(r.base)] : [])]));
  rows.push([], ['Scenario', 'Aanname', 'Status advies', 'Status diesel', 'Kosten advies', 'Kosten diesel', 'Voordeel']);
  scenarioCatalogue(report).forEach(x => rows.push([x.name, x.label, statusLabel(x.advice), statusLabel(x.diesel), x.advice.ncw ?? '', x.diesel.ncw ?? '', x.saving ?? '']));
  const csv = rows.map(r => r.map(x => typeof x === 'number' ? String(Math.round(x)) : `"${String(x).replaceAll('"', '""')}"`).join(';')).join('\r\n');
  const a = E('a', { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })), download: `vlootadvies-${report.client.name.replace(/[^\w-]+/g, '-').toLowerCase()}.csv` });
  document.body.append(a); a.click(); a.remove();
}

load();
