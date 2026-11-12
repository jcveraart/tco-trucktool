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
function bouwZij() {
  const nu = Date.now() - 10 * 60000, live = [...D.SES.values()].filter(s => s.klasse === 'echt' && +s.eind >= nu).length;
  $('zij').innerHTML = `<a class="merk" href="#/overzicht"><i></i>Stekker of Diesel</a>`
    + MENU.map(([groepNaam, items]) => (groepNaam ? `<h6>${groepNaam}</h6>` : '') + items.filter(k => SCHERMEN[k]).map(k => `<a class="nav" data-s="${k}" href="#/${k}">${esc(SCHERMEN[k].menu || SCHERMEN[k].titel)}</a>`).join('')).join('')
    + `<div class="voet"><a class="live${live ? ' aan' : ''}" href="#/sessies" style="text-decoration:none"><i></i>${live ? live + (live === 1 ? ' bezoeker' : ' bezoekers') + ' op de site' : 'Niemand op de site'}</a>Bijgewerkt ${esc(fKort(D.gegenereerd))}<br><a href="/" target="_blank" rel="noopener">Site</a> · <a href="https://www.notion.so/1c5cf07d8338422a8dd63ac4c0abb0dc" target="_blank" rel="noopener">Notion</a> · <a href="#" id="afmelden">Afmelden</a></div>`;
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
  const m = $('perMenu'); if (!open) { m.hidden = true; return; }
  m.innerHTML = PERIODES.map(([k, n]) => `<button class="opt${F.per === k ? ' on' : ''}" data-per="${k}">${n}</button>`).join('')
    + `<div class="eigen"><input type="date" id="perVan" value="${dagIso(X.B.d0)}" max="${dagIso(dagNr(Date.now()))}" aria-label="Van"><input type="date" id="perTot" value="${dagIso(X.B.d1)}" max="${dagIso(dagNr(Date.now()))}" aria-label="Tot en met"><button class="knop donker" id="perEigen" style="justify-content:center">Toepassen</button></div>`;
  m.hidden = false;
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
    if (!bij('.pop')) periodeMenu(false);
    if (!bij('.zoek')) $('zoekRes').hidden = true;
    if (!bij('.zij') && !bij('#menuKnop')) $('zij').classList.remove('open');
    let el;
    if (bij('#menuKnop')) return $('zij').classList.toggle('open');
    if (bij('#afmelden')) { e.preventDefault(); try { sessionStorage.removeItem(CODESLEUTEL); } catch (x) {} return location.reload(); }
    if (bij('.zij a.nav')) return $('zij').classList.remove('open');
    if (bij('#ververs')) { $('ververs').textContent = 'Bezig…'; return laad(); }
    if (bij('#perKnop')) return periodeMenu($('perMenu').hidden);
    if ((el = bij('[data-per]'))) { periodeMenu(false); return zetPeriode(el.dataset.per); }
    if (bij('#perEigen')) { const a = $('perVan').value, b = $('perTot').value; if (!a || !b) return; const d0 = isoDag(a), d1 = isoDag(b); periodeMenu(false); return zetPeriode('eigen', Math.min(d0, d1), Math.max(d0, d1)); }
    if ((el = bij('#fWie button'))) { F.wie = el.dataset.v; bewaarF(); render(); return toonPaneel(); }
    if ((el = bij('[data-z]'))) return zoekKies(+el.dataset.z);
    if (bij('#paneelX') || t === $('scrim')) return sluitPaneel();
    if (bij('#paneelTerug')) return history.back();
    if ((el = bij('[data-dimweg]'))) { F.dims = el.dataset.dimweg === 'alles' ? [] : F.dims.filter((_, i) => i !== +el.dataset.dimweg); return render(); }
    if ((el = bij('[data-u]'))) { U[el.dataset.u] = el.dataset.v; return render(); }
    if ((el = bij('[data-mf] button'))) { F.mail[el.parentNode.dataset.mf] = el.dataset.v; return render(); }
    if ((el = bij('[data-csv]'))) return csvVan(el.dataset.csv);
    if ((el = bij('[data-meer]'))) { const st = TB.get(el.dataset.meer); st.n = el.dataset.alles ? Infinity : st.n + (st.o.per || 50); return tekenTabel(el.dataset.meer); }
    if ((el = bij('th[data-s]'))) { const id = el.closest('[id^="tb-"]').id.slice(3), st = TB.get(id), i = el.dataset.s; st.sort = st.sort === '-' + i ? i : '-' + i; return tekenTabel(id); }
    if ((el = bij('[data-net]'))) { el.disabled = true; try { await actie({ net_weg: el.dataset.net }); D.netwerken = D.netwerken.filter(n => n[0] !== el.dataset.net); render(); } catch (x) { el.disabled = false; el.textContent = 'Mislukt'; } return; }
    if ((el = bij('[data-intern]'))) { const vid = el.dataset.intern, aan = el.dataset.aan === '1'; el.disabled = true; try { await actie({ intern: { visitor_id: vid, aan } }); if (aan) D.intern.add(vid); else D.intern.delete(vid); herreken(); } catch (x) { el.disabled = false; el.textContent = 'Mislukt'; } return; }
    if ((el = bij('[data-b]'))) { const [a, b] = el.dataset.b.split(':').map(Number); if (!bij('#paneel')) return zetPeriode('eigen', a, b); F.per = 'eigen'; F.d0 = a; F.d1 = b; const s = R.scherm; R.scherm = null; return ga(s, null); }
    if ((el = bij('[data-dim]'))) { const inPaneel = !!bij('#paneel'); zetDim(el.dataset.dim, el.dataset.w); if (inPaneel) sluitPaneel(); return; }
    if ((el = bij('[data-open]')) && el.dataset.open && !bij('a[href], button, input, select')) return openen(el.dataset.open);
  });
  document.addEventListener('change', e => { const el = e.target.closest('select[data-mfs]'); if (el) { F.mail[el.dataset.mfs] = el.value; render(); } });
  document.addEventListener('input', e => {
    const el = e.target; if (el.id === 'zoek') { zoekI = 0; return zoekToon(); }
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
    if (e.key === 'Escape') { if (!$('perMenu').hidden) return periodeMenu(false); if (R.open) return sluitPaneel(); }
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
