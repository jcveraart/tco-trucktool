// Lokaal e-maildashboard genereren op basis van Supabase (bron voor kliks,
// verzendingen en Resend-events; Notion blijft de klantenlijst).
//   node scripts/mail/dashboard.mjs            -> dashboard/email-dashboard.html
//   node scripts/mail/dashboard.mjs --serve    -> idem + http://127.0.0.1:4173/
// De HTML bevat klantgegevens en staat in .gitignore: nooit publiceren.
// Env: SUPABASE_ACCESS_TOKEN.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from './supabase-sql.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(dir, '..', '..', 'dashboard');
const outFile = path.join(outDir, 'email-dashboard.html');

const [contacten, verzonden, kliks, events, afmeldingen] = await Promise.all([
  sql(`select token, email, bedrijf, naam, segment, bron, toegevoegd_op, afgemeld_op, bounce_op, notion_page_id
       from public.email_contacten order by bedrijf nulls last, email`),
  sql(`select token, campagne, variant, verzonden_op, resend_id, gepland_voor from public.email_verzonden order by verzonden_op`),
  sql(`select id, ontvangen_op, token, campagne, variant, link, bot, ua, klasse from analytics.email_kliks_geklasseerd order by ontvangen_op desc limit 10000`),
  sql(`select resend_id, token, campagne, variant, last_event, bijgewerkt_op from public.email_events`),
  sql(`select ontvangen_op, token, email, campagne from public.email_afmeldingen order by ontvangen_op`),
]);

const data = { gegenereerd: new Date().toISOString(), contacten, verzonden, kliks, events, afmeldingen };
const template = fs.readFileSync(path.join(dir, 'dashboard-template.html'), 'utf8');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const html = template.replace('__DATA__', () => json).replace('__GEN__', () => new Date().toLocaleString('nl-NL'));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html);
// Publieke template (alleen vormgeving + placeholders, geen data) waar de
// online variant in de Edge Function de live data in zet.
fs.writeFileSync(path.join(dir, '..', '..', 'assets', 'maildashboard-template.html'), template);
console.log(`Dashboard: ${outFile} (${contacten.length} klanten, ${verzonden.length} verzonden, ${kliks.length} kliks)`);

if (process.argv.includes('--serve')) {
  const port = 4173;
  http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(outFile));
  }).listen(port, '127.0.0.1', () => console.log(`Open: http://127.0.0.1:${port}/`));
}
