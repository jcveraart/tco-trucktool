import { totalYear, cumulative, metrics, costRows, fleetSlots, steps, validateReport } from './report-core.mjs';

const API = 'https://zarvyblveyomngypwvhw.supabase.co/rest/v1/rpc/fleet_report_read';
const APIKEY = 'sb_publishable_srfj19l9xWDSkdirFz6RtQ_RperxnNH';
const q = s => document.querySelector(s);
const money = x => x == null ? '—' : `${x < 0 ? '−' : ''}€ ${new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(Math.abs(x))}`;
const num = (x, d = 0) => x == null ? '—' : new Intl.NumberFormat('nl-NL', { maximumFractionDigits: d }).format(x);
const pct = (x, d = 0) => `${num(x * 100, d)}%`;
const time = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(Math.round(minutes % 60)).padStart(2, '0')}`;
const date = x => x ? new Date(x).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const E = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || (v === false && !k.startsWith('aria-'))) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else if (k === 'style') Object.assign(node.style, v);
    else node.setAttribute(k, k.startsWith('aria-') ? String(v) : v === true ? '' : String(v));
  }
  for (const child of children.flat(Infinity)) if (child != null && child !== false) node.append(child.nodeType ? child : document.createTextNode(String(child)));
  return node;
};
const NS = 'http://www.w3.org/2000/svg';
function V(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  for (const child of children.flat(Infinity)) if (child != null) node.append(child.nodeType ? child : document.createTextNode(String(child)));
  return node;
}
const ICONS = {
  arrow: 'M4 12h16m-6-6 6 6-6 6', download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  link: 'm10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
  lock: 'M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4', bolt: 'm14 2-9 12h7l-2 8 9-12h-7z',
  leaf: 'M5 19c-8-14 13-15 15-16 1 13-4 21-15 16Zm0 0L16 8', coins: 'M12 5c5 0 9-2 9-4M3 1c0 5 18 5 18 0v16c0 5-18 5-18 0V1Zm0 8c0 5 18 5 18 0',
  van: 'M2 7h12v10H2zM14 10h5l3 4v3h-8M5 17a2 2 0 1 0 4 0m8 0a2 2 0 1 0 4 0M16 11v3h5',
  play: 'm8 4 12 8-12 8z', pause: 'M8 4v16M16 4v16', check: 'm5 12 4 4L20 5', sun: 'M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  grid: 'M5 2h14l-2 20H7L5 2Zm-3 6h20M3 15h18M12 2v20', chart: 'M3 3v18h18M6 16l5-6 4 3 6-9', info: 'M12 10v7m0-12v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};
function icon(name) { return V('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, V('path', { d: ICONS[name] || ICONS.info })); }
const button = (label, action, cls = '', ico) => E('button', { class: `btn ${cls}`, type: 'button', onclick: action }, ico ? icon(ico) : null, label);
const pill = (label, cls = '') => E('span', { class: `pill ${cls}` }, E('i', { class: 'dot', 'aria-hidden': true }), label);
function brand() { return E('a', { class: 'brand', href: 'https://stekkerofdiesel.nl/', 'aria-label': 'Stekker of Diesel — naar de website' }, E('img', { src: './mark.svg', alt: '', width: 39, height: 39 }), E('div', {}, E('b', {}, 'Stekker of Diesel'), E('span', {}, 'Persoonlijk vlootadvies'))); }
function toast(text) { q('#toast').textContent = text; q('#toast').classList.add('visible'); clearTimeout(state.toast); state.toast = setTimeout(() => q('#toast').classList.remove('visible'), 2800); }
function go(id) { document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
function anchor(id, label, cls = '') { return E('a', { href: `#${id}`, class: cls, onclick: event => { event.preventDefault(); go(id); } }, label); }
function textBlock(text, cls = 'prose') { return E('p', { class: cls }, text); }
function heading(number, id, title, description, right) {
  return E('header', { class: 'section-heading' }, E('div', {}, E('div', { class: 'eyebrow' }, E('b', {}, String(number).padStart(2, '0')), id), E('h2', {}, title), description ? E('p', {}, description) : null), right);
}
function section(id, title, ...children) { return E('section', { class: 'section', id, 'aria-label': title }, ...children); }
function legend(items) { return E('div', { class: 'legend' }, items.map(([label, cls]) => E('span', {}, E('i', { class: `swatch ${cls}`, 'aria-hidden': true }), label))); }
function fact(label, value) { return E('div', { class: 'fact' }, E('span', {}, label), E('b', {}, value)); }
function periods(variant, action) {
  return E('div', { class: 'periods', role: 'group', 'aria-label': 'Periode kiezen' }, variant.jaren.map((year, index) => E('button', { type: 'button', 'aria-pressed': index === state.period, onclick: () => action(index) }, year)));
}

let report;
const state = { variant: 0, period: 0, chart: 'cumulative', baseline: true, clock: 4, player: null, observer: null };
const params = new URLSearchParams(location.search);
const preview = params.has('preview');
const demo = params.get('demo') === '1';

async function load() {
  try {
    let response;
    if (preview) {
      const ids = params.get('preview').split('/');
      if (ids.length !== 2 || ids.some(x => !/^[A-Za-z0-9_-]{1,40}$/.test(x))) throw new Error('Dit voorbeeldadres is ongeldig. Open het rapport vanuit de app.');
      const query = new URLSearchParams({ variant: params.get('variant') || '', kentekens: params.get('kentekens') || '0', titel: params.get('titel') || '', varianten: params.get('varianten') || '' });
      response = await fetch(`/api/klanten/${ids[0]}/berekeningen/${ids[1]}/online?${query}`, { cache: 'no-store' });
    } else if (demo) response = await fetch('./demo.json', { cache: 'no-store' });
    else {
      const token = location.hash.slice(1);
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('Open dit rapport via de persoonlijke link die u van uw adviseur heeft ontvangen.');
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map(x => x.toString(16).padStart(2, '0')).join('');
      response = await fetch(API, { method: 'POST', headers: { apikey: APIKEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token_hash: hash }), cache: 'no-store', referrerPolicy: 'no-referrer' });
    }
    if (!response.ok) throw new Error('Het rapport kan nu niet worden geladen. Probeer het later opnieuw of neem contact op met uw adviseur.');
    const data = await response.json();
    if (!data) throw new Error('Deze persoonlijke link is verlopen, ingetrokken of niet gevonden. Vraag uw adviseur om een nieuwe link.');
    report = validateReport(data);
    state.variant = Math.max(0, report.variants.findIndex(x => x.variant === report.selected_variant));
    state.clock = Math.min(4, report.variants[state.variant].tijdas.length - 2);
    document.title = `Vlootadvies ${report.client.name} · Stekker of Diesel`;
    render();
  } catch (error) {
    q('#app').replaceChildren(E('main', { class: 'loading' }, E('img', { src: './mark.svg', alt: '', width: 48, height: 48, style: { margin: 'auto' } }), E('h1', {}, 'Uw rapport is persoonlijk.'), E('p', {}, error.message), E('a', { class: 'btn primary', href: 'mailto:info@stekkerofdiesel.nl' }, 'Contact met uw adviseur')));
    q('#app').setAttribute('aria-busy', 'false');
  }
}

function setPeriod(period) { state.period = period; stopPlayer(); render(); }
function setVariant(index) { state.variant = index; state.period = Math.min(state.period, report.variants[index].jaren.length - 1); stopPlayer(); render(); }
function stopPlayer() { clearInterval(state.player); state.player = null; }

function hero(r, m) {
  const count = r.aantallen[state.period], electric = count.elektrisch, total = count.elektrisch + count.diesel;
  const art = E('div', { class: 'hero-art' }, E('div', { class: 'art-heading' }, E('span', {}, 'Uw vloot in beweging'), pill(r.jaren[state.period], 'dark')),
    E('div', { class: 'art-stage' }, fleetArt(electric > 0), E('div', { class: 'orbit-label one' }, E('b', {}, `${electric} / ${total}`), 'voertuigen elektrisch'),
      E('div', { class: 'orbit-label two' }, E('b', {}, `${num(r.net_kw[state.period])} kW`), 'netaansluiting')),
    E('div', { class: 'art-scale', role: 'group', 'aria-label': 'Vloot door de jaren' }, r.jaren.map((year, index) => E('button', { type: 'button', 'aria-pressed': index === state.period, onclick: () => setPeriod(index) }, year))),
    E('p', { class: 'art-note' }, 'Kies een periode. Ontdek wat er verandert.'));
  return E('section', { class: 'hero', 'aria-label': 'Uw persoonlijke vlootadvies' },
      E('div', { class: 'hero-copy' }, E('div', { class: 'eyebrow' }, E('span', { class: 'dot', style: { background: '#b2f1c3' } }), `${report.client.name} · ${report.settings.startjaar}–${report.settings.startjaar + report.settings.jaren - 1}`),
      E('h1', {}, (report.title || 'Uw vloot, vooruit.').replace(/\.$/, ''), E('em', {}, 'Met een helder plan.')),
      E('p', {}, `Welke voertuigen, op welk moment, tegen welke kosten? Uw vlootadvies brengt alle keuzes samen. Bekijk het plan en ontdek de cijfers erachter.`),
      E('div', { class: 'hero-actions' }, button('Ontdek uw vlootplan', () => go('vlootplan'), 'mint', 'arrow'), E('span', { style: { fontSize: '11px', color: '#b0c6b6' } }, `${report.fleet.length} voertuigen · ${report.settings.jaren} jaar vooruit`)),
      E('div', { class: 'hero-meta' }, E('span', {}, `Opgesteld ${date(report.created_at)}`), E('span', {}, 'Door Stekker of Diesel'), report.publication ? E('span', {}, `Versie ${report.publication.revision}`) : null)), art);
}

function fleetArt(electric) {
  // Original vector illustration, built from simple depot/vehicle geometry.
  const color = electric ? '#b2f1c3' : '#e4bd7a';
  return V('svg', { viewBox: '0 0 370 220', class: 'fleet-art', 'aria-hidden': 'true' },
    V('ellipse', { cx: 187, cy: 188, rx: 149, ry: 17, fill: '#0a1f16', opacity: '.6' }),
    V('path', { d: 'M31 119 168 75l159 50-139 48Z', fill: '#42604a' }),
    V('path', { d: 'm31 119 157 54v16L31 135Z', fill: '#2c4734' }),
    V('path', { d: 'm188 173 139-48v16l-139 48Z', fill: '#35533d' }),
    V('path', { d: 'm113 63 76-25 87 29-77 27Z', fill: '#6a8567' }),
    V('path', { d: 'm113 63 86 31v64l-86-31Z', fill: '#3c5940' }),
    V('path', { d: 'm199 94 77-27v64l-77 27Z', fill: '#29442f' }),
    V('path', { d: 'm122 72 66 23v33l-66-23Z', fill: '#203c2b' }),
    V('path', { d: 'm211 96 52-18v48l-52 18Z', fill: '#182f22' }),
    V('path', { d: 'm218 101 38-13v31l-38 13Z', fill: '#9dd5a7', opacity: '.18' }),
    V('path', { d: 'm124 57 65-21 76 25-66 23Z', fill: '#8da68b' }),
    ...[0, 1, 2].map(i => V('path', { d: `m${139 + i * 22} ${54 + i * 7} 26-8 35 11-26 9Z`, fill: '#1b3e37', stroke: '#86b4a0', 'stroke-width': .6 })),
    V('path', { d: 'm74 117 59-20 57 19-59 21Z', fill: color }),
    V('path', { d: 'm74 117 57 20v30l-57-20Z', fill: electric ? '#8bd5a0' : '#cfa566' }),
    V('path', { d: 'm131 137 59-21v30l-59 21Z', fill: electric ? '#62a87c' : '#ac834b' }),
    V('path', { d: 'm83 119 21 7v13l-21-7Z', fill: '#244637' }),
    V('path', { d: 'm107 127 19 6v13l-19-7Z', fill: '#244637' }),
    V('ellipse', { cx: 90, cy: 154, rx: 7, ry: 10, fill: '#10251c', transform: 'rotate(-15 90 154)' }),
    V('ellipse', { cx: 146, cy: 160, rx: 7, ry: 10, fill: '#10251c', transform: 'rotate(15 146 160)' }),
    V('ellipse', { cx: 178, cy: 149, rx: 6, ry: 9, fill: '#10251c', transform: 'rotate(15 178 149)' }),
    V('path', { d: 'm231 144 34-11 32 11-34 12Z', fill: '#d7e3cf' }),
    V('path', { d: 'm231 144 32 12v19l-32-12Z', fill: '#a6bea0' }),
    V('path', { d: 'm263 156 34-12v19l-34 12Z', fill: '#769977' }),
    V('path', { d: 'm235 145 20 7v8l-20-7Z', fill: '#244637' }),
    V('ellipse', { cx: 241, cy: 168, rx: 5, ry: 7, fill: '#10251c' }),
    V('ellipse', { cx: 277, cy: 172, rx: 5, ry: 7, fill: '#10251c' }),
    V('path', { d: 'm206 133 10-3v31l-10 4Z', fill: '#8eca9e' }),
    V('path', { d: 'm209 136 4-1v10l-4 1Z', fill: '#224e37' }),
    electric ? V('path', { d: 'M211 149c-7 18-16 16-21 1', fill: 'none', stroke: '#b2f1c3', 'stroke-width': 2 }) : null);
}

function summary(r, m) {
  const endYear = report.settings.startjaar + report.settings.jaren - 1;
  const kpi = (label, value, note, ico, cls = '') => E('div', { class: `metric ${cls}` }, E('span', { class: 'metric-icon' }, icon(ico)), E('div', { class: 'metric-label' }, label), E('div', { class: 'metric-value' }, value), E('small', {}, note));
  const count = m.end.elektrisch + m.end.diesel;
  const defaultSummary = `${report.client.name} heeft een plan voor ${report.settings.jaren} jaar. In ${endYear} rijden ${m.end.elektrisch} van de ${count} voertuigen elektrisch. `
    + (m.saving == null ? `De berekende totale kosten bedragen ${money(r.ncw)} in contante waarde.` : `De berekende totale kosten bedragen ${money(r.ncw)}. Dat is ${money(Math.abs(m.saving))} ${m.saving >= 0 ? 'lager' : 'hoger'} dan het dieselplan, in contante waarde.`);
  let headline = m.end.elektrisch ? 'Stap voor stap naar een andere vloot.' : 'Uw keuzes, zorgvuldig doorgerekend.';
  if (m.inconclusive) headline = 'De plannen liggen financieel dicht bij elkaar.';
  const comparison = m.co2Saving == null ? 'Geen dieselvergelijking opgenomen' : `${num(Math.abs(m.co2Saving) / 1000, 1)} ton ${m.co2Saving >= 0 ? 'minder' : 'meer'} dan diesel in hetzelfde jaar`;
  const board = E('div', { class: 'result-board' + (!m.ref ? ' solo' : '') },
    m.ref ? E('div', { class: 'result-side diesel' }, E('div', { class: 'result-who' }, E('i', { class: 'dot' }), 'Diesel blijven'), E('div', { class: 'result-total' }, money(m.ref.ncw)), E('p', {}, `Totale kosten over ${report.settings.jaren} jaar`)) : null,
    E('div', { class: 'result-side plan' }, E('div', { class: 'result-who' }, E('i', { class: 'dot' }), r.naam), E('div', { class: 'result-total' }, money(r.ncw)), E('p', {}, 'Contante waarde · alle kosten samen')),
    E('div', { class: 'result-footer' }, E('p', {}, m.saving == null ? 'Het gekozen plan, volledig doorgerekend.' : [E('b', { class: m.saving >= 0 ? 'positive' : 'negative' }, money(Math.abs(m.saving))), ` ${m.saving >= 0 ? 'voordeel' : 'meerkosten'} over ${report.settings.jaren} jaar`]),
      E('span', { class: 'muted' }, m.inconclusive ? 'Verschil binnen de optimalisatiemarge' : `${pct(report.settings.rekenrente, 1)} rekenrente · ${r.gap == null ? 'marge onbekend' : pct(r.gap, 2) + ' optimalisatiemarge'}`)));
  return section('samenvatting', 'De hoofdlijnen', heading(1, 'De hoofdlijnen', 'De toekomst, in cijfers.', 'De belangrijkste uitkomsten van uw gekozen plan.', pill(r.naam, 'green')), board,
    E('div', { class: 'summary-grid' },
      kpi('Investering over de hele looptijd', money(r.investering), 'Voertuigen, laden, net en energie', 'chart'),
      kpi('Hoogste kapitaalbehoefte', money(r.kapitaal), 'Piek in het benodigde kapitaal', 'coins'),
      kpi(`Elektrisch in ${endYear}`, `${m.end.elektrisch} van ${count}`, `${pct(r.ze_aandeel?.at(-1) || 0)} van de gereden kilometers`, 'bolt'),
      kpi(`CO₂-uitstoot in ${endYear}`, `${num(m.co2 / 1000, 1)} t`, comparison, 'leaf')),
    E('div', { class: 'advice' }, E('div', { class: 'advice-main' }, E('div', { class: 'mini-label' }, 'Het advies van Stekker of Diesel'), E('h3', {}, headline), textBlock(r.texts?.samenvatting || defaultSummary), r.texts?.waarom ? textBlock(r.texts.waarom) : null),
      E('aside', { class: 'advice-aside', 'aria-label': 'Rapport in het kort' }, fact('Gekozen variant', r.naam), fact('Looptijd', `${report.settings.startjaar}–${endYear}`), fact('Werkdagen', `${report.settings.inzetdagen} per jaar`), fact('Vergeleken plannen', report.variants.length), fact('Berekening', date(report.calculated_at)))),
    (r.notices || []).map(notice => E('div', { class: 'notice' }, notice)));
}

function fleet(r) {
  const grid = E('div', { class: 'fleet-grid', style: { '--periods': r.jaren.length } });
  grid.append(E('div', { class: 'fleet-cell head' }, 'VOERTUIG / PLEK'), ...r.jaren.map((year, p) => E('div', { class: `fleet-cell head ${p === state.period ? 'current' : ''}` }, year)));
  for (const slot of fleetSlots(r)) {
    const first = slot.find(x => x.bestaand) || slot[0];
    grid.append(E('div', { class: 'fleet-cell' }, E('span', { class: 'vehicle-icon' }, icon('van')), E('div', { class: 'vehicle-name' }, first.bestaand ? first.naam : 'Nieuwe plek', E('small', {}, first.kenteken || first.groep))));
    for (let p = 0; p < r.jaren.length; p++) {
      const active = slot.find(x => x.actief[p]);
      grid.append(E('div', { class: 'fleet-cell' }, active ? E('button', { type: 'button', class: `vehicle-block ${active.aandrijving}`, onclick: () => vehicleDetail(r, active, p), 'aria-label': `${active.naam}, ${r.jaren[p]}, details bekijken` }, E('i', { class: 'dot' }), E('span', {}, E('strong', {}, active.bestaand ? 'Huidig voertuig' : active.naam), E('small', {}, `${active.aandrijving === 'electric' ? 'Elektrisch' : 'Diesel'} · ${active.contract === 'lease' ? 'lease' : 'eigendom'}`))) : E('span', { class: 'muted' }, first.bestaand && !first.actief.some(Boolean) ? 'Afgestoten vóór start' : 'Niet actief')));
    }
  }
  return section('vlootplan', 'Uw vlootplan', heading(2, 'Het vlootplan', 'Elke wagen. Het juiste moment.', 'Klik op een voertuig en bekijk de keuze, de inzet en de kosten.'),
    r.texts?.vlootplan ? textBlock(r.texts.vlootplan, 'prose section-note') : null,
    E('div', { class: 'panel' }, E('div', { class: 'panel-head' }, E('div', {}, E('h3', {}, 'Zo ontwikkelt uw vloot zich'), E('p', {}, 'De balken laten zien wat er per periode rijdt.')), legend([['Elektrisch', ''], ['Diesel', 'diesel']])),
      E('div', { class: 'fleet-table' }, grid), E('div', { class: 'fleet-foot' }, E('span', {}, 'Klik op een gekleurde balk voor de voertuigdetails.'), E('span', {}, `${r.aantallen.at(-1).elektrisch} elektrisch · ${r.aantallen.at(-1).diesel} diesel aan het eind`))),
    r.texts?.perwagen ? textBlock(r.texts.perwagen, 'prose section-note') : null);
}

function vehicleDetail(r, vehicle, period) {
  const original = report.fleet.find(x => x.id === vehicle.id) || {};
  const assignments = r.dagen[period]?.toewijzing.filter(x => x.voertuig_id === vehicle.id) || [];
  const lease = vehicle.lease_pj || original.lease_pj;
  const dialog = E('dialog', { 'aria-labelledby': 'vehicle-title' },
    E('div', { class: 'dialog-head' }, E('div', {}, E('div', { class: 'eyebrow' }, `Voertuigdetail · ${r.jaren[period]}`), E('h2', { id: 'vehicle-title' }, vehicle.naam)), button('×', () => dialog.close(), 'close')),
    E('div', { class: 'dialog-body' }, pill(vehicle.aandrijving === 'electric' ? 'Elektrisch' : 'Diesel', vehicle.aandrijving === 'electric' ? 'green' : 'amber'),
      fact('In het plan', vehicle.bestaand ? 'Huidig voertuig' : `Nieuw vanaf ${vehicle.start}`), fact('Contract', vehicle.contract === 'lease' ? 'Operational lease' : 'Eigendom'),
      vehicle.kenteken ? fact('Kenteken', vehicle.kenteken) : null,
      lease && vehicle.contract === 'lease' ? fact('Lease per maand', money(lease / 12)) : null,
      !vehicle.bestaand && vehicle.contract !== 'lease' ? fact('Aanschafprijs', money(vehicle.prijs)) : null,
      vehicle.subsidie ? fact('Subsidie', 'Meegenomen in de berekening') : null,
      E('h3', {}, 'Ritten in deze periode'), assignments.length ? E('ul', {}, assignments.map(a => E('li', {}, a.rit))) : E('p', {}, 'Geen rit toegewezen in de representatieve werkdag.'),
      E('h3', {}, 'Actief in het vlootplan'), E('p', {}, r.jaren.filter((_, i) => vehicle.actief[i]).join(' · ')),
      E('p', { style: { marginTop: '20px' } }, 'Deze keuze komt uit de opgeslagen berekening. Een andere inzet of prijs vraagt om een nieuwe berekening door uw adviseur.')));
  document.body.append(dialog); dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.addEventListener('click', e => { if (e.target === dialog) { const b = dialog.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) dialog.close(); } });
  dialog.showModal();
}

function segmented(options, value, action, label) {
  return E('div', { class: 'segmented', role: 'group', 'aria-label': label }, options.map(([key, text]) => E('button', { type: 'button', 'aria-pressed': key === value, onclick: () => action(key) }, text)));
}

function lineChart(series, labels, { yLabel = '', height = 230, format = money, zero = true } = {}) {
  const W = 700, H = height, L = 55, R = 15, T = 16, B = 30;
  const values = series.flatMap(s => s.values), low = Math.min(zero ? 0 : Infinity, ...values), high = Math.max(1, ...values);
  const span = high - low || 1, max = high + span * .09, min = low < 0 ? low - span * .04 : low;
  const X = i => L + (W - L - R) * i / Math.max(1, labels.length - 1);
  const Y = v => T + (H - T - B) * (1 - (v - min) / (max - min));
  const svg = V('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': yLabel || 'Kostenontwikkeling' });
  svg.append(V('title', {}, yLabel || 'Kostenontwikkeling'));
  for (let i = 0; i < 5; i++) {
    const value = min + (max - min) * i / 4, y = Y(value);
    svg.append(V('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'grid' }), V('text', { x: L - 9, y: y + 4, 'text-anchor': 'end' }, format === money ? `${num(value / 1000)}k` : num(value)));
  }
  const main = series[0];
  if (main?.values.length) svg.append(V('path', { d: `M${X(0)},${Y(Math.max(min, 0))} ` + main.values.map((v, i) => `L${X(i)},${Y(v)}`).join(' ') + ` L${X(labels.length - 1)},${Y(Math.max(min, 0))}Z`, fill: '#e5f2e5', opacity: '.65' }));
  for (const s of series) {
    svg.append(V('path', { d: s.values.map((v, i) => `${i ? 'L' : 'M'}${X(i)},${Y(v)}`).join(' '), fill: 'none', stroke: s.color, 'stroke-width': 2.7, ...(s.dashed ? { 'stroke-dasharray': '6 5' } : {}), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    s.values.forEach((v, i) => svg.append(V('circle', { cx: X(i), cy: Y(v), r: 3.6, fill: s.color, stroke: '#fff', 'stroke-width': 1.5 })));
  }
  labels.forEach((label, i) => svg.append(V('text', { x: X(i), y: H - 7, 'text-anchor': 'middle' }, label)));
  const tooltip = E('div', { class: 'chart-tip', hidden: true });
  const hover = V('line', { x1: L, x2: L, y1: T, y2: H - B, stroke: '#8a9e86', 'stroke-dasharray': '3 3', visibility: 'hidden' });
  svg.append(hover);
  labels.forEach((label, i) => {
    const area = V('rect', { x: X(i) - (W - L - R) / Math.max(1, labels.length - 1) / 2, y: T, width: (W - L - R) / Math.max(1, labels.length - 1), height: H - T - B, fill: 'transparent', tabindex: 0, role: 'img', 'aria-label': `${label}: ${series.map(s => `${s.name} ${format(s.values[i])}`).join(', ')}` });
    const show = () => { tooltip.hidden = false; tooltip.textContent = `${label}\n${series.map(s => `${s.name}: ${format(s.values[i])}`).join('\n')}`; hover.setAttribute('x1', X(i)); hover.setAttribute('x2', X(i)); hover.setAttribute('visibility', 'visible'); };
    const hide = () => { tooltip.hidden = true; hover.setAttribute('visibility', 'hidden'); };
    area.addEventListener('mouseenter', show); area.addEventListener('mouseleave', hide); area.addEventListener('focus', show); area.addEventListener('blur', hide);
    svg.append(area);
  });
  return E('div', { class: 'chart' }, tooltip, svg);
}

function finances(r, m) {
  const annual = r.per_jaar.map(totalYear), base = m.ref?.per_jaar.map(totalYear), accumulated = state.chart === 'cumulative';
  const series = [{ name: r.naam, values: accumulated ? cumulative(annual) : annual, color: '#18754c' }];
  if (base && state.baseline) series.push({ name: m.ref.naam, values: accumulated ? cumulative(base) : base, color: '#c99855', dashed: true });
  const chart = lineChart(series, r.per_jaar.map(x => x.jaar), { yLabel: accumulated ? 'Opgebouwde nominale kosten, inclusief restwaarde' : 'Nominale kosten per jaar, inclusief restwaarde' });
  const rows = costRows(r, m.ref);
  const table = dataTable(['Kostenpost', r.naam, ...(m.ref ? ['Diesel blijven', 'Voordeel'] : [])], rows.map(row => [row.name, money(row.plan), ...(m.ref ? [money(row.base), money(row.saving)] : [])]), ['Totaal', money(r.ncw), ...(m.ref ? [money(m.ref.ncw), money(m.saving)] : [])]);
  return section('kosten', 'Kosten en rendement', heading(3, 'Kosten en rendement', 'Het hele verhaal achter de euro.', 'Bekijk hoe de kosten zich ontwikkelen, en waar het verschil vandaan komt.', button('Cijfers downloaden', () => downloadCosts(r, m.ref), 'small', 'download')),
    E('div', { class: 'panel' }, E('div', { class: 'panel-head' }, E('div', {}, E('h3', {}, 'Kosten door de jaren'), E('p', {}, 'Beweeg over de grafiek voor de bedragen.')), segmented([['cumulative', 'Opgebouwd'], ['annual', 'Per jaar']], state.chart, chart => { state.chart = chart; render(); }, 'Grafiekweergave')),
      E('div', { class: 'chart-grid' }, E('div', { class: 'chart-card' }, E('h3', {}, accumulated ? 'Opgeteld, jaar na jaar' : 'De kosten van ieder jaar'), E('p', {}, 'Nominale bedragen · inclusief verkoop en restwaarde'), chart,
        E('div', { style: { margin: '4px 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' } }, legend([[r.naam, ''], ...(m.ref ? [['Diesel blijven', 'diesel']] : [])]), m.ref ? E('label', { class: 'hint', style: { margin: 0, display: 'flex', alignItems: 'center', gap: '6px' } }, E('input', { type: 'checkbox', ...(state.baseline ? { checked: true } : {}), onchange: e => { state.baseline = e.target.checked; render(); } }), 'Diesel tonen') : null)),
        E('aside', { class: 'cost-aside' }, E('div', {}, E('label', {}, 'Totale kosten, omgerekend naar vandaag'), E('div', { class: 'big' }, money(r.ncw)), E('p', {}, `${pct(report.settings.rekenrente, 1)} rekenrente · ${report.settings.jaren} jaar`)),
          E('div', {}, E('label', {}, 'Blijvend goedkoper dan diesel vanaf'), E('div', { class: 'big' }, !m.ref ? '—' : m.payback == null ? 'Niet binnen looptijd' : String(report.settings.startjaar + m.payback - 1)), E('p', {}, 'Op basis van de nominale jaarbedragen, inclusief restwaarde.')),
          m.inconclusive ? E('p', {}, 'Het verschil tussen de plannen valt binnen de optimalisatiemarge. Gebruik het niet als bewezen financieel voordeel.') : null)),
      E('details', { class: 'disclosure' }, E('summary', {}, 'Bekijk de volledige kostenopbouw', E('span', { class: 'muted', style: { marginLeft: 'auto', marginRight: '18px', fontSize: '10px' } }, 'Contante waarde')), E('div', { class: 'table-wrap' }, table))),
    ['kosten', 'investering', 'financiering'].filter(k => r.texts?.[k]).map(k => textBlock(r.texts[k], 'prose hint')));
}

function dataTable(headers, rows, total) {
  const tr = (row, head = false, cls = '') => E('tr', { class: cls }, row.map((value, i) => E(head ? 'th' : 'td', { class: i ? 'num' : '', ...(head ? { scope: 'col' } : {}) }, value)));
  return E('table', { class: 'data-table' }, E('thead', {}, tr(headers, true)), E('tbody', {}, rows.map(row => tr(row)), total ? tr(total, false, 'total') : null));
}

function dayChart(r, day) {
  const W = 700, H = 215, L = 42, R = 12, T = 13, B = 29;
  const axis = r.tijdas, upper = Math.max(1, day.grens || 0, ...day.net, ...day.gebouw, ...day.laden, ...day.zon) * 1.13;
  const X = minute => L + minute / 1440 * (W - L - R), Y = kw => T + (1 - kw / upper) * (H - T - B);
  const svg = V('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Vermogen op het depot in ${r.jaren[state.period]}. Gebruik de tijdschuif voor exacte waarden.` }, V('title', {}, 'Vermogen op het depot, in kW'));
  for (let i = 0; i < 5; i++) { const v = upper * i / 4; svg.append(V('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }), V('text', { x: L - 8, y: Y(v) + 4, 'text-anchor': 'end' }, num(v))); }
  for (let hour = 0; hour <= 24; hour += 3) svg.append(V('text', { x: X(hour * 60), y: H - 6, 'text-anchor': 'middle' }, `${String(hour).padStart(2, '0')}:00`));
  for (const [values, color, fill] of [[day.gebouw, '#b6bfb0', '#edf0e9'], [day.zon, '#a7b765', '#ebf0d580'], [day.laden, '#2a8b58', '#d8eddf99'], [day.net, '#7898aa', null]]) {
    let path = '';
    values.forEach((v, i) => path += `${i ? 'L' : 'M'}${X(axis[i])},${Y(v)}L${X(axis[i + 1])},${Y(v)}`);
    if (fill) svg.append(V('path', { d: path + `L${X(axis.at(-1))},${Y(0)}L${X(axis[0])},${Y(0)}Z`, fill }));
    svg.append(V('path', { d: path, stroke: color, 'stroke-width': 2.1, fill: 'none', 'stroke-linejoin': 'round' }));
  }
  svg.append(V('line', { x1: L, x2: W - R, y1: Y(day.grens || 0), y2: Y(day.grens || 0), stroke: '#c59a5d', 'stroke-dasharray': '6 4', 'stroke-width': 1.4 }));
  svg.append(V('line', { id: 'clock-line', x1: X(axis[state.clock]), x2: X(axis[state.clock]), y1: T, y2: H - B, stroke: '#183d2c', 'stroke-width': 1.4 }));
  svg.dataset.left = L; svg.dataset.plotWidth = W - L - R;
  return E('div', { class: 'chart', style: { marginTop: '17px' } }, svg);
}

function dayView(r) {
  const day = r.dagen[state.period];
  state.clock = Math.min(state.clock, r.tijdas.length - 2);
  const slide = E('input', { type: 'range', class: 'range', min: 0, max: r.tijdas.length - 2, step: 1, value: state.clock, 'aria-label': 'Tijdstip op de werkdag', oninput: e => { stopPlayer(); setClock(r, +e.target.value); updatePlayButton(); } });
  const play = button('Afspelen', () => {
    if (state.player) stopPlayer();
    else state.player = setInterval(() => { setClock(r, (state.clock + 1) % (r.tijdas.length - 1)); slide.value = state.clock; }, 900);
    updatePlayButton();
  }, 'small', 'play'); play.id = 'play-day';
  const soc = E('div', { class: 'soc-list', id: 'soc-list' });
  const readings = E('div', { class: 'day-readings' }, [['Gebouw', 'gray', 'gebouw'], ['Voertuigen laden', '', 'laden'], ['Zonnepanelen', 'solar', 'zon'], ['Van het net', 'blue', 'net']].map(([label, color, key]) => E('div', { class: 'reading' }, E('span', {}, E('i', { class: `swatch ${color}` }), label), E('b', { id: `reading-${key}` }, `${num(day[key][state.clock], 1)} kW`))));
  const peak = Math.max(0, ...day.net), margin = (day.grens || 0) - peak;
  const plan = E('div', { class: 'panel' }, E('div', { class: 'panel-head' }, E('div', {}, E('h3', {}, 'Een werkdag op uw depot'), E('p', {}, 'Kies een periode en schuif door de dag.')), periods(r, setPeriod)),
    E('div', { class: 'day-layout' }, E('div', { class: 'day-charts' }, E('h3', {}, 'Vermogen gedurende de dag'), E('p', { class: 'chart-note' }, 'kW · representatieve werkdag · stippellijn = aansluiting'), dayChart(r, day),
      legend([['Laden', ''], ['Gebouw', 'gray'], ['Zon', 'solar'], ['Net', 'blue'], ['Aansluiting', 'diesel']]),
      E('h3', { style: { marginTop: '28px', fontSize: '14px' } }, 'De accu’s op dit moment'), day.accu.length ? soc : E('div', { class: 'empty', style: { marginTop: '13px' } }, 'In deze periode rijden geen elektrische voertuigen. De grafiek laat het gebouw, zonnepanelen en de netafname zien.')),
      E('aside', { class: 'day-aside' }, E('div', { class: 'eyebrow' }, 'Een moment op uw werkdag'), E('div', { class: 'day-clock', id: 'clock-time', 'aria-live': 'off' }, time(r.tijdas[state.clock])), slide,
        E('div', { class: 'clock-controls' }, play, E('span', { id: 'clock-window' }, `${time(r.tijdas[state.clock])}–${time(r.tijdas[state.clock + 1])}`)), readings,
        E('p', { class: 'hint' }, 'De grafiek toont de basiswerkdag. Winter en andere opgenomen scenario’s worden in de modelcontrole meegenomen.'))),
    E('div', { class: 'day-facts' }, E('div', {}, E('span', {}, 'Hoogste afname'), E('b', {}, `${num(peak, 1)} kW`)), E('div', {}, E('span', {}, 'Ruimte op de aansluiting'), E('b', {}, `${num(margin, 1)} kW`)), E('div', {}, E('span', {}, 'Laden onderweg'), E('b', {}, `${num((day.onderweg_kwh_pj || 0) / 1000, 1)} MWh/jaar`))));
  const s = section('laden', 'Laden en energie', heading(4, 'Laden en energie', 'Een werkdag die klopt.', 'Zie wanneer uw voertuigen laden en wat dat vraagt van de aansluiting.'), plan,
    ['laden', 'werkdag'].filter(k => r.texts?.[k]).map(k => textBlock(r.texts[k], 'prose hint')));
  // Populate after insertion, once all referenced DOM elements are mounted.
  queueMicrotask(() => { if (q('#clock-time')) setClock(r, state.clock); });
  return s;
}

function updatePlayButton() {
  const button = q('#play-day'); if (!button) return;
  button.replaceChildren(icon(state.player ? 'pause' : 'play'), state.player ? 'Pauzeren' : 'Afspelen');
  button.setAttribute('aria-label', state.player ? 'Werkdag pauzeren' : 'Werkdag afspelen');
}
function setClock(r, index) {
  state.clock = index;
  const day = r.dagen[state.period], axis = r.tijdas, line = q('#clock-line');
  if (!q('#clock-time')) return;
  q('#clock-time').textContent = time(axis[index]);
  q('#clock-window').textContent = `${time(axis[index])}–${time(axis[index + 1])}`;
  const input = q('.range'); if (input) input.setAttribute('aria-valuetext', `${time(axis[index])} tot ${time(axis[index + 1])}`);
  for (const key of ['gebouw', 'laden', 'zon', 'net']) q(`#reading-${key}`).textContent = `${num(day[key][index], 1)} kW`;
  if (line) { const svg = line.ownerSVGElement; const x = +svg.dataset.left + axis[index] / 1440 * +svg.dataset.plotWidth; line.setAttribute('x1', x); line.setAttribute('x2', x); }
  const soc = q('#soc-list');
  if (soc) soc.replaceChildren(...day.accu.map(a => { const fraction = a.capaciteit ? a.kwh[index] / a.capaciteit : 0; return E('div', { class: 'soc-row' }, E('span', {}, a.voertuig), E('b', {}, `${num(a.kwh[index], 1)} kWh · ${pct(fraction)}`), E('div', { class: 'soc-track', role: 'meter', 'aria-label': `${a.voertuig} acculading`, 'aria-valuenow': Math.round(fraction * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 }, E('i', { style: { width: `${Math.max(0, Math.min(1, fraction)) * 100}%` } }))); }));
}

function variants(r) {
  return section('varianten', 'Plannen vergelijken', heading(5, 'Plannen vergelijken', 'Verken de mogelijkheden.', 'Kies een doorgerekend plan. Het hele rapport beweegt met uw keuze mee.'),
    r.texts?.varianten ? textBlock(r.texts.varianten, 'prose section-note') : null,
    E('div', { class: 'variants-grid', role: 'group', 'aria-label': 'Doorgerekende variant kiezen' }, report.variants.map((variant, index) => {
      const m = metrics(report, variant);
      return E('button', { type: 'button', class: 'variant-card', 'aria-pressed': state.variant === index, onclick: () => setVariant(index) }, E('span', { class: 'radio', 'aria-hidden': true }), E('span', { class: 'name' }, variant.naam),
        E('span', { class: 'amount' }, money(variant.ncw)), E('span', { class: 'caption' }, `${report.settings.jaren} jaar · contante waarde`),
        E('div', { class: 'variant-facts' }, E('div', {}, E('span', {}, 'Investering'), E('b', {}, money(variant.investering))), E('div', {}, E('span', {}, 'Elektrisch aan het eind'), E('b', {}, `${m.end.elektrisch} van ${m.end.elektrisch + m.end.diesel}`)),
          E('div', {}, E('span', {}, 'CO₂ laatste jaar'), E('b', {}, `${num(m.co2 / 1000, 1)} t`)),
          m.saving != null ? E('div', {}, E('span', {}, m.saving >= 0 ? 'Voordeel t.o.v. diesel' : 'Meerkosten t.o.v. diesel'), E('b', { class: m.saving >= 0 ? 'positive' : 'negative' }, money(Math.abs(m.saving)))) : null),
        m.inconclusive ? E('span', { class: 'hint', style: { margin: 0 } }, 'Verschil binnen optimalisatiemarge') : pill(state.variant === index ? 'Geselecteerd' : variant.referentie ? 'Dieselvergelijking' : 'Doorgerekend', state.variant === index ? 'green' : ''));
    })), E('p', { class: 'hint' }, 'Dit zijn opgeslagen berekeningen. Aanpassingen aan prijzen, routes of voertuigen laat u opnieuw doorrekenen door uw adviseur.'));
}

function roadmap(r) {
  const plan = r.jaren.map((year, p) => { const actions = steps(report, r, p); return E('div', { class: 'roadmap-card' }, E('div', { class: 'year' }, year), actions.length ? E('ul', {}, actions.map(x => E('li', {}, x))) : E('p', {}, 'De gekozen vloot en infrastructuur voortzetten.')); });
  const notes = Object.entries(r.texts || {}).filter(([key]) => /^(advies|stap)\d$/.test(key)).map(([, value]) => value);
  return section('stappen', 'Van plan naar praktijk', heading(7, 'Van plan naar praktijk', 'Uw volgende stap begint hier.', 'Een helder overzicht van de keuzes die voor u liggen.'),
    notes.length ? E('div', { class: 'panel', style: { padding: '23px 28px', marginBottom: '24px' } }, E('h3', { style: { marginBottom: '12px' } }, 'Uw adviseur raadt aan'), E('ul', { class: 'prose', style: { paddingLeft: '18px' } }, notes.map(x => E('li', {}, x)))) : null,
    E('div', { class: 'roadmap', style: { '--periods': r.jaren.length } }, plan),
    E('div', { class: 'contact-box' }, E('div', {}, E('h3', {}, 'Samen van inzicht naar uitvoering.'), E('p', {}, 'Bespreek het plan, toets de uitgangspunten en bepaal wat u als eerste oppakt.')),
      E('a', { class: 'btn primary', href: `mailto:${report.author.email}?subject=${encodeURIComponent('Bespreken vlootadvies ' + report.client.name)}` }, 'Bespreek uw vlootadvies', icon('arrow'))));
}

function assumptions(r) {
  const settings = report.settings;
  const rows = [['Looptijd', `${settings.startjaar}–${settings.startjaar + settings.jaren - 1}`], ['Rekenrente', pct(settings.rekenrente, 1)], ['Inzetdagen', `${settings.inzetdagen} per jaar`], ['Dieselprijs', `${moneyDecimal(settings.dieselprijs)} / liter`], ['Stroom dal / piek', `${moneyDecimal(settings.stroom_dal)} / ${moneyDecimal(settings.stroom_piek)} per kWh`], ['Beslisperiode', `${settings.periode_jaren} jaar`]];
  return section('uitgangspunten', 'De onderbouwing', heading(8, 'De onderbouwing', 'U ziet waarop het plan rust.', 'De aannames en de nauwkeurigheid horen bij het advies.'),
    r.texts?.over ? textBlock(r.texts.over, 'prose section-note') : null,
    E('div', { class: 'panel' }, E('div', { class: 'assumptions' }, E('div', {}, E('h3', {}, 'De belangrijkste uitgangspunten'), E('dl', { style: { marginTop: '10px' } }, rows.map(([label, value]) => E('div', {}, E('dt', {}, label), E('dd', {}, value))))),
      E('div', {}, E('h3', {}, 'Wat u bij deze berekening moet weten'), E('ul', {}, [...(r.aannames || []), ...(r.waarschuwingen || [])].map(x => E('li', {}, x))),
        E('p', { class: 'hint' }, r.texts?.disclaimer || 'Een onderbouwd plan op basis van de aangeleverde gegevens en indicatieve prijzen. Toets de inzet met echte ritgegevens en bevestig offertes en subsidies voordat u beslist.'))),
      E('div', { class: 'trustline' }, E('span', {}, `Optimalisatiemarge: ${r.gap == null ? 'onbekend' : pct(r.gap, 3)} · ${r.status === 'optimaal' ? 'opgelost binnen ingestelde nauwkeurigheid' : 'beste gevonden plan'}`),
        E('span', {}, r.controle?.fout ? 'Modelcontrole meldt een aandachtspunt; bespreek dit met uw adviseur.' : r.controle?.cashflow_npv_reconciled ? 'Energiebalans en kasstromen onafhankelijk nagerekend' : 'Onafhankelijke controle niet volledig beschikbaar')),
      E('details', { class: 'disclosure' }, E('summary', {}, 'De aangeleverde ritten'), E('div', { class: 'table-wrap' }, dataTable(['Rit', 'Dagafstand', 'Vertrek', 'Terug'], report.trips.map(t => [t.naam, `${num(t.km)} km`, time(t.vertrek * 60), time(t.aankomst * 60)]))))));
}
function moneyDecimal(x) { return `€ ${num(x, 2)}`; }

function impact(r, m) {
  const series = [{ name: r.naam, values: r.co2.map(x => x / 1000), color: '#0A8F5B' }];
  if (m.ref) series.push({ name: 'Diesel blijven', values: m.ref.co2.map(x => x / 1000), color: '#B8700E', dashed: true });
  const endYear = report.settings.startjaar + report.settings.jaren - 1;
  const zeTrips = report.trips.filter(t => t.ze_vanaf);
  return section('impact', 'Uitstoot en inzet', heading(6, 'Uitstoot en inzet', 'Wat uw keuze verandert.', 'De uitstoot en elektrische inzet, steeds vergeleken binnen hetzelfde jaar.'),
    E('div', { class: 'panel' }, E('div', { class: 'chart-grid' }, E('div', { class: 'chart-card' }, E('h3', {}, 'CO₂-uitstoot per jaar'), E('p', {}, 'Ton CO₂ · gewogen over de opgenomen scenario’s'), lineChart(series, r.jaren, { yLabel: 'CO₂-uitstoot in ton per jaar', format: x => `${num(x, 1)} t`, height: 210 }),
      E('div', { style: { margin: '0 0 18px' } }, legend([[r.naam, ''], ...(m.ref ? [['Diesel blijven', 'diesel']] : [])]))),
      E('aside', { class: 'cost-aside' }, E('div', {}, E('label', {}, `Elektrische kilometers in ${endYear}`), E('div', { class: 'big' }, pct(r.ze_aandeel.at(-1))), E('p', {}, `${m.end.elektrisch} van ${m.end.elektrisch + m.end.diesel} voertuigen elektrisch.`)),
        E('div', {}, E('label', {}, m.co2Saving == null ? `Uitstoot in ${endYear}` : `Verschil met diesel in ${endYear}`), E('div', { class: 'big' }, `${num(Math.abs(m.co2Saving ?? m.co2) / 1000, 1)} t`), E('p', {}, m.co2Saving == null ? 'Geen vergelijkingsplan opgenomen.' : `${m.co2Saving >= 0 ? 'Minder' : 'Meer'} CO₂ dan diesel in hetzelfde jaar.`)))),
      zeTrips.length ? E('div', { class: 'table-wrap' }, dataTable(['Rit met zero-emissie-eis', 'Vanaf', ...r.jaren], zeTrips.map(t => [t.naam, t.ze_vanaf, ...r.dagen.map(day => { const a = day.toewijzing.find(x => x.rit_id === t.id); return a ? a.aandrijving === 'electric' ? 'Elektrisch' : a.aandrijving === 'charter' ? 'Inhuur' : 'Diesel' : 'Niet toegewezen'; })]))) : null),
    r.texts?.co2 ? textBlock(r.texts.co2, 'prose hint') : null);
}

function downloadCosts(r, ref) {
  // Guard spreadsheet formula injection in client-edited labels.
  const safe = x => { let value = typeof x === 'number' ? x.toFixed(2) : String(x ?? ''); if (typeof x !== 'number' && /^[=+@\-\t\r]/.test(value)) value = "'" + value; return `"${value.replaceAll('"', '""')}"`; };
  const rows = [['Kostenpost', r.naam, ...(ref ? [ref.naam, 'Voordeel'] : [])], ...costRows(r, ref).map(x => [x.name, x.plan, ...(ref ? [x.base, x.saving] : [])])];
  const blob = new Blob(['\ufeff' + rows.map(row => row.map(safe).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = E('a', { href: url, download: 'vlootadvies-kosten.csv' }); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyLink() {
  try { await navigator.clipboard.writeText(location.href); toast('Persoonlijke link gekopieerd. Iedereen met deze link kan het rapport bekijken.'); }
  catch { toast('Kopieer het adres uit de adresbalk om dit rapport te delen.'); }
}

function render() {
  const r = report.variants[state.variant], m = metrics(report, r);
  stopPlayer(); state.observer?.disconnect();
  const banners = [demo ? E('div', { class: 'demo' }, 'Voorbeeldrapport · fictieve organisatie en voorbeeldberekening') : null, preview ? E('div', { class: 'preview-banner' }, 'Lokaal voorbeeld · dit rapport is nog niet online gepubliceerd') : null];
  const top = E('header', { class: 'top wrap' }, brand(), E('div', { class: 'top-right' }, E('span', { class: 'personal' }, icon('lock'), 'Uw persoonlijke rapport'), !preview && !demo ? button('Deel link', copyLink, '', 'link') : null, button('Bewaar als pdf', () => { stopPlayer(); print(); }, '', 'download')));
  const nav = E('div', { class: 'nav-shell' }, E('nav', { class: 'section-nav wrap', 'aria-label': 'In dit rapport' }, E('div', { class: 'nav-links' }, [['samenvatting', 'Overzicht'], ['vlootplan', 'Vlootplan'], ['kosten', 'Kosten'], ['laden', 'Laden & energie'], ['varianten', 'Vergelijken'], ['impact', 'Impact'], ['stappen', 'Volgende stappen'], ['uitgangspunten', 'Onderbouwing']].map(([id, label]) => anchor(id, label))), E('span', { class: 'nav-client' }, report.client.name)));
  const footer = E('footer', { class: 'footer wrap' }, brand(), E('div', { class: 'footer-right' }, 'Een helder plan voor elke kilometer.', E('span', {}, report.publication?.expires_at ? `Persoonlijke link geldig t/m ${date(report.publication.expires_at)}` : `Opgesteld ${date(report.created_at)} · ${report.client.name}`)));
  q('#app').replaceChildren(...banners.filter(Boolean), top, E('div', { class: 'wrap' }, hero(r, m)), nav,
    E('main', { id: 'inhoud', class: 'wrap' }, summary(r, m), fleet(r), finances(r, m), dayView(r), variants(r), impact(r, m), roadmap(r), assumptions(r)), footer);
  q('#app').setAttribute('aria-busy', 'false');
  state.observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { q('.section-nav .active')?.classList.remove('active'); document.querySelector(`.section-nav a[href="#${entry.target.id}"]`)?.classList.add('active'); } }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
  document.querySelectorAll('main .section').forEach(s => state.observer.observe(s));
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopPlayer(); updatePlayButton(); } });
window.addEventListener('pagehide', stopPlayer);
load();
