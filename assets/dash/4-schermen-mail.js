/* Dashboard · schermen voor de e-mailcampagne */
'use strict';
Object.assign(U, { stap: '', klik: 'mens', mailLijst: '' });
const KLIKKLEUR = { mens: KLEUR.volt, scanner: KLEUR.grijs, intern: KLEUR.licht, test: KLEUR.licht };
const KLIKREEKS = [['Mensen', KLEUR.volt, k => k.soort === 'mens'], ['Scanners', KLEUR.grijs, k => k.soort === 'scanner'], ['Intern of test', KLEUR.licht, k => k.soort === 'intern' || k.soort === 'test']];
const contactenVan = V => [...new Set(V.map(m => m.token))].map(t => D.CONTACT.get(t)).filter(Boolean);
const proc = (a, b, d = 1) => b ? pct(a, b, d) : '–';

/* Kans dat het verschil tussen twee aandelen toeval is (tweezijdige z-toets) */
function zToets(a, na, b, nb) {
  if (!na || !nb) return null; const p = (a + b) / (na + nb), se = Math.sqrt(p * (1 - p) * (1 / na + 1 / nb)); if (!se) return null;
  const z = Math.abs(a / na - b / nb) / se, t = 1 / (1 + .3275911 * z / Math.SQRT2), erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-z * z / 2);
  return 1 - erf;
}
const zeker = p => p == null ? '' : p < .05 ? 'Verschil is betrouwbaar' : p < .2 ? 'Verschil is een aanwijzing' : 'Verschil kan toeval zijn';

/* Cijfers van een groep mails, per ontvanger geteld */
function groepCijfers(V) {
  const c = mailCijfers(V);
  return { ...c, mails: V.length, a: V.filter(m => m.v === 'a').length, b: V.filter(m => m.v === 'b').length, gepland: V.filter(m => m.status === 'gepland').length, scan: c.cs.filter(x => x.scanKliks.length).length };
}
const cijferKolommen = () => [
  { t: 'Mails', r: true, v: r => r.n, h: r => nf.format(r.n) },
  { t: 'Bezorgd', r: true, nw: true, v: r => r.n ? r.bezorgd / r.n : null, h: r => `${proc(r.bezorgd, r.n)} <span class="dun">· ${nf.format(r.bezorgd)}</span>` },
  { t: 'Bounce', r: true, nw: true, v: r => r.n ? r.bounce / r.n : null, h: r => r.bounce ? `<span class="${r.bounce / r.n > .05 ? 'neer' : ''}">${proc(r.bounce, r.n)}</span> <span class="dun">· ${r.bounce}</span>` : '<span class="dun">0</span>' },
  { t: 'Klikkers', r: true, nw: true, tip: 'Ontvangers die zelf op een knop klikten, zonder scanners', v: r => r.n ? r.klik / r.n : null, h: r => r.klik ? `<b>${r.klik}</b> <span class="dun">· ${proc(r.klik, r.n)}</span>` : '<span class="dun">0</span>' },
  { t: 'Op de site', r: true, v: r => r.site, h: r => r.site || '<span class="dun">0</span>' },
  { t: 'Berekening', r: true, v: r => r.calc, h: r => r.calc || '<span class="dun">0</span>' },
  { t: 'Afgemeld', r: true, nw: true, v: r => r.n ? r.afm / r.n : null, h: r => r.afm ? `${r.afm} <span class="dun">· ${proc(r.afm, r.n)}</span>` : '<span class="dun">0</span>' }];
const klikStaven = (B, K, o = {}) => { const series = KLIKREEKS.map(([naam, kleur, f]) => ({ naam, kleur, vals: reeks(B, K.filter(f)) })); return staven({ labels: B.b, klik: true, series, ...o }) + legenda(KLIKREEKS.map(r => [r[0], r[1]])); };
const NA_VAKKEN = [['<1 min', 60e3], ['1–5 min', 300e3], ['5–30 min', 1800e3], ['30 min–2 u', 7200e3], ['2–8 u', 28800e3], ['8–24 u', 86400e3], ['1–3 d', 259200e3], ['3 d+', Infinity]];
function naVerzending(K) {
  const metNa = K.filter(k => k.na != null && k.na >= 0), series = KLIKREEKS.slice(0, 2).map(([naam, kleur, f]) => ({ naam, kleur, vals: NA_VAKKEN.map(([, g], i) => metNa.filter(k => f(k) && k.na < g && (i === 0 || k.na >= NA_VAKKEN[i - 1][1])).length) }));
  return staven({ labels: NA_VAKKEN.map(([k]) => ({ kort: k, label: k + ' na verzending' })), series, h: 190, breed: 40, labelBreedte: 62, leeg: 'Nog geen kliks' }) + legenda(KLIKREEKS.slice(0, 2).map(r => [r[0], r[1]]));
}
const perKnop = K => stapel(tel(K, k => linkNaam(k.link)).map(([naam]) => [naam, KLIKREEKS.map(([, , f]) => K.filter(k => linkNaam(k.link) === naam && f(k)).length)]), KLIKREEKS.map(r => [r[0], r[1]]), { leeg: 'Nog geen kliks', abs: true });

/* ===================== Campagne ===================== */
SCHERMEN.campagne = { titel: 'Campagne', mail: true, html() {
  const { B, V, K, KM, vorig } = X, c = groepCijfers(V), cv = groepCijfers(vorig.V), cs = c.cs;
  const seg = [...groep(V, m => (m.contact && m.contact.segment) || 'onbekend')].map(([k, ms]) => ({ k, ...groepCijfers(ms) }));
  const actief = cs.filter(x => x.mensKliks.length || x.bezoek.length).sort((a, b) => b.laatst - a.laatst);
  if (!c.n && !K.length) return leeg('Geen mails of kliks in deze periode');
  return `<section class="kpis k7">
    ${kpi('Ontvangers', nf.format(c.n), { d: [c.n, cv.n], spark: reeks(B, V), kleur: '#4A5158', sub: c.mails !== c.n ? nf.format(c.mails) + ' mails' : '', ga: 'verzendingen' })}
    ${kpi('Bezorgd', proc(c.bezorgd, c.n), { sub: nf.format(c.bezorgd) + ' ontvangers' })}
    ${kpi('Bounce', proc(c.bounce, c.n), { d: [c.n ? c.bounce / c.n : 0, cv.n ? cv.bounce / cv.n : 0, true], sub: nf.format(c.bounce) + ' adressen' })}
    ${kpi('Klikkers', nf.format(c.klik), { d: [c.klik, cv.klik], sub: proc(c.klik, c.bezorgd) + ' van bezorgd', ga: 'kliks', tip: 'Ontvangers die zelf klikten. Scanners van mailprogramma\'s tellen niet mee.' })}
    ${kpi('Op de site', nf.format(c.site), { d: [c.site, cv.site], sub: proc(c.site, c.bezorgd) + ' van bezorgd', ga: 'ontvangers' })}
    ${kpi('Berekening', nf.format(c.calc), { d: [c.calc, cv.calc], sub: c.site ? proc(c.calc, c.site, 0) + ' van wie kwam' : '' })}
    ${kpi('Afgemeld', nf.format(c.afm), { d: [c.afm, cv.afm, true], sub: proc(c.afm, c.bezorgd) + ' van bezorgd' })}
  </section>
  <div class="g2">
    ${kaart('Kliks in de tijd', klikStaven(B, K, { h: 240, extra: i => [['Mails verzonden', nf.format(reeks(B, V)[i])]] }), { sub: nf.format(K.length) + ' kliks, waarvan ' + nf.format(KM.length) + ' van mensen' })}
    ${kaart('Van mail tot berekening', c.n ? mailTrechter(c) : leeg('Geen mails verzonden in deze periode'), { sub: 'ontvangers' })}
  </div>
  <div class="g3">
    ${kaart('Per knop in de mail', perKnop(K))}
    ${kaart('Hoe snel na verzending', naVerzending(K))}
    ${kaart('Waar ontvangers nu staan', balken(tel(cs, x => x.stap), { kleurVan: k => k === 'Op de site' || k === 'Geklikt' ? KLEUR.volt : k === 'Afgemeld' || k === 'Bounce' ? KLEUR.rood : '#94A3B8' }), { acties: '<a class="knop mini" href="#/ontvangers">Ontvangers</a>' })}
  </div>
  <div class="g21">
    ${tabelKaart('Per segment', { id: 'segmenten', rows: seg, sort: '-1', cols: [{ t: 'Segment', v: r => r.k, h: r => `<span class="hfd">${esc(r.k)}</span>` }, ...cijferKolommen()] }, { sub: '' })}
    ${kaart('Wie reageerde', actief.length ? `<div class="feed">${actief.slice(0, 10).map(x => `<a data-open="c:${x.token}"><span class="t">${esc(fKort(x.laatst))}</span><span class="w"><i class="punt" style="background:${x.bezoek.length ? KLEUR.volt : KLEUR.oranje}"></i><b>${esc(x.naamKort)}</b></span><span class="sub">${x.berekend ? 'berekening' : x.bezoek.length ? 'op de site' : 'geklikt'}</span></a>`).join('')}</div>` : leeg('Nog niemand klikte zelf of kwam naar de site'), { sub: actief.length ? actief.length + ' ontvangers' : '' })}
  </div>
  <div class="g2">
    ${kaart('Wanneer mensen klikken', KM.length ? weekRooster(KM) : leeg('Nog geen kliks van mensen'))}
    ${kaart('Wanneer verzonden', weekRooster(V))}
  </div>`;
} };

/* ===================== Verzendingen ===================== */
const mailRij = () => [
  { t: 'Verzonden', nw: true, v: m => +m.t, h: m => fKort(m.t) }, { t: 'Ontvanger', v: m => m.contact.naamKort, h: m => `<span class="hfd">${esc(m.contact.naamKort)}</span>${m.contact.email && m.contact.email !== m.contact.naamKort ? `<span class="sub" style="display:block">${esc(m.contact.email)}</span>` : ''}`, x: m => m.contact.naamKort },
  { t: 'E-mail', verborgen: true, x: m => m.contact.email || '' }, { t: 'Mail', v: m => m.v, h: m => esc(mailNaam(m.v)) }, { t: 'Via', v: m => m.dienst || '', h: m => esc(m.dienst ? dienstNaam(m.dienst) : '–') }, { t: 'Status', v: m => m.status, h: tagMail },
  { t: 'Stap', v: m => m.contact.stap, h: m => tagStap(m.contact.stap) }, { t: 'Kliks', r: true, tip: 'Zelf geklikt, met scanners erachter', v: m => m.contact.mensKliks.length, h: m => (m.contact.mensKliks.length ? `<b>${m.contact.mensKliks.length}</b>` : '') + (m.contact.scanKliks.length ? ` <span class="dun">${m.contact.mensKliks.length ? '+ ' : ''}${m.contact.scanKliks.length} scanner</span>` : '') }];
SCHERMEN.verzendingen = { titel: 'Verzendingen', mail: true, html() {
  const { B, V, vorig } = X, c = groepCijfers(V), nu = Date.now();
  const batches = [...groep(V, m => m.batch ? m.batch.key : null)].map(([key, ms]) => ({ key, batch: D.BATCH.get(key), ...groepCijfers(ms), n: ms.length, t0: ms[0].t, t1: ms[ms.length - 1].t }));
  const perDienst = [...groep(V, m => m.dienst || 'onbekend')].map(([k, ms]) => ({ k, ...groepCijfers(ms) }));
  const perDomein = [...groep(V, m => (m.contact.domeinSoort || 'Onbekend').replace(/ \(.*/, ''))].map(([k, ms]) => ({ k, ...groepCijfers(ms) }));
  const uren = Array.from({ length: 24 }, (_, h) => V.filter(m => m.h === h)), u0 = Math.max(0, uren.findIndex(a => a.length) - 1), u1 = Math.min(23, 24 - [...uren].reverse().findIndex(a => a.length));
  const gepland = D.MAILS.filter(m => !m.test && m.status === 'gepland' && mailOk(m)), tests = D.MAILS.filter(m => m.test && B.in(m));
  const diensten = [['resend', 'Resend', '#4A5158'], ['brevo', 'Brevo', KLEUR.blue], [null, 'Onbekend', KLEUR.licht]].filter(([d]) => V.some(m => (m.dienst || null) === d));
  const lijst = U.mailLijst ? V.filter(m => m.status === U.mailLijst) : V;
  return `<section class="kpis">
    ${kpi('Mails verzonden', nf.format(V.length), { d: [V.length, vorig.V.length], spark: reeks(B, V), kleur: '#4A5158', sub: batches.length + (batches.length === 1 ? ' verzending' : ' verzendingen') })}
    ${kpi('Bezorgd', proc(c.bezorgd, c.n), { sub: nf.format(c.bezorgd) + ' ontvangers' })}
    ${kpi('Bounce', proc(c.bounce, c.n), { sub: nf.format(c.bounce) + ' adressen' })}
    ${kpi('Nog onderweg', nf.format(V.filter(m => m.status === 'verstuurd' && !m.bezorgd).length), { tip: 'Verstuurd, nog geen bericht van bezorging' })}
    ${kpi('Gepland', nf.format(gepland.length), { sub: gepland.length ? 'eerste ' + fKort(Math.min(...gepland.map(m => +m.gepland))) : '' })}
    ${kpi('Mail A en B', `${nf.format(c.a)}<small>/ ${nf.format(c.b)}</small>`, { ga: 'ab' })}
  </section>
  <div class="g21">
    ${kaart('Verzonden mails', staven({ labels: B.b, klik: true, h: 230, series: diensten.map(([d, naam, kleur]) => ({ naam, kleur, vals: reeks(B, V.filter(m => (m.dienst || null) === d)) })) }) + legenda(diensten.map(d => [d[1], d[2]])))}
    ${kaart('Tijdstip van verzenden', staven({ labels: uren.slice(u0, u1 + 1).map((_, i) => ({ kort: String(u0 + i).padStart(2, '0'), label: String(u0 + i).padStart(2, '0') + ':00 – ' + String(u0 + i + 1).padStart(2, '0') + ':00' })), series: [{ naam: 'Mails', kleur: '#4A5158', vals: uren.slice(u0, u1 + 1).map(a => a.length) }], h: 230, labelBreedte: 30, extra: i => { const g = groepCijfers(uren[u0 + i]); return [['Klikkers', String(g.klik)], ['Op de site', String(g.site)]]; } }))}
  </div>
  ${tabelKaart('Per verzending', { id: 'batches', rows: batches, sort: '-0', per: 30, open: r => 'v:' + r.key, leeg: 'Geen mails verzonden in deze periode', cols: [
      { t: 'Dag', nw: true, v: r => +r.t0, h: r => `<span class="hfd">${esc(dagLang(r.batch.d))}</span> <span class="dun">${fTijd(r.t0)}–${fTijd(r.t1)}</span>`, x: r => dagIso(r.batch.d) }, { t: 'Via', v: r => r.batch.dienst || '', h: r => esc(r.batch.dienst ? dienstNaam(r.batch.dienst) : '–') },
      { t: 'A / B', r: true, nw: true, v: r => r.a, h: r => `${r.a} / ${r.b}`, x: r => r.a + ' / ' + r.b }, ...cijferKolommen()] })}
  <div class="g2">
    ${tabelKaart('Resend en Brevo', { id: 'diensten', rows: perDienst, sort: '-1', cols: [{ t: 'Via', v: r => r.k, h: r => `<span class="hfd">${esc(dienstNaam(r.k))}</span>` }, ...cijferKolommen().filter(c => c.t !== 'Berekening')] }, { sub: '', csv: false })}
    ${tabelKaart('Soort adres', { id: 'domeinen', rows: perDomein, sort: '-1', cols: [{ t: 'Adres', nw: true, v: r => r.k, h: r => `<span class="hfd">${esc(r.k)}</span>` }, ...cijferKolommen().filter(c => c.t !== 'Berekening')] }, { sub: '', csv: false })}
  </div>
  ${gepland.length ? tabelKaart('Gepland', { id: 'gepland', rows: gepland, sort: '0', per: 15, open: m => 'c:' + m.token, zoek: m => m.contact.naamKort + ' ' + m.contact.email, cols: [{ t: 'Gepland voor', nw: true, v: m => +m.gepland, h: m => fVol(m.gepland) }, ...mailRij().slice(1, 5)] }) : ''}
  ${tabelKaart('Alle mails', { id: 'mails', rows: lijst, sort: '-0', per: 40, open: m => 'c:' + m.token, zoek: m => [m.contact.naamKort, m.contact.email, m.contact.segment].join(' '), leeg: 'Geen mails in deze selectie', cols: mailRij() },
    { acties: segU('mailLijst', [['', 'Alle', V.length], ['bezorgd', 'Bezorgd', V.filter(m => m.status === 'bezorgd').length], ['verstuurd', 'Verstuurd', V.filter(m => m.status === 'verstuurd').length], ['bounce', 'Bounce', V.filter(m => m.status === 'bounce').length]]) })}
  ${tests.length ? tabelKaart('Testmails', { id: 'testmails', rows: tests, sort: '-0', per: 10, open: m => 'c:' + m.token, cols: [{ t: 'Verzonden', nw: true, v: m => +m.t, h: m => fKort(m.t) }, { t: 'Naar', v: m => m.contact.email || m.contact.naamKort }, { t: 'Campagne', v: m => m.c }, { t: 'Mail', v: m => m.v, h: m => esc(mailNaam(m.v)) }, { t: 'Status', v: m => m.status, h: tagMail }] }) : ''}`;
} };

/* ===================== Ontvangers ===================== */
SCHERMEN.ontvangers = { titel: 'Ontvangers', mail: true, html() {
  const { V } = X, cs = contactenVan(V), nooit = [...D.CONTACT.values()].filter(c => !c.test && !c.echteMails.length);
  const volgorde = ['Op de site', 'Geklikt', 'Verstuurd', 'Gepland', 'Afgemeld', 'Bounce'], n = Object.fromEntries(tel(cs, c => c.stap));
  const lijst = U.stap === 'Niet gemaild' ? nooit : U.stap === 'berekend' ? cs.filter(c => c.berekend) : U.stap ? cs.filter(c => c.stap === U.stap) : cs;
  return `<section class="kpis">
    ${kpi('Ontvangers', nf.format(cs.length), { sub: nooit.length ? nf.format(nooit.length) + ' nog niet gemaild' : '' })}
    ${kpi('Zelf geklikt', nf.format(cs.filter(c => c.mensKliks.length).length), { sub: proc(cs.filter(c => c.mensKliks.length).length, cs.length) })}
    ${kpi('Op de site', nf.format(cs.filter(c => c.bezoek.length).length), { sub: proc(cs.filter(c => c.bezoek.length).length, cs.length) })}
    ${kpi('Berekening gemaakt', nf.format(cs.filter(c => c.berekend).length))}
    ${kpi('Afgemeld', nf.format(n['Afgemeld'] || 0), { sub: proc(n['Afgemeld'] || 0, cs.length) })}
    ${kpi('Bounce', nf.format(n['Bounce'] || 0), { sub: proc(n['Bounce'] || 0, cs.length) })}
  </section>
  ${tabelKaart('Ontvangers', { id: 'ontvangers', rows: lijst, sort: '-10', per: 50, open: c => 'c:' + c.token, zoek: c => [c.bedrijf, c.email, c.naam, c.segment].join(' '), leeg: 'Geen ontvangers in deze selectie', cols: [
      { t: 'Bedrijf', v: c => c.naamKort, h: c => `<span class="hfd">${esc(c.naamKort)}</span>${c.email && c.email !== c.naamKort ? `<span class="sub" style="display:block">${esc(c.email)}</span>` : ''}`, x: c => c.naamKort }, { t: 'E-mail', verborgen: true, x: c => c.email || '' }, { t: 'Naam', verborgen: true, x: c => c.naam || '' }, { t: 'Segment', v: c => c.segment || '' },
      { t: 'Stap', v: c => volgorde.indexOf(c.stap), h: c => tagStap(c.stap) + (c.berekend ? ' <span class="tag goed">Berekening</span>' : ''), x: c => c.stap },
      { t: 'Mail', nw: true, v: c => c.laatsteMail ? c.laatsteMail.v : '', h: c => c.laatsteMail ? `${esc(mailNaam(c.laatsteMail.v))} <span class="dun">· ${esc(c.laatsteMail.dienst ? dienstNaam(c.laatsteMail.dienst) : '–')}</span>` : '' },
      { t: 'Verzonden', nw: true, v: c => c.laatsteMail ? +c.laatsteMail.t : null, h: c => c.laatsteMail ? fKort(c.laatsteMail.t) : '–' },
      { t: 'Zelf geklikt', r: true, v: c => c.mensKliks.length, h: c => c.mensKliks.length ? `<b>${c.mensKliks.length}</b>` : '' }, { t: 'Scanner', r: true, v: c => c.scanKliks.length, h: c => c.scanKliks.length ? `<span class="dun">${c.scanKliks.length}</span>` : '' },
      { t: 'Laatste activiteit', nw: true, tip: 'Laatste klik, bezoek of afmelding van de ontvanger zelf', v: c => Math.max(0, ...c.mensKliks.map(k => +k.t), ...c.bezoek.map(s => +s.eind), ...c.afm.map(a => +a.t)) || null, h: c => { const t = Math.max(0, ...c.mensKliks.map(k => +k.t), ...c.bezoek.map(s => +s.eind), ...c.afm.map(a => +a.t)); return t ? fKort(t) : ''; } },
      { t: 'Sessies', r: true, v: c => c.bezoek.length, h: c => c.bezoek.length || '' }, { t: 'Tijd op site', r: true, nw: true, v: c => som(c.bezoek, s => s.sec), h: c => c.bezoek.length ? duur(som(c.bezoek, s => s.sec)) : '' }] },
    { acties: segU('stap', [['', 'Alle', cs.length], ...volgorde.filter(s => n[s]).map(s => [s, s, n[s]]), ...(cs.some(c => c.berekend) ? [['berekend', 'Berekening', cs.filter(c => c.berekend).length]] : []), ...(nooit.length ? [['Niet gemaild', 'Niet gemaild', nooit.length]] : [])]) })}`;
} };

/* ===================== Kliks ===================== */
SCHERMEN.kliks = { titel: 'Kliks', mail: true, html() {
  const { B, K, KM } = X, sc = K.filter(k => k.soort === 'scanner'), it = K.filter(k => k.soort === 'intern' || k.soort === 'test');
  const lijst = U.klik === 'mens' ? KM : U.klik === 'scanner' ? sc : U.klik === 'intern' ? it : K, naM = KM.map(k => k.na).filter(v => v != null);
  const geland = k => k.land.length > 0;
  return `<section class="kpis">
    ${kpi('Kliks', nf.format(K.length), { spark: reeks(B, K), kleur: KLEUR.grijs, sub: nf.format(uniek(K.filter(k => k.token), k => k.token)) + ' ontvangers' })}
    ${kpi('Van mensen', nf.format(KM.length), { spark: reeks(B, KM), sub: nf.format(uniek(KM, k => k.token)) + ' ontvangers' })}
    ${kpi('Van scanners', nf.format(sc.length), { sub: proc(sc.length, K.length, 0) + ' van alle kliks', tip: 'Mailprogramma\'s en beveiligingsfilters openen alle links om ze te controleren' })}
    ${kpi('Intern of test', nf.format(it.length))}
    ${kpi('Tijd tot klik', naM.length ? verschilTekst(mediaan(naM)) : '–', { sub: 'mediaan, mensen' })}
    ${kpi('Kwam op de site aan', proc(K.filter(geland).length, K.length, 0), { sub: nf.format(K.filter(geland).length) + ' kliks met een paginaweergave', tip: 'Scanners die de pagina niet echt laden, laten geen weergave achter' })}
  </section>
  <div class="g21">
    ${kaart('Kliks in de tijd', klikStaven(B, K, { h: 230 }))}
    ${kaart('Waarom een scanner', balken(tel(sc, k => k.reden), { kleur: KLEUR.grijs, leeg: 'Geen scanners', lang: true }) + '<h3>Hoe snel na verzending</h3>' + naVerzending(K))}
  </div>
  <div class="g3">
    ${kaart('Per knop in de mail', perKnop(K))}
    ${kaart('Browser', stapel(tel(K, k => uaBrowser(k.ua) || 'Onbekend').map(([naam]) => [naam, KLIKREEKS.map(([, , f]) => K.filter(k => (uaBrowser(k.ua) || 'Onbekend') === naam && f(k)).length)]), KLIKREEKS.map(r => [r[0], r[1]]), { leeg: 'Nog geen kliks', abs: true }))}
    ${kaart('Systeem', stapel(tel(K, k => uaOs(k.ua) || 'Onbekend').map(([naam]) => [naam, KLIKREEKS.map(([, , f]) => K.filter(k => (uaOs(k.ua) || 'Onbekend') === naam && f(k)).length)]), KLIKREEKS.map(r => [r[0], r[1]]), { leeg: 'Nog geen kliks', abs: true }))}
  </div>
  ${tabelKaart('Alle kliks', { id: 'kliks', rows: lijst, sort: '-0', per: 50, open: k => 'k:' + k.id, zoek: k => [k.contact && k.contact.naamKort, k.contact && k.contact.email, linkNaam(k.link), k.reden].join(' '), leeg: 'Geen kliks in deze selectie', cols: [
      { t: 'Tijd', nw: true, v: k => k.tp, h: k => fKort(k.t) + `<span class="dun">:${String(k.t.getSeconds()).padStart(2, '0')}</span>`, x: k => k.iso }, { t: 'Ontvanger', v: k => k.contact ? k.contact.naamKort : 'zzz', h: k => k.contact ? `<span class="hfd">${esc(k.contact.naamKort)}</span>` : '<span class="dun">Onbekend</span>' },
      { t: 'Knop', v: k => linkNaam(k.link) }, { t: 'Mail', v: k => k.v || '', h: k => esc(mailNaam(k.v)) }, { t: 'Soort', v: k => k.soort, h: k => tagKlik(k.soort) }, { t: 'Waarom', v: k => k.reden || '', kl: 'smal' },
      { t: 'Na verzending', r: true, nw: true, v: k => k.na, h: k => k.na == null ? '–' : verschilTekst(k.na) }, { t: 'Aangekomen', v: k => k.land.length, h: k => k.land.length ? '<span class="vink">✓</span>' : '' },
      { t: 'Browser', nw: true, v: k => uaBrowser(k.ua) || '', h: k => esc([uaBrowser(k.ua), uaOs(k.ua)].filter(Boolean).join(' · ') || '–') }] },
    { acties: segU('klik', [['mens', 'Mensen', KM.length], ['scanner', 'Scanners', sc.length], ['intern', 'Intern of test', it.length], ['', 'Alle', K.length]]) })}`;
} };

/* ===================== Mail A tegen B ===================== */
SCHERMEN.ab = { titel: 'Mail A tegen B', mail: true, html() {
  const { V, K } = X, g = { a: groepCijfers(V.filter(m => m.v === 'a')), b: groepCijfers(V.filter(m => m.v === 'b')) };
  if (!g.a.n && !g.b.n) return leeg('Geen mails verzonden in deze periode');
  const maten = [['Klikkers', 'klik'], ['Op de site', 'site'], ['Berekening', 'calc'], ['Afgemeld', 'afm', true], ['Bounce', 'bounce', true]];
  const p = Object.fromEntries(maten.map(([, k]) => [k, zToets(g.a[k], g.a.n, g.b[k], g.b.n)]));
  const beter = k => g.a.n && g.b.n && g.a[k] / g.a.n !== g.b[k] / g.b.n ? (g.a[k] / g.a.n > g.b[k] / g.b.n ? 'a' : 'b') : null, winnaar = p.klik != null && p.klik < .05 ? beter('klik') : null;
  const kolom = v => { const c = g[v]; return `<div class="${winnaar === v ? 'win' : ''}"><h4>${mailNaam(v)}${winnaar === v ? ' <span class="tag goed">Wint op kliks</span>' : ''}</h4><div class="sub" style="margin-bottom:12px">${nf.format(c.n)} ontvangers</div>${stats([[proc(c.klik, c.n, 2), `klikte zelf (${c.klik})`], [proc(c.site, c.n, 2), `kwam op de site (${c.site})`], [String(c.calc), 'maakte een berekening'], [proc(c.afm, c.n, 2), `meldde zich af (${c.afm})`], [proc(c.bounce, c.n), `bounce (${c.bounce})`], [proc(c.bezorgd, c.n), 'bezorgd']])}</div>`; };
  const links = tel(K, k => k.link).map(x => x[0]), ks = v => K.filter(k => k.v === v && k.soort === 'mens');
  const nodig = (() => { const r = (g.a.klik + g.b.klik) / Math.max(1, g.a.n + g.b.n); if (!r) return null; const d = r * .5; return Math.ceil(16 * r * (1 - r) / (d * d)); })();
  return `${kaart('Vergelijking', `<div class="ab">${kolom('a')}${kolom('b')}</div>`, { sub: 'per ontvanger, zonder scanners' })}
  <div class="g2">
    ${tabelKaart('Is het verschil echt', { id: 'abtoets', rows: maten.map(([naam, k, omgekeerd]) => ({ naam, k, omgekeerd })), cols: [{ t: 'Maat', h: r => `<span class="hfd">${esc(r.naam)}</span>`, x: r => r.naam }, { t: 'Mail A', r: true, h: r => `${proc(g.a[r.k], g.a.n, 2)} <span class="dun">· ${g.a[r.k]}</span>` }, { t: 'Mail B', r: true, h: r => `${proc(g.b[r.k], g.b.n, 2)} <span class="dun">· ${g.b[r.k]}</span>` },
        { t: 'Beter', h: r => { const w = beter(r.k); if (!w) return '<span class="dun">gelijk</span>'; const goed = r.omgekeerd ? (w === 'a' ? 'b' : 'a') : w; return esc(mailNaam(goed)); } }, { t: 'Zekerheid', nw: true, h: r => p[r.k] == null ? '<span class="dun">te weinig gegevens</span>' : `<span class="tag ${p[r.k] < .05 ? 'goed' : p[r.k] < .2 ? 'let' : ''}" title="Kans op toeval: ${Math.round(p[r.k] * 100)}%">${zeker(p[r.k])}</span>` }] }, { sub: '', csv: false })}
    ${kaart('Hoeveel mails zijn nodig', nodig ? stats([[nf.format(nodig), 'ontvangers per mail om een verschil van de helft aan te tonen'], [nf.format(Math.min(g.a.n, g.b.n)), 'ontvangers per mail nu'], [proc((g.a.klik + g.b.klik), g.a.n + g.b.n, 2), 'klikt nu zelf']]) : leeg('Nog niemand klikte zelf, dus er valt nog niets te vergelijken'))}
  </div>
  <div class="g2">
    ${kaart('Knoppen per mail', links.length ? paarBalken(links.map(l => [linkNaam(l), ks('a').filter(k => k.link === l).length, ks('b').filter(k => k.link === l).length]), v => String(v), ['Mail A', 'Mail B'], [KLEUR.blue, KLEUR.paars]) : leeg('Nog geen kliks'), { sub: 'kliks van mensen' })}
    ${tabelKaart('Per verzenddienst', { id: 'abdienst', rows: ['a', 'b'].flatMap(v => [...groep(V.filter(m => m.v === v), m => m.dienst || 'onbekend')].map(([d, ms]) => ({ k: mailNaam(v) + ' · ' + dienstNaam(d), ...groepCijfers(ms) }))), sort: '0', cols: [{ t: 'Mail', nw: true, v: r => r.k, h: r => `<span class="hfd">${esc(r.k)}</span>` }, ...cijferKolommen().filter(c => c.t !== 'Berekening')] }, { sub: '', csv: false })}
  </div>`;
} };
