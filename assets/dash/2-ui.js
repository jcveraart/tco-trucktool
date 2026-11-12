/* Dashboard · bouwstenen: filters, periode, selectie, grafieken, tabellen, navigatie en het detailpaneel */
'use strict';

/* ===== Toestand ===== */
const F = { per: '30', d0: null, d1: null, wie: 'echt', dims: [], mail: { campagne: '', variant: '', dienst: '', segment: '' } };
try { const o = JSON.parse(localStorage.getItem('sod-dash-f') || '{}'); if (o.per && o.per !== 'eigen') F.per = o.per; if (o.wie) F.wie = o.wie; } catch (e) {}
const bewaarF = () => { try { localStorage.setItem('sod-dash-f', JSON.stringify({ per: F.per, wie: F.wie })); } catch (e) {} };
const R = { scherm: 'overzicht', open: null };
const PERIODES = [['vandaag', 'Vandaag'], ['gisteren', 'Gisteren'], ['7', '7 dagen'], ['30', '30 dagen'], ['90', '90 dagen'], ['alles', 'Alles']];
const PERIODES2 = [['week', 'Deze week'], ['vweek', 'Vorige week'], ['maand', 'Deze maand'], ['vmaand', 'Vorige maand']];

function bereik() {
  const nu = dagNr(Date.now()); let d0, d1, naam, vs;
  if (F.per === 'eigen') { d0 = F.d0; d1 = F.d1; naam = d0 === d1 ? dagLang(d0) : dagLabel(d0) + ' – ' + dagLabel(d1); }
  else if (F.per === 'vandaag') { d0 = d1 = nu; naam = 'Vandaag'; vs = 'gisteren'; }
  else if (F.per === 'gisteren') { d0 = d1 = nu - 1; naam = 'Gisteren'; vs = 'eergisteren'; }
  else if (F.per === 'week') { d0 = nu - weekdag(nu); d1 = nu; naam = 'Deze week'; }
  else if (F.per === 'vweek') { d0 = nu - weekdag(nu) - 7; d1 = d0 + 6; naam = 'Vorige week'; }
  else if (F.per === 'maand' || F.per === 'vmaand') { const t = new Date(nu * 864e5), v = F.per === 'vmaand', m = t.getUTCMonth() - (v ? 1 : 0); d0 = Date.UTC(t.getUTCFullYear(), m, 1) / 864e5; d1 = v ? Date.UTC(t.getUTCFullYear(), m + 1, 0) / 864e5 : nu; naam = v ? 'Vorige maand' : 'Deze maand'; }
  else if (F.per === 'alles') { d0 = Math.min(D.eersteDag, D.MAILS.length ? D.MAILS[0].d : nu, D.CALC.length ? D.CALC[0].d : nu); d1 = nu; naam = 'Alles'; }
  else { const n = +F.per; d0 = nu - n + 1; d1 = nu; naam = n + ' dagen'; }
  const n = d1 - d0 + 1, korrel = n <= 2 ? 'uur' : n <= 70 ? 'dag' : 'week', alles = F.per === 'alles';
  const p0 = d0 - n, p1 = d0 - 1; vs = alles ? null : vs || (n === 1 ? 'de dag ervoor' : 'de ' + n + ' dagen ervoor');
  const B = { d0, d1, n, naam, vs, korrel, p0, p1, in: x => x.d >= d0 && x.d <= d1, vorig: alles ? () => false : x => x.d >= p0 && x.d <= p1, b: [] };
  if (korrel === 'uur') { for (let d = d0; d <= d1; d++) for (let h = 0; h < 24; h++) B.b.push({ kort: String(h).padStart(2, '0'), label: (n > 1 ? dagLabel(d) + ' ' : '') + String(h).padStart(2, '0') + ':00' }); B.ix = x => (x.d - d0) * 24 + x.h; }
  else if (korrel === 'dag') { for (let d = d0; d <= d1; d++) B.b.push({ d0: d, d1: d, kort: dagLabel(d), label: dagLang(d), we: weekdag(d) > 4 }); B.ix = x => x.d - d0; }
  else { const w0 = d0 - weekdag(d0); for (let d = w0; d <= d1; d += 7) B.b.push({ d0: Math.max(d, d0), d1: Math.min(d + 6, d1), kort: dagLabel(d), label: 'Week van ' + dagLabel(d) }); B.ix = x => Math.floor((x.d - w0) / 7); }
  return B;
}
/* Reeks per tijdvak: telt items (of telt waarde op) in de vakken van B */
function reeks(B, items, waarde) { const r = Array(B.b.length).fill(0); for (const x of items) { const i = B.ix(x); if (i >= 0 && i < r.length) r[i] += waarde ? waarde(x) : 1; } return r; }
function reeksUniek(B, items, sleutel) { const r = B.b.map(() => new Set()); for (const x of items) { const i = B.ix(x); if (i >= 0 && i < r.length) r[i].add(sleutel(x)); } return r.map(s => s.size); }

/* ===== Selectie ===== */
const wieOk = k => F.wie === 'alles' || F.wie === k;
const DIMNAAM = { pagina: 'Bezocht', instap: 'Instappagina', land: 'Land', browser: 'Browser', os: 'Systeem', apparaat: 'Apparaat', scherm: 'Scherm', bron: 'Bron', kanaal: 'Kanaal', reden: 'Reden', vt: 'Voertuig', taal: 'Taal', doel: 'Deed', bezoek: 'Bezoek', uitkomst: 'Uitkomst', campagne: 'Campagne', variant: 'Mail', dienst: 'Via', segment: 'Segment' };
const KANAAL = Object.fromEntries(BRONNEN.map(b => [b[0], b[1]]));
const DOELNAAM = Object.fromEntries(DOELEN), DOELSLEUTEL = Object.fromEntries(DOELEN.map(([k, n]) => [n, k]));
const uitkomstNaam = g => g === 'e' ? 'Elektrisch goedkoper' : g === 'd' ? 'Diesel goedkoper' : 'Gelijk';
const bezoekNaam = s => s.n == null ? null : s.n <= 1 ? 'Eerste bezoek' : 'Terugkerend';
const MAILDIMS = ['campagne', 'variant', 'dienst', 'segment'];
const mailWaarde = (type, w) => type === 'variant' ? mailNaam(w) : type === 'dienst' ? dienstNaam(w) : type === 'segment' ? String(w).charAt(0).toUpperCase() + String(w).slice(1) : w;
/* Het filtermenu: groepen met de kenmerken waarop je kunt filteren */
const FILTERS = [['Bezoek', [['kanaal', 'Kanaal'], ['bron', 'Bron'], ['instap', 'Instappagina'], ['pagina', 'Bezochte pagina'], ['doel', 'Wat ze deden'], ['bezoek', 'Nieuw of terug'], ['land', 'Land'], ['taal', 'Taal']]],
  ['Apparaat', [['apparaat', 'Type'], ['scherm', 'Scherm'], ['browser', 'Browser'], ['os', 'Systeem']]],
  ['Calculator', [['vt', 'Voertuig'], ['uitkomst', 'Uitkomst']]],
  ['E-mail', [['campagne', 'Campagne'], ['variant', 'Mail A of B'], ['dienst', 'Verzonden via'], ['segment', 'Segment']]]];
const dimS = (d, s) => { const w = d.w; switch (d.type) {
  case 'pagina': return s.views.some(v => v.naam === w); case 'instap': return s.instap === w; case 'land': return landNaam(s.land) === w; case 'browser': return s.browser === w; case 'os': return s.os === w;
  case 'apparaat': return s.app === w; case 'scherm': return schermNaam(s.vw) === w; case 'bron': return s.bron === w; case 'kanaal': return KANAAL[s.bronSoort] === w; case 'reden': return s.reden === w;
  case 'vt': return s.reeksen.some(r => VT[r.vt] === w); case 'uitkomst': return s.reeksen.some(r => uitkomstNaam(r.goedkoper) === w); case 'taal': return (s.lang || '').slice(0, 2).toUpperCase() === w;
  case 'doel': return s.doelen.has(DOELSLEUTEL[w]); case 'bezoek': return bezoekNaam(s) === w; default: return true; } };
const dimA = (d, e) => { const w = d.w; switch (d.type) {
  case 'pagina': case 'instap': return paginaNaam(e.ev === 'page_view' ? e.page : (e.p.p || e.page), e.p.hash) === w; case 'land': return landNaam(e.land) === w; case 'browser': return e.browser === w; case 'os': return e.os === w;
  case 'apparaat': { const m = e.p.mobile ?? e.p.m; return m == null ? false : (m ? 'Mobiel' : 'Desktop') === w; } case 'scherm': return schermNaam(e.p.vw) === w; case 'bron': return e.bron === w; case 'kanaal': return KANAAL[e.bronSoort] === w; case 'reden': return anonReden(e) === w;
  default: return false; } };
const dimR = (d, r) => d.type === 'vt' ? VT[r.vt] === d.w : d.type === 'uitkomst' ? uitkomstNaam(r.goedkoper) === d.w : r.ses ? dimS(d, r.ses) : d.type === 'apparaat' ? r.app === d.w : d.type === 'bron' ? r.bron === d.w : d.type === 'kanaal' ? KANAAL[r.bronSoort] === d.w : false;
const mailOk = x => { const m = F.mail, c = x.contact || D.CONTACT.get(x.token); return (!m.campagne || x.c === m.campagne) && (!m.variant || x.v === m.variant) && (!m.dienst || (x.dienst || (x.mail && x.mail.dienst)) === m.dienst) && (!m.segment || ((c && c.segment) || 'onbekend') === m.segment); };
function selectie(test) {
  const dims = F.dims, alleS = [...D.SES.values()];
  const S = alleS.filter(s => test(s) && wieOk(s.klasse) && dims.every(d => dimS(d, s))).sort((a, b) => b.start - a.start);
  const fa = e => test(e) && wieOk(e.klasse) && dims.every(d => dimA(d, e));
  const Rk = [...D.REEKS.values()].filter(r => test(r) && wieOk(r.klasse) && dims.every(d => dimR(d, r))).sort((a, b) => b.t - a.t);
  const K = D.KLIKS.filter(k => test(k) && mailOk(k)), V = D.MAILS.filter(m => !m.test && test(m) && mailOk(m));
  return { S, A: D.ANON.filter(fa), AL: D.ANONL.filter(fa), AP: D.ANONP.filter(fa), R: Rk, C: Rk.flatMap(r => r.runs), K, KW: K.filter(k => wieOk(klikWie(k))), KM: K.filter(k => k.soort === 'mens'), V,
    views: S.flatMap(s => s.views), AFM: D.AFM.filter(a => test(a) && (!F.mail.campagne || a.c === F.mail.campagne)) };
}
let X = null; // { B, cur, vorig } van de huidige weergave
function herbereken() { const B = bereik(); X = { B, ...selectie(B.in), vorig: selectie(B.vorig) }; return X; }
const kpiVan = sel => {
  const tijden = []; for (const v of sel.views) if (v.leave) tijden.push(v.sec); for (const e of sel.AL) tijden.push(Math.min(+e.p.sec || 0, 3600));
  return { views: sel.views.length + sel.A.length, bezoekers: uniek(sel.S, s => s.vid), sessies: sel.S.length, tijd: gem(tijden) || 0, sesTijd: gem(sel.S, s => s.sec) || 0,
    bounce: sel.S.length ? sel.S.filter(s => s.views.length <= 1).length / sel.S.length : 0, calc: sel.R.length, mails: sel.V.length, mensKliks: uniek(sel.KM, k => k.token),
    doelen: sel.S.filter(s => s.doelen.has('aanvraag')).length };
};

/* ===== Na het plaatsen: grafieken en tabellen tekenen ===== */
let _na = [], _uid = 0;
const na = f => _na.push(f), uid = () => 'u' + (++_uid);
const CH = new Map();
function monteer(el, bouw) { const oud = _na; _na = []; let html; try { html = bouw(); } catch (e) { console.error(e); html = `<div class="melding">Dit onderdeel kon niet worden getoond: ${esc(e.message)}</div>`; } el.innerHTML = html; const q = _na; _na = oud; for (const f of q) { try { f(); } catch (e) { console.error(e); } } }
function grafiek(teken, o = {}) { const id = uid(); na(() => { CH.set(id, teken); const el = $(id); if (el) el.innerHTML = teken(el); }); return `<div class="chart" id="${id}"${o.stijl ? ` style="${o.stijl}"` : ''}></div>`; }
function hertekenGrafieken() { for (const [id, teken] of CH) { const el = $(id); if (!el) { CH.delete(id); continue; } el.innerHTML = teken(el); } }

/* ===== Kaarten, tegels, balken ===== */
const kaart = (titel, inhoud, o = {}) => `<section class="kaart"${o.id ? ` id="${o.id}"` : ''}><header><h2>${esc(titel)}</h2>${o.sub ? `<small>${o.sub}</small>` : ''}<span class="ruimte"></span>${o.acties || ''}</header>${inhoud}</section>`;
const leeg = t => `<div class="leeg">${esc(t || 'Geen gegevens in deze periode')}</div>`;
const legenda = items => `<div class="legenda">${items.map(([n, k, lijn]) => `<span><i class="${lijn ? 'lijn' : ''}" style="background:${k}"></i>${esc(n)}</span>`).join('')}</div>`;
function delta(a, b, omgekeerd) { if (!b || X.B.vs == null) return ''; const d = (a - b) / b; if (Math.abs(d) < .005) return '<b>gelijk</b>'; const goed = omgekeerd ? d < 0 : d > 0; return `<b class="${goed ? 'op' : 'neer'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d) >= 10 ? '>999' : Math.abs(Math.round(d * 100))}%</b>`; }
function spark(w, kleur = KLEUR.volt) {
  if (!w || w.length < 2 || !w.some(v => v)) return '<svg viewBox="0 0 160 28"></svg>';
  const W = 160, H = 28, max = Math.max(1e-9, ...w), x = i => i * W / (w.length - 1), y = v => H - 2 - (H - 6) * v / max;
  const pad = w.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${pad}L${W},${H}L0,${H}Z" fill="${kleur}" opacity=".1"/><path d="${pad}" fill="none" stroke="${kleur}" stroke-width="1.75" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
/* Tegel: o = { d: [nu, vorig, omgekeerd?], sub, spark, ga, tip } */
function kpi(l, n, o = {}) {
  const d = o.d ? delta(o.d[0], o.d[1], o.d[2]) : '', sub = [d, o.sub ? esc(o.sub) : ''].filter(Boolean).join(' · ');
  const t = o.d && X.B.vs ? `Vergeleken met ${X.B.vs}` : '';
  return `<${o.ga ? `a href="#/${o.ga}"` : 'div'} class="kpi"${o.tip || t ? ` title="${esc(o.tip || t)}"` : ''}><div class="l">${esc(l)}</div><div class="n">${n}</div><div class="d">${sub || '&nbsp;'}</div>${o.spark ? spark(o.spark, o.kleur) : ''}</${o.ga ? 'a' : 'div'}>`;
}
/* Horizontale balken. rijen: [label, waarde, extra?]. o: { max, tot, fmt, dim, open, ga, kleur, kleurVan, leeg, pct } */
function balken(rijen, o = {}) {
  rijen = rijen.filter(r => r[1] > 0);
  if (!rijen.length) return leeg(o.leeg);
  const max = o.maxWaarde || Math.max(...rijen.map(r => r[1])), tot = o.tot ?? som(rijen, r => r[1]);
  const fmt = o.fmt || (v => nf.format(v));
  const rest = rijen.length - (o.max || 8);
  return rijen.slice(0, o.max || 8).map(([k, v, extra]) => {
    const attr = o.dim ? ` data-dim="${o.dim}" data-w="${esc(k)}"` : o.open ? ` data-open="${esc(o.open(k))}"` : '';
    return `<div class="br${o.lang ? ' lang' : ''}"${attr} title="${esc(k)}"><div class="k">${esc(k)}</div><div class="tr"><i style="width:${(100 * v / max).toFixed(1)}%;${o.kleurVan ? 'background:' + o.kleurVan(k) : o.kleur ? 'background:' + o.kleur : ''}"></i></div><div class="v">${esc(fmt(v))}${o.pct === false ? '' : `<small>${extra != null ? esc(extra) : pct(v, tot)}</small>`}</div></div>`;
  }).join('') + (rest > 0 && o.rest !== false ? `<div class="sub" style="padding:6px 0 0">en nog ${rest}</div>` : '');
}
/* Gestapelde balken (100%). rijen: [label, [waarden]], reeksen: [[naam, kleur]] */
function stapel(rijen, reeksen, o = {}) {
  rijen = rijen.filter(r => r[1].some(v => v > 0));
  if (!rijen.length) return leeg(o.leeg);
  const max = Math.max(...rijen.map(r => som(r[1])));
  return rijen.slice(0, o.max || 10).map(([k, vals]) => { const tot = som(vals), noem = o.abs ? max : tot;
    const tip = `<b>${esc(k)}</b><table>${vals.map((v, i) => `<tr><td><i class="tk" style="background:${reeksen[i][1]}"></i>${esc(reeksen[i][0])}</td><td>${nf.format(v)}</td><td>${pct(v, tot)}</td></tr>`).join('')}</table>`;
    return `<div class="br"${o.dim ? ` data-dim="${o.dim}" data-w="${esc(k)}"` : ''} data-tip="${esc(tip)}"><div class="k">${esc(k)}</div><div class="tr ${o.abs ? 'abs' : 'st'}">${vals.map((v, i) => v ? `<i style="width:${Math.max(o.abs ? .8 : 0, 100 * v / noem).toFixed(1)}%;background:${reeksen[i][1]}"></i>` : '').join('')}</div><div class="v">${o.fmt ? esc(o.fmt(vals, tot)) : nf.format(tot)}</div></div>`; }).join('') + legenda(reeksen);
}
function trechter(stappen, o = {}) {
  const basis = stappen[0][1], max = Math.max(1, ...stappen.map(s => s[1]));
  return `<div class="trechter">${stappen.map(([k, n, kleur], i) => `<div class="st"><div>${esc(k)}</div><div><div class="bk" style="width:${(100 * n / max).toFixed(1)}%;${kleur ? 'background:' + kleur : ''}"></div></div><div class="v"><b>${nf.format(n)}</b> · ${pct(n, basis, basis >= 200 ? 1 : 0)}${o.val !== false && i > 0 && stappen[i - 1][1] > n && !stappen[i][3] ? `<span class="val">−${nf.format(stappen[i - 1][1] - n)}</span>` : ''}</div></div>`).join('')}</div>`;
}
const stats = rijen => { const n = rijen.length, k = n <= 6 ? n : n % 4 === 0 ? 4 : n % 3 === 0 ? 3 : n % 5 === 0 ? 5 : 4; return `<div class="stats" style="--n:${k}">${rijen.map(([n, l]) => `<div class="stat"><div class="n" title="${esc(n)}">${esc(n)}</div><div class="l">${esc(l)}</div></div>`).join('')}</div>`; };

/* ===== SVG-grafieken ===== */
const mooiMax = max => { if (max <= 0) return 1; const st = Math.pow(10, Math.floor(Math.log10(max))), f = max / st; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * st; };
const asGetal = v => v >= 10000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0).replace('.', ',') + 'K' : nf.format(Math.round(v * 10) / 10);
const tipTabel = (kop, rijen) => `<b>${esc(kop)}</b><table>${rijen.map(([n, v, k]) => `<tr><td>${k ? `<i class="tk" style="background:${k}"></i>` : ''}${esc(n)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
/* Gestapelde staven. o: { labels:[{kort,label}], series:[{naam,kleur,vals}], h, fmt, klik:bool, leeg, extra:i=>[[naam,waarde]] } */
function staven(o) {
  return grafiek(el => {
    const n = o.labels.length, tots = o.labels.map((_, i) => som(o.series, s => s.vals[i]));
    if (!tots.some(v => v)) return leeg(o.leeg);
    const W = Math.max(280, el.clientWidth || 600), H = o.h || (W < 520 ? 170 : 210), L = 38, B = 24, T = 8, fmt = o.fmt || (v => nf.format(v));
    const top = mooiMax(Math.max(...tots)), bw = (W - L) / n, w = Math.max(2, Math.min(o.breed || 26, bw - Math.min(6, bw * .3))), y = v => T + (H - B - T) * (1 - v / top);
    const elk = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - L) / (o.labelBreedte || 54)))));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
    for (const g of [0, top / 2, top]) s += `<line x1="${L}" x2="${W}" y1="${y(g)}" y2="${y(g)}" stroke="${g ? '#EEEEEA' : '#D9D9D4'}"/><text x="${L - 8}" y="${y(g) + 4}" text-anchor="end">${o.yFmt ? o.yFmt(g) : asGetal(g)}</text>`;
    o.labels.forEach((lab, i) => {
      const x = L + i * bw + (bw - w) / 2; let acc = 0;
      const tip = tipTabel(lab.label || lab.kort, [...(o.series.length > 1 ? o.series.map(sr => [sr.naam, fmt(sr.vals[i]), sr.kleur]) : [[o.series[0].naam, fmt(tots[i]), o.series[0].kleur]]), ...(o.series.length > 1 ? [['Totaal', fmt(tots[i])]] : []), ...(o.extra ? o.extra(i) : [])]);
      s += `<g ${o.klik && lab.d0 != null ? `data-b="${lab.d0}:${lab.d1}"` : ''} data-tip="${esc(tip)}"><rect class="hv" x="${L + i * bw}" y="0" width="${bw}" height="${H - B}" fill="transparent"/>`;
      const laatste = o.series.map(sr => sr.vals[i] > 0).lastIndexOf(true);
      o.series.forEach((sr, j) => { const v = sr.vals[i]; if (!v) return; const y0 = y(acc), y1 = y(acc + v), gap = acc ? 2 : 0, h = Math.max(1, y0 - y1 - gap), r = j === laatste ? Math.min(4, w / 2, h) : 0; acc += v;
        s += r ? `<path d="M${x},${y1 + h}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y1 + h}Z" fill="${sr.kleur}"/>` : `<rect x="${x}" y="${y1}" width="${w}" height="${h}" fill="${sr.kleur}"/>`; });
      s += '</g>';
      if (i % elk === 0 && lab.kort) s += `<text x="${x + w / 2}" y="${H - 7}" text-anchor="middle">${esc(lab.kort)}</text>`;
    });
    return s + '</svg>';
  });
}
/* Lijnen met vergelijking. o: { labels, series:[{naam,kleur,vals,streep,vlak}], fmt, h } */
function lijnen(o) {
  return grafiek(el => {
    const n = o.labels.length, alle = o.series.flatMap(s => s.vals).filter(v => v != null);
    if (!alle.some(v => v)) return leeg(o.leeg);
    const W = Math.max(280, el.clientWidth || 600), H = o.h || (W < 520 ? 180 : 230), L = 38, B = 24, T = 10, Rr = 8, fmt = o.fmt || (v => nf.format(Math.round(v * 10) / 10));
    const top = mooiMax(Math.max(...alle)), x = i => n === 1 ? (L + W - Rr) / 2 : L + i * (W - L - Rr) / (n - 1), y = v => T + (H - B - T) * (1 - v / top);
    const elk = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - L) / (o.labelBreedte || 54)))));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
    for (const g of [0, top / 2, top]) s += `<line x1="${L}" x2="${W}" y1="${y(g)}" y2="${y(g)}" stroke="${g ? '#EEEEEA' : '#D9D9D4'}"/><text x="${L - 8}" y="${y(g) + 4}" text-anchor="end">${o.yFmt ? o.yFmt(g) : asGetal(g)}</text>`;
    for (const sr of o.series) {
      const pad = sr.vals.map((v, i) => v == null ? '' : `${i && sr.vals[i - 1] != null ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
      if (sr.vlak) s += `<path d="${pad}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="${sr.kleur}" opacity=".08"/>`;
      s += `<path d="${pad}" fill="none" stroke="${sr.kleur}" stroke-width="${sr.streep ? 1.5 : 2}" stroke-linejoin="round" stroke-linecap="round" ${sr.streep ? 'stroke-dasharray="1 5"' : ''}/>`;
      if (n <= 31 && !sr.streep) sr.vals.forEach((v, i) => { if (v != null && (n === 1 || v > 0)) s += `<circle cx="${x(i)}" cy="${y(v)}" r="${n === 1 ? 4 : 2.5}" fill="${sr.kleur}" stroke="#fff" stroke-width="1.5"/>`; });
    }
    const bw = n === 1 ? W - L : (W - L - Rr) / (n - 1);
    o.labels.forEach((lab, i) => {
      const tip = tipTabel(lab.label || lab.kort, o.series.filter(sr => sr.vals[i] != null).map(sr => [sr.naam, fmt(sr.vals[i]), sr.kleur]));
      s += `<g ${o.klik && lab.d0 != null ? `data-b="${lab.d0}:${lab.d1}"` : ''} data-tip="${esc(tip)}"><rect x="${x(i) - bw / 2}" y="0" width="${bw}" height="${H - B}" fill="transparent"/></g>`;
      if (i % elk === 0 && lab.kort) s += `<text x="${x(i)}" y="${H - 7}" text-anchor="${i === 0 && n > 1 ? 'start' : 'middle'}">${esc(lab.kort)}</text>`;
    });
    return s + '</svg>';
  });
}
/* Histogram uit grenzen. vakken: [[label, bovengrens]] */
function histogram(waarden, vakken, o = {}) {
  const n = vakken.map(() => 0); for (const v of waarden) { const i = vakken.findIndex(([, g]) => v < g); if (i >= 0) n[i]++; }
  return staven({ labels: vakken.map(([k]) => ({ kort: k, label: k + (o.eenheid ? ' ' + o.eenheid : '') })), series: [{ naam: o.naam || 'Aantal', kleur: o.kleur || KLEUR.volt, vals: n }], breed: 44, labelBreedte: o.labelBreedte || 46, h: o.h || 180, leeg: o.leeg, ...(o.kleuren ? { series: o.kleuren.map(([naam, kleur, f]) => ({ naam, kleur, vals: n.map((v, i) => f(i) ? v : 0) })) } : {}) });
}
/* Rooster met kleurwaarde. o: { rijen, kolommen, grid, links, cel, waarden, tip } */
function rooster(o) {
  return grafiek(el => {
    if (!o.rijen.length) return leeg(o.leeg);
    const W = Math.max(280, el.clientWidth || 600), L = o.links || 120, T = 20, cw = (W - L) / o.kolommen.length, ch = o.cel || 24, H = T + o.rijen.length * ch + 2;
    const max = Math.max(1, ...o.grid.flat());
    const kleur = v => { if (!v) return '#F4F4F1'; const a = Math.sqrt(v / max), l = [215, 237, 226], d = [7, 115, 74]; return `rgb(${l.map((c, i) => Math.round(c + (d[i] - c) * a))})`; };
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
    o.kolommen.forEach((k, j) => { if (k !== '') s += `<text x="${L + j * cw + cw / 2}" y="12" text-anchor="middle">${esc(o.kortKol ? kort(k, Math.max(4, Math.floor(cw / 6.5))) : k)}</text>`; });
    o.grid.forEach((rij, i) => {
      s += `<text x="${L - 10}" y="${T + i * ch + ch / 2 + 4}" text-anchor="end">${esc(kort(o.rijen[i], Math.floor(L / 6.2)))}</text>`;
      rij.forEach((v, j) => {
        s += `<rect data-tip="${esc(o.tip ? o.tip(i, j, v) : `<b>${esc(o.rijen[i])} · ${esc(o.kolommen[j])}</b><br>${nf.format(v)}`)}" x="${L + j * cw + 1}" y="${T + i * ch + 1}" width="${Math.max(1, cw - 2)}" height="${ch - 2}" rx="3" fill="${kleur(v)}"/>`;
        if (o.waarden && v && cw > 26) s += `<text x="${L + j * cw + cw / 2}" y="${T + i * ch + ch / 2 + 4}" text-anchor="middle" style="fill:${v / max > .3 ? '#fff' : '#4A5158'};pointer-events:none">${nf.format(v)}</text>`;
      });
    });
    return s + '</svg>';
  });
}
function weekRooster(items) {
  const g = Array.from({ length: 7 }, () => Array(24).fill(0)); for (const x of items) g[weekdag(x.d)][x.h]++;
  const dagen = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
  return rooster({ rijen: dagen, kolommen: Array.from({ length: 24 }, (_, h) => h % 3 ? '' : String(h).padStart(2, '0')), grid: g, links: 30, cel: 22, tip: (i, j, v) => `<b>${dagen[i]} ${String(j).padStart(2, '0')}:00</b><br>${nf.format(v)}` });
}

/* ===== Tabellen: sorteren, zoeken, meer tonen, CSV ===== */
const TB = new Map();
/* o: { id, rows, cols:[{t, v, h, r, nw, kl, x}], open:r=>'s:id', sort:'-kolomindex', per, zoek:r=>tekst, leeg, hoog } */
function tabel(o) { let st = TB.get(o.id); if (!st) { st = { sort: o.sort ?? null, n: o.per || 50, q: '' }; TB.set(o.id, st); } st.o = o; na(() => tekenTabel(o.id)); return `<div id="tb-${o.id}"></div>`; }
function tabelRijen(st) {
  const o = st.o; let rows = o.rows;
  if (st.q && o.zoek) { const q = st.q.toLowerCase(); rows = rows.filter(r => String(o.zoek(r) || '').toLowerCase().includes(q)); }
  if (st.sort != null) { const af = String(st.sort).startsWith('-'), c = o.cols[+String(st.sort).replace('-', '')], f = c && c.v; if (f) rows = [...rows].sort((a, b) => { const x = f(a), y = f(b); const r = x == null ? (y == null ? 0 : 1) : y == null ? -1 : typeof x === 'string' ? x.localeCompare(String(y), 'nl') : x - y; return x == null || y == null ? r : af ? -r : r; }); }
  return rows;
}
function tekenTabel(id) {
  const st = TB.get(id), el = $('tb-' + id); if (!st || !el) return; const o = st.o, rows = tabelRijen(st);
  const aantal = $('tn-' + id); if (aantal) aantal.textContent = nf.format(rows.length) + (rows.length !== o.rows.length ? ' van ' + nf.format(o.rows.length) : '');
  const cel = (c, r) => c.h ? c.h(r) : esc(c.v ? (c.v(r) ?? '–') : '');
  el.innerHTML = `<div class="tb${o.hoog ? ' hoog' : ''}"><table><thead><tr>${o.cols.map((c, i) => c.verborgen ? '' : `<th class="${c.r ? 'r' : ''}"${c.v ? ` data-s="${i}"` : ''}${c.tip ? ` title="${esc(c.tip)}"` : ''}>${esc(c.t)}${st.sort != null && String(st.sort).replace('-', '') === String(i) ? `<span class="pijl">${String(st.sort).startsWith('-') ? '↓' : '↑'}</span>` : ''}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.slice(0, st.n).map(r => `<tr${o.open ? ` data-open="${esc(o.open(r) || '')}"` : ''}${o.actief && o.actief(r) ? ' class="actief"' : ''}>${o.cols.map(c => c.verborgen ? '' : `<td class="${[c.r ? 'r' : '', c.nw ? 'nw' : '', c.kl || ''].join(' ').trim()}">${cel(c, r)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${o.cols.filter(c => !c.verborgen).length}" class="leeg">${esc(o.leeg || 'Niets gevonden')}</td></tr>`}</tbody></table></div>${rows.length > st.n ? `<div class="meer"><span>${nf.format(st.n)} van ${nf.format(rows.length)}</span><button class="knop mini" data-meer="${id}">Toon meer</button><button class="knop mini" data-meer="${id}" data-alles="1">Toon alles</button></div>` : ''}`;
}
/* Kaart met tabel, zoekveld en CSV in de kop */
function tabelKaart(titel, o, ko = {}) {
  return kaart(titel, (ko.voor || '') + tabel(o), { ...ko, sub: ko.sub ?? `<span id="tn-${o.id}"></span>`, acties: (ko.acties || '') + (o.zoek ? `<input class="veld" type="search" placeholder="Zoek" data-tq="${o.id}" value="${esc((TB.get(o.id) || {}).q || '')}" style="width:150px">` : '') + (ko.csv === false ? '' : `<button class="knop mini" data-csv="${o.id}" title="Download als CSV">CSV</button>`) });
}
function csvVan(id) {
  const st = TB.get(id); if (!st) return; const o = st.o, rows = tabelRijen(st), kaal = h => String(h ?? '').replace(/<br\s*\/?>/g, ' · ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  const cols = o.cols.filter(c => c.t);
  const regels = [cols.map(c => c.t), ...rows.map(r => cols.map(c => c.x ? c.x(r) : c.h ? kaal(c.h(r)) : (c.v ? c.v(r) : '')))].map(r => r.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + regels], { type: 'text/csv;charset=utf-8' })); a.download = `${id}-${dagIso(dagNr(Date.now()))}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ===== Verwijzingen en labels ===== */
const ent = (soort, id, tekst) => `<a class="ent" data-open="${esc(soort + ':' + id)}">${esc(tekst)}</a>`;
const tagWie = k => `<span class="tag ${k === 'echt' ? 'goed' : k === 'intern' ? 'grijs' : 'fout'}">${WIE[k]}</span>`;
const tagKlik = s => `<span class="tag ${s === 'mens' ? 'goed' : s === 'scanner' ? 'fout' : 'grijs'}">${KLIKSOORT[s]}</span>`;
const tagUitkomst = g => g === 'e' ? '<span class="tag e">Elektrisch</span>' : g === 'd' ? '<span class="tag d">Diesel</span>' : '<span class="tag">Gelijk</span>';
const STAPKLASSE = { 'Niet gemaild': '', 'Gepland': 'paars', 'Verstuurd': 'grijs', 'Geklikt': 'blauw', 'Op de site': 'goed', 'Afgemeld': 'fout', 'Bounce': 'fout' };
const tagStap = s => `<span class="tag ${STAPKLASSE[s] || ''}">${esc(s)}</span>`;
const MAILSTATUS = { gepland: ['Gepland', 'paars'], bounce: ['Bounce', 'fout'], bezorgd: ['Bezorgd', 'goed'], verstuurd: ['Verstuurd', 'grijs'] };
const tagMail = m => { const [l, k] = MAILSTATUS[m.status]; return `<span class="tag ${k}">${l}</span>`; };
const wieNaam = s => s.contact ? s.contact.naamKort : 'Bezoeker ' + s.vid.slice(0, 8);
const wieHtml = s => s.contact ? `<span class="hfd">${esc(s.contact.naamKort)}</span>${s.mailZeker ? '' : ' <span class="dun" title="Vermoedelijk, op het tijdstip van de klik">≈</span>'}` : `<span class="dun">Bezoeker ${esc(s.vid.slice(0, 8))}</span>`;
const apparaatTekst = s => [s.app, s.browser, s.os].filter(Boolean).join(' · ') || '–';
const routeTekst = (s, n = 6) => s.route.slice(0, n).join(' → ') + (s.route.length > n ? ' → …' : '');

/* ===== Navigatie ===== */
const SCHERMEN = {}; // naam -> { titel, groep, html(), mail?:bool }
const MENU = [['', ['overzicht']], ['Site', ['verkeer', 'paginas', 'gedrag', 'herkomst', 'techniek']], ['Calculator', ['berekeningen', 'trechter']], ['E-mail', ['campagne', 'verzendingen', 'ontvangers', 'kliks', 'ab']], ['Mensen', ['bezoekers', 'sessies', 'aanvragen']], ['Beheer', ['kwaliteit']]];
function ga(scherm, open) { const h = '#/' + scherm + (open ? '~' + encodeURIComponent(open) : ''); if (location.hash === h) route(); else location.hash = h; }
const openen = sleutel => ga(R.scherm, sleutel);
function route() {
  const m = /^#\/([a-z]+)(?:~(.+))?$/.exec(location.hash) || [], scherm = SCHERMEN[m[1]] ? m[1] : 'overzicht', open = m[2] ? decodeURIComponent(m[2]) : null;
  const wissel = scherm !== R.scherm || !$('inhoud').firstChild; R.scherm = scherm; R.open = open;
  if (wissel) { render(); scrollTo(0, 0); }
  toonPaneel();
}
function render() {
  if (!D.EV) return;
  herbereken(); CH.clear();
  const sch = SCHERMEN[R.scherm];
  document.title = sch.titel + ' · Stekker of Diesel';
  $('titel').textContent = sch.titel;
  $('zij').querySelectorAll('a.nav').forEach(a => a.classList.toggle('on', a.dataset.s === R.scherm));
  tijdBalk();
  $('fWie').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === F.wie));
  const n = actieveFilters().length; $('filterRij').innerHTML = chipsHtml(); $('filterRij').hidden = !n; $('filterTel').textContent = n || ''; $('filterTel').hidden = !n;
  for (const g of $('zij').querySelectorAll('.groep')) { const actief = !!g.querySelector('a.nav.on'); g.classList.toggle('actief', actief); if (actief) g.classList.add('open'); }
  monteer($('inhoud'), () => sch.html());
}
/* Alle actieve filters, ook die op e-mail, in één lijst */
const actieveFilters = () => [...F.dims.map(d => ({ type: d.type, w: d.w, toon: d.w })), ...MAILDIMS.filter(k => F.mail[k]).map(k => ({ type: k, w: F.mail[k], toon: mailWaarde(k, F.mail[k]) }))];
const filterWaarde = type => MAILDIMS.includes(type) ? F.mail[type] || null : (F.dims.find(d => d.type === type) || {}).w ?? null;
function chipsHtml() {
  const a = actieveFilters();
  return a.map(f => `<span class="chip"><span data-filter="${f.type}" title="Wijzig dit filter"><b>${DIMNAAM[f.type] || f.type}</b>${esc(f.toon)}</span><button type="button" data-dimweg="${f.type}" aria-label="Filter weg">×</button></span>`).join('') + (a.length > 1 ? '<button class="knop mini kaal" data-dimweg="alles">Wis alles</button>' : '');
}
/* Waarden waaruit je bij een kenmerk kunt kiezen, met het aantal in de gekozen periode (los van dat ene filter) */
function filterOpties(type) {
  const B = X.B, ander = F.dims.filter(d => d.type !== type);
  if (MAILDIMS.includes(type)) { const m = F.mail, f = x => (type === 'campagne' || !m.campagne || x.c === m.campagne) && (type === 'variant' || !m.variant || x.v === m.variant) && (type === 'dienst' || !m.dienst || x.dienst === m.dienst) && (type === 'segment' || !m.segment || ((x.contact && x.contact.segment) || 'onbekend') === m.segment);
    const V = D.MAILS.filter(x => !x.test && B.in(x) && f(x)); return tel(V, x => type === 'campagne' ? x.c : type === 'variant' ? x.v : type === 'dienst' ? x.dienst : (x.contact && x.contact.segment) || 'onbekend').map(([w, n]) => ({ w, toon: mailWaarde(type, w), n })); }
  const S = [...D.SES.values()].filter(s => B.in(s) && wieOk(s.klasse) && ander.every(d => dimS(d, s))), A = D.ANON.filter(e => B.in(e) && wieOk(e.klasse) && ander.every(d => dimA(d, e)));
  const Rk = [...D.REEKS.values()].filter(r => B.in(r) && wieOk(r.klasse) && ander.every(d => dimR(d, r)));
  const uit = type === 'pagina' ? tel([...S.flatMap(s => [...new Set(s.views.map(v => v.naam))]), ...A.map(e => e.naam)], x => x) : type === 'instap' ? tel([...S.map(s => s.instap), ...A.map(e => e.naam)], x => x)
    : type === 'doel' ? DOELEN.map(([k, n]) => [n, S.filter(s => s.doelen.has(k)).length]).filter(x => x[1]) : type === 'bezoek' ? tel(S, bezoekNaam) : type === 'taal' ? tel(S, s => s.lang ? s.lang.slice(0, 2).toUpperCase() : null)
    : type === 'vt' ? tel(Rk, r => VT[r.vt]) : type === 'uitkomst' ? tel(Rk, r => uitkomstNaam(r.goedkoper)) : type === 'kanaal' ? tel([...S, ...A], x => KANAAL[x.bronSoort]) : type === 'land' ? tel([...S, ...A], x => landNaam(x.land))
    : type === 'scherm' ? tel([...S.map(s => s.vw), ...A.map(e => e.p.vw)], schermNaam) : tel([...S, ...A], x => type === 'apparaat' ? x.app : x[type]);
  return uit.map(([w, n]) => ({ w, toon: w, n }));
}
/* De periodebalk: snelle keuzes, zelf kiezen en een stap eerder of later */
function tijdBalk() {
  const B = X.B, nu = dagNr(Date.now()), extra = PERIODES2.find(p => p[0] === F.per), eigen = F.per === 'eigen', alles = F.per === 'alles';
  $('perSeg').innerHTML = PERIODES.map(([k, n]) => `<button type="button" data-per="${k}"${F.per === k ? ' class="on"' : ''}>${n}</button>`).join('');
  const seg = $('perSeg'), on = seg.querySelector('.on'); if (on && seg.scrollWidth > seg.clientWidth) { const r = on.getBoundingClientRect(), g = seg.getBoundingClientRect(); if (r.left < g.left || r.right > g.right) seg.scrollLeft += r.left - g.left - 24; }
  const k = $('perKnop'); k.innerHTML = icoon('kalender') + `<span>${extra ? extra[1] : 'Zelf kiezen'}</span>`; k.classList.toggle('gekozen', eigen || !!extra); $('tijd').classList.toggle('eigen', eigen || !!extra);
  $('perBereik').textContent = B.d0 === B.d1 ? dagLang(B.d0) : dagLabel(B.d0) + ' – ' + dagLabel(B.d1);
  const [eerder, later] = $('tijd').querySelectorAll('[data-stap]'); eerder.disabled = alles || B.d1 - B.n < D.eersteDag - 1; later.disabled = alles || B.d1 >= nu;
}
function stapPeriode(richting) {
  const B = X.B, nu = dagNr(Date.now()), d1 = Math.min(B.d1 + richting * B.n, nu), d0 = d1 - B.n + 1;
  if (d1 === nu && B.n === 1) return zetPeriode('vandaag'); if (d1 === nu - 1 && B.n === 1) return zetPeriode('gisteren');
  if (d1 === nu && [7, 30, 90].includes(B.n)) return zetPeriode(String(B.n));
  zetPeriode('eigen', d0, d1);
}
function zetPeriode(per, d0, d1) { F.per = per; F.d0 = d0 ?? null; F.d1 = d1 ?? null; bewaarF(); render(); toonPaneel(); }
function zetDim(type, w) {
  if (MAILDIMS.includes(type)) F.mail[type] = F.mail[type] === w ? '' : w;
  else { const stond = F.dims.some(x => x.type === type && x.w === w); F.dims = F.dims.filter(x => x.type !== type); if (!stond) F.dims.push({ type, w }); else { render(); return; }
    if (type === 'reden') { const k = INTERNE_REDENEN.has(w) ? 'intern' : 'bot'; if (F.wie !== 'alles' && F.wie !== k) F.wie = k; } }
  render();
}
function wisDim(type) { if (type === 'alles') { F.dims = []; for (const k of MAILDIMS) F.mail[k] = ''; } else if (MAILDIMS.includes(type)) F.mail[type] = ''; else F.dims = F.dims.filter(d => d.type !== type); render(); }

/* ===== Detailpaneel ===== */
const PANEEL = {}; // soort -> id => { soort, titel, html } of null
function toonPaneel() {
  const p = $('paneel'), sc = $('scrim');
  if (!R.open) { p.classList.remove('aan'); sc.classList.remove('aan'); document.body.style.overflow = ''; return; }
  const i = R.open.indexOf(':'), soort = R.open.slice(0, i), id = R.open.slice(i + 1), f = PANEEL[soort];
  let uit = null; try { uit = f ? f(id) : null; } catch (e) { console.error(e); uit = { soort: 'Fout', html: () => `<div class="melding">${esc(e.message)}</div>` }; }
  $('paneelSoort').textContent = uit ? uit.soort : 'Niet gevonden';
  monteer($('paneelLijf'), () => uit ? uit.html() : '<div class="leeg">Dit onderdeel staat niet (meer) in de geladen gegevens.</div>');
  if (p.dataset.open !== R.open) $('paneelLijf').scrollTop = 0; p.dataset.open = R.open;
  p.classList.add('aan'); sc.classList.add('aan'); document.body.style.overflow = 'hidden';
}
const sluitPaneel = () => ga(R.scherm, null);

/* ===== Zoeken ===== */
let ZI = null;
function zoekIndex() {
  if (ZI) return ZI; ZI = [];
  for (const [k, s] of Object.entries(SCHERMEN)) ZI.push({ g: 'Schermen', t: s.titel, z: s.titel.toLowerCase(), ga: k });
  for (const c of D.CONTACT.values()) if (!c.test) ZI.push({ g: 'Ontvangers', t: c.naamKort, s: [c.email !== c.naamKort ? c.email : null, c.stap].filter(Boolean).join(' · '), z: [c.bedrijf, c.email, c.naam].filter(Boolean).join(' ').toLowerCase(), o: 'c:' + c.token, w: c.bezoek.length * 4 + c.mensKliks.length * 2 });
  for (const b of D.BEZ.values()) ZI.push({ g: 'Bezoekers', t: b.naam, s: `${b.ses.length} sessies · ${fKort(b.laatst)}`, z: (b.vid + ' ' + b.naam).toLowerCase(), o: 'b:' + b.vid, w: b.klasse === 'echt' ? 1 : 0 });
  for (const n of new Set([...D.SES.values()].flatMap(s => s.views.map(v => v.naam)).concat(D.ANON.map(e => e.naam)))) ZI.push({ g: "Pagina's", t: n, z: n.toLowerCase(), o: 'p:' + n });
  for (const a of D.AANVR) ZI.push({ g: 'Aanvragen', t: a.company, s: a.email, z: [a.company, a.contact_name, a.email].join(' ').toLowerCase(), o: 'a:' + a.id });
  return ZI;
}
function zoekResultaten(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  const hits = zoekIndex().filter(x => x.z.includes(q)).sort((a, b) => (b.z.startsWith(q) - a.z.startsWith(q)) || (b.w || 0) - (a.w || 0));
  const per = groep(hits, x => x.g), uit = [];
  for (const g of ['Schermen', 'Ontvangers', 'Bezoekers', "Pagina's", 'Aanvragen']) if (per.has(g)) uit.push(...per.get(g).slice(0, g === 'Ontvangers' ? 8 : 5));
  return uit;
}
