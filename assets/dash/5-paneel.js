/* Dashboard · detailpanelen: sessie, bezoeker, ontvanger, klik, berekening, pagina, verzending, aanvraag */
'use strict';
const kv = rijen => { rijen = rijen.filter(r => r && r[1] != null && r[1] !== ''); return rijen.length ? `<div class="kv">${rijen.map(([k, v, kl]) => `<div>${esc(k)}</div><div${kl ? ` class="${kl}"` : ''}>${v}</div>`).join('')}</div>` : leeg('Niets bekend'); };
const pKop = (titel, onder = [], acties = []) => `<h2 class="titel">${esc(titel)}</h2><div class="onder">${onder.filter(Boolean).join('<span class="dun">·</span>')}</div>${acties.filter(Boolean).length ? `<div class="acties">${acties.filter(Boolean).join('')}</div>` : ''}`;
const fDagKort = t => dagNr(+t) === dagNr(Date.now()) ? fTijd(t) : dagLabel(dagNr(+t));
const pKnop = (sleutel, tekst) => `<button class="knop" data-open="${esc(sleutel)}">${esc(tekst)}</button>`;
/* Tijdlijn. items: { t, kl, w (html), sub (html), open, kop } */
function tijdlijn(items, o = {}) {
  if (!items.length) return leeg(o.leeg || 'Niets vastgelegd');
  let vorige = null, dag = null, uit = '';
  for (const it of items) {
    if (it.kop) { uit += `<li class="kop"><span>${esc(it.kop)}</span></li>`; vorige = null; continue; }
    const d = dagNr(+it.t);
    if (o.dagen && d !== dag) { uit += `<li class="kop"><span>${esc(dagLang(d))}</span></li>`; dag = d; vorige = null; }
    const gat = vorige != null ? (it.t - vorige) / 1000 : null;
    if (o.gaten && gat != null && gat >= 300) uit += `<li class="gat"><span class="t"></span><span class="o"><i></i></span><span class="w">${duur(gat)} later</span></li>`;
    uit += `<li class="${it.kl || ''}"${it.open ? ` data-open="${esc(it.open)}" style="cursor:pointer"` : ''}><span class="t">${o.sec ? fSec(it.t) : fTijd(it.t)}${o.sec && gat != null && gat < 300 && gat >= 1 ? `<small>+${duur(gat)}</small>` : ''}</span><span class="o"><i></i></span><span class="w">${it.w}${it.sub ? `<span class="sub">${it.sub}</span>` : ''}</span></li>`;
    vorige = +it.t;
  }
  return `<ul class="tl">${uit}</ul>`;
}
const modelTekst = id => String(id || '').replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
const uitkomstTekst = (g, v) => g === 'gelijk' || !v ? 'gelijk' : `${g === 'd' ? 'diesel' : 'elektrisch'} ${euro(Math.abs(v))} per jaar goedkoper`;

/* Eén gebeurtenis in gewone taal */
function evRegel(e, s) {
  const p = e.p, n = ACTIES[e.ev] || e.ev;
  switch (e.ev) {
    case 'session_start': case 'page_leave': case 'perf': return null;
    case 'page_view': { const v = s.views.find(x => x.t === e.t), lcp = s.perf.find(x => x.t >= e.t && x.t - e.t < 60000 && x.p.lcp != null); return { kl: 'pag', w: esc(v ? v.naam : paginaNaam(e.page, p.hash)), sub: v ? [v.leave ? duur(v.sec) + ' op de pagina' : null, v.leave && v.depth ? v.depth + '% gescrold' : null, v.kliks ? v.kliks + (v.kliks === 1 ? ' klik' : ' kliks') : null, lcp ? 'zichtbaar na ' + msTekst(+lcp.p.lcp) : null].filter(Boolean).join(' · ') : '' }; }
    case 'klik': return { kl: 'klein', w: `Klik op <b>${esc(kort(p.el || p.id || p.tag || '?', 70))}</b>`, sub: [p.href ? esc(kort(p.href, 60)) : null, p.yp != null ? `op ${Math.round(p.yp)}% van de pagina` : null].filter(Boolean).join(' · ') };
    case 'nav': return { kl: 'klein', w: `Menu naar <b>${esc(p.to || '?')}</b>` };
    case 'wizard_open': return { w: '<b>Invulvenster geopend</b>' };
    case 'wizard_step': return { kl: 'klein', w: `Stap ${esc(STAPPEN[p.step] || p.step || '?')}` };
    case 'wizard_close': return { w: `Invulvenster gesloten bij stap ${esc(STAPPEN[p.step] || p.step || '?')}` };
    case 'wizard_complete': return { kl: 'goed', w: '<b>Berekening afgerond</b>', sub: esc([VT[p.vt] || p.vt, p.model ? modelTekst(p.model) : null, p.km ? nf.format(+p.km) + ' km per jaar' : null, p.cheaper ? uitkomstTekst(p.cheaper === 'e' || p.cheaper === 'd' ? p.cheaper : 'gelijk', +p.diff_year) : null].filter(Boolean).join(' · ')) };
    case 'vehicle_select': return { w: `Voertuig gekozen: <b>${esc(VT[p.vt] || p.vt)}</b>` };
    case 'model_open': case 'model_apply': case 'model_variant': case 'model_compare_item': return { kl: e.ev === 'model_apply' ? 'goed' : '', w: `${esc(n)}: <b>${esc(modelTekst(p.id))}</b>` };
    case 'model_compare': return { w: esc(n), sub: esc(String(p.ids || '').split(',').map(modelTekst).join(' en ')) };
    case 'model_search': return { kl: 'klein', w: `Model gezocht: <b>${esc(p.q)}</b>` };
    case 'model_filter': return { kl: 'klein', w: `Modellen gefilterd op ${esc(VT[p.cat] || (p.cat === 'all' ? 'alles' : p.cat))}` };
    case 'cta_click': return { w: `Knop <b>${esc(p.text || p.cta || '?')}</b>` };
    case 'fleet_cta_click': return { kl: 'goed', w: '<b>Naar de vlootanalyse geklikt</b>', sub: p.from ? 'vanaf ' + esc(p.from) : '' };
    case 'fleet_request_sent': case 'quote_sent': return { kl: 'goed', w: `<b>${esc(n)}</b>` };
    case 'details_open': return { kl: 'klein', w: 'Vraag opengeklapt', sub: esc(p.q || '') };
    case 'tip_open': return { kl: 'klein', w: `Uitleg geopend: ${esc((VELD[p.tip] || [])[0] || p.tip || '?')}` };
    case 'consent': return { kl: 'klein', w: `Cookiekeuze: ${p.stat ? 'akkoord met statistieken' : 'geweigerd'}` };
    case 'outbound': return { w: `Externe link naar <b>${esc(p.host || '?')}</b>`, sub: esc(kort(p.url || '', 80)) };
    case 'plate_lookup': return { kl: 'goed', w: '<b>Kenteken opgezocht</b>', sub: esc([p.kind === 'E' ? 'elektrisch' : p.kind === 'D' ? 'diesel' : null, VT[p.vt], p.year, p.euro ? 'Euro ' + p.euro : null].filter(Boolean).join(' · ')) };
    case 'print': case 'pdf_email': case 'share': return { kl: 'goed', w: `<b>${esc(n)}</b>` };
    case 'js_error': return { kl: 'fout', w: 'Fout op de pagina', sub: esc(p.m || '') };
    case 'rage': return { kl: 'fout', w: 'Frustratieklik', sub: esc(p.el || '') };
    case 'logo_toggle': return { kl: 'klein', w: `Logo omgezet naar ${p.diesel ? 'diesel' : 'stekker'}` };
    default: { const rest = Object.entries(p).filter(([k, v]) => v != null && typeof v !== 'object' && !['p', 'm', 'wd'].includes(k)).map(([k, v]) => k + ': ' + v).join(' · '); return { kl: 'klein', w: esc(n), sub: esc(kort(rest, 120)) }; }
  }
}
function sessieItems(s) {
  const items = [];
  for (const e of s.ev) { const r = evRegel(e, s); if (r) items.push({ t: e.t, ...r }); }
  for (const c of s.calc) { const nm = (c.gewijzigd || []).map(veldNaam).filter(Boolean); items.push({ t: c.t, kl: c.trigger === 'invulvenster' ? 'goed' : '', open: 'r:' + c.r.id, w: c.trigger === 'invulvenster' ? '<b>Berekening bewaard</b>' : `Berekening aangepast`, sub: esc([VT[c.vt] || c.vt, uitkomstTekst(c.goedkoper, c.verschil), c.trigger !== 'invulvenster' && c.invoer && nm.length ? nm.length + ' velden anders dan standaard' : null].filter(Boolean).join(' · ')) }); }
  return items.sort((a, b) => a.t - b.t);
}

/* ===================== Sessie ===================== */
PANEEL.s = id => {
  const s = D.SES.get(id); if (!s) return null; const b = D.BEZ.get(s.vid), i = b ? b.ses.indexOf(s) : -1;
  return { soort: 'Sessie', html: () => pKop(wieNaam(s), [esc(fVol(s.start)), tagWie(s.klasse) + (s.reden ? ` <span class="sub">${esc(s.reden)}</span>` : ''), esc(s.bron)],
      [pKnop('b:' + s.vid, 'Bezoeker'), s.contact ? pKnop('c:' + s.contact.token, 'Ontvanger') : '', i > 0 ? pKnop('s:' + b.ses[i - 1].id, '← Vorige sessie') : '', b && i < b.ses.length - 1 ? pKnop('s:' + b.ses[i + 1].id, 'Volgende sessie →') : ''])
    + stats([[duur(s.sec), 'op de site'], [s.views.length, s.views.length === 1 ? 'pagina' : "pagina's"], [s.ev.length, 'gebeurtenissen'], [s.reeksen.length, s.reeksen.length === 1 ? 'berekening' : 'berekeningen'], [s.n ? s.n + 'e' : '–', 'bezoek'], [landNaam(s.land) || '–', 'land']])
    + (s.doelen.size ? `<div class="rij onder">${doelTags(s.doelen)}</div>` : '')
    + kaart('Tijdlijn', tijdlijn(sessieItems(s), { sec: true, gaten: true }), { sub: `${fTijd(s.start)} – ${fTijd(s.eind)}` })
    + kaart("Tijd per pagina", balken([...groep(s.views, v => v.naam)].map(([k, vs]) => [k, som(vs, v => v.sec), vs.length > 1 ? vs.length + ' keer' : gem(vs, v => v.depth) ? Math.round(gem(vs, v => v.depth)) + '% gescrold' : '']).sort((a, c) => c[1] - a[1]), { fmt: duur, open: k => 'p:' + k, leeg: 'Geen tijd gemeten' }))
    + kaart('Kenmerken', kv([['Bron', esc(s.bron)], ['Verwijzer', esc(s.ref)], ['Campagne', esc(s.camp)], ['Instappagina', esc(s.instap)], ['Laatste pagina', esc(s.uitstap)], ['Apparaat', esc(apparaatTekst(s))], ['Scherm', s.vw ? `${s.vw} × ${s.vh || '?'}${s.dpr ? ' · ' + s.dpr + 'x' : ''} <span class="dun">${esc(schermNaam(s.vw))}</span>` : null], ['Taal', esc(s.lang)], ['Taal van de site', s.taal ? (s.taal === 'en' ? 'Engels' : 'Nederlands') : null], ['Tijdzone', esc(s.tz)], ['Land', esc(landNaam(s.land))], ['Verbinding', s.net ? esc(String(s.net).toUpperCase()) : null], ['Donkere modus', s.dark == null ? null : s.dark ? 'Ja' : 'Nee'],
        ['Gekoppeld aan mail', s.contact ? ent('c', s.contact.token, s.contact.naamKort) + (s.mailZeker ? '' : ' <span class="dun">vermoedelijk, op tijdstip van de klik</span>') : null], ['Bezoeker', `<span class="mono">${esc(s.vid)}</span>`], ['Sessie', `<span class="mono">${esc(s.id)}</span>`]]))
    + (s.perf.length ? kaart('Laadtijd', `<div class="tb"><table><thead><tr><th>Pagina</th><th class="r">Server</th><th class="r">Zichtbaar</th><th class="r">Reactie</th><th class="r">Geladen</th></tr></thead><tbody>${s.perf.map(e => `<tr><td>${esc(paginaNaam(e.p.p || e.page))}</td><td class="r">${msTekst(e.p.ttfb)}</td><td class="r">${snelTag(e.p.lcp == null ? null : +e.p.lcp, 2500, 4000)}</td><td class="r">${e.p.inp == null ? '–' : snelTag(+e.p.inp, 200, 500)}</td><td class="r">${msTekst(e.p.load)}</td></tr>`).join('')}</tbody></table></div>`) : '') };
};

/* ===================== Bezoeker ===================== */
PANEEL.b = id => {
  const b = D.BEZ.get(id); if (!b) return null; const intern = D.intern.has(b.vid), views = b.ses.flatMap(s => s.views);
  return { soort: 'Bezoeker', html: () => pKop(b.naam, [tagWie(b.klasse) + (b.reden ? ` <span class="sub">${esc(b.reden)}</span>` : ''), esc(apparaatTekst({ app: b.mobile == null ? null : b.mobile ? 'Mobiel' : 'Desktop', browser: b.browser, os: b.os })), esc(landNaam(b.land))],
      [b.contact ? pKnop('c:' + b.contact.token, 'Ontvanger') : '', `<button class="knop" data-intern="${esc(b.vid)}" data-aan="${intern ? 0 : 1}">${intern ? 'Niet meer intern' : 'Markeer als intern'}</button>`])
    + stats([[b.ses.length, b.ses.length === 1 ? 'sessie' : 'sessies'], [b.views, 'weergaven'], [duur(b.sec), 'op de site'], [b.reeksen.length, b.reeksen.length === 1 ? 'berekening' : 'berekeningen'], [fDagKort(b.eerst), 'eerste bezoek'], [fDagKort(b.laatst), 'laatst gezien']])
    + (b.doelen.size ? `<div class="rij onder">${doelTags(b.doelen)}</div>` : '')
    + kaart('Sessies', tijdlijn([...b.ses].reverse().map(s => ({ t: s.start, kl: s.doelen.has('aanvraag') || s.doelen.has('berekening') ? 'goed' : 'pag', open: 's:' + s.id, w: esc(routeTekst(s, 5) || 'Geen pagina'), sub: esc([duur(s.sec), s.views.length + (s.views.length === 1 ? ' pagina' : " pagina's"), s.bron, s.reeksen.length ? s.reeksen.length + (s.reeksen.length === 1 ? ' berekening' : ' berekeningen') : null].filter(Boolean).join(' · ')) })), { dagen: true }))
    + (b.reeksen.length ? kaart('Berekeningen', reeksLijst(b.reeksen)) : '')
    + kaart("Pagina's", balken([...groep(views, v => v.naam)].map(([k, vs]) => [k, vs.length, duur(som(vs, v => v.sec))]).sort((a, c) => c[1] - a[1]), { open: k => 'p:' + k, leeg: 'Geen weergaven' }))
    + kaart('Kenmerken', kv([['Eerste bron', esc(b.bron)], ['Scherm', b.vw ? b.vw + ' px breed <span class="dun">' + esc(schermNaam(b.vw)) + '</span>' : null], ['Taal', esc(b.lang)], ['Land', esc(landNaam(b.land))], ['Bekend via mail', b.contact ? ent('c', b.contact.token, b.contact.naamKort) + (b.mailZeker ? '' : ' <span class="dun">vermoedelijk</span>') : null], ['Bezoeker', `<span class="mono">${esc(b.vid)}</span>`]])) };
};
const reeksLijst = rs => `<div class="feed">${[...rs].sort((a, b) => b.t - a.t).map(r => `<a data-open="r:${esc(r.id)}"><span class="t">${esc(fKort(r.t))}</span><span class="w"><i class="punt" style="background:${r.goedkoper === 'e' ? KLEUR.volt : r.goedkoper === 'd' ? KLEUR.oranje : KLEUR.grijs}"></i><b>${esc(VT[r.vt] || r.vt)}</b>${r.modelNaam ? ' · ' + esc(r.modelNaam) : ''}${r.km ? ' · ' + nf.format(r.km) + ' km' : ''}</span><span class="sub">${esc(uitkomstTekst(r.goedkoper, r.verschil).replace(' per jaar goedkoper', ''))}</span></a>`).join('')}</div>`;

/* ===================== Ontvanger ===================== */
PANEEL.c = id => {
  const c = D.CONTACT.get(id); if (!c) return null;
  const items = [];
  if (c.toegevoegd) items.push({ t: c.toegevoegd, kl: 'klein', w: 'Toegevoegd aan de lijst', sub: c.bron ? 'bron: ' + esc(c.bron) : '' });
  for (const m of c.mails) {
    items.push({ t: m.t, kl: 'mail', w: `<b>${esc(mailNaam(m.v))} ${m.status === 'gepland' ? 'gepland' : 'verzonden'}</b>${m.test ? ' <span class="tag grijs">Test</span>' : ''}`, sub: esc([m.dienst ? 'via ' + dienstNaam(m.dienst) : null, m.c].filter(Boolean).join(' · ')), open: m.batch ? 'v:' + m.batch.key : null });
    if (m.status === 'bounce') items.push({ t: m.statusT && m.gebeurtenis === 'bounced' ? m.statusT : new Date(+m.t + 1000), kl: 'fout', w: '<b>Bounce</b>', sub: 'het adres bestaat niet of weigert de mail' });
    else if (m.status === 'bezorgd' && m.statusT) items.push({ t: new Date(Math.max(+m.statusT, +m.t + 1000)), kl: 'klein', w: 'Bezorgd' });
  }
  for (const k of c.kliks) items.push(k.soort === 'mens' ? { t: k.t, kl: 'goed', open: 'k:' + k.id, w: `<b>Klikte op ${esc(linkNaam(k.link))}</b>`, sub: k.na != null ? verschilTekst(k.na) + ' na verzending' : '' } : { t: k.t, kl: 'klein', open: 'k:' + k.id, w: `${k.soort === 'scanner' ? 'Scanner' : KLIKSOORT[k.soort]} opende ${esc(linkNaam(k.link))}`, sub: esc(k.reden || '') });
  for (const s of c.ses) items.push({ t: s.start, kl: 'pag', open: 's:' + s.id, w: 'Bezoek aan de site' + (s.klasse !== 'echt' ? ' ' + tagWie(s.klasse) : ''), sub: esc([routeTekst(s, 5), duur(s.sec)].filter(Boolean).join(' · ')) });
  for (const r of c.calc) items.push({ t: r.t, kl: 'goed', open: 'r:' + r.id, w: `<b>Berekening ${esc(VT[r.vt] || r.vt)}</b>`, sub: esc(uitkomstTekst(r.goedkoper, r.verschil)) });
  for (const a of c.afm) items.push({ t: a.t, kl: 'fout', w: '<b>Afgemeld</b>' });
  if (c.afgemeld && !c.afm.length) items.push({ t: c.afgemeld, kl: 'fout', w: '<b>Afgemeld</b>' });
  items.sort((a, b) => a.t - b.t);
  const bez = [...new Set(c.ses.map(s => s.vid))];
  return { soort: c.test ? 'Testontvanger' : 'Ontvanger', html: () => pKop(c.naamKort, [c.email && c.email !== c.naamKort ? esc(c.email) : '', tagStap(c.stap) + (c.berekend ? ' <span class="tag goed">Berekening</span>' : ''), c.segment ? esc(c.segment) : ''],
      [...bez.map(v => pKnop('b:' + v, bez.length > 1 ? 'Bezoeker ' + v.slice(0, 6) : 'Bezoeker')), c.notion ? `<a class="knop" href="https://www.notion.so/${esc(String(c.notion).replace(/-/g, ''))}" target="_blank" rel="noopener">Open in Notion</a>` : '', c.email ? `<a class="knop" href="mailto:${esc(c.email)}">Mail sturen</a>` : ''])
    + stats([[c.echteMails.length || c.mails.length, 'mails'], [c.mensKliks.length, 'zelf geklikt'], [c.scanKliks.length, 'scannerkliks'], [c.bezoek.length, c.bezoek.length === 1 ? 'sessie' : 'sessies'], [c.bezoek.length ? duur(som(c.bezoek, s => s.sec)) : '–', 'op de site'], [c.calc.length, c.calc.length === 1 ? 'berekening' : 'berekeningen']])
    + kaart('Tijdlijn', tijdlijn(items, { dagen: true, sec: true, leeg: 'Nog niets gebeurd' }))
    + kaart('Gegevens', kv([['Bedrijf', esc(c.bedrijf)], ['Naam', esc(c.naam)], ['E-mail', esc(c.email)], ['Soort adres', esc(c.domeinSoort)], ['Segment', esc(c.segment)], ['Bron', esc(c.bron)], ['Toegevoegd', c.toegevoegd ? esc(fVol(c.toegevoegd)) : null], ['Kenmerk', `<span class="mono">${esc(c.token)}</span>`]])) };
};

/* ===================== Klik ===================== */
PANEEL.k = id => {
  const k = D.KLIK.get(String(id)); if (!k) return null; const c = k.contact, zc = k.zelfde.filter(x => x.c === k.c);
  const dichtst = (arr) => arr.length ? arr.reduce((a, b) => Math.abs(b.tp - k.tp) < Math.abs(a.tp - k.tp) ? b : a) : null;
  const ander = dichtst(k.zelfde.filter(x => x.link !== k.link)), app = dichtst(zc.filter(x => String(x.ua || '') !== String(k.ua || '')));
  const alle = [k, ...zc], eerste = Math.min(...alle.map(x => +x.t)), links = new Set(alle.map(x => x.link));
  const ses = c ? c.ses.find(s => s.start - k.t >= 0 && s.start - k.t < 120000) : null;
  const toets = [[k.bot, 'Herkend als bot aan de browser', ''], [ander && Math.abs(ander.t - k.t) < 5000, 'Andere knop binnen 5 seconden', ander ? verschilTekst(ander.tp - k.tp) + ' verschil' : 'geen andere knop'], [app && Math.abs(app.t - k.t) < 300000, 'Ander apparaat binnen 5 minuten', app ? verschilTekst(app.tp - k.tp) + ' verschil' : 'steeds hetzelfde apparaat'],
    [k.na != null && k.na < 300000, 'Binnen 5 minuten na verzending', k.na != null ? verschilTekst(k.na) + ' na verzending' : 'verzendtijd onbekend'], [links.size >= 2 && k.t - eerste <= 600000, 'Meerdere knoppen binnen 10 minuten', links.size + (links.size === 1 ? ' knop' : ' knoppen') + ' aangeklikt'], [!k.token, 'Geen ontvanger bekend', '']];
  return { soort: 'Mailklik', html: () => pKop(`${c ? c.naamKort : 'Onbekend'} · ${linkNaam(k.link)}`, [esc(fMs(k.tp)), tagKlik(k.soort), k.reden ? esc(k.reden) : ''], [c ? pKnop('c:' + c.token, 'Ontvanger') : '', ses ? pKnop('s:' + ses.id, 'Sessie die volgde') : '', k.mail && k.mail.batch ? pKnop('v:' + k.mail.batch.key, 'Verzending') : ''])
    + kaart(k.soort === 'mens' ? 'Waarom een mens' : 'Controle', `<ul class="toets">${toets.map(([ja, naam, w]) => `<li><span class="${ja ? 'ja' : 'nee'}">${ja ? '●' : '○'}</span><span>${esc(naam)}</span><span class="w">${esc(w)}</span></li>`).join('')}<li><span class="${ses ? 'vink' : 'nee'}">${ses ? '✓' : '○'}</span><span>Sessie met cookies binnen 2 minuten</span><span class="w">${ses ? 'telt daarom als mens' : 'geen'}</span></li></ul>`, { sub: k.intern ? 'vanaf een eigen netwerk' : k.test ? 'testmail' : '' })
    + kaart('Aangekomen op de site', k.land.length ? `<div class="tb"><table><thead><tr><th>Na de klik</th><th>Pagina</th><th>Cookies</th><th>Browser</th><th>Land</th></tr></thead><tbody>${k.land.map(e => `<tr${e.sid && D.SES.has(e.sid) ? ` data-open="s:${e.sid}"` : ''}><td class="nw">${verschilTekst(e.t - k.t)}</td><td>${esc(paginaNaam(e.page, e.p.hash))}</td><td>${e.consent === 'stat' ? 'Ja' : 'Nee'}</td><td>${esc([e.browser, e.os].filter(Boolean).join(' · ') || '–')}${e.ua === 'bot' || e.p.wd ? ' <span class="tag fout">bot</span>' : ''}</td><td>${esc(e.land || '')}</td></tr>`).join('')}</tbody></table></div>` : leeg('Geen paginaweergave binnen 30 seconden na de klik'))
    + (k.zelfde.length ? kaart('Andere kliks van deze ontvanger', `<div class="tb"><table><thead><tr><th>Tijd</th><th class="r">Verschil</th><th>Knop</th><th>Soort</th><th>Browser</th></tr></thead><tbody>${k.zelfde.slice(0, 40).map(x => `<tr data-open="k:${x.id}"><td class="nw">${esc(fKort(x.t))}</td><td class="r nw">${x.tp < k.tp ? '−' : '+'}${verschilTekst(x.tp - k.tp)}</td><td>${esc(linkNaam(x.link))}</td><td>${tagKlik(x.soort)}</td><td>${esc([uaBrowser(x.ua), uaOs(x.ua)].filter(Boolean).join(' · ') || '–')}${String(x.ua || '') !== String(k.ua || '') ? ' <span class="dun">ander</span>' : ''}</td></tr>`).join('')}</tbody></table></div>`, { sub: String(k.zelfde.length) }) : '')
    + kaart('Kenmerken', kv([['Knop', esc(linkNaam(k.link))], ['Mail', esc(mailNaam(k.v))], ['Campagne', esc(k.c)], ['Verzonden', k.mail ? esc(fVol(k.mail.t)) + (k.mail.dienst ? ' <span class="dun">via ' + esc(dienstNaam(k.mail.dienst)) + '</span>' : '') : null], ['Na verzending', k.na != null ? esc(verschilTekst(k.na)) : null], ['Browser', esc([uaBrowser(k.ua), uaOs(k.ua)].filter(Boolean).join(' · '))], ['User-agent', k.ua ? `<span class="ua">${esc(k.ua)}</span>` : null]])) };
};

/* ===================== Berekening ===================== */
const VELDGROEP = [['Gebruik', ['km', 'kmH', 'wd', 'jr']], ['Diesel', ['dw', 'dwl', 'dag', 'pD', 'bpmD', 'rw', 'ld', 'dp', 'oD', 'vD', 'wD', 'tD']], ['Elektrisch', ['nw', 'calcModel', 'eag', 'pE', 'rwE', 'le', 'acc', 'sp', 'xSp', 'ere', 'aERE', 'aSlim', 'oE', 'vE', 'wE', 'tE']], ['Subsidie', ['reg', 'gr', 'cls', 'subX']],
  ['Lease', ['lsD', 'lsE', 'lqD', 'lqE', 'lpD', 'lpE', 'lkD', 'lkE', 'lmD', 'lmE', 'loD', 'loE', 'lvD', 'lvE', 'lwD', 'lwE', 'lpC', 'lrC', 'lcO', 'lcV', 'lcW']], ['Financiering', ['xFin', 'xfs', 'xri', 'xre']], ['Laden', ['xLad', 'xl0', 'xla', 'xlo', 'xln', 'xOw', 'xos', 'xop', 'xot', 'xoh']], ['Zonnepanelen', ['xZon', 'xzk', 'xzs']]];
const veldToon = (k, v) => k === 'calcModel' ? esc(modelTekst(v) || '–') : esc(veldWaarde(k, v));
function invoerKaart(r) {
  const inv = r.laatste.invoer; if (!inv) return '';
  const anders = new Set(r.gewijzigd), aan = { Lease: inv.dw === 'l' || inv.nw === 'l' || inv.dwl === 'lease' || inv.lsD == 1 || inv.lsE == 1, Financiering: !!inv.xFin, Laden: !!inv.xLad || !!inv.xOw, Zonnepanelen: !!inv.xZon };
  const gezien = new Set(VELDGROEP.flatMap(g => g[1])), tol = Object.keys(inv).filter(k => /^k_/.test(k) && +inv[k] > 0), rest = Object.keys(inv).filter(k => !gezien.has(k) && !/^[kr]_/.test(k) && k !== 'mpQ' && veldNaam(k));
  const blok = (naam, keys, open) => { keys = keys.filter(k => inv[k] !== undefined); if (!keys.length) return ''; const n = keys.filter(k => anders.has(k)).length;
    return `<details${open ? ' open' : ''}><summary>${esc(naam)}${n ? `<span class="tag goed">${n} aangepast</span>` : ''}</summary>${kv(keys.map(k => [VELD[k] ? VELD[k][0] : veldNaam(k), veldToon(k, inv[k]), anders.has(k) ? 'anders' : '']))}</details>`; };
  const groepVan = k => (VELDGROEP.find(g => g[1].includes(k)) || [])[0];
  const gewijzigd = r.gewijzigd.filter(k => veldNaam(k) && inv[k] !== undefined && aan[groepVan(k)] !== false && !(k === 'calcModel' && !inv[k]) && !(/^l[sq][DE]$/.test(k) && !+inv[k]));
  return kaart('Aangepast door de bezoeker', gewijzigd.length ? kv(gewijzigd.map(k => [veldNaam(k), veldToon(k, inv[k])])) : leeg('Alles op de standaardwaarden gelaten'), { sub: gewijzigd.length ? gewijzigd.length + ' velden' : '' })
    + kaart('Alle invoer', VELDGROEP.map(([naam, keys]) => aan[naam] === false ? '' : blok(naam, keys, keys.some(k => anders.has(k)))).join('') + (tol.length ? blok('Kilometers in het buitenland', tol, true) : '') + blok('Overig', rest, false));
}
function verloopKaart(r) {
  if (r.runs.length < 2 && !r.laatste.invoer) return '';
  const items = r.runs.map((c, i) => {
    const v = r.runs[i - 1], diff = v && c.invoer && v.invoer ? Object.keys(c.invoer).filter(k => !/^r_/.test(k) && veldNaam(k) && String(c.invoer[k]) !== String(v.invoer[k])) : [];
    return { t: c.t, kl: i === 0 ? 'pag' : diff.length ? '' : 'klein', w: i === 0 ? (c.trigger === 'invulvenster' ? 'Invulvenster afgerond' : 'Eerste stand') : diff.length ? diff.slice(0, 6).map(k => `${esc(veldNaam(k))}: <span class="dun">${veldToon(k, v.invoer[k])}</span> → <b>${veldToon(k, c.invoer[k])}</b>`).join('<br>') + (diff.length > 6 ? `<br><span class="dun">en nog ${diff.length - 6}</span>` : '') : v && v.modus !== c.modus ? (c.modus === 'uitgebreid' ? 'Uitgebreid geopend' : 'Terug naar simpel') : c.trigger === 'invulvenster' ? 'Invulvenster opnieuw afgerond' : 'Opnieuw bewaard',
      sub: i === 0 || diff.length ? esc(uitkomstTekst(c.goedkoper, c.verschil) + (c.modus === 'uitgebreid' ? ' · uitgebreid' : '')) : '' };
  });
  return kaart('Verloop', tijdlijn(items, { sec: true, gaten: true }), { sub: r.n + (r.n === 1 ? ' stand' : ' standen') + (r.duur >= 1 ? ' in ' + duur(r.duur) : '') });
}
PANEEL.r = id => {
  const r = D.REEKS.get(id); if (!r) return null; const l = r.laatste, u = l.uitkomst || {}, v = l.voertuig || {}, kd = v.kenteken_diesel, ke = v.kenteken_elektrisch, ls = v.lease || {};
  const kent = k => k ? esc([k.merk, k.model, k.jaar, k.euro ? 'Euro ' + k.euro : null, k.catalogusprijs ? 'catalogusprijs ' + euro(k.catalogusprijs) : null].filter(Boolean).join(' · ')) : null;
  const wie = r.contact ? r.contact.naamKort : r.ses ? 'Bezoeker ' + r.ses.vid.slice(0, 8) : 'Zonder cookies';
  return { soort: 'Berekening', html: () => pKop([VT[r.vt] || r.vt, r.modelNaam].filter(Boolean).join(' · '), [esc(fVol(r.t)), tagUitkomst(r.goedkoper), esc(wie), tagWie(r.klasse)],
      [r.ses ? pKnop('s:' + r.ses.id, 'Sessie') : '', r.ses ? pKnop('b:' + r.ses.vid, 'Bezoeker') : '', r.contact ? pKnop('c:' + r.contact.token, 'Ontvanger') : ''])
    + (u.diesel_jaar != null ? `<div class="vergelijk"><div class="${r.goedkoper === 'd' ? 'win d' : ''}"><div class="l">Diesel per jaar</div><div class="n">${euro(u.diesel_jaar)}</div><div class="sub">${u.diesel_km != null ? '€ ' + String(u.diesel_km).replace('.', ',') + ' per km' : ''}</div></div><div class="${r.goedkoper === 'e' ? 'win' : ''}"><div class="l">Elektrisch per jaar</div><div class="n">${euro(u.elektrisch_jaar)}</div><div class="sub">${u.elektrisch_km != null ? '€ ' + String(u.elektrisch_km).replace('.', ',') + ' per km' : ''}</div></div></div>` : '')
    + stats([[r.verschil == null ? '–' : euro(Math.abs(r.verschil)), r.goedkoper === 'd' ? 'diesel goedkoper per jaar' : 'elektrisch goedkoper per jaar'], ...(u.pct != null ? [[String(Math.abs(u.pct)).replace('.', ',') + '%', 'verschil']] : []), [n0(r.km), 'km per jaar'], [r.jaren ? r.jaren + ' jaar' : '–', 'afschrijving'],
        ...(u.terugverdien_jaar != null ? [[n1(u.terugverdien_jaar) + ' jaar', 'terugverdientijd']] : []), ...(u.meerprijs != null ? [[euro(u.meerprijs), 'meerprijs elektrisch']] : []), ...(u.besparing_gebruik_jaar != null ? [[euro(u.besparing_gebruik_jaar), 'besparing in gebruik per jaar']] : []), ...(u.goedkoper_vanaf_km != null ? [[n0(u.goedkoper_vanaf_km) + ' km', 'elektrisch goedkoper vanaf']] : []), ...(u.co2_ton != null ? [[String(u.co2_ton).replace('.', ',') + ' ton', 'CO₂ minder per jaar']] : [])])
    + (u.diesel ? kaart('Kosten per jaar', paarBalken(KOSTEN.map(([k, nm]) => [nm, +u.diesel[k] || 0, +(u.elektrisch || {})[k] || 0]))) : D.beperkt ? '<div class="melding">Invoer en kostenopbouw komen beschikbaar zodra de nieuwe gegevensfunctie in Supabase staat.</div>' : '')
    + kaart('Voertuig', kv([['Soort', esc(VT[r.vt] || r.vt)], ['Elektrisch model', esc(r.modelNaam)], ['Diesel', v.diesel ? (v.diesel === 'huidig' ? 'Huidige houden' : 'Nieuw') : null], ['Elektrisch', v.elektrisch ? (v.elektrisch === 'gebruikt' ? 'Gebruikt' : 'Nieuw') : null], ['Lease diesel', ls.diesel ? esc(String(ls.diesel)) + (ls.diesel_maand ? ' · ' + euro(ls.diesel_maand) + ' per maand' : '') : null], ['Lease elektrisch', ls.elektrisch ? esc(String(ls.elektrisch)) + (ls.elektrisch_maand ? ' · ' + euro(ls.elektrisch_maand) + ' per maand' : '') : null],
        ['Kenteken diesel', kent(kd)], ['Kenteken elektrisch', kent(ke)], ['Tol buitenland', (v.tol || []).length ? esc(v.tol.map(t => typeof t === 'string' ? t.toUpperCase() : (t.land || t.id || '')).join(', ')) : null], ['Weergave', r.modus === 'uitgebreid' ? 'Uitgebreid' : 'Simpel'], ['Bron', esc(r.bron)], ['Apparaat', esc(r.app)]]))
    + invoerKaart(r) + verloopKaart(r) };
};

/* ===================== Pagina ===================== */
PANEEL.p = naam => {
  const { B, S, A } = X, views = S.flatMap(s => s.views.filter(v => v.naam === naam)), an = A.filter(e => e.naam === naam), ses = S.filter(s => s.views.some(v => v.naam === naam));
  if (!views.length && !an.length && ![...D.SES.values()].some(s => s.views.some(v => v.naam === naam)) && !D.ANON.some(e => e.naam === naam)) return null;
  const tijden = views.filter(v => v.leave).map(v => v.sec), van = [], naar = [];
  for (const s of ses) s.route.forEach((p, i) => { if (p !== naam) return; van.push(i ? s.route[i - 1] : 'Begin van de sessie'); naar.push(i + 1 < s.route.length ? s.route[i + 1] : 'Einde van de sessie'); });
  const kl = ses.flatMap(s => s.ev.filter(e => e.ev === 'klik' && paginaNaam(e.p.p || e.page) === naam));
  return { soort: 'Pagina', html: () => pKop(naam, [esc(X.B.naam), esc(WIE[F.wie] || 'Iedereen')], [`<button class="knop" data-dim="pagina" data-w="${esc(naam)}">Filter het dashboard op deze pagina</button>`])
    + stats([[nf.format(views.length + an.length), 'weergaven'], [nf.format(ses.length), 'sessies'], [tijden.length ? duur(gem(tijden)) : '–', 'gemiddelde tijd'], [tijden.length ? duur(mediaan(tijden)) : '–', 'mediaan'], [views.some(v => v.leave) ? Math.round(gem(views.filter(v => v.leave), v => v.depth)) + '%' : '–', 'gescrold'], [nf.format(ses.filter(s => s.instap === naam).length), 'keer instap'], [proc(ses.filter(s => s.uitstap === naam).length, ses.length, 0), 'eindigde hier']])
    + kaart('Weergaven', staven({ labels: B.b, h: 180, series: [{ naam: 'Met cookies', kleur: KLEUR.volt, vals: reeks(B, views) }, { naam: 'Zonder cookies', kleur: KLEUR.voltM, vals: reeks(B, an) }] }))
    + kaart('Kwam van', balken(tel(van, x => x), { max: 7, open: k => /^Begin/.test(k) ? '' : 'p:' + k })) + kaart('Ging naar', balken(tel(naar, x => x), { max: 7, open: k => /^Einde/.test(k) ? '' : 'p:' + k, kleurVan: k => /^Einde/.test(k) ? KLEUR.grijs : KLEUR.volt }))
    + kaart('Bron van deze sessies', balken(tel([...ses, ...an], x => x.bron), { max: 6 }))
    + (kl.length ? kaart('Waar ze op klikken', balken(tel(kl, e => kort(e.p.el || e.p.id || e.p.tag || '?', 60)), { max: 10, pct: false })) : '')
    + kaart('Laatste sessies', ses.length ? `<div class="feed">${ses.slice(0, 15).map(s => `<a data-open="s:${s.id}"><span class="t">${esc(fKort(s.start))}</span><span class="w"><b>${esc(wieNaam(s))}</b> · ${esc(routeTekst(s, 4))}</span><span class="sub">${duur(som(s.views.filter(v => v.naam === naam), v => v.sec))}</span></a>`).join('')}</div>` : leeg('Geen sessies met cookies')) };
};

/* ===================== Verzending ===================== */
PANEEL.v = key => {
  const b = D.BATCH.get(key); if (!b) return null; const c = groepCijfers(b.mails), K = D.KLIKS.filter(k => k.mail && k.mail.batch === b);
  const reageerde = c.cs.filter(x => x.mensKliks.length || x.bezoek.length || x.afm.length || x.afgemeld);
  return { soort: 'Verzending', html: () => pKop(dagLang(b.d), [esc(b.dienst ? 'via ' + dienstNaam(b.dienst) : 'verzenddienst onbekend'), `${fTijd(b.t0)} – ${fTijd(b.t1)}`, `${c.a} keer mail A, ${c.b} keer mail B`], [`<button class="knop" data-b="${b.d}:${b.d}">Bekijk deze dag in het dashboard</button>`])
    + stats([[nf.format(b.mails.length), 'mails'], [proc(c.bezorgd, c.n), 'bezorgd'], [c.bounce, 'bounce'], [c.klik, 'klikten zelf'], [c.scan, 'door scanner geopend'], [c.site, 'op de site'], [c.calc, 'maakten een berekening'], [c.afm, 'afgemeld']])
    + kaart('Van mail tot berekening', mailTrechter(c))
    + kaart('Wie reageerde', reageerde.length ? `<div class="feed">${reageerde.map(x => `<a data-open="c:${x.token}"><span class="t">${esc(fKort(x.laatst))}</span><span class="w"><b>${esc(x.naamKort)}</b></span><span class="sub">${tagStap(x.stap)}</span></a>`).join('')}</div>` : leeg('Nog niemand klikte zelf, kwam naar de site of meldde zich af'))
    + (K.length ? kaart('Kliks na deze verzending', perKnop(K) + '<h3>Hoe snel</h3>' + naVerzending(K)) : '')
    + tabelKaart('Ontvangers', { id: 'p-batch', rows: b.mails, sort: '0', per: 25, open: m => 'c:' + m.token, zoek: m => m.contact.naamKort + ' ' + (m.contact.email || ''), cols: [{ t: 'Tijd', nw: true, v: m => +m.t, h: m => fTijd(m.t) }, { t: 'Ontvanger', v: m => m.contact.naamKort, h: m => `<span class="hfd">${esc(kort(m.contact.naamKort, 34))}</span>` }, { t: 'Mail', v: m => m.v, h: m => esc(String(m.v || '').toUpperCase()) }, { t: 'Status', v: m => m.status, h: tagMail }, { t: 'Stap', v: m => m.contact.stap, h: m => tagStap(m.contact.stap) }] }) };
};

/* ===================== Aanvraag ===================== */
PANEEL.a = id => {
  const a = D.AANVR.find(x => String(x.id) === String(id)); if (!a) return null;
  const c = a.email ? [...D.CONTACT.values()].find(x => x.email && x.email.toLowerCase() === String(a.email).toLowerCase()) : null;
  const ses = [...D.SES.values()].filter(s => s.doelen.has('aanvraag') && Math.abs(s.eind - a.t) < 30 * 60000 && s.start - a.t < 60000).sort((x, y) => Math.abs(x.eind - a.t) - Math.abs(y.eind - a.t))[0];
  return { soort: 'Aanvraag vlootanalyse', html: () => pKop(a.company || 'Aanvraag', [esc(fVol(a.t)), a.status ? `<span class="tag ${a.status === 'nieuw' ? 'let' : ''}">${esc(a.status)}</span>` : ''], [ses ? pKnop('s:' + ses.id, 'Sessie') : '', c ? pKnop('c:' + c.token, 'Ontvanger') : '', a.email ? `<a class="knop" href="mailto:${esc(a.email)}">Mail sturen</a>` : '', a.calc_link ? `<a class="knop" href="${esc(a.calc_link)}" target="_blank" rel="noopener">Open de berekening</a>` : ''])
    + kaart('Gegevens', kv([['Bedrijf', esc(a.company)], ['Contact', esc(a.contact_name)], ['E-mail', esc(a.email)], ['Telefoon', esc(a.phone)], ['Grootte van de vloot', esc(a.fleet_size)], ['Bericht', a.message ? esc(a.message).replace(/\n/g, '<br>') : null]]))
    + (ses ? kaart('Wat eraan voorafging', tijdlijn(sessieItems(ses), { sec: true, gaten: true })) : '') };
};
