/* Dashboard · kern: hulpjes, tijd, en het datamodel (sessies, bezoekers, berekeningen, mails, kliks).
   Alle schermen lezen uit het object D dat bouw() vult. */
'use strict';
const TZ = 'Europe/Amsterdam';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('nl-NL');
const n0 = v => v == null || isNaN(v) ? '–' : nf.format(Math.round(v));
const n1 = v => v == null || isNaN(v) ? '–' : (+v).toFixed(1).replace('.', ',');
const euro = v => v == null || isNaN(v) ? '–' : (v < 0 ? '−€ ' : '€ ') + nf.format(Math.abs(Math.round(v)));
const pct = (a, b, d = 0) => b ? (100 * a / b).toFixed(d).replace('.', ',') + '%' : '–';
const som = (a, f = x => x) => { let s = 0; for (const x of a) s += +f(x) || 0; return s; };
const gem = (a, f = x => x) => a.length ? som(a, f) / a.length : null;
const kwantiel = (arr, q) => { if (!arr.length) return null; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(q * a.length))]; };
const mediaan = a => kwantiel(a, .5);
const tel = (arr, f) => { const m = new Map(); for (const x of arr) { const k = f(x); if (k == null || k === '') continue; m.set(k, (m.get(k) || 0) + 1); } return [...m].sort((a, b) => b[1] - a[1]); };
const groep = (arr, f) => { const m = new Map(); for (const x of arr) { const k = f(x); if (k == null) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; };
const uniek = (arr, f = x => x) => new Set(arr.map(f)).size;
const duur = s => { s = Math.round(s || 0); if (s < 60) return s + ' s'; const m = Math.floor(s / 60); if (m < 60) return m + ' m ' + String(s % 60).padStart(2, '0') + ' s'; return Math.floor(m / 60) + ' u ' + String(m % 60).padStart(2, '0') + ' m'; };
const msTekst = v => v == null ? '–' : v >= 1000 ? (v / 1000).toFixed(1).replace('.', ',') + ' s' : Math.round(v) + ' ms';
const verschilTekst = ms => { const a = Math.abs(ms); if (a < 1) return a.toFixed(3).replace('.', ',') + ' ms'; if (a < 1000) return (a < 10 ? a.toFixed(1).replace('.', ',') : Math.round(a)) + ' ms'; if (a < 60000) return (a / 1000).toFixed(1).replace('.', ',') + ' s'; const m = a / 60000; if (m < 60) return Math.round(m) + ' min'; const u = m / 60; return u < 48 ? Math.round(u) + ' uur' : Math.round(u / 24) + ' dagen'; };
const kort = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

/* ===== Tijd in Nederlandse tijd, snel: verschuiving per uur onthouden ===== */
const _dtf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' });
const _off = new Map();
function tzOff(ms) { const k = Math.floor(ms / 36e5); let o = _off.get(k); if (o === undefined) { const p = {}; for (const x of _dtf.formatToParts(k * 36e5)) p[x.type] = +x.value; o = Date.UTC(p.year, p.month - 1, p.day, p.hour) - k * 36e5; _off.set(k, o); } return o; }
const dagNr = ms => Math.floor((+ms + tzOff(+ms)) / 864e5);
const uurVan = ms => Math.floor((+ms + tzOff(+ms)) / 36e5) % 24;
const weekdag = d => ((d + 3) % 7 + 7) % 7; // 0 = maandag
const dagStart = d => { const u = d * 864e5; return u - tzOff(u - 36e5); };
const _u = o => new Intl.DateTimeFormat('nl-NL', { timeZone: 'UTC', ...o });
const _fDag = _u({ day: 'numeric', month: 'short' }), _fDagLang = _u({ weekday: 'short', day: 'numeric', month: 'short' }), _fDatum = _u({ day: 'numeric', month: 'short', year: 'numeric' });
const dagLabel = d => _fDag.format(d * 864e5).replace('.', '');
const dagLang = d => _fDagLang.format(d * 864e5).replace(/\./g, '');
const dagIso = d => new Date(d * 864e5).toISOString().slice(0, 10);
const isoDag = s => Math.floor(Date.parse(s + 'T00:00:00Z') / 864e5);
const _a = o => new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, ...o });
const _fTijd = _a({ hour: '2-digit', minute: '2-digit' }), _fSec = _a({ hour: '2-digit', minute: '2-digit', second: '2-digit' }), _fVol = _a({ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fTijd = t => t ? _fTijd.format(t) : '–';
const fSec = t => t ? _fSec.format(t) : '–';
const fVol = t => t ? _fVol.format(t).replace(/\./g, '') : '–';
const fMs = t => new Date(t).toLocaleString('nl-NL', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
/* Kort en leesbaar: vandaag alleen de tijd, anders dag + tijd */
function fKort(t) { if (!t) return '–'; const d = dagNr(+t), nu = dagNr(Date.now()); return d === nu ? fTijd(t) : d === nu - 1 ? 'gisteren ' + fTijd(t) : dagLabel(d) + ' ' + fTijd(t); }
function geleden(t) { const m = (Date.now() - +t) / 60000; if (m < 1) return 'zojuist'; if (m < 60) return Math.round(m) + ' min geleden'; if (m < 60 * 24) return Math.round(m / 60) + ' uur geleden'; return Math.round(m / 1440) + ' dagen geleden'; }
const preciesMs = iso => { const m = /\.(\d+)/.exec(iso || ''); return Date.parse(String(iso).replace(/\.\d+/, '')) + (m ? parseFloat('0.' + m[1]) * 1000 : 0); };

/* ===== Namen ===== */
const KLEUR = { volt: '#0A8F5B', voltM: '#9BCBB4', voltL: '#D7EDE2', blue: '#2F6FD6', oranje: '#D97706', paars: '#7C5CE0', grijs: '#94A3B8', licht: '#CBD5E1', ink: '#15171A', rood: '#B42318' };
const NAMEN = { calc: 'Calculator', calculator: 'Calculator', vloot: 'Vlootanalyse', vlootanalyse: 'Vlootanalyse', modellen: 'Modellen', model: 'Model', faq: 'Overstapgids', nieuws: 'Nieuws', over: 'Over ons', 'over-ons': 'Over ons', uitgebreid: 'Uitgebreid', privacy: 'Privacy', restwaarde: 'Restwaarde', gids: 'Gids', zone: 'Zero-emissiezone' };
const paginaNaam = (page, hash) => { if (hash && hash.startsWith('gids/')) return 'Gids · ' + hash.slice(5).replace(/-/g, ' '); return NAMEN[page] || NAMEN[hash] || page || '–'; };
const ACTIES = { wizard_open: 'Invulvenster geopend', wizard_complete: 'Berekening afgerond', wizard_close: 'Invulvenster gesloten', vehicle_select: 'Voertuig gekozen', model_open: 'Model bekeken', model_apply: 'Model gebruikt', model_compare: 'Modellen vergeleken', model_compare_item: 'Model in vergelijking', model_filter: 'Modellen gefilterd', model_search: 'Model gezocht', model_picker: 'Modelkiezer geopend', model_variant: 'Uitvoering gekozen', cta_click: 'Hoofdknop', fleet_cta_click: 'Knop vlootanalyse', fleet_request_sent: 'Vlootanalyse aangevraagd', quote_sent: 'Offerte aangevraagd', quote_open: 'Offerte geopend', pdf_email: 'PDF gemaild', print: 'PDF of print', share: 'Gedeeld', outbound: 'Externe link', plate_lookup: 'Kenteken opgezocht', tip_open: 'Uitleg geopend', details_open: 'Vraag opengeklapt', logo_toggle: 'Logo omgezet', js_error: 'Fout op de pagina', nav: 'Menu gebruikt', scenario_save: 'Scenario bewaard', reset: 'Opnieuw begonnen', unit: 'Eenheid gewisseld', faq_jump: 'Gids-navigatie', embed_copy: 'Insluitcode gekopieerd', consent: 'Cookiekeuze', rage: 'Frustratieklik', copy: 'Tekst gekopieerd' };
const STAPPEN = { use: 'Gebruik', buy: 'Aanschaf', sub: 'Subsidie', en: 'Energie', up: 'Onderhoud', lease: 'Lease', lad: 'Laden', fin: 'Financiering', zon: 'Zonnepanelen', hef: 'Heffing' };
const VT = { trekker: 'Trekker', bakwagen: 'Bakwagen', bestel: 'Bestelbus', bus: 'Bus' };
const LINKNAAM = { calc: 'Calculator', uitgebreid: 'Uitgebreid', vloot: 'Vlootanalyse', gids: 'Overstapgids', heffing: 'Heffing', subsidie: 'Subsidies', ze: 'Zero-emissiezones', modellen: 'Modellen', kenteken: 'Kenteken' };
const linkNaam = k => LINKNAAM[k] || k || '–';
const mailNaam = v => v ? 'Mail ' + String(v).toUpperCase() : '–';
const DIENST = { resend: 'Resend', brevo: 'Brevo' };
const dienstNaam = d => DIENST[d || 'resend'] || d;
const DOELPAGINA = { calc: ['calc'], kenteken: ['calc'], modellen: ['modellen'], gids: ['faq'], heffing: ['gids'], subsidie: ['gids'], ze: ['gids'], uitgebreid: ['uitgebreid'], vloot: ['vloot'] };
const _bron = h => /google\./.test(h) || h === 'google' ? 'Google' : /bing\./.test(h) || h === 'bing' ? 'Bing' : /duckduckgo/.test(h) ? 'DuckDuckGo' : /ecosia|startpage|yahoo|brave/.test(h) ? h.split('.').slice(-2, -1)[0].replace(/^./, c => c.toUpperCase())
  : /linkedin|lnkd/.test(h) ? 'LinkedIn' : /facebook|fb\./.test(h) ? 'Facebook' : /instagram/.test(h) ? 'Instagram' : /chatgpt|openai/.test(h) ? 'ChatGPT' : /perplexity|claude\.ai|gemini|copilot/.test(h) ? 'AI-assistent' : null;
const bronNaam = (ref, utm) => {
  if (utm === 'email') return 'E-mailcampagne';
  if (utm) return _bron(String(utm).toLowerCase()) || utm;
  if (!ref) return 'Direct';
  const h = ref.replace(/^www\./, '');
  return _bron(h) || h;
};
const ZOEKERS = new Set(['Google', 'Bing', 'DuckDuckGo', 'Ecosia', 'Startpage', 'Yahoo', 'Brave']);
const bronSoort = naam => naam === 'E-mailcampagne' ? 'email' : naam === 'Direct' ? 'direct' : ZOEKERS.has(naam) ? 'zoek' : 'overig';
const BRONNEN = [['direct', 'Direct', KLEUR.blue], ['zoek', 'Zoekmachine', KLEUR.volt], ['email', 'E-mail', KLEUR.oranje], ['overig', 'Overig', KLEUR.paars]];
const schermNaam = vw => vw == null ? null : vw < 640 ? 'Telefoon' : vw < 1024 ? 'Tablet' : vw < 1440 ? 'Laptop' : 'Groot scherm';
const _land = new Intl.DisplayNames(['nl'], { type: 'region' });
const landNaam = c => { if (!c) return null; try { return _land.of(c) || c; } catch { return c; } };
const uaBrowser = ua => !ua ? null : /edg\//i.test(ua) ? 'Edge' : /firefox|fxios/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : /outlook|microsoft/i.test(ua) ? 'Outlook' : 'Overig';
const uaOs = ua => !ua ? null : /iphone|ipad/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac os x/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Overig';
const WIE = { echt: 'Echt', intern: 'Intern', bot: 'Bot of test' };
const INTERNE_REDENEN = new Set(['Eigen netwerk', 'Eigen browser', 'Testmail-ontvanger', 'Als intern gemarkeerd']);
const KLIKSOORT = { mens: 'Mens', scanner: 'Scanner', intern: 'Intern', test: 'Test' };
const klikWie = k => k.soort === 'mens' ? 'echt' : k.soort === 'scanner' ? 'bot' : 'intern';
/* Velden van de calculator: [naam, eenheid, kant]. Kant D = diesel, E = elektrisch. */
const VELD = { km: ['Kilometers per jaar', 'km'], kmH: ['Waarvan met heffing of tol', 'km'], wd: ['Rijdagen per jaar', 'dagen'], jr: ['Afschrijftermijn', 'jaar'], rw: ['Restwaarde', '%', 'D'], rwE: ['Restwaarde', '%', 'E'], eag: ['Leeftijd', 'jaar', 'E'], dag: ['Leeftijd', 'jaar', 'D'], pD: ['Aanschafprijs', '€', 'D'], bpmD: ['Bpm', '€', 'D'], pE: ['Aanschafprijs', '€', 'E'], subX: ['Subsidiebedrag', '€'], ld: ['Verbruik', 'L/100 km', 'D'], dp: ['Dieselprijs excl. btw', '€/L', 'D'], le: ['Verbruik', 'kWh/100 km', 'E'], sp: ['Stroomprijs eigen terrein', '€/kWh', 'E'], acc: ['Bruikbare accu', 'kWh', 'E'], ere: ['ERE-opbrengst', '€/kWh', 'E'], oD: ['Onderhoud', '€/km', 'D'], oE: ['Onderhoud', '€/km', 'E'], vD: ['Verzekering', '€/jaar', 'D'], vE: ['Verzekering', '€/jaar', 'E'], wD: ['Wegenbelasting', '€/jaar', 'D'], wE: ['Wegenbelasting', '€/jaar', 'E'], tD: ['Heffingstarief', '€/km', 'D'], tE: ['Heffingstarief', '€/km', 'E'], lpD: ['Leaseprijs', '€/maand', 'D'], lpE: ['Leaseprijs', '€/maand', 'E'], lpC: ['Leaseprijs lopend contract', '€/maand', 'D'], lrC: ['Resterende looptijd', 'maanden', 'D'], lkD: ['Contractkilometers', 'km', 'D'], lkE: ['Contractkilometers', 'km', 'E'], lmD: ['Meerkilometerprijs', '€/km', 'D'], lmE: ['Meerkilometerprijs', '€/km', 'E'], xfs: ['Gefinancierd deel', '%'], xri: ['Rente lening', '%'], xre: ['Rendement eigen geld', '%'], xl0: ['Investering laadpaal', '€'], xla: ['Netaansluiting en voorbereiding', '€'], xlo: ['Onderhoud en beheer laadpaal', '€/jaar'], xln: ['Vaste netkosten', '€/jaar'], xos: ['Aandeel onderweg geladen', '%'], xop: ['Prijs openbaar laden', '€/kWh'], xot: ['Tijdverlies per 100 km', 'min'], xoh: ['Kosten stilstand', '€/uur'], xzk: ['Vermogen zonnepanelen', 'kWp'], xzs: ['Deel voor je voertuigen', '%'],
  dw: ['Dieselvoertuig'], nw: ['Elektrisch voertuig'], dwl: ['Huidige diesel'], gr: ['Bedrijfsgrootte'], cls: ['Gewichtsklasse'], reg: ['Subsidie of regeling'], calcModel: ['Gekozen model'], mpQ: ['Model gezocht'], lsD: ['Diesel leasen', '', 'D'], lsE: ['Elektrisch leasen', '', 'E'], lqD: ['Eigen lease-offerte', '', 'D'], lqE: ['Eigen lease-offerte', '', 'E'], xFin: ['Financiering meerekenen'], xLad: ['Laadpaal meerekenen'], xZon: ['Zonnepanelen meerekenen'], xOw: ['Onderweg laden meerekenen'], xSp: ['Eigen stroomprijs'], aERE: ['ERE meerekenen'], aSlim: ['Slim laden'], loD: ['Onderhoud in leaseprijs', '', 'D'], loE: ['Onderhoud in leaseprijs', '', 'E'], lvD: ['Verzekering in leaseprijs', '', 'D'], lvE: ['Verzekering in leaseprijs', '', 'E'], lwD: ['Wegenbelasting in leaseprijs', '', 'D'], lwE: ['Wegenbelasting in leaseprijs', '', 'E'], lcO: ['Onderhoud in lopend contract'], lcV: ['Verzekering in lopend contract'], lcW: ['Wegenbelasting in lopend contract'] };
const KEUZE = { dw: { n: 'Nieuw kopen', l: 'Operational lease', h: 'Huidige houden' }, nw: { n: 'Nieuw kopen', g: 'Gebruikt kopen', l: 'Operational lease' }, dwl: { eig: 'Eigendom', lease: 'Leasecontract' }, gr: { 0: 'Groot', 1: 'Middelgroot', 2: 'Klein' }, reg: { geen: 'Geen', az: 'AanZET', mia: 'MIA', mia2: 'MIA (hoog tarief)', stour: 'STour', eigen: 'Eigen bedrag' }, lsD: { 0: 'Nee', 1: 'Ja' }, lsE: { 0: 'Nee', 1: 'Ja' }, lqD: { 0: 'Nee', 1: 'Ja' }, lqE: { 0: 'Nee', 1: 'Ja' } };
const veldNaam = k => { const f = VELD[k]; if (!f) return /^k_/.test(k) ? 'Kilometers ' + k.slice(2).toUpperCase() : null; return f[0] + (f[2] === 'D' && !/iesel/.test(f[0]) ? ' diesel' : f[2] === 'E' && !/lektrisch/.test(f[0]) ? ' elektrisch' : ''); };
function veldWaarde(k, v) {
  if (v === true) return 'Ja'; if (v === false) return 'Nee'; if (v == null || v === '') return '–';
  if (KEUZE[k] && KEUZE[k][v] != null) return KEUZE[k][v];
  const e = (VELD[k] || [])[1];
  if (typeof v === 'number' || (v !== '' && !isNaN(v))) { const x = +v, t = Math.abs(x) < 10 && x % 1 ? String(Math.round(x * 1000) / 1000).replace('.', ',') : nf.format(x); return e === '€' ? '€ ' + t : e && e.startsWith('€/') ? '€ ' + t + ' ' + e.slice(1).replace('/', 'per ').replace('per L', 'per liter') : e ? t + ' ' + e : t; }
  return String(v);
}
const KOSTEN = [['afs', 'Aanschaf'], ['fin', 'Financiering'], ['en', 'Energie'], ['lad', 'Laden'], ['zon', 'Zonnepanelen'], ['ond', 'Onderhoud'], ['ver', 'Verzekering'], ['bel', 'Wegenbelasting'], ['hef', 'Kilometerheffing'], ['tol', 'Tol buitenland'], ['tij', 'Tijdverlies']];
const DOELEN = [['berekening', 'Berekening gemaakt'], ['uitgebreid', 'Uitgebreid bekeken'], ['model', 'Model gebruikt'], ['kenteken', 'Kenteken opgezocht'], ['pdf', 'PDF of print'], ['deel', 'Gedeeld'], ['vlootklik', 'Naar vlootanalyse geklikt'], ['aanvraag', 'Aanvraag verstuurd']];
const DOEL_EV = { wizard_complete: 'berekening', model_apply: 'model', plate_lookup: 'kenteken', print: 'pdf', pdf_email: 'pdf', share: 'deel', fleet_cta_click: 'vlootklik', fleet_request_sent: 'aanvraag', quote_sent: 'aanvraag' };

/* ===== Datamodel ===== */
const D = {};
function bouw(raw) {
  const bz = raw.bz || {}, ml = raw.ml || {}, extra = raw.extra || null;
  D.gegenereerd = new Date(raw.gegenereerd || Date.now()); D.beperkt = !extra; D.dagen = raw.dagen || bz.dagen || 90;
  D.intern = new Set(bz.intern || []); D.netwerken = bz.netwerken || [];
  const mk = t => { const ms = +t; return { d: dagNr(ms), h: uurVan(ms) }; };

  /* --- Events --- */
  const EV = D.EV = (bz.events || []).map(r => { const t = new Date(r[0]); return { t, ...mk(t), ev: r[1], page: r[2], consent: r[3], vid: r[4], sid: r[5], p: r[6] || {}, ua: r[7], browser: r[8], os: r[9], land: r[10], intern: !!r[11] }; });
  // Oudere laadmetingen (zonder v) telden een tabblad dat op de achtergrond laadde mee: die LCP laten we weg
  for (const e of EV) if (e.ev === 'perf' && !e.p.v && e.p.lcp != null && +e.p.lcp - (+e.p.load || +e.p.dcl || 0) > 4000) { e.p = { ...e.p }; delete e.p.lcp; }
  D.eersteDag = EV.length ? EV[0].d : dagNr(Date.now());

  /* --- Zonder cookies: losse weergaven --- */
  const anon = D.ANON = EV.filter(e => e.consent === 'anon' && e.ev === 'page_view');
  D.ANONL = EV.filter(e => e.consent === 'anon' && e.ev === 'page_leave');
  D.ANONP = EV.filter(e => e.consent === 'anon' && e.ev === 'perf');
  for (let i = 0, j = 0, k = 0; i < anon.length; i++) { // salvo: 8+ weergaven binnen een minuut
    const t = +anon[i].t; while (+anon[j].t < t - 30000) j++; if (k < i) k = i; while (k + 1 < anon.length && +anon[k + 1].t <= t + 30000) k++;
    anon[i].salvo = (k - j + 1) >= 8;
  }
  for (const e of anon) { e.naam = paginaNaam(e.page, e.p.hash); e.bron = bronNaam(e.p.ref, e.p.utm_source); e.bronSoort = bronSoort(e.bron); e.app = e.p.mobile == null ? null : e.p.mobile ? 'Mobiel' : 'Desktop'; }

  /* --- Sessies (met cookies) --- */
  const SES = D.SES = new Map();
  for (const e of EV) {
    if (e.consent !== 'stat' || !e.sid) continue;
    let s = SES.get(e.sid);
    if (!s) { s = { id: e.sid, vid: e.vid, start: e.t, eind: e.t, d: e.d, h: e.h, ev: [], views: [], sec: 0, bot: false, intern: false, mobile: null, vw: null, vh: null, lang: null, taal: null, tz: null, dpr: null, dark: null, net: null, ref: '', utm: null, camp: null, n: null, land: null, browser: null, os: null, perf: [], calc: [], doelen: new Set(), evs: new Set(), stappen: new Set(), mail: null, mailZeker: false }; SES.set(e.sid, s); }
    s.ev.push(e); s.eind = e.t; s.evs.add(e.ev); if (e.ev === 'wizard_step') s.stappen.add(e.p.step);
    if (e.ua === 'bot' || e.p.wd) s.bot = s.bot || (e.ua === 'bot' ? 'Bot (user-agent)' : 'Automatische browser');
    if (e.p.dev) s.bot = 'Testomgeving';
    if (e.p.intern) s.intern = s.intern || 'Eigen browser';
    if (e.intern) s.intern = 'Eigen netwerk';
    if (e.browser && !s.browser) { s.browser = e.browser; s.os = e.os; }
    if (e.land && !s.land) s.land = e.land;
    if (e.ev === 'session_start') Object.assign(s, { mobile: e.p.mobile == null ? null : !!e.p.mobile, vw: e.p.vw, vh: e.p.vh, lang: e.p.lang, taal: e.p.taal, tz: e.p.tz, dpr: e.p.dpr, dark: e.p.dark, net: e.p.net, ref: e.p.ref || '', utm: e.p.utm_source || null, camp: e.p.utm_campaign || null, n: e.p.n, start0: e });
    if (e.ev === 'page_view') s.views.push({ naam: paginaNaam(e.page, e.p.hash), page: e.page, hash: e.p.hash, t: e.t, d: e.d, h: e.h, sec: 0, depth: 0, leave: false, kliks: 0, s });
    if (e.ev === 'page_leave') { const sec = Math.min(+e.p.sec || 0, 3600); s.sec += sec; const v = s.views[s.views.length - 1]; if (v) { v.sec += sec; v.depth = Math.max(v.depth, +e.p.depth || 0); v.leave = true; } }
    if (e.ev === 'klik') { const v = s.views[s.views.length - 1]; if (v) v.kliks++; }
    if (e.ev === 'perf') s.perf.push(e);
    if (DOEL_EV[e.ev]) s.doelen.add(DOEL_EV[e.ev]);
  }
  const BEZ = D.BEZ = new Map();
  for (const s of SES.values()) { if (!BEZ.has(s.vid)) BEZ.set(s.vid, { vid: s.vid, ses: [] }); BEZ.get(s.vid).ses.push(s); }
  for (const b of BEZ.values()) { const bron = b.ses.find(s => s.vw); if (bron) for (const s of b.ses) if (s.vw == null) Object.assign(s, { vw: bron.vw, mobile: bron.mobile, lang: bron.lang, vh: bron.vh, dpr: bron.dpr, tz: bron.tz, dark: bron.dark }); }
  for (const s of SES.values()) if (!s.bot && s.views.length >= 5 && (s.eind - s.start) / s.views.length < 1500) s.bot = 'Te snel door pagina\'s';
  // Standaardvenster van een geautomatiseerde browser (1024 × 768) vanuit een tijdzone buiten Europa
  for (const s of SES.values()) if (!s.bot && s.vw === 1024 && s.vh === 768 && s.tz && !/^Europe\//.test(s.tz)) s.bot = 'Automatische browser';

  /* --- E-mail: contacten, verzonden mails, kliks --- */
  const CONTACT = D.CONTACT = new Map();
  const contact = (token, basis) => { let c = CONTACT.get(token); if (!c) { c = { token, email: null, bedrijf: null, naam: null, segment: null, bron: null, mails: [], kliks: [], ses: [], afm: [], calc: [] }; CONTACT.set(token, c); } if (basis) for (const k in basis) if (basis[k] != null) c[k] = basis[k]; return c; };
  for (const c of ml.contacten || []) contact(c.token, { email: c.email, bedrijf: c.bedrijf, naam: c.naam, segment: c.segment, bron: c.bron, toegevoegd: c.toegevoegd_op ? new Date(c.toegevoegd_op) : null, afgemeld: c.afgemeld_op ? new Date(c.afgemeld_op) : null, bounce: c.bounce_op ? new Date(c.bounce_op) : null, notion: c.notion_page_id });
  for (const r of bz.contacten || []) contact(r[0], { bedrijf: r[1], naam: r[2], email: r[3], segment: r[4] }); // vult aan wat de maillijst niet meegaf
  for (const c of CONTACT.values()) { c.domein = c.email ? c.email.split('@')[1].toLowerCase() : null; c.domeinSoort = !c.domein ? null : /^(gmail|hotmail|outlook|live|ziggo|kpnmail|kpnplanet|planet|hetnet|icloud|yahoo|home|xs4all|upcmail|telfort|casema|quicknet|msn|me|chello|online|tele2|zonnet|solcon|caiway|zeelandnet)\./.test(c.domein) ? 'Privé-adres (gmail, hotmail, ziggo…)' : 'Eigen domein'; }

  const evPer = new Map(), evId = new Map();
  for (const e of ml.events || []) { evPer.set(e.token + '|' + e.campagne, e); if (e.resend_id) evId.set(e.resend_id, e); }
  const MAILS = D.MAILS = [], mailKey = new Map(), nu = Date.now();
  const voegMail = v => {
    const key = v.token + '|' + v.campagne + '|' + (v.verzonden_op || v.gepland_voor || '');
    if (mailKey.has(key)) return; const t = v.verzonden_op ? new Date(v.verzonden_op) : v.gepland_voor ? new Date(v.gepland_voor) : null; if (!t) return;
    const m = { token: v.token, c: v.campagne, v: v.variant, t, ...mk(t), gepland: v.gepland_voor ? new Date(v.gepland_voor) : null, test: !!v.test, dienst: v.dienst || (v.onbekendeDienst ? null : 'resend'), rid: v.resend_id || null, id: MAILS.length };
    mailKey.set(key, m); MAILS.push(m);
  };
  for (const v of ml.verzonden || []) voegMail(v);
  const gezien = new Set(MAILS.map(m => m.token + '|' + m.c));
  for (const r of bz.verzonden || []) if (!gezien.has(r[0] + '|' + r[1])) voegMail({ token: r[0], campagne: r[1], verzonden_op: r[2], test: r[3], variant: r[4], onbekendeDienst: true });
  MAILS.sort((a, b) => a.t - b.t); MAILS.forEach((m, i) => m.id = i);
  D.TESTTOKENS = new Set(); { const echt = new Set(); for (const m of MAILS) (m.test ? D.TESTTOKENS : echt).add(m.token); for (const t of echt) D.TESTTOKENS.delete(t); for (const c of CONTACT.values()) if (c.bron === 'test') D.TESTTOKENS.add(c.token); }
  const mailVan = new Map(); // token|campagne -> eerste echte mail
  for (const m of MAILS) {
    const c = contact(m.token); c.mails.push(m); m.contact = c; m.test = m.test || D.TESTTOKENS.has(m.token);
    const e = (m.rid && evId.get(m.rid)) || (!m.test && evPer.get(m.token + '|' + m.c)) || null;
    m.gebeurtenis = e ? e.last_event : null; m.statusT = e ? new Date(e.bijgewerkt_op) : null;
    m.status = m.gepland && +m.gepland > nu ? 'gepland' : (m.gebeurtenis === 'bounced' || (c.bounce && +c.bounce >= +m.t - 60000)) ? 'bounce' : ['delivered', 'opened', 'clicked'].includes(m.gebeurtenis) ? 'bezorgd' : 'verstuurd';
    // Brevo meldt bezorging niet terug: zonder bounce geldt de mail na een uur als aangekomen
    m.bezorgd = m.status === 'bezorgd' || (m.status === 'verstuurd' && m.dienst === 'brevo' && nu - m.t > 3600e3);
    if (!m.test && !mailVan.has(m.token + '|' + m.c)) mailVan.set(m.token + '|' + m.c, m);
  }

  const kliksRuw = ml.kliks ? ml.kliks.map(k => ({ iso: k.ontvangen_op, token: k.token, c: k.campagne, v: k.variant, link: k.link, bot: !!k.bot, intern: !!(k.intern || k.klasse === 'intern'), id: k.id, ua: k.ua })) : [];
  { const ids = new Set(kliksRuw.map(k => String(k.id))); for (const r of bz.kliks || []) if (!ids.has(String(r[7]))) kliksRuw.push({ iso: r[0], token: r[1], c: r[2], v: r[3], link: r[4], bot: !!r[5], intern: !!r[6], id: r[7] ?? 'b' + kliksRuw.length, ua: r[8] }); }
  const KLIKS = D.KLIKS = kliksRuw.map(k => { const t = new Date(k.iso); return { ...k, t, tp: preciesMs(k.iso), ...mk(t) }; }).sort((a, b) => a.tp - b.tp);
  D.KLIK = new Map(KLIKS.map(k => [String(k.id), k]));
  const perToken = groep(KLIKS.filter(k => k.token), k => k.token);
  for (const k of KLIKS) {
    k.contact = k.token ? CONTACT.get(k.token) || null : null;
    k.mail = mailVan.get(k.token + '|' + k.c) || null;
    k.na = k.mail ? k.t - k.mail.t : null;
    k.zelfde = (perToken.get(k.token) || []).filter(x => x !== k);
    k.test = !!(k.mail && k.mail.test) || D.TESTTOKENS.has(k.token) || (k.token && (MAILS.find(m => m.token === k.token && m.c === k.c) || {}).test) || false;
  }
  /* Scanner: bot-vlag, andere knop binnen 5 s, ander apparaat binnen 5 min, binnen 5 min na verzending,
     of 2+ knoppen binnen 10 minuten (zelfde regels als scripts/mail/core.mjs) */
  for (const k of KLIKS) {
    const zc = k.zelfde.filter(x => x.c === k.c), alle = [k, ...zc], eerste = Math.min(...alle.map(x => +x.t)), links = new Set(alle.map(x => x.link));
    const tegelijk = k.zelfde.some(x => x.link !== k.link && Math.abs(x.t - k.t) < 5000);
    const anderApparaat = zc.some(x => String(x.ua || '') !== String(k.ua || '') && Math.abs(x.t - k.t) < 300000);
    const snel = k.na != null && k.na < 300000, veel = links.size >= 2 && k.t - eerste <= 600000;
    k.scanner = !!(k.bot || !k.token || tegelijk || anderApparaat || snel || veel);
    k.reden = !k.scanner ? null : k.bot ? 'Herkend aan browser' : !k.token ? 'Onbekende ontvanger' : snel ? 'Binnen vijf minuten na verzending' : 'Meerdere knoppen of apparaten tegelijk';
  }
  /* Scanners laden na hun klik ook de pagina's zelf, zonder cookies en vaak zonder utm: een weergave zonder verwijzer
     binnen 30 s na een scannerklik met dezelfde browser telt als mailscanner. Tijd en laadmeting erven dat. */
  { const sc = KLIKS.filter(k => k.scanner); let i = 0;
    for (const e of anon) { if (e.p.utm_source !== 'email' && e.p.ref) continue; while (i < sc.length && sc[i].t < e.t - 30000) i++;
      for (let j = i; j < sc.length && sc[j].t <= e.t; j++) { const k = sc[j]; if (e.p.utm_source === 'email' || !e.browser || !k.ua || (uaBrowser(k.ua) === e.browser && uaOs(k.ua) === e.os)) { e.scanner = true; break; } } }
    const sleutel = (e, pag) => [pag, e.land, e.browser, e.os].join('|'), perSleutel = groep(anon, e => sleutel(e, e.page));
    for (const [lijst, venster] of [[D.ANONL, 1800e3], [D.ANONP, 120e3]]) for (const e of lijst) { const a = perSleutel.get(sleutel(e, e.p.p || e.page)); if (!a) continue;
      for (let j = a.length - 1; j >= 0; j--) { const d = e.t - a[j].t; if (d < 0) continue; if (d > venster) break; e.scanner = !!a[j].scanner; e.salvo = a[j].salvo && !a[j].p.ref; break; } } }

  /* Sessie aan ontvanger koppelen: zeker via het token in de browser, anders op tijdstip van de klik */
  for (const s of SES.values()) {
    const st = s.start0; if (!st) continue;
    if (st.p.mail && CONTACT.has(st.p.mail)) { s.mail = st.p.mail; s.mailZeker = true; continue; }
    if (st.p.utm_source !== 'email') continue;
    const kand = new Set(KLIKS.filter(k => k.token && k.c === (st.p.utm_campaign || k.c) && (!st.p.utm_content || st.p.utm_content === k.v + '-' + k.link) && st.t - k.t >= 0 && st.t - k.t < 120000).map(k => k.token));
    if (kand.size === 1) { s.mail = [...kand][0]; s.mailZeker = false; }
  }
  for (const b of BEZ.values()) { const bron = b.ses.find(s => s.mail && s.mailZeker) || b.ses.find(s => s.mail); if (bron) for (const s of b.ses) if (!s.mail) { s.mail = bron.mail; s.mailZeker = bron.mailZeker; } }
  for (const s of SES.values()) if (s.mail) for (const k of perToken.get(s.mail) || []) if (s.start - k.t >= 0 && s.start - k.t < 120000 && !k.bot) { k.scanner = false; k.reden = null; }
  for (const k of KLIKS) k.soort = k.intern ? 'intern' : k.test ? 'test' : k.scanner ? 'scanner' : 'mens';
  /* Landing bij een klik: weergave uit de mail op de doelpagina, binnen 30 s */
  { const mv = EV.filter(e => e.ev === 'page_view' && e.p.utm_source === 'email'); let i = 0;
    for (const k of KLIKS) { const doel = DOELPAGINA[k.link]; while (i < mv.length && mv[i].t < k.t - 1000) i++; k.land = []; for (let j = i; j < mv.length && mv[j].t - k.t < 30000; j++) { const e = mv[j]; if ((!e.p.utm_campaign || e.p.utm_campaign === k.c) && (!e.p.utm_content || e.p.utm_content === (k.v || '') + '-' + k.link) && (!doel || doel.includes(e.page))) k.land.push(e); } } }
  for (const k of KLIKS) if (k.contact) k.contact.kliks.push(k);

  /* --- Sessies afronden: wie, bron, route --- */
  const vidIntern = new Map(); for (const s of SES.values()) if (s.intern && !vidIntern.has(s.vid)) vidIntern.set(s.vid, s.intern);
  D.vidIntern = vidIntern;
  for (const s of SES.values()) { s.contact = s.mail ? CONTACT.get(s.mail) || null : null; if (s.contact) s.contact.ses.push(s); s.bron = bronNaam(s.ref, s.mail || s.utm === 'email' ? 'email' : s.utm); s.bronSoort = bronSoort(s.bron); s.app = s.mobile == null ? null : s.mobile ? 'Mobiel' : 'Desktop'; s.route = s.views.map(v => v.naam).filter((n, i, a) => i === 0 || n !== a[i - 1]); s.instap = s.views[0] ? s.views[0].naam : null; s.uitstap = s.views.length ? s.views[s.views.length - 1].naam : null; if (s.views.some(v => v.naam === 'Uitgebreid')) s.doelen.add('uitgebreid'); }
  herklasseer();

  /* --- Berekeningen --- */
  const calcRuw = extra && extra.calc ? extra.calc.map(c => ({ id: c.id, iso: c.received_at, vid: c.visitor_id, sid: c.session_id, reeks: c.reeks, nr: c.nr, trigger: c.trigger, modus: c.modus, vt: c.vt, model: c.model_id, km: c.km, jaren: c.jaren, goedkoper: c.goedkoper, verschil: c.verschil_jaar, invoer: c.invoer || {}, gewijzigd: c.gewijzigd || [], voertuig: c.voertuig || {}, uitkomst: c.uitkomst || {}, bronC: c.bron || {}, intern: !!c.intern, consent: c.consent }))
    : (bz.calc || []).map((r, i) => ({ id: 'x' + i, iso: r[0], vid: r[1], sid: r[2], reeks: r[2] ? 's' + r[2] + r[3] : 'x' + i, nr: i, vt: r[3], goedkoper: r[4], trigger: r[5], modus: r[6], model: r[7], km: r[8], jaren: r[9], verschil: r[10], consent: r[11], intern: !!r[12], invoer: null, gewijzigd: [], voertuig: {}, uitkomst: {}, bronC: {} }));
  const CALC = D.CALC = calcRuw.map(c => { const t = new Date(c.iso); return { ...c, t, ...mk(t), km: c.km == null ? null : +c.km, verschil: c.verschil == null ? null : +c.verschil }; }).sort((a, b) => a.t - b.t || a.nr - b.nr);
  const REEKS = D.REEKS = new Map();
  for (const c of CALC) {
    const s = c.sid ? SES.get(c.sid) : null; c.ses = s || null; if (s) { s.calc.push(c); s.doelen.add('berekening'); }
    let r = REEKS.get(c.reeks); if (!r) { r = { id: c.reeks, runs: [] }; REEKS.set(c.reeks, r); } r.runs.push(c); c.r = r;
  }
  for (const r of REEKS.values()) {
    const l = r.laatste = r.runs[r.runs.length - 1], e = r.eerste = r.runs[0];
    Object.assign(r, { t: l.t, d: l.d, h: l.h, ses: r.runs.map(c => c.ses).find(Boolean) || null, vt: l.vt, modus: r.runs.some(c => c.modus === 'uitgebreid') ? 'uitgebreid' : 'simpel', goedkoper: l.goedkoper, verschil: l.verschil, km: l.km, jaren: l.jaren, model: l.model, n: r.runs.length, duur: (l.t - e.t) / 1000, intern: r.runs.some(c => c.intern) });
    const v = l.voertuig || {}, ls = v.lease || {};
    r.modelNaam = v.model || (l.model ? l.model.replace(/-/g, ' ') : null); r.diesel = v.diesel || null; r.elektrisch = v.elektrisch || null;
    r.lease = !!(ls.diesel || ls.elektrisch); r.kenteken = !!(v.kenteken_diesel || v.kenteken_elektrisch); r.kentekenMerk = (v.kenteken_diesel || v.kenteken_elektrisch || {}).merk || null;
    r.mobile = r.ses ? r.ses.mobile : (l.bronC.mobile ?? null); r.app = r.mobile == null ? null : r.mobile ? 'Mobiel' : 'Desktop';
    r.bron = r.ses ? r.ses.bron : bronNaam(l.bronC.ref, l.bronC.utm_source); r.bronSoort = bronSoort(r.bron);
    r.contact = r.ses ? r.ses.contact : null; if (r.contact) r.contact.calc.push(r);
    r.gewijzigd = [...new Set(r.runs.flatMap(c => c.gewijzigd || []))];
  }
  for (const s of SES.values()) s.reeksen = [...new Set(s.calc.map(c => c.r))];
  klasseerCalc();

  /* --- Bezoekers afronden --- */
  for (const b of BEZ.values()) {
    b.ses.sort((x, y) => x.start - y.start);
    const m = b.ses.find(s => s.mail && s.mailZeker) || b.ses.find(s => s.mail), f = b.ses.find(s => s.vw) || b.ses[0];
    Object.assign(b, { eerst: b.ses[0].start, laatst: b.ses[b.ses.length - 1].eind, d: b.ses[0].d, contact: m ? m.contact : null, mailZeker: m ? m.mailZeker : false, views: som(b.ses, s => s.views.length), sec: som(b.ses, s => s.sec), reeksen: [...new Set(b.ses.flatMap(s => s.reeksen))], doelen: new Set(b.ses.flatMap(s => [...s.doelen])), vw: f.vw, mobile: f.mobile, lang: f.lang, browser: (b.ses.find(s => s.browser) || {}).browser, os: (b.ses.find(s => s.os) || {}).os, land: (b.ses.find(s => s.land) || {}).land, bron: b.ses[0].bron });
    b.naam = b.contact ? (b.contact.bedrijf || b.contact.email) : 'Bezoeker ' + b.vid.slice(0, 8);
  }
  klasseerBezoekers();

  /* --- Contacten afronden --- */
  D.AFM = (ml.afmeldingen || []).map(a => { const t = new Date(a.ontvangen_op); return { t, ...mk(t), token: a.token, email: a.email, c: a.campagne }; });
  for (const a of D.AFM) if (a.token && CONTACT.has(a.token)) CONTACT.get(a.token).afm.push(a);
  for (const c of CONTACT.values()) {
    c.test = D.TESTTOKENS.has(c.token); c.naamKort = c.bedrijf || c.email || 'Onbekend';
    c.echteMails = c.mails.filter(m => !m.test); c.laatsteMail = c.echteMails[c.echteMails.length - 1] || null;
    c.mensKliks = c.kliks.filter(k => k.soort === 'mens'); c.scanKliks = c.kliks.filter(k => k.soort === 'scanner');
    c.bezoek = c.ses.filter(s => s.klasse !== 'bot'); c.berekend = c.ses.some(s => s.doelen.has('berekening'));
    c.stap = c.afgemeld || c.afm.length ? 'Afgemeld' : (c.bounce || c.mails.some(m => m.status === 'bounce')) ? 'Bounce' : c.bezoek.length ? 'Op de site' : c.mensKliks.length ? 'Geklikt' : c.echteMails.some(m => m.status === 'gepland') ? 'Gepland' : c.echteMails.length ? 'Verstuurd' : 'Niet gemaild';
    c.laatst = Math.max(0, ...c.mensKliks.map(k => +k.t), ...c.bezoek.map(s => +s.eind), c.laatsteMail ? +c.laatsteMail.t : 0, ...c.afm.map(a => +a.t));
  }
  /* --- Verzendingen: per dag en verzenddienst --- */
  D.BATCH = new Map();
  for (const m of MAILS) { if (m.test) continue; const key = m.d + '-' + (m.dienst || 'onbekend'); let b = D.BATCH.get(key); if (!b) { b = { key, d: m.d, dienst: m.dienst, mails: [] }; D.BATCH.set(key, b); } b.mails.push(m); m.batch = b; }
  for (const b of D.BATCH.values()) { b.t0 = b.mails[0].t; b.t1 = b.mails[b.mails.length - 1].t; b.naam = dagLang(b.d) + ' · ' + (b.dienst ? dienstNaam(b.dienst) : 'onbekend'); }
  D.campagnes = [...new Set(MAILS.filter(m => !m.test).map(m => m.c))].sort();
  D.segmenten = [...new Set([...CONTACT.values()].filter(c => !c.test && c.echteMails.length).map(c => c.segment || 'onbekend'))].sort();

  /* --- Aanvragen --- */
  D.AANVR = ((extra && extra.aanvragen) || []).map(a => { const t = new Date(a.created_at); return { ...a, t, ...mk(t) }; });
}

/* Wie is het: echt, intern of bot. Opnieuw te draaien nadat een bezoeker (niet) intern is gemaakt. */
function sessieReden(s) { return s.intern || D.vidIntern.get(s.vid) || (D.intern.has(s.vid) ? 'Als intern gemarkeerd' : null) || (s.mail && D.TESTTOKENS.has(s.mail) ? 'Testmail-ontvanger' : null) || (s.bot ? s.bot : null); }
const anonReden = e => e.intern ? 'Eigen netwerk' : e.p.intern ? 'Eigen browser' : e.p.dev ? 'Testomgeving' : e.ua === 'bot' ? 'Bot (user-agent)' : e.p.wd ? 'Automatische browser' : e.scanner ? 'Mailscanner' : (e.salvo && !e.p.ref) ? 'Salvo van weergaven' : null;
const klasseVan = reden => !reden ? 'echt' : INTERNE_REDENEN.has(reden) ? 'intern' : 'bot';
function herklasseer() {
  for (const s of D.SES.values()) { s.reden = sessieReden(s); s.klasse = klasseVan(s.reden); }
  for (const e of D.ANON) { e.reden = anonReden(e); e.klasse = klasseVan(e.reden); }
  for (const e of D.ANONL) e.klasse = klasseVan(anonReden(e));
  for (const e of D.ANONP) e.klasse = klasseVan(anonReden(e));
}
function klasseerCalc() { for (const r of D.REEKS.values()) { r.klasse = r.ses ? r.ses.klasse : r.intern ? 'intern' : 'echt'; for (const c of r.runs) c.klasse = r.klasse; } }
function klasseerBezoekers() {
  for (const b of D.BEZ.values()) {
    b.reden = b.ses.map(s => s.reden).find(x => x && INTERNE_REDENEN.has(x)) || (b.ses.every(s => s.klasse === 'bot') ? b.ses[0].reden : null);
    b.klasse = klasseVan(b.reden);
  }
}
