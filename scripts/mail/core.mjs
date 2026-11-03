// Gedeelde, pure functies voor het e-mailsysteem. Geen netwerk, geen secrets -
// alles hier is direct te testen (tests/mail.test.mjs).
import crypto from 'node:crypto';

export const SITE = 'https://stekkerofdiesel.nl';
// Bestemmingen die /m/ kent (m/m.js). Een link buiten deze lijst bestaat niet.
export const LINKS = ['calc', 'uitgebreid', 'vloot', 'gids', 'heffing', 'subsidie', 'ze', 'modellen', 'kenteken'];

// Specifiek e-mail label: campagne-1 + variant a = "1a", campagne-1 + b = "1b".
// Intern blijft de variant 'a'/'b' (ook in trackinglinks); dit label is wat
// Notion, dashboards en Resend-tags aan de buitenkant tonen.
export function emailLabel(campagne, variant) {
  if (!variant) return '';
  const m = String(campagne || '').match(/(\d+)\s*$/);
  return m ? `${m[1]}${variant}` : `${campagne}-${variant}`;
}

// Stabiele A/B-verdeling: dezelfde ontvanger krijgt altijd dezelfde variant.
export function splitVariant(token) {
  const h = crypto.createHash('sha256').update(String(token)).digest();
  return h[0] % 2 === 0 ? 'a' : 'b';
}

export function trackedUrl({ token, campagne, variant, link }) {
  if (!LINKS.includes(link)) throw new Error(`Onbekende linkbestemming: ${link}`);
  const q = new URLSearchParams({ k: link, c: campagne, v: variant, t: token });
  return `${SITE}/m/?${q}`;
}

export function unsubscribeUrl({ token, campagne }) {
  const q = new URLSearchParams({ t: token, c: campagne });
  return `${SITE}/afmelden/?${q}`;
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Voorkeurswoord in alle mailteksten: bedrijfswagen, nooit bestelwagen.
// Loopt vóór de placeholders, zodat een bedrijfsnaam ongemoeid blijft.
function bedrijfswagen(text) {
  return String(text ?? '')
    .replace(/\bBestelwagens\b/g, 'Bedrijfswagens').replace(/\bbestelwagens\b/g, 'bedrijfswagens')
    .replace(/\bBestelwagen\b/g, 'Bedrijfswagen').replace(/\bbestelwagen\b/g, 'bedrijfswagen');
}

// Vult {{bedrijf}}, {{naam}} en {{voornaam}} in. Onbekende placeholders blijven staan,
// zodat een typefout zichtbaar wordt in de dry-run in plaats van stil leeg te blijven.
export function renderText(text, contact) {
  const first = String(contact.naam || '').trim().split(/\s+/)[0] || '';
  return bedrijfswagen(text)
    .replaceAll('{{bedrijf}}', contact.bedrijf || '')
    .replaceAll('{{voornaam}}', first)
    .replaceAll('{{naam}}', contact.naam || '');
}

// Bouwt de volledige HTML-mail voor één ontvanger. ctas: [{link, label}] met link
// uit LINKS; elke knop krijgt de getrackte URL van deze ontvanger en variant.
export function buildEmail({ campagne, variant, contact, mail }) {
  const ctaUrls = (mail.ctas || []).map(cta => trackedUrl({ token: contact.token, campagne, variant, link: cta.link }));
  const buttons = (mail.ctas || []).map(cta => {
    const url = trackedUrl({ token: contact.token, campagne, variant, link: cta.link });
    return `<tr><td style="padding:6px 0"><a href="${url}" style="display:inline-block;background:#14532d;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px">${esc(renderText(cta.label, contact))}</a></td></tr>`;
  }).join('');
  const paras = (mail.paragraphs || []).map(p => `<p style="margin:0 0 14px;line-height:1.55;color:#1f2937">${esc(renderText(p, contact))}</p>`).join('');
  const unsub = unsubscribeUrl({ token: contact.token, campagne });
  const html = `<!doctype html><html lang="nl"><body style="margin:0;background:#f6f4ec;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px">
<tr><td><img src="${SITE}/assets/mail/logo-email.png" alt="Stekker of Diesel" width="190" style="display:block;margin-bottom:22px"></td></tr>
<tr><td><h1 style="font-size:23px;line-height:1.25;margin:0 0 16px;color:#111827">${esc(renderText(mail.heading, contact))}</h1>${paras}</td></tr>
${buttons}
<tr><td style="padding-top:26px;border-top:1px solid #e5e1d3;font-size:12.5px;line-height:1.5;color:#6b7280">
Je ontvangt deze mail omdat je contact met ons had over elektrisch rijden.<br>
Geen mails meer? <a href="${unsub}" style="color:#14532d">Meld je hier af</a>.<br>
Stekker of Diesel · Pierre Lallementstraat 44, Amsterdam · stekkerofdiesel.nl
</td></tr></table></td></tr></table></body></html>`;
  const text = [
    renderText(mail.heading, contact), '',
    ...(mail.paragraphs || []).map(p => renderText(p, contact)), '',
    ...(mail.ctas || []).map((cta, i) => `${renderText(cta.label, contact)}: ${ctaUrls[i]}`), '',
    'Je ontvangt deze mail omdat je contact met ons had over elektrisch rijden.',
    `Geen mails meer? Meld je hier af: ${unsub}`,
    'Stekker of Diesel · Pierre Lallementstraat 44, Amsterdam · stekkerofdiesel.nl',
  ].join('\n');
  return { subject: renderText(mail.subject, contact), html, text, unsubscribe: unsub };
}

// Variabelen voor de Resend-templates ({{{NAAM}}}, {{{BEDRIJF}}}, ...).
// VOERTUIG volgt het segment van de klant en zegt nooit "bestelwagen".
const VOERTUIG_PER_SEGMENT = { bestel: 'bedrijfswagen', bestelbus: 'bedrijfswagen', trekker: 'vrachtwagen', bakwagen: 'bakwagen', bus: 'bus' };
export function templateVariables(contact, campagne) {
  const naam = String(contact.naam || '').trim();
  return {
    NAAM: naam.split(/\s+/)[0] || 'relatie',
    VOERTUIG: VOERTUIG_PER_SEGMENT[String(contact.segment || '').toLowerCase()] || 'bedrijfswagen',
    BEDRIJF: contact.bedrijf || 'jullie bedrijf',
    EMAIL: contact.email || '',
    CAMPAGNE: campagne,
    TOKEN: String(contact.token),
    ...(contact.kvk ? { KVK: String(contact.kvk) } : {}),
  };
}

// Eén verzendrecord voor public.email_verzonden. Testmails (--test) worden
// ook gelogd, maar met test=true: zo staan ze apart in het dashboard en
// vervuilen ze de campagnestatistieken niet.
export function verzendingRecord({ token, campagne, variant, resendId, geplandVoor = null, test = false }) {
  return { token, campagne, variant, resend_id: resendId, gepland_voor: geplandVoor, test: !!test };
}

// SQL-literal voor de Management-API-syncscripts. Alleen voor waarden die uit
// onze eigen tabellen/Notion komen; spiegel van het invoerbeleid elders.
export function sqlStr(value) {
  if (value === null || value === undefined || value === '') return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
}
