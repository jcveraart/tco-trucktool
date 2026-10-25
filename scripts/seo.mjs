// Maakt van index.html een losse pagina per route (/overstapgids/laden/ enz.), met eigen titel,
// beschrijving, canonical, Open Graph en structured data, plus sitemap.xml en 404.html.
// Bron van de teksten: het blok <script type="application/json" id="seo"> in index.html.
// Draai na elke wijziging aan index.html: node scripts/seo.mjs (de workflow seo.yml doet het ook).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://stekkerofdiesel.nl';
const BRAND = 'Stekker of Diesel';
const PATHS = { calc: '/', uitgebreid: '/uitgebreid/', modellen: '/modellen/', faq: '/overstapgids/', nieuws: '/nieuws/', over: '/over-ons/', privacy: '/privacy/', vloot: '/vlootanalyse/', restwaarde: '/restwaarde/' };
const PRIO = { calc: '1.0', uitgebreid: '0.8', modellen: '0.9', faq: '0.9', nieuws: '0.7', vloot: '0.6', restwaarde: '0.7', over: '0.4', privacy: '0.2' };

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const { routes } = JSON.parse(src.match(/<script type="application\/json" id="seo">([\s\S]*?)<\/script>/)[1]);
const today = new Date().toISOString().slice(0, 10);
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const text = h => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const urlOf = k => SITE + (k.startsWith('gids/') ? '/overstapgids/' + k.slice(5) + '/' : PATHS[k]);

// Vorige lastmod per url, met een hash van de inhoud, zodat lastmod alleen verschuift als de pagina echt verandert
const prev = {};
try {
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  for (const m of sm.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><!-- ([0-9a-f]+) -->/g)) prev[m[1]] = { d: m[2], h: m[3] };
} catch (e) {}

function sectionOf(html, k) {
  const p = k.startsWith('gids/') ? 'gids' : k;
  const s = html.match(new RegExp(`<section class="page" data-page="${p}"[\\s\\S]*?\\n</section>`));
  if (!s) throw new Error('Geen sectie voor ' + k);
  if (p !== 'gids') return s[0];
  const a = s[0].match(new RegExp(`<article class="ga" data-g="${k.slice(5)}"[\\s\\S]*?</article>`));
  if (!a) throw new Error('Geen gidsonderwerp ' + k);
  return a[0];
}

function faqItems(html, k = 'faq') {
  return [...sectionOf(html, k).matchAll(/<details><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map(m => ({ '@type': 'Question', name: text(m[1]), acceptedAnswer: { '@type': 'Answer', text: text(m[2]) } }));
}

function jsonld(k, r, mod) {
  const url = urlOf(k), org = { '@id': SITE + '/#org' };
  const crumbs = [[BRAND, SITE + '/']];
  if (k.startsWith('gids/')) crumbs.push([routes.faq.name, urlOf('faq')]);
  if (k !== 'calc') crumbs.push([r.name, url]);
  const g = [
    { '@type': 'Organization', '@id': SITE + '/#org', name: BRAND, url: SITE + '/', logo: SITE + '/apple-touch-icon.png' },
    { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: BRAND, inLanguage: 'nl-NL', publisher: org },
    { '@type': k === 'faq' || k === 'calc' ? ['WebPage', 'FAQPage'] : 'WebPage', '@id': url, url, name: r.title, description: r.desc, inLanguage: 'nl-NL', isPartOf: { '@id': SITE + '/#website' }, dateModified: mod, primaryImageOfPage: SITE + '/og.png', ...(crumbs.length > 1 ? { breadcrumb: { '@id': url + '#kruimel' } } : {}), ...(k === 'faq' || k === 'calc' ? { mainEntity: faqItems(src, k) } : {}) }
  ];
  if (crumbs.length > 1) g.push({ '@type': 'BreadcrumbList', '@id': url + '#kruimel', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) });
  if (k === 'calc' || k === 'uitgebreid') g.push({ '@type': 'WebApplication', name: 'TCO-calculator elektrisch of diesel', url, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: 'nl-NL', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, publisher: org, description: r.desc });
  if (k.startsWith('gids/')) g.push({ '@type': 'Article', headline: r.name, description: r.desc, mainEntityOfPage: { '@id': url }, image: SITE + '/og.png', inLanguage: 'nl-NL', dateModified: mod, author: org, publisher: org });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c');
}

function head(k, mod, noindex) {
  const r = routes[k], url = urlOf(k);
  return [
    '<!--seo-->',
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.desc)}">`,
    noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">',
    noindex ? '' : `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${BRAND}">`,
    '<meta property="og:locale" content="nl_NL">',
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(r.title)}">`,
    `<meta property="og:description" content="${esc(r.desc)}">`,
    `<meta property="og:image" content="${SITE}/og.png">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${BRAND}: vind jouw ideale bedrijfsauto">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<script type="application/ld+json">${jsonld(k, r, mod)}</script>`,
    '<!--/seo-->'
  ].filter(Boolean).join('\n');
}

function page(k, mod, noindex) {
  const p = k.startsWith('gids/') ? 'gids' : k;
  let h = src.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, () => head(k, mod, noindex));
  h = h.replace(/<section class="page" data-page="([a-z]+)"( id="calc")?( hidden)?>/g, (m, x, id = '') => `<section class="page" data-page="${x}"${id}${x === p ? '' : ' hidden'}>`);
  if (p === 'gids') h = h.replace(/<article class="ga" data-g="([a-z-]+)"( hidden)?>/g, (m, g) => `<article class="ga" data-g="${g}"${g === k.slice(5) ? '' : ' hidden'}>`);
  return h;
}

const urls = [];
let calcMod = today;
for (const k of Object.keys(routes)) {
  const url = urlOf(k);
  const hash = crypto.createHash('sha1').update(JSON.stringify(routes[k]) + sectionOf(src, k)).digest('hex').slice(0, 12);
  const mod = prev[url] && prev[url].h === hash ? prev[url].d : today;
  if (k === 'calc') calcMod = mod;
  const file = path.join(ROOT, new URL(url).pathname, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(k, mod));
  urls.push(` <url><loc>${url}</loc><lastmod>${mod}</lastmod><!-- ${hash} --><priority>${k.startsWith('gids/') ? '0.8' : PRIO[k]}</priority></url>`);
}
fs.writeFileSync(path.join(ROOT, '404.html'), page('calc', calcMod, true));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`${urls.length} pagina's, sitemap en 404.html geschreven`);

