/* Dashboard · start: inloggen, gegevens ophalen en alle bediening */
'use strict';
const API = 'https://zarvyblveyomngypwvhw.supabase.co/functions/v1/';
const CODESLEUTEL = 'sod_dash_code';
let CODE = null, NIEUW = false; // NIEUW: de functie 'dashboard' bestaat en levert alles in één keer
const eigenVid = () => { try { return localStorage.getItem('sod-vid'); } catch (e) { return null; } };
class ApiFout extends Error { constructor(status) { super('status ' + status); this.status = status; } }
async function post(fn, body) {
  const r = await fetch(API + fn, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: CODE, ...body }) });
  if (!r.ok) throw new ApiFout(r.status);
  return r.text();
}
/* De oude functies zetten de gegevens in een sjabloon. Dat sjabloon is nu alleen nog de gegevens zelf;
   zolang een oude kopie in de cache staat, halen we de gegevens uit de pagina. */
function ontleed(tekst) {
  const t = tekst.trim(); if (t[0] === '{') return JSON.parse(t);
  const m = /const (?:RAW|DATA) = (\{.*\});?\s*$/m.exec(tekst); if (!m) throw new Error('Onbekend antwoord');
  return JSON.parse(m[1]);
}
async function haal() {
  const vid = eigenVid();
  try { const raw = JSON.parse(await post('dashboard', { vid, dagen: 365 })); if (raw && raw.bz) { NIEUW = true; return raw; } }
  catch (e) { if (e instanceof ApiFout && (e.status === 401 || e.status === 429)) throw e; }
  NIEUW = false;
  const [bz, ml] = (await Promise.all([post('bezoekers-dashboard', { vid, dagen: 365 }), post('email-dashboard', {})])).map(ontleed);
  return { gegenereerd: bz.gegenereerd, dagen: bz.dagen, bz, ml, extra: null };
}
const actie = body => post(NIEUW ? 'dashboard' : 'bezoekers-dashboard', body);

/* ===== Opbouw ===== */
const ICOON = {
  overzicht: '<rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1"/><rect x="9" y="9" width="4.5" height="4.5" rx="1"/>',
  Site: '<circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c-2 2-2 9 0 11M8 2.5c2 2 2 9 0 11"/>',
  Calculator: '<rect x="3.5" y="2" width="9" height="12" rx="1.5"/><path d="M6 5h4M6 8.2h.01M8 8.2h.01M10 8.2h.01M6 10.8h.01M8 10.8h.01M10 10.8h.01"/>',
  'E-mail': '<rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.5 4.5 8 9l5.5-4.5"/>',
  Mensen: '<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.6-2.700 2.600-4 5-4s4.400 1.300 5 4"/>',
  Beheer: '<path d="M2.5 5h6M11.5 5h2M2.5 11h2M7.5 11h6"/><circle cx="10" cy="5" r="1.5"/><circle cx="6" cy="11" r="1.5"/>',
  filter: '<path d="M2.5 4h11M4.5 8h7M6.5 12h3"/>',
  kalender: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.8h11M5.5 2v3M10.5 2v3"/>',
};
const icoon = k => `<svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICOON[k] || ''}</svg>`;
let MENUOPEN = {}; try { MENUOPEN = JSON.parse(localStorage.getItem('sod-dash-menu') || '{}'); } catch (e) {}
function bouwZij() {
  const nu = Date.now() - 10 * 60000, live = [...D.SES.values()].filter(s => s.klasse === 'echt' && +s.eind >= nu).length;
  const link = (k, ic) => `<a class="nav${ic ? ' top' : ''}" data-s="${k}" href="#/${k}">${ic ? icoon(ic) : ''}<span>${esc(SCHERMEN[k].menu || SCHERMEN[k].titel)}</span></a>`;
  $('zij').innerHTML = `<a class="merk" href="#/overzicht"><i></i>Stekker of Diesel</a><div class="menu">`
    + MENU.map(([naam, items]) => { items = items.filter(k => SCHERMEN[k]); if (!items.length) return '';
        if (items.length === 1) return link(items[0], naam || items[0]);
        return `<div class="groep${MENUOPEN[naam] ? ' open' : ''}" data-g="${esc(naam)}"><button class="nav top" type="button" data-groep="${esc(naam)}" aria-expanded="${!!MENUOPEN[naam]}">${icoon(naam)}<span>${esc(naam)}</span><i class="pijl"></i></button><div class="sub"><div>${items.map(k => link(k)).join('')}</div></div></div>`; }).join('')
    + `</div><div class="voet"><a class="live${live ? ' aan' : ''}" href="#/sessies"><i></i>${live ? live + (live === 1 ? ' bezoeker' : ' bezoekers') + ' op de site' : 'Niemand op de site'}</a><span>Bijgewerkt ${esc(fKort(D.gegenereerd))}</span><span><a href="/" target="_blank" rel="noopener">Site</a> · <a href="https://www.notion.so/1c5cf07d8338422a8dd63ac4c0abb0dc" target="_blank" rel="noopener">Notion</a> · <a href="#" id="afmelden">Afmelden</a></span></div>`;
}

/* ===== Filtermenu ===== */
let FM = { type: null, q: '' };
function filterMenu(open, type) {
  const m = $('filterMenu'); if (!open) { m.hidden = true; $('filterKnop').classList.remove('aan'); return; }
  if (type !== undefined) { FM.type = type; FM.q = ''; }
  if (!FM.type) {
    m.innerHTML = FILTERS.map(([groepNaam, items]) => `<h6>${groepNaam}</h6>` + items.map(([k, n]) => { const w = filterWaarde(k); return `<button class="opt" data-fkies="${k}"><span>${esc(n)}</span>${w != null ? `<em>${esc(MAILDIMS.includes(k) ? mailWaarde(k, w) : w)}</em>` : ''}<i class="pijl"></i></button>`; }).join('')).join('')
      + (actieveFilters().length ? '<div class="onderin"><button class="knop mini" data-dimweg="alles">Wis alle filters</button></div>' : '');
  } else {
    const naam = FILTERS.flatMap(g => g[1]).find(x => x[0] === FM.type)[1], opties = filterOpties(FM.type), nu = filterWaarde(FM.type), max = Math.max(1, ...opties.map(o => o.n));
    const q = FM.q.trim().toLowerCase(), lijst = q ? opties.filter(o => String(o.toon).toLowerCase().includes(q)) : opties;
    m.innerHTML = `<button class="opt terug" data-fkies=""><i class="pijl"></i><span>${esc(naam)}</span></button>`
      + (opties.length > 8 ? `<input class="veld" id="filterZoek" type="search" placeholder="Zoek" value="${esc(FM.q)}" autocomplete="off">` : '')
      + `<div class="waarden">${lijst.length ? lijst.slice(0, 200).map(o => `<button class="opt waarde${String(nu) === String(o.w) ? ' on' : ''}" data-fw="${esc(o.w)}"><span>${esc(o.toon)}</span><b style="--w:${(100 * o.n / max).toFixed(0)}%">${nf.format(o.n)}</b></button>`).join('') : '<div class="leeg">Niets in deze periode</div>'}</div>`;
  }
  m.hidden = false; $('filterKnop').classList.add('aan');
  const z = $('filterZoek'); if (z && type !== undefined) z.focus();
}

function toon(raw) {
  bouw(raw); ZI = null;
  $('login').hidden = true; $('app').hidden = false;
  bouwZij(); R.scherm = null; $('inhoud').innerHTML = ''; route();
}
async function laad(viaKnop) {
  const knop = $('loginKnop'), fout = $('loginFout'), ver = $('ververs');
  knop.disabled = true; knop.textContent = 'Gegevens ophalen…'; fout.textContent = ''; ver.disabled = true;
  try {
    const raw = await haal();
    try { sessionStorage.setItem(CODESLEUTEL, CODE); } catch (e) {}
    toon(raw);
  } catch (e) {
    console.error(e);
    const tekst = e.status === 401 ? 'Onjuiste code.' : e.status === 429 ? 'Te veel pogingen. Probeer het over een uur opnieuw.' : e.status ? `Er ging iets mis (${e.status}).` : 'De gegevens konden niet worden opgehaald. Probeer het opnieuw.';
    if (e.status === 401) { try { sessionStorage.removeItem(CODESLEUTEL); } catch (x) {} }
    if (!$('app').hidden && e.status !== 401) { ver.textContent = 'Mislukt, opnieuw'; }
    else { $('app').hidden = true; $('login').hidden = false; fout.textContent = tekst; if (viaKnop) $('code').select(); }
  } finally { knop.disabled = false; knop.textContent = 'Open dashboard'; ver.disabled = false; if (ver.textContent === 'Bezig…') ver.textContent = 'Vernieuwen'; }
}

/* ===== Periode-menu ===== */
function periodeMenu(open) {
  const m = $('perMenu'); if (!open) { m.hidden = true; $('perKnop').classList.remove('aan'); return; }
  const max = dagIso(dagNr(Date.now()));
  m.innerHTML = `<div class="snel">${PERIODES2.map(([k, n]) => `<button class="opt${F.per === k ? ' on' : ''}" data-per="${k}">${n}</button>`).join('')}</div>`
    + `<div class="eigen"><label>Van<input type="date" id="perVan" value="${dagIso(X.B.d0)}" max="${max}"></label><label>Tot en met<input type="date" id="perTot" value="${dagIso(X.B.d1)}" max="${max}"></label><button class="knop donker" id="perEigen" style="justify-content:center">Toepassen</button></div>`;
  m.hidden = false; $('perKnop').classList.add('aan');
}

/* ===== Zoeken ===== */
let zoekHits = [], zoekI = 0;
function zoekToon() {
  const q = $('zoek').value, res = $('zoekRes'); if (!q.trim()) { res.hidden = true; return; }
  zoekHits = zoekResultaten(q); zoekI = Math.min(zoekI, Math.max(0, zoekHits.length - 1));
  let g = null;
  res.innerHTML = zoekHits.length ? zoekHits.map((x, i) => (x.g !== g ? `<h6>${esc(g = x.g)}</h6>` : '') + `<a data-z="${i}" class="${i === zoekI ? 'on' : ''}"><span>${esc(x.t)}</span>${x.s ? `<small>${esc(kort(x.s, 44))}</small>` : ''}</a>`).join('') : '<div class="leeg">Niets gevonden</div>';
  res.hidden = false;
}
function zoekKies(i) { const x = zoekHits[i]; if (!x) return; $('zoek').value = ''; $('zoekRes').hidden = true; $('zoek').blur(); if (x.ga) ga(x.ga); else openen(x.o); }

/* ===== Na een wijziging van wie intern is ===== */
function herreken() { herklasseer(); klasseerCalc(); klasseerBezoekers(); ZI = null; render(); toonPaneel(); }

/* ===== Gebeurtenissen ===== */
function koppel() {
  $('loginForm').addEventListener('submit', e => { e.preventDefault(); CODE = $('code').value.trim(); if (CODE) laad(true); });
  addEventListener('hashchange', () => { if (D.EV) route(); });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(hertekenGrafieken, 150); });

  document.addEventListener('click', async e => {
    const t = e.target, bij = sel => t.closest(sel);
    if (!bij('#perPop')) periodeMenu(false);
    if (!bij('#filterPop') && !bij('[data-filter]')) filterMenu(false);
    if (!bij('.zoek')) $('zoekRes').hidden = true;
    if (!bij('.zij') && !bij('#menuKnop')) $('zij').classList.remove('open');
    let el;
    if (bij('#menuKnop')) return $('zij').classList.toggle('open');
    if (bij('#afmelden')) { e.preventDefault(); try { sessionStorage.removeItem(CODESLEUTEL); } catch (x) {} return location.reload(); }
    if (bij('.zij a.nav')) return $('zij').classList.remove('open');
    if (bij('#ververs')) { $('ververs').textContent = 'Bezig…'; return laad(); }
    if (bij('#perKnop')) return periodeMenu($('perMenu').hidden);
    if (bij('#filterKnop')) return filterMenu($('filterMenu').hidden, null);
    if ((el = bij('[data-fkies]'))) return filterMenu(true, el.dataset.fkies || null);
    if ((el = bij('[data-fw]'))) { zetDim(FM.type, el.dataset.fw); return filterMenu(true, null); }
    if ((el = bij('[data-filter]'))) return filterMenu(true, el.dataset.filter);
    if ((el = bij('[data-groep]'))) { const g = el.parentNode, open = !g.classList.contains('open'); g.classList.toggle('open', open); el.setAttribute('aria-expanded', open); MENUOPEN[el.dataset.groep] = open; try { localStorage.setItem('sod-dash-menu', JSON.stringify(MENUOPEN)); } catch (x) {} return; }
    if ((el = bij('[data-stap]'))) return stapPeriode(+el.dataset.stap);
    if ((el = bij('[data-per]'))) { periodeMenu(false); return zetPeriode(el.dataset.per); }
    if (bij('#perEigen')) { const a = $('perVan').value, b = $('perTot').value; if (!a || !b) return; const d0 = isoDag(a), d1 = isoDag(b); periodeMenu(false); return zetPeriode('eigen', Math.min(d0, d1), Math.max(d0, d1)); }
    if ((el = bij('#fWie button'))) { F.wie = el.dataset.v; bewaarF(); render(); return toonPaneel(); }
    if ((el = bij('[data-z]'))) return zoekKies(+el.dataset.z);
    if (bij('#paneelX') || t === $('scrim')) return sluitPaneel();
    if (bij('#paneelTerug')) return history.back();
    if ((el = bij('[data-dimweg]'))) { wisDim(el.dataset.dimweg); if (!$('filterMenu').hidden) filterMenu(true, null); return; }
    if ((el = bij('[data-u]'))) { U[el.dataset.u] = el.dataset.v; return render(); }
    if ((el = bij('[data-csv]'))) return csvVan(el.dataset.csv);
    if ((el = bij('[data-meer]'))) { const st = TB.get(el.dataset.meer); st.n = el.dataset.alles ? Infinity : st.n + (st.o.per || 50); return tekenTabel(el.dataset.meer); }
    if ((el = bij('th[data-s]'))) { const id = el.closest('[id^="tb-"]').id.slice(3), st = TB.get(id), i = el.dataset.s; st.sort = st.sort === '-' + i ? i : '-' + i; return tekenTabel(id); }
    if ((el = bij('[data-net]'))) { el.disabled = true; try { await actie({ net_weg: el.dataset.net }); D.netwerken = D.netwerken.filter(n => n[0] !== el.dataset.net); render(); } catch (x) { el.disabled = false; el.textContent = 'Mislukt'; } return; }
    if ((el = bij('[data-intern]'))) { const vid = el.dataset.intern, aan = el.dataset.aan === '1'; el.disabled = true; try { await actie({ intern: { visitor_id: vid, aan } }); if (aan) D.intern.add(vid); else D.intern.delete(vid); herreken(); } catch (x) { el.disabled = false; el.textContent = 'Mislukt'; } return; }
    if ((el = bij('[data-b]'))) { const [a, b] = el.dataset.b.split(':').map(Number); if (!bij('#paneel')) return zetPeriode('eigen', a, b); F.per = 'eigen'; F.d0 = a; F.d1 = b; const s = R.scherm; R.scherm = null; return ga(s, null); }
    if ((el = bij('[data-dim]'))) { const inPaneel = !!bij('#paneel'); zetDim(el.dataset.dim, el.dataset.w); if (inPaneel) sluitPaneel(); return; }
    if ((el = bij('[data-open]')) && el.dataset.open && !bij('a[href], button, input, select')) return openen(el.dataset.open);
  });
  document.addEventListener('input', e => {
    const el = e.target; if (el.id === 'zoek') { zoekI = 0; return zoekToon(); }
    if (el.id === 'filterZoek') { if ($('filterMenu').hidden) return; FM.q = el.value; const p = el.selectionStart; filterMenu(true); const z = $('filterZoek'); if (z) { z.focus(); z.setSelectionRange(p, p); } return; }
    if (el.dataset && el.dataset.tq) { const st = TB.get(el.dataset.tq); if (st) { st.q = el.value; st.n = st.o.per || 50; tekenTabel(el.dataset.tq); } }
  });
  $('zoek').addEventListener('focus', zoekToon);
  $('zoek').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); zoekI = Math.max(0, Math.min(zoekHits.length - 1, zoekI + (e.key === 'ArrowDown' ? 1 : -1))); zoekToon(); const on = $('zoekRes').querySelector('a.on'); if (on) on.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter') { e.preventDefault(); zoekKies(zoekI); }
    else if (e.key === 'Escape') { $('zoek').value = ''; $('zoekRes').hidden = true; $('zoek').blur(); e.stopPropagation(); }
  });
  document.addEventListener('keydown', e => {
    if ($('app').hidden) return;
    const inVeld = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (e.key === 'Escape') { if (!$('filterMenu').hidden) { e.preventDefault(); return filterMenu(false); } if (!$('perMenu').hidden) return periodeMenu(false); if (R.open) return sluitPaneel(); }
    if (e.key === 'f' && !inVeld && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); return filterMenu(true, null); }
    if ((e.key === '/' && !inVeld) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); $('zoek').focus(); $('zoek').select(); }
  });

  /* Zwevende toelichting bij grafieken */
  const tip = $('tip'); let tipEl = null;
  document.addEventListener('mousemove', e => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) { if (tipEl) { tip.style.display = 'none'; tipEl = null; } return; }
    if (el !== tipEl) { tip.innerHTML = el.dataset.tip; tip.style.display = 'block'; tipEl = el; }
    const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y + h > innerHeight - 8) y = e.clientY - h - 14;
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
  });
  document.addEventListener('mouseleave', () => { tip.style.display = 'none'; tipEl = null; });
  addEventListener('scroll', () => { if (tipEl) { tip.style.display = 'none'; tipEl = null; } }, true);
}

/* ===== Begin ===== */
(function start() {
  try { localStorage.setItem('sod-intern', '1'); } catch (e) {} // deze browser telt op de site als intern
  // Oude links: #mail=<kenmerk> en #vid=<bezoeker>
  const oud = /^#(mail|vid)=([\w-]+)/.exec(location.hash);
  if (oud) history.replaceState(null, '', oud[1] === 'mail' ? '#/ontvangers~c%3A' + oud[2] : '#/bezoekers~b%3A' + oud[2]);
  koppel();
  try { CODE = sessionStorage.getItem(CODESLEUTEL); } catch (e) {}
  if (CODE) { $('code').value = CODE; laad(); } else $('code').focus();
})();
