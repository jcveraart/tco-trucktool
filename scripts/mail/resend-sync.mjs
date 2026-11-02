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
let updated = 0;
for (const s of sent) {
  const r = await fetch(`https://api.resend.com/emails/${s.resend_id}`, {
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  if (!r.ok) { console.error(`Resend HTTP ${r.status} voor ${s.resend_id}`); continue; }
  const mail = await r.json();
  const event = mail.last_event || 'sent';
  if (mail.scheduled_at) await sql(`update public.email_verzonden set gepland_voor = coalesce(gepland_voor, ${sqlStr(mail.scheduled_at)}) where resend_id = ${sqlStr(s.resend_id)}`);
  await sql(`insert into public.email_events (resend_id, token, campagne, variant, last_event, bijgewerkt_op)
    values (${sqlStr(s.resend_id)}, ${sqlStr(s.token)}, ${sqlStr(s.campagne)}, ${sqlStr(s.variant)}, ${sqlStr(event)}, now())
    on conflict (resend_id) do update set last_event = excluded.last_event, bijgewerkt_op = now()`);
  if (event === 'bounced') await sql(`update public.email_contacten set bounce_op = coalesce(bounce_op, now()) where token = ${sqlStr(s.token)}`);
  if (event === 'complained') await sql(`update public.email_contacten set afgemeld_op = coalesce(afgemeld_op, now()) where token = ${sqlStr(s.token)}`);
  updated++;
  await sleep(300); // Supabase Management API throttlet bij snelle losse queries (429)
}
console.log(`${updated} mails bijgewerkt in email_events.`);
