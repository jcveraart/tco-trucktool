import { totalYear, cumulative, metrics, costRows, fleetSlots, steps, validateReport, periodYears, scenarioPlans, scenarioLevel, dayKm, totalKm } from './report-core.mjs';

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
    else node.setAttribute(k, v === true ? '' : String(v));
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
const KIND = { investering: 'Investeringen', voertuig: 'Lease en vaste kosten', gebruik: 'Brandstof, stroom en onderhoud', laden: 'Laden en net', overig: 'Overig' };
const KIND_COLOR = { investering: '#15171A', voertuig: '#7A8188', gebruik: '#F2A33A', laden: '#0A8F5B', overig: '#C3C3BD' };

let report;
const state = { variant: 0, scenario: null, period: 0, costMode: 'cum', diffMode: 'jaar', clock: 28, playing: null, vehicle: null, compare: true };
const params = new URLSearchParams(location.search);

async function load() {
  try {
    let response;
    if (params.has('preview')) {
      const ids = params.get('preview').split('/');
      if (ids.length !== 2 || ids.some(x => !/^[A-Za-z0-9_-]{1,40}$/.test(x))) throw new Error('Dit voorbeeldadres is ongeldig. Open het rapport vanuit de app.');
      const query = new URLSearchParams({ variant: params.get('variant') || '', kentekens: params.get('kentekens') || '0', titel: params.get('titel') || '', varianten: params.get('varianten') || '' });
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
    report = validateReport(data);
    state.variant = Math.max(0, report.variants.findIndex(x => x.variant === report.selected_variant));
    state.period = report.variants[state.variant].jaren.length - 1;
    document.title = `${report.client.name} · ${(report.title || 'Vlootadvies').replace(/\.$/, '')} · Stekker of Diesel`;
    render();
    addEventListener('scroll', spy, { passive: true });
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
  Object.assign(state, patch);
  const r = report.variants[state.variant];
  state.period = Math.min(state.period, r.jaren.length - 1);
  render();
  if (focus) q(`#${focus}`)?.focus({ preventScroll: true });
}
function stopDay() { clearInterval(state.playing); state.playing = null; }

// ---------------------------------------------------------------- building blocks
const section = (id, title, ...children) => E('section', { class: 'section', id, 'aria-label': title }, title ? E('div', { class: 'section-head' }, E('h2', {}, title), children[0]?.isHead ? children.shift().node : null) : null, ...children);
const head = node => ({ isHead: true, node });
const segmented = (options, value, onpick, label) => E('div', { class: 'seg', role: 'group', 'aria-label': label },
  options.map(([v, l]) => E('button', { type: 'button', 'aria-pressed': String(v === value), onclick: () => onpick(v) }, l)));
const periodPicker = (r, onpick = p => set({ period: p })) => segmented(r.jaren.map((j, i) => [i, j]), state.period, onpick, 'Periode');
const tile = (label, value, note, cls = '') => E('div', { class: `tile ${cls}` }, E('span', {}, label), E('b', {}, value), note ? E('small', {}, note) : null);
const prose = text => text ? E('p', { class: 'prose' }, text) : null;
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
const SECTIONS = [['overzicht', 'Overzicht'], ['verschil', 'Verschil'], ['jaren', 'Door de jaren'], ['vlootplan', 'Vlootplan'], ['wagens', 'Per wagen'],
  ['investeringen', 'Investeringen'], ['laden', 'Laden'], ['werkdag', 'Werkdag'], ['uitstoot', 'Uitstoot'], ['scenarios', 'Scenario’s'], ['varianten', 'Varianten'], ['stappen', 'Stappenplan'], ['verantwoording', 'Verantwoording']];
function nav(c) {
  const lvl = scenarioLevel(report, c.key);
  return E('nav', { class: 'nav', 'aria-label': 'Hoofdstukken' }, E('div', { class: 'wrap nav-in' },
    E('div', { class: 'nav-links' }, SECTIONS.filter(([id]) => id !== 'scenarios' || report.scenarios).filter(([id]) => id !== 'varianten' || report.variants.length > 2)
      .map(([id, label]) => E('a', { href: `#${id}`, 'data-id': id, onclick: e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } }, label))),
    lvl ? E('button', { class: 'chip', type: 'button', onclick: () => set({ scenario: null }), 'aria-label': 'Terug naar de basis' }, `${lvl.axis.name} ${lvl.level.label}`, icon('close')) : null));
}
function spy() {
  const links = document.querySelectorAll('.nav-links a'); let active = null;
  for (const a of links) { const s = document.getElementById(a.dataset.id); if (s && s.getBoundingClientRect().top < 160) active = a; }
  links.forEach(a => a.classList.toggle('on', a === active));
  if (active && !active.dataset.seen) { active.dataset.seen = 1; active.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}

// ---------------------------------------------------------------- 1 overzicht
function overview(c) {
  const { plan, ref, m } = c, Y = report.settings.jaren, years = `${report.settings.startjaar}–${report.settings.startjaar + Y - 1}`;
  const groups = [...new Set(report.fleet.map(v => v.soort || v.groep))];
  const trips = report.trips.filter(t => !t.piek).length;
  const left = E('div', { class: 'id' }, E('div', { class: 'id-name' }, vehicleIcon(groups[0] || 'bestel', 'big'), E('h1', {}, report.client.name)),
    E('p', {}, [`${report.fleet.length} voertuigen`, `${trips} ritten per dag`, years, report.client.place].filter(Boolean).join(' · ')));
  let headline;
  const ze = report.trips.some(t => t.ze_vanaf) || (report.goals?.ze_doel_pct > 0);
  if (ref && m.saving > 0) headline = [E('h2', { class: 'headline' }, plan.naam === 'Advies' ? 'Ons advies is ' : `${plan.naam} is `, E('em', {}, money(round(m.saving))), ' goedkoper'),
    E('p', { class: 'sub' }, `dan diesel blijven · ${money(round(m.saving / Y))} per jaar · ${Y} jaar, contante waarde`)];
  else if (ref && !plan.referentie && ze) headline = [E('h2', { class: 'headline' }, 'Zero-emissie rijden kost ', E('em', { class: 'amber' }, money(round(-m.saving))), ' extra'), E('p', { class: 'sub' }, `ten opzichte van diesel blijven, dat de zero-emissie-eisen niet haalt · ${Y} jaar`)];
  else if (ref && !plan.referentie) headline = [E('h2', { class: 'headline' }, 'Diesel blijven is ', E('em', { class: 'amber' }, money(round(-m.saving))), ' goedkoper'), E('p', { class: 'sub' }, `${Y} jaar, contante waarde`)];
  else headline = [E('h2', { class: 'headline' }, 'Totale kosten ', E('em', {}, money(round(plan.ncw)))), E('p', { class: 'sub' }, `${Y} jaar, contante waarde`)];
  const lvl = scenarioLevel(report, c.key);
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
    E('div', { class: 'split' }, totals, whatIf(c)),
    E('div', { class: 'tiles five' },
      tile('Investering', money(plan.investering), 'voertuigen, laden en net'),
      tile('Hoogste kapitaalbehoefte', money(plan.kapitaal)),
      tile(`Elektrisch in ${plan.jaren.at(-1)}`, `${m.end.elektrisch} van ${m.end.elektrisch + m.end.diesel}`, pct(plan.ze_aandeel?.at(-1)) + ' van de kilometers'),
      tile('CO₂ per jaar', m.co2 != null ? tons(m.co2) : '—', m.co2Pct != null ? `${pct(Math.abs(m.co2Pct))} ${m.co2Pct >= 0 ? 'minder' : 'meer'} dan diesel blijven` : null),
      tile('Terugverdiend', m.payback ? String(report.settings.startjaar + m.payback - 1) : ref && m.saving > 0 ? 'binnen de looptijd' : '—', m.payback ? `na ${m.payback} jaar` : null)),
    advice(c));
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
  const points = Object.keys(t).filter(k => /^advies\d+$/.test(k)).sort().map(k => t[k]);
  const notices = [...(plan.notices || []), ...(plan.budget_over || [])];
  return E('div', { class: 'advice' }, E('div', {}, E('h3', {}, 'Ons advies'), prose(t.samenvatting || defaultSummary(c)), notices.length ? E('ul', { class: 'notices' }, notices.map(n => E('li', {}, n))) : null),
    E('ol', { class: 'points' }, (points.length ? points : auto).map(p => E('li', {}, p))));
  function defaultSummary() {
    if (!ref || plan === ref) return `Dit plan kost ${money(plan.ncw)} over ${report.settings.jaren} jaar.`;
    return m.saving > 0 ? `Met dit plan rijdt ${report.client.name} over ${report.settings.jaren} jaar ${money(round(m.saving))} goedkoper dan met alleen diesel. In ${plan.jaren.at(-1)} rijden ${m.end.elektrisch} van de ${m.end.elektrisch + m.end.diesel} voertuigen elektrisch.`
      : `Doorgaan op diesel is in deze situatie het voordeligst. Elektrisch rijden wordt interessant als prijzen of ritten veranderen.`;
  }
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
    head(segmented([['jaar', 'Per jaar'], ['totaal', `In ${Y} jaar`]], state.diffMode, v => set({ diffMode: v }), 'Per jaar of totaal')), table, info, prose(plan.texts?.kosten));
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
    prose(plan.texts?.financiering));
}

// ---------------------------------------------------------------- 4 vlootplan
function fleetPlan(c) {
  const { plan } = c, P = plan.jaren.length;
  const lanes = fleetSlots(plan);
  const counts = plan.aantallen;
  const maxN = Math.max(1, ...counts.map(x => x.elektrisch + x.diesel));
  const bars = E('div', { class: 'counts' }, counts.map((x, p) => E('button', { type: 'button', class: 'count' + (p === state.period ? ' on' : ''), onclick: () => set({ period: p }), 'aria-label': `${plan.jaren[p]}: ${x.elektrisch} elektrisch, ${x.diesel} diesel` },
    E('div', { class: 'stack' }, E('i', { class: 'd', style: { height: `${x.diesel / maxN * 100}%` } }), E('i', { class: 'e', style: { height: `${x.elektrisch / maxN * 100}%` } })),
    E('b', {}, `${x.elektrisch} / ${x.elektrisch + x.diesel}`), E('span', {}, plan.jaren[p]))));
  const grid = E('div', { class: 'gantt', style: { gridTemplateColumns: `minmax(130px, 220px) repeat(${P}, minmax(0, 1fr))`, '--p': P } },
    E('div', { class: 'gh' }), plan.jaren.map((j, p) => E('button', { type: 'button', class: 'gh' + (p === state.period ? ' on' : ''), onclick: () => set({ period: p }) }, j)));
  let group = null;
  for (const lane of lanes) {
    const first = lane.find(v => v.bestaand) || lane[0];
    if (first.groep !== group) { group = first.groep; grid.append(E('div', { class: 'gg', style: { gridColumn: `1 / span ${P + 1}` } }, group)); }
    grid.append(E('div', { class: 'gl' }, vehicleIcon(kindOf(first)), E('span', {}, first.bestaand ? first.naam : 'Nieuwe plek'), first.kenteken ? E('small', {}, first.kenteken) : null));
    for (let p = 0; p < P; p++) {
      const v = lane.find(x => x.actief[p]);
      const cell = E('div', { class: 'gc' + (p === state.period ? ' on' : '') });
      if (v) {
        const startHere = p === 0 || !lane.find(x => x.actief[p - 1]) || lane.find(x => x.actief[p - 1]) !== v;
        const endHere = p === P - 1 || lane.find(x => x.actief[p + 1]) !== v;
        cell.append(E('button', { type: 'button', class: `pill ${isEV(v) ? 'e' : 'd'}${startHere ? ' s' : ''}${endHere ? ' t' : ''}${state.vehicle === v.id ? ' sel' : ''}`,
          onclick: () => set({ vehicle: state.vehicle === v.id ? null : v.id }), 'aria-label': `${v.naam}, ${plan.jaren[p]}` }, startHere ? E('span', {}, v.bestaand ? 'Huidig' : v.naam) : null));
      }
      grid.append(cell);
    }
  }
  const sel = plan.vloot.find(v => v.id === state.vehicle);
  const detail = sel ? vehicleCard(plan, sel) : null;
  return section('vlootplan', 'Het vlootplan', bars, E('div', { class: 'gantt-wrap' }, grid), legend([['Elektrisch', '#0A8F5B'], ['Diesel', '#F2A33A']]), detail, prose(plan.texts?.vlootplan));
}
function vehicleCard(plan, v) {
  const active = plan.jaren.filter((_, p) => v.actief[p]);
  const f = report.fleet.find(x => x.id === v.id);
  return E('div', { class: 'vcard' }, E('button', { class: 'x', type: 'button', onclick: () => set({ vehicle: null }), 'aria-label': 'Sluiten' }, icon('close')),
    E('div', { class: 'vcard-h' }, vehicleIcon(kindOf(v), isEV(v) ? 'e' : 'd'), E('div', {}, E('h3', {}, v.naam), E('p', {}, [isEV(v) ? 'Elektrisch' : 'Diesel', v.bestaand ? 'huidig voertuig' : v.contract === 'lease' ? 'lease' : 'koop', v.kenteken].filter(Boolean).join(' · ')))),
    E('div', { class: 'tiles four' },
      tile('In gebruik', active.length ? `${active[0]}${active.length > 1 ? ` t/m ${active.at(-1)}` : ''}` : 'niet'),
      v.bestaand ? tile('Bouwjaar', f?.bouwjaar || '—') : tile(v.contract === 'lease' ? 'Lease per maand' : 'Aanschafprijs', v.contract === 'lease' ? money((v.lease_pj || 0) / 12) : money(v.prijs)),
      v.bestaand ? tile('Contract', f?.contract === 'lease' ? 'lease' : 'eigendom') : tile('Vanaf', v.start || '—'),
      isEV(v) && f?.accu_kwh ? tile('Accu', `${num(f.accu_kwh)} kWh`) : v.subsidie ? tile('Subsidie', 'ja') : tile('Groep', v.groep)));
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
      next.map(v => E('div', { class: 'wagen-next' }, icon('arrow'), E('span', { class: isEV(v) ? 'e' : 'd' }, v.naam), E('small', {}, `${v.start} · ${v.contract === 'lease' ? `lease ${money((v.lease_pj || 0) / 12)} p/m` : `koop ${money(v.prijs)}`}`))));
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
    prose(plan.texts?.investering));
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
    prose(plan.texts?.laden));
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
    gantt, prose(plan.texts?.werkdag));
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
    zeTrips(plan), prose(plan.texts?.co2));
}
function zeTrips(plan) {
  const ze = report.trips.filter(t => t.ze_vanaf);
  if (!ze.length) return null;
  return E('div', { class: 'block', style: { marginTop: '36px' } }, E('h3', {}, 'Ritten in zero-emissiezones'), E('table', { class: 'tbl' }, E('tbody', {}, ze.map(t => E('tr', {}, E('td', {}, t.naam), E('td', { class: 'n' }, `vanaf ${t.ze_vanaf}`), E('td', { class: 'n' }, `${num(t.km)} km`))))));
}

// ---------------------------------------------------------------- 10 scenario's
function scenarios(c) {
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
  const table = E('div', { class: 'tablewrap' }, E('table', { class: 'tbl' }, E('thead', {}, E('tr', {}, ['Scenario', 'Advies', 'Diesel blijven', 'Voordeel', 'Elektrisch aan het eind'].map((h, i) => E('th', { class: i ? 'n' : '' }, h)))),
    E('tbody', {}, E('tr', { class: !state.scenario ? 'on' : '', onclick: () => set({ scenario: null }) }, E('td', {}, 'Basis'), E('td', { class: 'n' }, money(base.ncw)), E('td', { class: 'n' }, money(ref.ncw)), E('td', { class: 'n pos' }, money(ref.ncw - base.ncw)), E('td', { class: 'n' }, endCount(base))),
      sc.axes.flatMap(a => a.levels.filter(l => l.id !== 'basis').map(l => {
        const key = `${a.id}:${l.id}`, o = sc.outcomes[key];
        return E('tr', { class: state.scenario === key ? 'on' : '', onclick: () => set({ scenario: state.scenario === key ? null : key }) }, E('td', {}, `${a.name} ${l.label}`), E('td', { class: 'n' }, money(o.advies.ncw)), E('td', { class: 'n' }, money(o.diesel.ncw)),
          E('td', { class: 'n ' + (o.diesel.ncw - o.advies.ncw >= 0 ? 'pos' : 'neg') }, money(o.diesel.ncw - o.advies.ncw)), E('td', { class: 'n' }, endCount(o.advies)));
      })))));
  return section('scenarios', 'Scenario’s', tornado, table);
  function endCount(v) { const e = v.aantallen?.at(-1); return e ? `${e.elektrisch} van ${e.elektrisch + e.diesel}` : '—'; }
}

// ---------------------------------------------------------------- 11 varianten
function variants(c) {
  if (report.variants.length < 3) return null;
  const ref = report.variants.find(v => v.referentie);
  const max = Math.max(1, ...report.variants.map(v => ref ? Math.abs(ref.ncw - v.ncw) : 0));
  return section('varianten', 'Varianten vergelijken', E('div', { class: 'variants' }, report.variants.map((v, i) => {
    const e = v.aantallen?.at(-1);
    return E('button', { type: 'button', class: 'variant' + (i === state.variant ? ' on' : '') + (v.referentie ? ' ref' : ''), onclick: () => set({ variant: i, scenario: null, vehicle: null }) },
      E('b', {}, v.naam), E('div', { class: 'vtrack' }, ref && !v.referentie ? E('i', { class: ref.ncw >= v.ncw ? 'pos' : 'neg', style: ref.ncw >= v.ncw ? { left: '50%', width: `${(ref.ncw - v.ncw) / max * 50}%` } : { right: '50%', width: `${(v.ncw - ref.ncw) / max * 50}%` } }) : null),
      E('span', { class: 'n' }, money(v.ncw)), E('small', {}, v.referentie ? 'referentie' : ref ? `${money(ref.ncw - v.ncw)} ${ref.ncw >= v.ncw ? 'voordeel' : 'nadeel'}` : ''),
      E('small', {}, e ? `${e.elektrisch} van ${e.elektrisch + e.diesel} elektrisch` : ''));
  })), prose(report.variants[state.variant].texts?.varianten));
}

// ---------------------------------------------------------------- 12 stappenplan
function roadmap(c) {
  const { plan } = c, t = plan.texts || {};
  const generic = ['stap0', 'stap1', 'stap2', 'stap3', 'stap4'].map(k => t[k]).filter(Boolean);
  const defaults = generic.length ? generic : ['Ritgegevens toetsen met een maand echte ritregistratie of telematica.', 'Offertes opvragen voor de nieuwe voertuigen en de laadpunten.',
    'Subsidies en fiscale regelingen aanvragen vóór het tekenen van een koopovereenkomst.', 'Chauffeurs en planning voorbereiden: laadmomenten, laadpassen en wie de stekkers verwisselt.'];
  return section('stappen', 'Stappenplan', E('ol', { class: 'road' }, E('li', { class: 'now' }, E('b', {}, 'Nu'), E('ul', {}, defaults.map(s => E('li', {}, s)))),
    plan.jaren.map((j, p) => { const s = steps(report, plan, p); return s.length ? E('li', {}, E('b', {}, j), E('ul', {}, s.map(x => E('li', {}, x)))) : null; })));
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
    E('div', { class: 'facts' }, facts.map(([k, v]) => E('div', {}, E('span', {}, k), E('b', {}, v)))),
    E('div', { class: 'split' }, E('div', { class: 'block' }, E('h3', {}, 'Aannames'), E('ul', { class: 'list' }, [...(plan.aannames || []), ...choices].map(a => E('li', {}, a)))),
      E('div', { class: 'block' }, E('h3', {}, 'Let op'), E('ul', { class: 'list' }, [...(plan.waarschuwingen || []), ...(plan.notices || [])].map(a => E('li', {}, a))),
        E('p', { class: 'method' }, `Het plan is berekend met een optimalisatiemodel dat voertuigen, ritten, laden, net en kosten over de hele dag en alle jaren tegelijk afweegt. ${plan.controle?.cashflow_npv_reconciled ? 'Accu, netbelasting en kasstromen zijn na afloop los nagerekend.' : ''}${plan.gap ? ` Optimalisatiemarge ${pct(plan.gap, 1)}.` : ''}`))),
    prose(t.over), prose(t.disclaimer || 'Dit advies is gebaseerd op de gegevens die u heeft aangeleverd en op prijzen en regelingen zoals die bij het opstellen bekend waren. Vraag altijd offertes op voordat u beslist.'));
}

function footer() {
  return E('footer', { class: 'foot' }, E('div', { class: 'wrap foot-in' }, E('div', {}, E('a', { class: 'brand', href: 'https://stekkerofdiesel.nl/' }, mark(), 'Stekker of Diesel'),
    E('p', {}, `Opgesteld voor ${report.client.name} · ${date(report.created_at)}${report.publication ? ` · versie ${report.publication.revision}` : ''}`)),
    E('a', { class: 'btn dark', href: `mailto:${report.author?.email || 'info@stekkerofdiesel.nl'}?subject=${encodeURIComponent('Vlootadvies ' + report.client.name)}` }, icon('mail'), 'Vragen? Mail ons')));
}

// ---------------------------------------------------------------- render
function render() {
  const y = scrollY, c = current();
  q('#app').replaceChildren(
    report.demo ? E('div', { class: 'demo' }, 'Voorbeeldrapport · fictieve organisatie') : null,
    topbar(), nav(c),
    E('main', { id: 'inhoud', class: 'wrap' }, overview(c), difference(c), years(c), fleetPlan(c), perVehicle(c), investments(c), charging(c), workday(c), emissions(c), scenarios(c), variants(c), roadmap(c), accountability(c)),
    footer());
  q('#app').setAttribute('aria-busy', 'false');
  scrollTo(0, y); spy();
}

function downloadCsv() {
  const { plan, ref } = current();
  const rows = [['Jaar', ...Object.values(KIND).map(k => `${plan.naam} · ${k}`), `${plan.naam} · totaal`, ...(ref && ref !== plan ? [`${ref.naam} · totaal`] : [])]];
  plan.per_jaar.forEach((r, i) => rows.push([r.jaar, ...Object.keys(KIND).map(k => r[k] || 0), totalYear(r), ...(ref && ref !== plan ? [totalYear(ref.per_jaar[i])] : [])]));
  rows.push([]); rows.push(['Post', `${plan.naam} (contante waarde)`, ...(ref && ref !== plan ? [`${ref.naam} (contante waarde)`] : [])]);
  costRows(plan, ref).forEach(r => rows.push([r.name, Math.round(r.plan), ...(ref && ref !== plan ? [Math.round(r.base)] : [])]));
  const csv = rows.map(r => r.map(x => typeof x === 'number' ? String(Math.round(x)) : `"${String(x).replaceAll('"', '""')}"`).join(';')).join('\r\n');
  const a = E('a', { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })), download: `vlootadvies-${report.client.name.replace(/[^\w-]+/g, '-').toLowerCase()}.csv` });
  document.body.append(a); a.click(); a.remove();
}

load();
