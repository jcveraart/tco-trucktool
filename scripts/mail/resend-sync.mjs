// Resend-events ophalen en bewaren: per verzonden mail de laatste stand
// (delivered/opened/clicked/bounced/complained). Hard bounce zet bounce_op,
// een klacht meldt de klant direct af. Daarna notion-sync.mjs draaien om de
// e-mailstap in Notion bij te werken.
//   node scripts/mail/resend-sync.mjs
// Env: RESEND_API_KEY, SUPABASE_ACCESS_TOKEN.
import { sql } from './supabase-sql.mjs';
import { sqlStr } from './core.mjs';

if (!process.env.RESEND_API_KEY) { console.error('RESEND_API_KEY ontbreekt.'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sent = await sql('select resend_id, token, campagne, variant from public.email_verzonden where resend_id is not null');
console.log(`${sent.length} verzonden mails met Resend-id.`);
const events = [], bounces = [], klachten = [], gepland = [];
let onbekend = 0;
for (const s of sent) {
  const r = await fetch(`https://api.resend.com/emails/${s.resend_id}`, {
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  if (r.status === 404) { onbekend++; continue; } // mail van het oude Resend-account (voor de migratie)
  if (!r.ok) { console.error(`Resend HTTP ${r.status} voor ${s.resend_id}`); continue; }
  const mail = await r.json();
  const event = mail.last_event || 'sent';
  events.push(`(${sqlStr(s.resend_id)}, ${sqlStr(s.token)}, ${sqlStr(s.campagne)}, ${sqlStr(s.variant)}, ${sqlStr(event)}, now())`);
  if (mail.scheduled_at) gepland.push(`(${sqlStr(s.resend_id)}, ${sqlStr(mail.scheduled_at)}::timestamptz)`);
  if (event === 'bounced') bounces.push(sqlStr(s.token));
  if (event === 'complained') klachten.push(sqlStr(s.token));
}
// In batches wegschrijven: losse queries per mail lopen tegen de
// rate-limit (429) van de Supabase Management API aan.
for (let i = 0; i < events.length; i += 100) {
  await sql(`insert into public.email_events (resend_id, token, campagne, variant, last_event, bijgewerkt_op)
    values ${events.slice(i, i + 100).join(',')}
    on conflict (resend_id) do update set last_event = excluded.last_event, bijgewerkt_op = now()`);
}
for (let i = 0; i < gepland.length; i += 100) {
  await sql(`update public.email_verzonden v set gepland_voor = coalesce(v.gepland_voor, g.tijd)
    from (values ${gepland.slice(i, i + 100).join(',')}) as g(id, tijd) where v.resend_id = g.id`);
}
if (bounces.length) await sql(`update public.email_contacten set bounce_op = coalesce(bounce_op, now()) where token in (${bounces.join(',')})`);
if (klachten.length) await sql(`update public.email_contacten set afgemeld_op = coalesce(afgemeld_op, now()) where token in (${klachten.join(',')})`);
console.log(`${events.length} mails bijgewerkt in email_events.${onbekend ? ` ${onbekend} overgeslagen (oud Resend-account).` : ''}`);
