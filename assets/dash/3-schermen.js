/* Dashboard · schermen voor de site, de calculator en de mensen erachter */
'use strict';
const U = { metric: 'weergaven', ses: '', calcWie: '' }; // kleine keuzes binnen een scherm
const segU = (key, opts, kl = 'klein') => `<div class="seg ${kl}">${opts.map(([v, l, c]) => `<button data-u="${key}" data-v="${v}" class="${U[key] === v ? 'on' : ''}">${esc(l)}${c != null ? `<span class="c">${nf.format(c)}</span>` : ''}</button>`).join('')}</div>`;
const alleViews = sel => [...sel.views, ...sel.A];
const heeft = (s, ev) => s.evs.has(ev);

/* ----- Gedeelde berekeningen ----- */
function siteTrechter(S) {
  return [['Sessies', S.length], ['Calculator bekeken', S.filter(s => s.views.some(v => v.naam === 'Calculator' || v.naam === 'Uitgebreid')).length], ['Invulvenster geopend', S.filter(s => heeft(s, 'wizard_open')).length],
    ['Berekening gemaakt', S.filter(s => s.doelen.has('berekening')).length], ['Uitgebreid, PDF of gedeeld', S.filter(s => s.doelen.has('uitgebreid') || s.doelen.has('pdf') || s.doelen.has('deel')).length, KLEUR.voltM, 1],
    ['Naar vlootanalyse', S.filter(s => s.doelen.has('vlootklik') || s.views.some(v => v.naam === 'Vlootanalyse')).length, KLEUR.voltM, 1], ['Aanvraag verstuurd', S.filter(s => s.doelen.has('aanvraag')).length, KLEUR.voltM, 1]];
}
function mailCijfers(V) {
  const tokens = new Set(V.map(m => m.token)), cs = [...tokens].map(t => D.CONTACT.get(t)).filter(Boolean);
  const bezorgd = new Set(V.filter(m => m.bezorgd).map(m => m.token)).size, bounce = new Set(V.filter(m => m.status === 'bounce').map(m => m.token)).size;
  const klik = cs.filter(c => c.mensKliks.length), site = cs.filter(c => c.bezoek.length), calc = site.filter(c => c.berekend), afm = cs.filter(c => c.afgemeld || c.afm.length);
  return { n: tokens.size, bezorgd, bounce, klik: klik.length, site: site.length, calc: calc.length, afm: afm.length, cs };
}
const mailTrechter = c => trechter([['Verzonden', c.n, '#4A5158'], ['Bezorgd', c.bezorgd], ['Geklikt door een mens', c.klik], ['Op de site', c.site, KLEUR.volt], ['Berekening gemaakt', c.calc, KLEUR.volt], ['Afgemeld', c.afm, KLEUR.rood, 1], ['Bounce', c.bounce, KLEUR.rood, 1]]);
function paginaStats(sel) {
  const m = new Map(), get = k => { let r = m.get(k); if (!r) { r = { k, views: 0, anon: 0, ses: new Set(), tijden: [], depths: [], in: 0, uit: 0, kliks: 0, lcp: [] }; m.set(k, r); } return r; };
  for (const s of sel.S) { s.views.forEach((v, i) => { const r = get(v.naam); r.views++; r.ses.add(s.id); r.kliks += v.kliks; if (v.leave) { r.tijden.push(v.sec); r.depths.push(v.depth); } if (i === 0) r.in++; if (i === s.views.length - 1) r.uit++; }); for (const p of s.perf) if (p.p.lcp) get(paginaNaam(p.p.p || p.page, null)).lcp.push(+p.p.lcp); }
  for (const e of sel.A) { const r = get(e.naam); r.views++; r.anon++; }
  for (const e of sel.AL) { const r = get(paginaNaam(e.p.p || e.page, e.p.hash)); r.tijden.push(Math.min(+e.p.sec || 0, 3600)); r.depths.push(+e.p.depth || 0); }
  for (const e of sel.AP) if (e.p.lcp) get(paginaNaam(e.p.p || e.page, null)).lcp.push(+e.p.lcp);
  return [...m.values()].filter(r => r.views).sort((a, b) => b.views - a.views);
}
const snelTag = (v, goed, matig, alsGetal) => v == null ? '<span class="dun">–</span>' : `<span class="tag ${v <= goed ? 'goed' : v <= matig ? 'let' : 'fout'}">${alsGetal ? v.toFixed(2).replace('.', ',') : msTekst(v)}</span>`;

/* Laatste activiteit: wat er echt toe doet, nieuwste eerst */
function activiteit(sel, max = 14) {
  const items = [];
  for (const s of sel.S) if (s.contact || s.views.length > 1 || s.doelen.size) items.push({ t: s.start, k: s.contact ? KLEUR.oranje : KLEUR.blue, o: 's:' + s.id, w: `<b>${esc(wieNaam(s))}</b> bezocht ${s.views.length} ${s.views.length === 1 ? 'pagina' : "pagina's"}`, r: duur(s.sec) });
  for (const r of sel.R) items.push({ t: r.t, k: r.goedkoper === 'e' ? KLEUR.volt : KLEUR.oranje, o: 'r:' + r.id, w: `<b>Berekening</b> ${esc(VT[r.vt] || r.vt)}${r.contact ? ' · ' + esc(r.contact.naamKort) : ''}`, r: r.verschil == null ? '' : (r.goedkoper === 'd' ? 'diesel ' : 'elektrisch ') + euro(Math.abs(r.verschil)) });
  for (const k of sel.KM) items.push({ t: k.t, k: KLEUR.oranje, o: 'k:' + k.id, w: `<b>${esc(k.contact ? k.contact.naamKort : 'Onbekend')}</b> klikte in de mail op ${esc(linkNaam(k.link))}`, r: '' });
  for (const a of sel.AFM) { const c = a.token && D.CONTACT.get(a.token); items.push({ t: a.t, k: KLEUR.rood, o: c ? 'c:' + c.token : null, w: `<b>${esc(c ? c.naamKort : a.email || 'Iemand')}</b> meldde zich af`, r: '' }); }
  for (const b of D.BATCH.values()) if (X.B.in(b)) items.push({ t: b.t1, k: '#4A5158', o: 'v:' + b.key, w: `<b>${nf.format(b.mails.length)} mails</b> verzonden via ${esc(dienstNaam(b.dienst))}`, r: '' });
  for (const a of D.AANVR) if (X.B.in(a)) items.push({ t: a.t, k: KLEUR.volt, o: 'a:' + a.id, w: `<b>${esc(a.company)}</b> vroeg een vlootanalyse aan`, r: '' });
  items.sort((a, b) => b.t - a.t);
  return items.length ? `<div class="feed">${items.slice(0, max).map(i => `<a ${i.o ? `data-open="${esc(i.o)}"` : ''}><span class="t">${esc(fKort(i.t))}</span><span class="w"><i class="punt" style="background:${i.k}"></i>${i.w}</span><span class="sub">${esc(i.r)}</span></a>`).join('')}</div>` : leeg('Nog niets gebeurd in deze periode');
}
/* De grote grafiek op het overzicht, met keuze wat je ziet */
function verloop() {
  const { B, S, A, R: Rk, V, K, vorig } = X, lab = B.b;
  const vorigeReeks = (items, f) => { if (B.vs == null) return null; const sh = B.n, r = Array(lab.length).fill(0); for (const x of items) { const i = B.ix({ d: x.d + sh, h: x.h }); if (i >= 0 && i < r.length) r[i] += f ? f(x) : 1; } return r; };
  let series, vr;
  if (U.metric === 'sessies') { series = BRONNEN.map(([k, n, c]) => ({ naam: n, kleur: c, vals: reeks(B, S.filter(s => s.bronSoort === k)) })); vr = vorigeReeks(vorig.S); }
  else if (U.metric === 'berekeningen') { series = [{ naam: 'Elektrisch goedkoper', kleur: KLEUR.volt, vals: reeks(B, Rk.filter(r => r.goedkoper === 'e')) }, { naam: 'Diesel goedkoper of gelijk', kleur: KLEUR.oranje, vals: reeks(B, Rk.filter(r => r.goedkoper !== 'e')) }]; vr = vorigeReeks(vorig.R); }
  else if (U.metric === 'mail') { series = [{ naam: 'Kliks van mensen', kleur: KLEUR.volt, vals: reeks(B, K.filter(k => k.soort === 'mens')) }, { naam: 'Scanners', kleur: KLEUR.grijs, vals: reeks(B, K.filter(k => k.soort === 'scanner')) }, { naam: 'Intern of test', kleur: KLEUR.licht, vals: reeks(B, K.filter(k => k.soort === 'intern' || k.soort === 'test')) }]; }
  else { series = [{ naam: 'Met cookies', kleur: KLEUR.volt, vals: reeks(B, X.views) }, { naam: 'Zonder cookies', kleur: KLEUR.voltM, vals: reeks(B, A) }]; vr = vorigeReeks([...vorig.views, ...vorig.A]); }
  const vz = U.metric === 'mail' ? reeks(B, V) : null;
  return staven({ labels: lab, series, klik: true, h: 330, extra: i => [...(vr ? [[B.vs.replace(/^de /, '').replace(/^./, c => c.toUpperCase()), nf.format(vr[i])]] : []), ...(vz ? [['Mails verzonden', nf.format(vz[i])]] : [])] }) + legenda(series.map(s => [s.naam, s.kleur]));
}

/* ===================== Overzicht ===================== */
SCHERMEN.overzicht = { titel: 'Overzicht', html() {
  const { B, S, A, R: Rk, V, KM, vorig } = X, k = kpiVan(X), kv = kpiVan(vorig), mc = mailCijfers(V);
  const aanvr = D.AANVR.filter(B.in).length + S.filter(s => s.doelen.has('aanvraag')).length, aanvrV = D.AANVR.filter(B.vorig).length + vorig.S.filter(s => s.doelen.has('aanvraag')).length;
  return `<section class="kpis">
    ${kpi('Bezoekers', nf.format(k.bezoekers), { d: [k.bezoekers, kv.bezoekers], spark: reeksUniek(B, S, s => s.vid), ga: 'bezoekers', sub: k.sessies + ' sessies' })}
    ${kpi('Weergaven', nf.format(k.views), { d: [k.views, kv.views], spark: reeks(B, alleViews(X)), ga: 'verkeer' })}
    ${kpi('Berekeningen', nf.format(k.calc), { d: [k.calc, kv.calc], spark: reeks(B, Rk), ga: 'berekeningen', sub: Rk.length ? pct(Rk.filter(r => r.goedkoper === 'e').length, Rk.length) + ' elektrisch' : '' })}
    ${kpi('Mails verzonden', nf.format(mc.n), { d: [k.mails, kv.mails], spark: reeks(B, V), ga: 'verzendingen', sub: mc.n ? pct(mc.bounce, mc.n, 1) + ' bounce' : '', kleur: '#4A5158' })}
    ${kpi('Klikkers uit mail', nf.format(k.mensKliks), { d: [k.mensKliks, kv.mensKliks], spark: reeks(B, KM), ga: 'kliks', sub: mc.n ? pct(mc.klik, mc.n, 1) + ' van ontvangers' : '', kleur: KLEUR.oranje })}
    ${kpi('Aanvragen', nf.format(aanvr), { d: [aanvr, aanvrV], ga: 'aanvragen', sub: S.filter(s => s.doelen.has('vlootklik')).length + ' kliks naar vlootanalyse' })}
  </section>
  <div class="g21">
    ${kaart('Verloop', verloop(), { acties: segU('metric', [['weergaven', 'Weergaven'], ['sessies', 'Sessies'], ['berekeningen', 'Berekeningen'], ['mail', 'Mailkliks']]) })}
    ${kaart('Laatste activiteit', activiteit(X, 11))}
  </div>
  <div class="g2">
    ${kaart('Van bezoek tot aanvraag', trechter(siteTrechter(S)), { sub: 'sessies met cookies', acties: '<a class="knop mini" href="#/trechter">Trechter</a>' })}
    ${kaart('Van mail tot berekening', mc.n ? mailTrechter(mc) : leeg('Geen mails verzonden in deze periode'), { sub: 'ontvangers', acties: '<a class="knop mini" href="#/campagne">Campagne</a>' })}
  </div>
  <div class="g3">
    ${kaart("Populairste pagina's", balken(tel(alleViews(X), v => v.naam), { max: 8, open: k => 'p:' + k }), { acties: '<a class="knop mini" href="#/paginas">Alle</a>' })}
    ${kaart('Waar ze vandaan komen', balken(tel([...S, ...A], x => x.bron), { max: 8, dim: 'bron' }), { acties: '<a class="knop mini" href="#/herkomst">Herkomst</a>' })}
    ${kaart('Wanneer', weekRooster(alleViews(X)))}
  </div>`;
} };

/* ===================== Verkeer ===================== */
SCHERMEN.verkeer = { titel: 'Verkeer', html() {
  const { B, S, A, vorig } = X, k = kpiVan(X), kv = kpiVan(vorig), lab = B.b;
  const perKanaal = BRONNEN.map(([key, n, c]) => ({ naam: n, kleur: c, vals: reeks(B, S.filter(s => s.bronSoort === key)) }));
  const nieuw = S.filter(s => s.n != null && s.n <= 1).length, terug = S.filter(s => s.n > 1).length;
  // Week op week over alles wat geladen is
  const al = selectie(() => true), nu = dagNr(Date.now()), w0 = nu - weekdag(nu), weken = [];
  for (let i = 0; i < 10; i++) { const a = w0 - i * 7, b = a + 6, f = x => x.d >= a && x.d <= b; const s = al.S.filter(f); weken.push({ a, views: som(s, x => x.views.length) + al.A.filter(f).length, ses: s.length, bez: uniek(s, x => x.vid), calc: al.R.filter(f).length, mails: al.V.filter(f).length, kliks: uniek(al.KM.filter(f), x => x.token), lopend: i === 0 }); }
  while (weken.length > 1 && !weken[weken.length - 1].views && !weken[weken.length - 1].mails) weken.pop();
  const wd = (key, i) => { const v = weken[i + 1]; if (!v || !v[key] || weken[i].lopend) return ''; const d = (weken[i][key] - v[key]) / v[key]; return ` <span class="${d >= 0 ? 'op' : 'neer'}" style="font-size:11.5px">${d >= 0 ? '▲' : '▼'}${Math.abs(Math.round(d * 100))}%</span>`; };
  const wk = (t, key) => ({ t, r: true, nw: true, v: r => r[key], h: r => nf.format(r[key]) + wd(key, weken.indexOf(r)) });
  const consent = D.EV.filter(e => e.ev === 'consent' && B.in(e) && !e.intern && e.ua !== 'bot' && !e.p.wd && e.p.via === 'banner');
  return `<section class="kpis">
    ${kpi('Weergaven', nf.format(k.views), { d: [k.views, kv.views], spark: reeks(B, alleViews(X)) })}
    ${kpi('Sessies', nf.format(k.sessies), { d: [k.sessies, kv.sessies], spark: reeks(B, S) })}
    ${kpi('Bezoekers', nf.format(k.bezoekers), { d: [k.bezoekers, kv.bezoekers], spark: reeksUniek(B, S, s => s.vid) })}
    ${kpi('Tijd per sessie', duur(k.sesTijd), { d: [k.sesTijd, kv.sesTijd] })}
    ${kpi('Tijd per pagina', duur(k.tijd), { d: [k.tijd, kv.tijd] })}
    ${kpi('Na 1 pagina weg', Math.round(k.bounce * 100) + '%', { d: [k.bounce, kv.bounce, true] })}
  </section>
  ${kaart('Paginaweergaven', staven({ labels: lab, klik: true, h: 240, series: [{ naam: 'Met cookies', kleur: KLEUR.volt, vals: reeks(B, X.views) }, { naam: 'Zonder cookies', kleur: KLEUR.voltM, vals: reeks(B, A) }], extra: i => [['Sessies', nf.format(reeks(B, S)[i])]] }) + legenda([['Met cookies', KLEUR.volt], ['Zonder cookies', KLEUR.voltM]]), { sub: nf.format(k.views) + ' in ' + B.naam.toLowerCase() })}
  <div class="g21">
    ${kaart('Sessies per kanaal', staven({ labels: lab, klik: true, series: perKanaal }) + legenda(BRONNEN.map(b => [b[1], b[2]])))}
    ${kaart('Nieuw of terug', balken([['Eerste bezoek', nieuw], ['Terugkerend', terug]], { leeg: 'Geen sessies' }) + '<h3>Cookiekeuze in de melding</h3>' + balken([['Akkoord met statistieken', consent.filter(e => e.p.stat).length], ['Geweigerd', consent.filter(e => !e.p.stat).length]], { kleurVan: k => k === 'Geweigerd' ? KLEUR.grijs : KLEUR.volt, leeg: 'Geen keuzes in deze periode' }))}
  </div>
  ${kaart('Week op week', tabel({ id: 'weken', rows: weken, per: 12, cols: [{ t: 'Week van', nw: true, v: r => r.a, h: r => dagLabel(r.a) + (r.lopend ? ' <span class="tag">loopt nog</span>' : '') }, wk('Weergaven', 'views'), wk('Sessies', 'ses'), wk('Bezoekers', 'bez'), wk('Berekeningen', 'calc'), wk('Mails verzonden', 'mails'), wk('Klikkers uit mail', 'kliks')] }), { sub: 'los van de gekozen periode' })}
  <div class="g3">
    ${kaart('Wanneer', weekRooster(alleViews(X)))}
    ${kaart('Apparaat', balken(tel([...S, ...A], x => x.app), { dim: 'apparaat' }) + '<h3>Scherm</h3>' + balken(tel([...S.map(s => s.vw), ...A.map(e => e.p.vw)], schermNaam), { dim: 'scherm' }))}
    ${kaart('Land', balken(tel([...S, ...A], x => landNaam(x.land)), { max: 9, dim: 'land' }))}
  </div>`;
} };

/* ===================== Pagina's ===================== */
SCHERMEN.paginas = { titel: "Pagina's", html() {
  const rijen = paginaStats(X), { S } = X, max = Math.max(1, ...rijen.map(r => r.views));
  const SC = [['0–25%', '#D7EDE2'], ['25–50%', '#9BCBB4'], ['50–75%', '#4FA884'], ['75–100%', '#07734A']];
  return tabelKaart("Alle pagina's", { id: 'paginas', rows: rijen, sort: '-1', per: 40, zoek: r => r.k, open: r => 'p:' + r.k, cols: [
      { t: 'Pagina', v: r => r.k, h: r => `<span class="hfd">${esc(r.k)}</span>` },
      { t: 'Weergaven', r: true, nw: true, v: r => r.views, h: r => `<span class="inbalk" style="width:${Math.round(60 * r.views / max)}px"></span>${nf.format(r.views)}` },
      { t: 'Zonder cookies', r: true, v: r => r.anon, h: r => r.anon ? nf.format(r.anon) : '' }, { t: 'Sessies', r: true, v: r => r.ses.size, h: r => nf.format(r.ses.size) },
      { t: 'Gem. tijd', r: true, nw: true, v: r => gem(r.tijden), h: r => r.tijden.length ? duur(gem(r.tijden)) : '–' }, { t: 'Mediaan', r: true, nw: true, v: r => mediaan(r.tijden), h: r => r.tijden.length ? duur(mediaan(r.tijden)) : '–' },
      { t: 'Gescrold', r: true, v: r => gem(r.depths), h: r => r.depths.length ? Math.round(gem(r.depths)) + '%' : '–' }, { t: 'Kliks', r: true, v: r => r.kliks, h: r => r.kliks || '' },
      { t: 'Instap', r: true, v: r => r.in, h: r => r.in || '' }, { t: 'Laatste pagina', r: true, tip: 'Deel van de sessies dat hier eindigde', v: r => r.ses.size ? r.uit / r.ses.size : null, h: r => pct(r.uit, r.ses.size) },
      { t: 'Laadtijd', r: true, tip: 'Grootste deel zichtbaar (LCP), 75e percentiel', v: r => kwantiel(r.lcp, .75), h: r => snelTag(kwantiel(r.lcp, .75), 2500, 4000) }] })
  + `<div class="g2">
    ${kaart('Gemiddelde tijd per pagina', balken(rijen.filter(r => r.tijden.length).map(r => [r.k, gem(r.tijden), r.tijden.length + ' metingen']).sort((a, b) => b[1] - a[1]), { max: 12, fmt: duur, open: k => 'p:' + k }))}
    ${kaart('Hoe ver ze scrollen', stapel(rijen.filter(r => r.depths.length).map(r => { const v = [0, 0, 0, 0]; for (const d of r.depths) v[d >= 75 ? 3 : d >= 50 ? 2 : d >= 25 ? 1 : 0]++; return [r.k, v]; }), SC, { max: 12 }))}
  </div><div class="g2">
    ${kaart('Instappagina', balken(rijen.map(r => [r.k, r.in]).sort((a, b) => b[1] - a[1]), { max: 8, dim: 'instap' }))}
    ${kaart('Laatste pagina', balken(rijen.map(r => [r.k, r.uit, pct(r.uit, r.ses.size) + ' van wie er kwam']).sort((a, b) => b[1] - a[1]), { max: 8, open: k => 'p:' + k }))}
  </div><div class="g2">
    ${kaart('Onderwerpen in de overstapgids', balken(rijen.filter(r => r.k.startsWith('Gids · ')).map(r => [r.k.slice(7), r.views]), { max: 14, pct: false, open: k => 'p:Gids · ' + k }))}
    ${kaart('Modellen bekeken of gebruikt', balken(tel(S.flatMap(s => s.ev.filter(e => e.ev === 'model_open' || e.ev === 'model_apply')), e => (e.p.id || '').replace(/-/g, ' ')), { max: 14, pct: false }))}
  </div>`;
} };

/* ===================== Gedrag ===================== */
SCHERMEN.gedrag = { titel: 'Gedrag', html() {
  const { S } = X;
  const top = tel(S.flatMap(s => s.route), x => x).slice(0, 9).map(x => x[0]), kol = [...top, 'Weg'], grid = top.map(() => kol.map(() => 0));
  for (const s of S) s.route.forEach((p, i) => { const a = top.indexOf(p); if (a < 0) return; const b = i + 1 < s.route.length ? top.indexOf(s.route[i + 1]) : kol.length - 1; if (b >= 0) grid[a][b]++; });
  const routes = tel(S.filter(s => s.views.length), s => s.route.length > 5 ? s.route.slice(0, 5).join(' → ') + ' → …' : s.route.join(' → '));
  const ac = new Map(); for (const s of S) for (const e of s.evs) if (ACTIES[e]) ac.set(e, (ac.get(e) || 0) + 1);
  const kl = S.flatMap(s => s.ev.filter(e => e.ev === 'klik').map(e => ({ e, s }))), km = new Map();
  for (const { e, s } of kl) { const p = paginaNaam(e.p.p || e.page), el = e.p.el || e.p.id || e.p.tag, key = p + '|' + el; let x = km.get(key); if (!x) { x = { p, el, n: 0, ses: new Set(), yp: [] }; km.set(key, x); } x.n++; x.ses.add(s.id); if (e.p.yp != null) x.yp.push(+e.p.yp); }
  const hb = Array(10).fill(0); for (const { e } of kl) if (e.p.yp != null) hb[Math.min(9, Math.floor(+e.p.yp / 10))]++;
  const evs = n => S.flatMap(s => s.ev.filter(e => e.ev === n));
  return `<div class="g2">
    ${kaart('Tijd per sessie', histogram(S.map(s => s.sec), [['<10 s', 10], ['10–30 s', 30], ['30 s–1 m', 60], ['1–3 m', 180], ['3–10 m', 600], ['10–30 m', 1800], ['30 m+', Infinity]], { naam: 'Sessies', labelBreedte: 40 }))}
    ${kaart("Pagina's per sessie", histogram(S.map(s => s.views.length), [['1', 2], ['2', 3], ['3', 4], ['4', 5], ['5–6', 7], ['7–9', 10], ['10–19', 20], ['20+', Infinity]], { naam: 'Sessies' }))}
  </div>
  ${kaart('Van pagina naar pagina', rooster({ rijen: top, kolommen: kol, grid, links: 150, cel: 28, waarden: true, kortKol: true, leeg: 'Geen sessies', tip: (i, j, v) => `<b>${esc(top[i])} → ${esc(kol[j])}</b><br>${nf.format(v)} keer` }))}
  <div class="g2">
    ${kaart('Meest gevolgde routes', routes.length ? routes.slice(0, 14).map(([k, v]) => `<div class="br breed"><div class="k" title="${esc(k)}">${esc(k)}</div><div class="v">${nf.format(v)}</div></div>`).join('') : leeg('Geen sessies'))}
    ${kaart('Wat ze doen', balken([...ac].sort((a, b) => b[1] - a[1]).map(([k, v]) => [ACTIES[k], v]), { max: 16, tot: S.length }), { sub: 'deel van de sessies' })}
  </div>
  <div class="g21">
    ${tabelKaart('Waar ze op klikken', { id: 'klikel', rows: [...km.values()], sort: '-2', per: 25, hoog: true, zoek: r => r.p + ' ' + r.el, leeg: 'Geen kliks gemeten', cols: [{ t: 'Pagina', v: r => r.p }, { t: 'Element', v: r => r.el, kl: 'smal', h: r => `<span title="${esc(r.el)}">${esc(kort(r.el, 60))}</span>` }, { t: 'Kliks', r: true, v: r => r.n }, { t: 'Sessies', r: true, v: r => r.ses.size }, { t: 'Hoogte', r: true, tip: 'Mediaan: hoe ver op de pagina (0% is bovenaan)', v: r => mediaan(r.yp), h: r => r.yp.length ? Math.round(mediaan(r.yp)) + '%' : '–' }] })}
    ${kaart('Hoogte van kliks', staven({ labels: hb.map((_, i) => ({ kort: i * 10 + '%', label: `${i * 10}–${i * 10 + 10}% van de pagina` })), series: [{ naam: 'Kliks', kleur: KLEUR.volt, vals: hb }], h: 200, labelBreedte: 44, leeg: 'Geen kliks gemeten' }))}
  </div>
  <div class="g3">
    ${kaart('Frustratiekliks', balken(tel(evs('rage'), e => paginaNaam(e.p.p || e.page) + ' · ' + (e.p.el || '?')), { pct: false, leeg: 'Geen' }))}
    ${kaart('Externe links', balken(tel(evs('outbound'), e => e.p.host), { pct: false, leeg: 'Geen' }))}
    ${kaart('Vragen opengeklapt', balken(tel(evs('details_open'), e => e.p.q), { pct: false, max: 8, leeg: 'Geen' }))}
  </div>`;
} };

/* ===================== Herkomst ===================== */
SCHERMEN.herkomst = { titel: 'Herkomst', html() {
  const { S, A } = X, per = groep(S, s => s.bron), anonPer = new Map(tel(A, e => e.bron));
  const rijen = [...new Set([...per.keys(), ...anonPer.keys()])].map(b => { const s = per.get(b) || []; return { b, ses: s.length, bez: uniek(s, x => x.vid), anon: anonPer.get(b) || 0, bounce: s.length ? s.filter(x => x.views.length <= 1).length / s.length : null, tijd: gem(s, x => x.sec), pag: gem(s, x => x.views.length), calc: s.filter(x => x.doelen.has('berekening')).length, vloot: s.filter(x => x.doelen.has('vlootklik') || x.doelen.has('aanvraag')).length }; });
  const inst = new Map(); for (const s of S) if (s.instap) { if (!inst.has(s.instap)) inst.set(s.instap, [0, 0, 0, 0]); inst.get(s.instap)[BRONNEN.findIndex(x => x[0] === s.bronSoort)]++; }
  const ir = [...inst].sort((a, b) => som(b[1]) - som(a[1])).slice(0, 10);
  return tabelKaart('Per bron', { id: 'bronnen', rows: rijen, sort: '-1', per: 20, zoek: r => r.b, cols: [
      { t: 'Bron', v: r => r.b, h: r => `<a class="ent" data-dim="bron" data-w="${esc(r.b)}">${esc(r.b)}</a>` }, { t: 'Sessies', r: true, v: r => r.ses }, { t: 'Bezoekers', r: true, v: r => r.bez }, { t: 'Weergaven zonder cookies', r: true, v: r => r.anon, h: r => r.anon ? nf.format(r.anon) : '' },
      { t: 'Na 1 pagina weg', r: true, v: r => r.bounce, h: r => r.bounce == null ? '–' : Math.round(r.bounce * 100) + '%' }, { t: 'Tijd per sessie', r: true, nw: true, v: r => r.tijd, h: r => r.ses ? duur(r.tijd) : '–' }, { t: "Pagina's", r: true, v: r => r.pag, h: r => r.ses ? n1(r.pag) : '–' },
      { t: 'Berekening', r: true, v: r => r.ses ? r.calc / r.ses : null, h: r => r.ses ? `${r.calc} <span class="dun">· ${pct(r.calc, r.ses)}</span>` : '–' }, { t: 'Vlootanalyse', r: true, v: r => r.vloot, h: r => r.vloot || '' }] })
  + `<div class="g2">
    ${kaart('Kanaal', balken(tel([...S, ...A], x => KANAAL[x.bronSoort]), { dim: 'kanaal', kleurVan: k => (BRONNEN.find(b => b[1] === k) || [])[2] }))}
    ${kaart('Verwijzende sites', balken(tel([...S.map(s => s.ref), ...A.map(e => e.p.ref)], x => x ? x.replace(/^www\./, '') : null), { max: 12, pct: false, leeg: 'Alleen direct verkeer' }))}
  </div><div class="g3">
    ${kaart('Land', balken(tel([...S, ...A], x => landNaam(x.land)), { max: 12, dim: 'land' }))}
    ${kaart('Taal van de browser', balken(tel(S, s => s.lang ? s.lang.slice(0, 2).toUpperCase() : null), { max: 8, dim: 'taal' }) + '<h3>Taal van de site</h3>' + balken(tel([...S.flatMap(s => s.ev.filter(e => e.ev === 'page_view')), ...A], e => e.p.taal ? (e.p.taal === 'en' ? 'Engels' : 'Nederlands') : null), { max: 3 }))}
    ${kaart('Campagne', balken(tel(S.filter(s => s.camp), s => s.camp), { pct: false, leeg: 'Geen' }) + '<h3>Tijdzone</h3>' + balken(tel(S, s => s.tz), { max: 6 }))}
  </div>
  ${kaart('Instappagina per kanaal', rooster({ rijen: ir.map(r => r[0]), kolommen: BRONNEN.map(b => b[1]), grid: ir.map(r => r[1]), links: 150, cel: 28, waarden: true, leeg: 'Geen sessies' }))}`;
} };

/* ===================== Techniek ===================== */
SCHERMEN.techniek = { titel: 'Apparaat en snelheid', html() {
  const { S, A, AP } = X, P = [...S.flatMap(s => s.perf), ...AP], m = groep(P, e => paginaNaam(e.p.p || e.page, null));
  const q = (arr, k) => kwantiel(arr.map(x => x.p[k]).filter(x => x != null).map(Number), .75);
  const rijen = [...m].map(([k, a]) => ({ k, n: a.length, ttfb: q(a, 'ttfb'), lcp: q(a, 'lcp'), inp: q(a, 'inp'), cls: q(a, 'cls'), load: q(a, 'load') }));
  const fm = new Map(); for (const e of S.flatMap(s => s.ev.filter(x => x.ev === 'js_error'))) { const k = (e.p.m || '?') + (e.p.src ? ' · ' + e.p.src + ':' + (e.p.line || '') : ''); const x = fm.get(k) || { k, n: 0, t: e.t, ses: new Set() }; x.n++; x.ses.add(e.sid); if (e.t > x.t) x.t = e.t; fm.set(k, x); }
  const lcp = P.map(p => +p.p.lcp).filter(Boolean);
  return `<section class="kpis k4">
    ${kpi('Grootste deel zichtbaar', msTekst(kwantiel(lcp, .75)), { sub: 'LCP, 75e percentiel', tip: 'Goed is onder 2,5 seconde' })}
    ${kpi('Reactie op een klik', msTekst(q(P, 'inp')), { sub: 'INP, 75e percentiel', tip: 'Goed is onder 200 ms' })}
    ${kpi('Server', msTekst(q(P, 'ttfb')), { sub: 'TTFB, 75e percentiel' })}
    ${kpi('Metingen', nf.format(P.length), { sub: pct(lcp.filter(v => v <= 2500).length, lcp.length) + ' snel genoeg' })}
  </section><div class="g3">
    ${kaart('Type', balken(tel([...S, ...A], x => x.app), { dim: 'apparaat' }) + '<h3>Schermbreedte</h3>' + balken(tel([...S.map(s => s.vw), ...A.map(e => e.p.vw)], schermNaam), { dim: 'scherm' }))}
    ${kaart('Browser', balken(tel([...S, ...A], x => x.browser), { dim: 'browser' }) + '<h3>Systeem</h3>' + balken(tel([...S, ...A], x => x.os), { dim: 'os' }))}
    ${kaart('Scherm', balken(tel(S, s => s.dpr == null ? null : s.dpr >= 2 ? 'Scherp (2x of meer)' : s.dpr > 1 ? 'Geschaald' : 'Normaal')) + '<h3>Donkere modus</h3>' + balken(tel(S, s => s.dark == null ? null : s.dark ? 'Donker' : 'Licht')) + '<h3>Verbinding</h3>' + balken(tel(S, s => s.net ? s.net.toUpperCase() : null)))}
  </div>
  ${tabelKaart('Laadsnelheid per pagina', { id: 'snelheid', rows: rijen, sort: '-1', leeg: 'Geen metingen', cols: [{ t: 'Pagina', v: r => r.k }, { t: 'Metingen', r: true, v: r => r.n }, { t: 'Server (TTFB)', r: true, v: r => r.ttfb, h: r => snelTag(r.ttfb, 800, 1800) }, { t: 'Grootste deel (LCP)', r: true, v: r => r.lcp, h: r => snelTag(r.lcp, 2500, 4000) }, { t: 'Reactie (INP)', r: true, v: r => r.inp, h: r => snelTag(r.inp, 200, 500) }, { t: 'Verspringen (CLS)', r: true, v: r => r.cls, h: r => snelTag(r.cls, .1, .25, true) }, { t: 'Volledig geladen', r: true, v: r => r.load, h: r => msTekst(r.load) }] }, { sub: '75e percentiel' })}
  <div class="g2">
    ${kaart('Grootste deel zichtbaar (LCP)', histogram(lcp, [['<1 s', 1000], ['1–1,5 s', 1500], ['1,5–2,5 s', 2500], ['2,5–4 s', 4000], ['4–6 s', 6000], ['6 s+', Infinity]], { kleuren: [['Goed', KLEUR.volt, i => i < 3], ['Matig', '#C98A12', i => i === 3], ['Traag', KLEUR.rood, i => i > 3]], labelBreedte: 50, leeg: 'Geen metingen' }) + legenda([['Goed', KLEUR.volt], ['Matig', '#C98A12'], ['Traag', KLEUR.rood]]))}
    ${tabelKaart('Fouten op de site', { id: 'fouten', rows: [...fm.values()], sort: '-0', per: 10, leeg: 'Geen fouten', cols: [{ t: 'Laatst', nw: true, v: r => +r.t, h: r => fKort(r.t) }, { t: 'Melding', v: r => r.k, h: r => `<span style="overflow-wrap:anywhere">${esc(r.k)}</span>` }, { t: 'Aantal', r: true, v: r => r.n }, { t: 'Sessies', r: true, v: r => r.ses.size }] })}
  </div>`;
} };

/* ===================== Berekeningen ===================== */
const reeksWie = r => r.contact ? `<span class="hfd">${esc(r.contact.naamKort)}</span>` : r.ses ? `<span class="dun">Bezoeker ${esc(r.ses.vid.slice(0, 8))}</span>` : '<span class="dun">Zonder cookies</span>';
function paarBalken(rijen, fmt = euro, namen = ['Diesel', 'Elektrisch'], kleuren = [KLEUR.oranje, KLEUR.volt]) { // [label, links, rechts]
  rijen = rijen.filter(r => r[1] || r[2]); if (!rijen.length) return leeg();
  const max = Math.max(...rijen.flatMap(r => [r[1], r[2]]));
  return rijen.map(([k, d, e]) => `<div class="br" data-tip="${esc(tipTabel(k, [[namen[0], fmt(d), kleuren[0]], [namen[1], fmt(e), kleuren[1]], ['Verschil', fmt(d - e)]]))}"><div class="k">${esc(k)}</div><div style="display:grid;gap:2px"><div class="tr" style="height:6px"><i style="width:${(100 * d / max).toFixed(1)}%;background:${kleuren[0]}"></i></div><div class="tr" style="height:6px"><i style="width:${(100 * e / max).toFixed(1)}%;background:${kleuren[1]}"></i></div></div><div class="v">${esc(fmt(d))}<small>${esc(fmt(e))}</small></div></div>`).join('') + legenda([[namen[0], kleuren[0]], [namen[1], kleuren[1]]]);
}
SCHERMEN.berekeningen = { titel: 'Berekeningen', html() {
  const { B, R: Rk, vorig } = X, n = Rk.length, e = Rk.filter(r => r.goedkoper === 'e'), metUit = Rk.filter(r => r.laatste.uitkomst && r.laatste.uitkomst.diesel_jaar != null);
  const vs = Rk.map(r => r.verschil).filter(v => v != null), tv = metUit.map(r => r.laatste.uitkomst.terugverdien_jaar).filter(v => v != null);
  const gw = new Map(); for (const r of Rk) for (const k of r.gewijzigd) { const nm = veldNaam(k); if (nm) gw.set(nm, (gw.get(nm) || 0) + 1); }
  for (const [k, v] of gw) if (n >= 5 && v >= n * .95) gw.delete(k); // staat altijd in de lijst: zegt niets
  const kosten = KOSTEN.map(([k, nm]) => [nm, gem(metUit, r => (r.laatste.uitkomst.diesel || {})[k] || 0) || 0, gem(metUit, r => (r.laatste.uitkomst.elektrisch || {})[k] || 0) || 0]);
  const lijst = U.calcWie === 'bekend' ? Rk.filter(r => r.contact) : U.calcWie === 'cookies' ? Rk.filter(r => r.ses) : U.calcWie === 'diesel' ? Rk.filter(r => r.goedkoper === 'd') : U.calcWie === 'veel' ? Rk.filter(r => r.n >= 3) : Rk;
  return (D.beperkt ? '<div class="melding">De volledige invoer en uitkomst per berekening komen beschikbaar zodra de nieuwe gegevensfunctie in Supabase staat. Tot die tijd zie je hier de hoofdcijfers.</div>' : '') + `<section class="kpis">
    ${kpi('Berekeningen', nf.format(n), { d: [n, vorig.R.length], spark: reeks(B, Rk), sub: nf.format(som(Rk, r => r.n)) + ' standen bewaard' })}
    ${kpi('Elektrisch goedkoper', pct(e.length, n), { d: [n ? e.length / n : 0, vorig.R.length ? vorig.R.filter(r => r.goedkoper === 'e').length / vorig.R.length : 0], sub: `${e.length} van ${n}` })}
    ${kpi('Verschil per jaar', euro(mediaan(vs)), { sub: 'mediaan, voordeel elektrisch', tip: 'Positief: elektrisch is goedkoper' })}
    ${kpi('Kilometers per jaar', n0(mediaan(Rk.map(r => r.km).filter(v => v != null))), { sub: 'mediaan' })}
    ${kpi('Terugverdientijd', tv.length ? n1(mediaan(tv)) + '<small>jaar</small>' : '–', { sub: tv.length ? 'mediaan' : '' })}
    ${kpi('Met kenteken', pct(Rk.filter(r => r.kenteken).length, n), { sub: pct(Rk.filter(r => r.lease).length, n) + ' met lease' })}
  </section>
  <div class="g21">
    ${kaart('Berekeningen in de tijd', staven({ labels: B.b, klik: true, h: 230, series: [{ naam: 'Elektrisch goedkoper', kleur: KLEUR.volt, vals: reeks(B, e) }, { naam: 'Diesel goedkoper of gelijk', kleur: KLEUR.oranje, vals: reeks(B, Rk.filter(r => r.goedkoper !== 'e')) }] }) + legenda([['Elektrisch goedkoper', KLEUR.volt], ['Diesel goedkoper of gelijk', KLEUR.oranje]]))}
    ${kaart('Uitkomst per voertuig', stapel(Object.keys(VT).map(vt => [VT[vt], [Rk.filter(r => r.vt === vt && r.goedkoper === 'e').length, Rk.filter(r => r.vt === vt && r.goedkoper !== 'e').length]]), [['Elektrisch', KLEUR.volt], ['Diesel', KLEUR.oranje]], { dim: 'vt' }) + '<h3>Hoe uitgebreid</h3>' + balken(tel(Rk, r => r.modus === 'uitgebreid' ? 'Uitgebreid' : 'Simpel')) + '<h3>Wanneer bewaard</h3>' + balken([['Alleen het invulvenster', Rk.filter(r => r.n === 1).length], ['Daarna 1 of 2 keer aangepast', Rk.filter(r => r.n === 2 || r.n === 3).length], ['Vaker aangepast', Rk.filter(r => r.n > 3).length]]))}
  </div>
  <div class="g3">
    ${kaart('Kilometers per jaar', histogram(Rk.map(r => r.km).filter(v => v != null), [['<20', 20000], ['20–40', 40000], ['40–60', 60000], ['60–80', 80000], ['80–100', 100000], ['100–150', 150000], ['150+', Infinity]], { eenheid: '× 1.000 km', naam: 'Berekeningen', labelBreedte: 56 }), { sub: '× 1.000' })}
    ${kaart('Verschil per jaar', histogram(vs, [['< −20k', -20000], ['−20k', -10000], ['−10k', -5000], ['−5k', 0], ['0', 5000], ['5k', 10000], ['10k', 20000], ['20k+', Infinity]], { kleuren: [['Diesel goedkoper', KLEUR.oranje, i => i < 4], ['Elektrisch goedkoper', KLEUR.volt, i => i >= 4]], labelBreedte: 40 }) + legenda([['Diesel goedkoper', KLEUR.oranje], ['Elektrisch goedkoper', KLEUR.volt]]), { sub: '€, vanaf' })}
    ${kaart('Terugverdientijd', histogram(tv, [['<1', 1], ['1–2', 2], ['2–3', 3], ['3–5', 5], ['5–8', 8], ['8+', Infinity]], { eenheid: 'jaar', naam: 'Berekeningen', leeg: 'Nog niet beschikbaar' }), { sub: 'jaar' })}
  </div>
  <div class="g3">
    ${kaart('Wat ze aanpassen', balken([...gw].sort((a, b) => b[1] - a[1]), { max: 14, tot: n, leeg: 'Nog niet beschikbaar' }), { sub: 'deel van de berekeningen' })}
    ${kaart('Kosten per jaar, gemiddeld', metUit.length ? paarBalken(kosten) : leeg('Nog niet beschikbaar'))}
    ${kaart('Gekozen modellen', balken(tel(Rk.filter(r => r.modelNaam), r => r.modelNaam), { max: 8, pct: false, leeg: 'Geen model gekozen' }) + '<h3>Dieselvoertuig</h3>' + balken(tel(Rk, r => r.diesel ? (r.diesel === 'huidig' ? 'Huidige houden' : 'Nieuw') : null), { leeg: 'Nog niet beschikbaar' }) + '<h3>Merk via kenteken</h3>' + balken(tel(Rk, r => r.kentekenMerk), { max: 6, pct: false, leeg: 'Geen kenteken opgezocht' }))}
  </div>
  ${tabelKaart('Alle berekeningen', { id: 'reeksen', rows: lijst, sort: '-0', per: 40, open: r => 'r:' + r.id, zoek: r => [r.contact && r.contact.naamKort, VT[r.vt], r.modelNaam, r.bron, r.kentekenMerk].filter(Boolean).join(' '), leeg: 'Geen berekeningen in deze selectie', cols: [
      { t: 'Tijd', nw: true, v: r => +r.t, h: r => fKort(r.t) }, { t: 'Wie', nw: true, v: r => r.contact ? r.contact.naamKort : r.ses ? 'zz' + r.ses.vid : 'zzz', h: reeksWie }, { t: 'Voertuig', v: r => VT[r.vt] || r.vt },
      { t: 'Model', v: r => r.modelNaam, kl: 'smal', h: r => esc(r.modelNaam || '') }, { t: 'Km', r: true, v: r => r.km, h: r => n0(r.km) },
      { t: 'Diesel', r: true, nw: true, v: r => r.laatste.uitkomst.diesel_jaar, h: r => euro(r.laatste.uitkomst.diesel_jaar) }, { t: 'Elektrisch', r: true, nw: true, v: r => r.laatste.uitkomst.elektrisch_jaar, h: r => euro(r.laatste.uitkomst.elektrisch_jaar) },
      { t: 'Verschil', r: true, nw: true, v: r => r.verschil, h: r => `<span class="${r.verschil > 0 ? 'op' : r.verschil < 0 ? 'neer' : ''}">${euro(r.verschil)}</span>` }, { t: 'Goedkoper', v: r => r.goedkoper, h: r => tagUitkomst(r.goedkoper) },
      { t: 'Standen', r: true, tip: 'Hoe vaak de berekening is bewaard: na het invulvenster en na elke aanpassing', v: r => r.n }, { t: 'Bron', v: r => r.bron }, { t: 'Apparaat', v: r => r.app, h: r => esc(r.app || '–') }] },
    { acties: segU('calcWie', [['', 'Alle', Rk.length], ['cookies', 'Met sessie', Rk.filter(r => r.ses).length], ['bekend', 'Bekend bedrijf', Rk.filter(r => r.contact).length], ['diesel', 'Diesel wint', Rk.filter(r => r.goedkoper === 'd').length], ['veel', '3+ standen', Rk.filter(r => r.n >= 3).length]]) })}`;
} };

/* ===================== Trechter ===================== */
SCHERMEN.trechter = { titel: 'Trechter', html() {
  const { S } = X, wz = ['use', 'buy', 'sub', 'en', 'up'];
  const stappen = [['Op de calculator', S.filter(s => s.views.some(v => v.naam === 'Calculator' || v.naam === 'Uitgebreid')).length], ['Invulvenster geopend', S.filter(s => heeft(s, 'wizard_open')).length], ...wz.map(st => ['Stap ' + STAPPEN[st], S.filter(s => s.stappen.has(st)).length]), ['Berekening afgerond', S.filter(s => heeft(s, 'wizard_complete')).length],
    ['Uitgebreid bekeken', S.filter(s => s.doelen.has('uitgebreid')).length, KLEUR.voltM, 1], ['PDF, print of gedeeld', S.filter(s => s.doelen.has('pdf') || s.doelen.has('deel')).length, KLEUR.voltM, 1], ['Naar vlootanalyse geklikt', S.filter(s => s.doelen.has('vlootklik')).length, KLEUR.voltM, 1], ['Aanvraag verstuurd', S.filter(s => s.doelen.has('aanvraag')).length, KLEUR.voltM, 1]];
  const tijden = []; for (const s of S) { const a = s.ev.find(e => e.ev === 'wizard_open'), b = s.ev.find(e => e.ev === 'wizard_complete'); if (a && b && b.t > a.t) tijden.push((b.t - a.t) / 1000); }
  const per = (naam, f) => { const m = groep(S, f); return tabelKaart('Per ' + naam, { id: 'tr-' + naam, sort: '-1', per: 8, rows: [...m].map(([k, s]) => ({ k, n: s.length, c: s.filter(x => x.views.some(v => v.naam === 'Calculator' || v.naam === 'Uitgebreid')).length, w: s.filter(x => heeft(x, 'wizard_open')).length, b: s.filter(x => x.doelen.has('berekening')).length, v: s.filter(x => x.doelen.has('vlootklik') || x.doelen.has('aanvraag')).length })),
    cols: [{ t: naam[0].toUpperCase() + naam.slice(1), v: r => r.k }, { t: 'Sessies', r: true, v: r => r.n }, { t: 'Calculator', r: true, v: r => r.c / r.n, h: r => pct(r.c, r.n) }, { t: 'Invulvenster', r: true, v: r => r.w / r.n, h: r => pct(r.w, r.n) }, { t: 'Berekening', r: true, v: r => r.b / r.n, h: r => `<b>${pct(r.b, r.n)}</b> <span class="dun">· ${r.b}</span>` }, { t: 'Vlootanalyse', r: true, v: r => r.v / r.n, h: r => pct(r.v, r.n) }] }); };
  return `<div class="g21">
    ${kaart('Van calculator tot aanvraag', trechter(stappen), { sub: 'sessies met cookies' })}
    ${kaart('Afhaken in het invulvenster', balken(tel(S.flatMap(s => s.ev.filter(x => x.ev === 'wizard_close')), x => 'Bij ' + (STAPPEN[x.p.step] || x.p.step || '?')), { leeg: 'Niemand haakte af' }) + '<h3>Tijd in het invulvenster</h3>' + (tijden.length ? stats([[duur(mediaan(tijden)), 'mediaan'], [duur(kwantiel(tijden, .9)), 'traagste 10%'], [tijden.length, 'keer afgerond']]) : leeg('Nog niet afgerond')))}
  </div>
  <div class="g2">${per('kanaal', s => KANAAL[s.bronSoort])}${per('apparaat', s => s.app || 'Onbekend')}</div>
  <div class="g2">${per('instappagina', s => s.instap)}${per('bezoek', s => s.n == null ? null : s.n <= 1 ? 'Eerste bezoek' : 'Terugkerend')}</div>`;
} };

/* ===================== Bezoekers ===================== */
const doelTags = d => DOELEN.filter(([k]) => d.has(k) && k !== 'uitgebreid').map(([k, n]) => `<span class="tag ${k === 'aanvraag' || k === 'berekening' ? 'goed' : ''}">${esc(n.replace(' gemaakt', '').replace(' opgezocht', '').replace(' gebruikt', '').replace('Naar vlootanalyse geklikt', 'Vlootanalyse'))}</span>`).join(' ');
SCHERMEN.bezoekers = { titel: 'Bezoekers', html() {
  const { S, B, vorig } = X, vids = new Set(S.map(s => s.vid)), rijen = [...vids].map(v => D.BEZ.get(v)).filter(Boolean), inPer = new Map(); for (const s of S) inPer.set(s.vid, (inPer.get(s.vid) || 0) + 1);
  const nieuw = rijen.filter(b => B.in(b)).length;
  return `<section class="kpis k4">
    ${kpi('Bezoekers met cookies', nf.format(rijen.length), { d: [rijen.length, uniek(vorig.S, s => s.vid)], spark: reeksUniek(B, S, s => s.vid) })}
    ${kpi('Nieuw in deze periode', nf.format(nieuw), { sub: pct(nieuw, rijen.length) })}
    ${kpi('Kwamen vaker', nf.format(rijen.filter(b => b.ses.length > 1).length), { sub: pct(rijen.filter(b => b.ses.length > 1).length, rijen.length) })}
    ${kpi('Bekend bedrijf', nf.format(rijen.filter(b => b.contact).length), { sub: 'via de mailcampagne' })}
  </section>
  ${tabelKaart('Bezoekers', { id: 'bezoekers', rows: rijen, sort: F.wie === 'echt' ? '-2' : '-3', per: 50, open: b => 'b:' + b.vid, zoek: b => b.naam + ' ' + b.vid + ' ' + b.bron, leeg: 'Geen bezoekers met cookies in deze periode', cols: [
      { t: 'Bezoeker', nw: true, v: b => b.contact ? b.naam : 'zz' + b.vid, h: b => b.contact ? `<span class="hfd">${esc(b.naam)}</span>` : `<span class="dun">${esc(b.naam)}</span>` }, ...(F.wie === 'echt' ? [] : [{ t: 'Wie', nw: true, v: b => b.klasse, h: b => tagWie(b.klasse) + (b.reden ? ` <span class="sub">${esc(b.reden)}</span>` : '') }]),
      { t: 'Eerste bezoek', nw: true, v: b => +b.eerst, h: b => fKort(b.eerst) }, { t: 'Laatst gezien', nw: true, v: b => +b.laatst, h: b => fKort(b.laatst) }, { t: 'Sessies', r: true, v: b => b.ses.length, h: b => b.ses.length + (inPer.get(b.vid) !== b.ses.length ? ` <span class="dun">· ${inPer.get(b.vid)} nu</span>` : '') },
      { t: 'Weergaven', r: true, v: b => b.views }, { t: 'Tijd', r: true, nw: true, v: b => b.sec, h: b => duur(b.sec) }, { t: 'Berekeningen', r: true, v: b => b.reeksen.length, h: b => b.reeksen.length || '' },
      { t: 'Deed', v: b => b.doelen.size, h: b => doelTags(b.doelen) }, { t: 'Eerste bron', nw: true, v: b => b.bron }, { t: 'Apparaat', nw: true, v: b => (b.mobile ? 'Mobiel' : 'Desktop'), h: b => esc([b.mobile == null ? null : b.mobile ? 'Mobiel' : 'Desktop', b.browser].filter(Boolean).join(' · ') || '–') }, { t: 'Land', v: b => b.land, h: b => esc(b.land || '') }] })}`;
} };

/* ===================== Sessies ===================== */
SCHERMEN.sessies = { titel: 'Sessies', html() {
  const { S } = X, f = { '': () => true, calc: s => s.doelen.has('berekening'), mail: s => s.bronSoort === 'email', diep: s => s.views.length >= 3, lang: s => s.sec >= 120 }, lijst = S.filter(f[U.ses] || f['']);
  const nuGrens = Date.now() - 30 * 60000, actief = S.filter(s => +s.eind >= nuGrens);
  return (actief.length ? kaart('Nu op de site', `<div class="feed">${actief.map(s => `<a data-open="s:${s.id}"><span class="t">${fTijd(s.eind)}</span><span class="w"><i class="punt" style="background:${KLEUR.volt}"></i><b>${esc(wieNaam(s))}</b> · ${esc(s.views.length ? s.views[s.views.length - 1].naam : '')}</span><span class="sub">${s.views.length} p · ${duur(s.sec)}</span></a>`).join('')}</div>`, { sub: 'laatste 30 minuten' }) : '')
  + tabelKaart('Sessies', { id: 'sessies', rows: lijst, sort: '-0', per: 50, open: s => 's:' + s.id, zoek: s => [wieNaam(s), s.vid, s.bron, s.route.join(' '), s.land, s.browser].join(' '), leeg: 'Geen sessies met cookies in deze selectie', cols: [
      { t: 'Start', nw: true, v: s => +s.start, h: s => fKort(s.start) }, { t: 'Wie', nw: true, v: s => s.contact ? s.contact.naamKort : 'zz' + s.vid, h: s => wieHtml(s) + (F.wie === 'alles' ? ' ' + tagWie(s.klasse) : '') },
      { t: 'Tijd', r: true, nw: true, v: s => s.sec, h: s => duur(s.sec) }, { t: "Pagina's", r: true, v: s => s.views.length }, { t: 'Route', kl: 'route', h: s => esc(routeTekst(s)) },
      { t: 'Deed', v: s => s.doelen.size, h: s => doelTags(s.doelen) }, { t: 'Bron', nw: true, v: s => s.bron }, { t: 'Bezoek', r: true, v: s => s.n, h: s => s.n ? s.n + 'e' : '–' }, { t: 'Land', v: s => s.land, h: s => esc(s.land || '') }, { t: 'Apparaat', nw: true, v: s => s.app, h: s => esc([s.app, s.browser].filter(Boolean).join(' · ') || '–') }] },
    { acties: segU('ses', [['', 'Alle', S.length], ['calc', 'Met berekening', S.filter(f.calc).length], ['mail', 'Uit e-mail', S.filter(f.mail).length], ['diep', "3+ pagina's", S.filter(f.diep).length], ['lang', '2+ minuten', S.filter(f.lang).length]]) });
} };

/* ===================== Aanvragen en doelen ===================== */
SCHERMEN.aanvragen = { titel: 'Aanvragen en doelen', html() {
  const { S, B } = X, aan = D.AANVR.filter(B.in), sterk = S.filter(s => ['aanvraag', 'pdf', 'deel', 'vlootklik', 'kenteken'].some(d => s.doelen.has(d)));
  const kanalen = [...groep(S, s => KANAAL[s.bronSoort])].map(([k, s]) => ({ k, n: s.length, ...Object.fromEntries(DOELEN.map(([d]) => [d, s.filter(x => x.doelen.has(d)).length])) }));
  return `<section class="kpis">${[['Aanvragen vlootanalyse', aan.length + S.filter(s => s.doelen.has('aanvraag')).length], ...DOELEN.filter(([k]) => ['vlootklik', 'berekening', 'pdf', 'deel', 'kenteken'].includes(k)).map(([k, n]) => [n, S.filter(s => s.doelen.has(k)).length])].map(([l, n]) => kpi(l, nf.format(n), { sub: l.startsWith('Aanvragen') ? '' : pct(n, S.length) + ' van de sessies' })).join('')}</section>
  ${tabelKaart('Aanvragen voor een vlootanalyse', { id: 'aanvragen', rows: aan, sort: '-0', open: a => 'a:' + a.id, leeg: 'Nog geen aanvragen in deze periode', zoek: a => [a.company, a.contact_name, a.email].join(' '), cols: [{ t: 'Ontvangen', nw: true, v: a => +a.t, h: a => fKort(a.t) }, { t: 'Bedrijf', v: a => a.company, h: a => `<span class="hfd">${esc(a.company)}</span>` }, { t: 'Contact', v: a => a.contact_name }, { t: 'E-mail', v: a => a.email }, { t: 'Telefoon', v: a => a.phone }, { t: 'Vloot', v: a => a.fleet_size }, { t: 'Status', v: a => a.status, h: a => `<span class="tag ${a.status === 'nieuw' ? 'let' : a.status === 'afgerond' ? 'goed' : ''}">${esc(a.status)}</span>` }] })}
  <div class="g2">
    ${kaart('Doelen', balken(DOELEN.map(([k, n]) => [n, S.filter(s => s.doelen.has(k)).length]), { tot: S.length, max: 10, leeg: 'Geen sessies' }), { sub: 'deel van de sessies' })}
    ${tabelKaart('Doelen per kanaal', { id: 'doelkanaal', rows: kanalen, sort: '-1', cols: [{ t: 'Kanaal', v: r => r.k }, { t: 'Sessies', r: true, v: r => r.n }, ...[['berekening', 'Berekening'], ['pdf', 'PDF'], ['vlootklik', 'Vlootanalyse'], ['aanvraag', 'Aanvraag']].map(([d, t]) => ({ t, r: true, v: r => r[d] / r.n, h: r => r[d] ? `${r[d]} <span class="dun">· ${pct(r[d], r.n)}</span>` : '' }))] })}
  </div>
  ${tabelKaart('Sessies die verder gingen dan rekenen', { id: 'doelses', rows: sterk, sort: '-0', per: 25, open: s => 's:' + s.id, zoek: s => wieNaam(s) + ' ' + s.bron, leeg: 'Nog geen in deze periode', cols: [{ t: 'Start', nw: true, v: s => +s.start, h: s => fKort(s.start) }, { t: 'Wie', v: s => wieNaam(s), h: wieHtml }, { t: 'Deed', v: s => s.doelen.size, h: s => doelTags(s.doelen) }, { t: 'Tijd', r: true, nw: true, v: s => s.sec, h: s => duur(s.sec) }, { t: "Pagina's", r: true, v: s => s.views.length }, { t: 'Bron', v: s => s.bron }, { t: 'Apparaat', v: s => s.app, h: s => esc(s.app || '–') }] })}`;
} };

/* ===================== Datakwaliteit ===================== */
SCHERMEN.kwaliteit = { titel: 'Filters en netwerken', html() {
  const B = X.B, wie = F.wie; F.wie = 'alles'; const al = selectie(B.in); F.wie = wie;
  const red = new Map(), add = (r, n) => { if (r) red.set(r, (red.get(r) || 0) + n); };
  for (const s of al.S) add(s.reden, s.views.length); for (const e of al.A) add(e.reden, 1);
  const tot = al.views.length + al.A.length, per = k => som(al.S.filter(s => s.klasse === k), s => s.views.length) + al.A.filter(e => e.klasse === k).length;
  const laatste = D.EV.length ? D.EV[D.EV.length - 1].t : null;
  return (D.beperkt ? '<div class="melding">Beperkte modus: de nieuwe gegevensfunctie staat nog niet in Supabase. Daardoor ontbreken de volledige berekeningen en de aanvragen, en zijn mails na de eerste duizend deels zonder verzenddienst.</div>' : '') + `<section class="kpis k4">
    ${kpi('Echte weergaven', nf.format(per('echt')), { sub: pct(per('echt'), tot) + ' van alles' })}
    ${kpi('Intern', nf.format(per('intern')), { sub: pct(per('intern'), tot) })}
    ${kpi('Bots en tests', nf.format(per('bot')), { sub: pct(per('bot'), tot) })}
    ${kpi('Mailkliks van scanners', nf.format(al.K.filter(k => k.soort === 'scanner').length), { sub: pct(al.K.filter(k => k.soort === 'scanner').length, al.K.length) + ' van alle kliks' })}
  </section><div class="g2">
    ${kaart('Waarom weggefilterd', balken([...red].sort((a, b) => b[1] - a[1]), { max: 12, tot, dim: 'reden', leeg: 'Niets weggefilterd', kleurVan: k => INTERNE_REDENEN.has(k) ? '#64748B' : KLEUR.rood }) + legenda([['Intern', '#64748B'], ['Bot of test', KLEUR.rood]]), { sub: 'weergaven' })}
    ${kaart('Interne netwerken', `<div class="tb"><table><thead><tr><th>Netwerk</th><th>Laatst gezien</th><th>Geldig</th><th></th></tr></thead><tbody>${D.netwerken.length ? D.netwerken.map(([id, label, , laatst, dagen]) => { const verlopen = Date.now() - new Date(laatst) > dagen * 86400000; return `<tr><td>${esc(label || id)}</td><td class="nw">${fKort(new Date(laatst))}</td><td class="nw">${verlopen ? '<span class="tag fout">verlopen</span>' : dagen + ' dagen'}</td><td class="r"><button class="knop mini" data-net="${esc(id)}">Niet intern</button></td></tr>`; }).join('') : '<tr><td colspan="4" class="leeg">Nog geen. Open het dashboard op elk netwerk dat je gebruikt.</td></tr>'}</tbody></table></div>`)}
  </div>
  ${kaart('Gegevens', stats([[fKort(D.gegenereerd), 'opgehaald'], [laatste ? fKort(laatste) : '–', 'laatste gebeurtenis'], [nf.format(D.EV.length), 'gebeurtenissen'], [nf.format(D.SES.size), 'sessies'], [nf.format(D.CALC.length), 'standen van berekeningen'], [nf.format(D.MAILS.length), 'mails'], [nf.format(D.KLIKS.length), 'mailkliks'], [D.dagen + ' dagen', 'geladen']]))}`;
} };
