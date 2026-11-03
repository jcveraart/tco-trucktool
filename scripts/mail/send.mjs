// Campagne versturen via Resend, met A/B-variant per ontvanger en getrackte links.
//
//   node scripts/mail/send.mjs --campagne introductie            dry-run (standaard, verstuurt niets)
//   node scripts/mail/send.mjs --campagne introductie --test je@voorbeeld.nl
//   node scripts/mail/send.mjs --campagne introductie --send     echt versturen naar de verzendlijst
//   node scripts/mail/send.mjs --campagne introductie --send --limit 20
//
// Env: RESEND_API_KEY, SUPABASE_ACCESS_TOKEN. Ontvangers komen uit
// analytics.email_verzendlijst (niet afgemeld, geen bounce, nog niet gemaild
// voor deze campagne). Elke verzending wordt gelogd in email_verzonden.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitVariant, buildEmail, sqlStr, templateVariables, unsubscribeUrl, emailLabel, verzendingRecord } from './core.mjs';
import { sql } from './supabase-sql.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback = null) => { const i = args.indexOf('--' + name); return i >= 0 ? (args[i + 1] ?? true) : fallback; };
const campagne = opt('campagne');
const doSend = args.includes('--send');
const testTo = opt('test');
const limit = opt('limit') ? Number(opt('limit')) : null;
const selectFile = opt('select');
const planTijd = opt('plan'); // ISO-tijd, bv. 2026-11-03T07:46:00+01:00; Resend verstuurt dan pas
if (!campagne) { console.error('Gebruik: --campagne <slug> [--test e-mail] [--send] [--limit n]'); process.exit(1); }

const dir = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(dir, 'campagnes', campagne + '.json'), 'utf8'));
const hasTodo = JSON.stringify(config).includes('TODO');
if (hasTodo) console.error('Let op: de campagnetekst bevat nog TODO-plekken.');
if (hasTodo && (doSend || testTo)) { console.error('Versturen geweigerd: vul eerst de TODO-teksten in de campagne in.'); process.exit(1); }

async function recipients() {
  if (testTo) {
    // Testontvanger krijgt een echt contact (bron 'test'), zodat de
    // testmail gelogd kan worden en in het dashboard verschijnt zonder
    // ooit in de echte verzendlijst te belanden.
    const email = String(testTo).toLowerCase();
    const bestaand = await sql(`select token, email, bedrijf, naam, segment from public.email_contacten where email = ${sqlStr(email)}`);
    if (bestaand.length) return bestaand;
    await sql(`insert into public.email_contacten (email, bron) values (${sqlStr(email)}, 'test') on conflict (email) do nothing`);
    return sql(`select token, email, bedrijf, naam, segment from public.email_contacten where email = ${sqlStr(email)}`);
  }
  const list = await sql(`select l.token, l.email, l.bedrijf, l.naam, l.segment from analytics.email_verzendlijst l
    where not exists (select 1 from public.email_verzonden v where v.token = l.token and v.campagne = ${sqlStr(campagne)})
    order by l.email`);
  if (selectFile) {
    const emails = new Set(JSON.parse(fs.readFileSync(selectFile, 'utf8')).map(e => String(e).toLowerCase()));
    const filtered = list.filter(c => emails.has(c.email));
    console.log(`Selectiebestand: ${filtered.length} van ${emails.size} adressen staan klaar om te mailen.`);
    return limit ? filtered.slice(0, limit) : filtered;
  }
  return limit ? list.slice(0, limit) : list;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function sendOne(contact, variant) {
  // Geen List-Unsubscribe-Post: de afmeldpagina is statisch en kan geen POST
  // verwerken. De URL in List-Unsubscribe opent de bevestigpagina.
  const unsubscribe = unsubscribeUrl({ token: contact.token, campagne });
  const tags = [
    { name: 'campagne', value: campagne }, { name: 'variant', value: variant },
    { name: 'label', value: emailLabel(campagne, variant) },
    { name: 'token', value: String(contact.token) },
  ];
  let body;
  const basis = planTijd && !testTo ? { scheduled_at: planTijd } : {};
  if (config.resendTemplates) {
    // Teksten komen uit de gepubliceerde Resend-templates; de trackinglinks
    // met TOKEN/CAMPAGNE zitten al in de template zelf.
    body = JSON.stringify({
      ...basis,
      from: config.from, to: [contact.email], reply_to: config.replyTo,
      template: { id: config.resendTemplates[variant], variables: templateVariables(contact, campagne) },
      headers: { 'List-Unsubscribe': `<${unsubscribe}>` },
      tags,
    });
  } else {
    const mail = config.variants[variant];
    const { subject, html, text } = buildEmail({ campagne, variant, contact, mail });
    body = JSON.stringify({
      ...basis,
      from: config.from, to: [contact.email], reply_to: config.replyTo, subject, html, text,
      headers: { 'List-Unsubscribe': `<${unsubscribe}>` },
      tags,
    });
  }
  for (let poging = 0; ; poging++) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body,
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) return data.id;
    if (r.status === 429 && poging < 3) { await sleep(2000 * (poging + 1)); continue; }
    throw new Error(`Resend HTTP ${r.status} voor ${contact.email}: ${JSON.stringify(data).slice(0, 200)}`);
  }
}

const list = await recipients();
const perVariant = { a: 0, b: 0 };
for (const c of list) perVariant[splitVariant(c.token)]++;
console.log(`${list.length} ontvangers voor campagne ${campagne}: ${emailLabel(campagne, 'a')}=${perVariant.a}, ${emailLabel(campagne, 'b')}=${perVariant.b}`);
if (!doSend && !testTo) {
  const sample = list[0];
  if (sample && config.resendTemplates) {
    const v = splitVariant(sample.token);
    console.log(`Voorbeeld (variant ${v}) naar ${sample.email}\nResend-template: ${config.resendTemplates[v]}\nVariabelen: ${JSON.stringify(templateVariables(sample, campagne))}`);
  } else if (sample) {
    const v = splitVariant(sample.token);
    const { subject, html } = buildEmail({ campagne, variant: v, contact: sample, mail: config.variants[v] });
    console.log(`Voorbeeld (variant ${v}) naar ${sample.email}\nOnderwerp: ${subject}\n${html.slice(0, 500)}...`);
  }
  console.log('Dry-run: niets verstuurd. Gebruik --test <e-mail> of --send.');
  process.exit(0);
}
if (!process.env.RESEND_API_KEY) { console.error('RESEND_API_KEY ontbreekt.'); process.exit(1); }

let sent = 0, failed = 0;
for (const contact of list) {
  const variant = splitVariant(contact.token);
  try {
    const resendId = await sendOne(contact, variant);
    const rec = verzendingRecord({ token: contact.token, campagne, variant, resendId, geplandVoor: planTijd || null, test: !!testTo });
    await sql(`insert into public.email_verzonden (token, campagne, variant, resend_id, gepland_voor, test) values (${sqlStr(rec.token)}, ${sqlStr(rec.campagne)}, ${sqlStr(rec.variant)}, ${sqlStr(rec.resend_id)}, ${rec.gepland_voor ? sqlStr(rec.gepland_voor) : 'null'}, ${rec.test}) on conflict (token, campagne) do update set resend_id = excluded.resend_id, gepland_voor = excluded.gepland_voor, test = excluded.test`);
    sent++;
    console.log(`${planTijd ? `ingepland voor ${planTijd}` : 'verstuurd'} (${emailLabel(campagne, variant)}) ${contact.email} ${resendId}`);
    await sleep(550); // onder de Resend-rate-limit (2/sec) blijven
  } catch (e) { failed++; console.error(String(e.message || e)); }
}
console.log(`Klaar: ${sent} verstuurd, ${failed} mislukt.`);
process.exit(failed ? 1 : 0);
