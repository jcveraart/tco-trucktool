// Bezorgstatus van campagnemails bijwerken (draait elk uur via
// .github/workflows/mailstatus.yml). Haalt bij Resend de laatste stand op van
// mails die nog niet definitief zijn (verstuurd/ingepland/vertraagd) en zet die
// in public.email_events; daar leest het maildashboard "Bezorgd" uit.
// Hard bounce zet bounce_op, een klacht meldt de klant af.
// Gebruikt de REST-API met de service-role (geen Management-token nodig).
// Env: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.
const URL = 'https://zarvyblveyomngypwvhw.supabase.co/rest/v1';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY, RESEND = process.env.RESEND_API_KEY;
if (!KEY || !RESEND) { console.error('SUPABASE_SERVICE_ROLE_KEY of RESEND_API_KEY ontbreekt.'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const H = { apikey: KEY, authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };
async function rest(pad, opties = {}) {
  const r = await fetch(`${URL}/${pad}`, { ...opties, headers: { ...H, ...(opties.headers || {}) } });
  if (!r.ok) throw new Error(`Supabase ${r.status} op ${pad}: ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}

const DEFINITIEF = new Set(['delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed']);
const sinds = new Date(Date.now() - 30 * 864e5).toISOString();
const verzonden = await rest(`email_verzonden?select=resend_id,token,campagne,variant&resend_id=not.is.null&verzonden_op=gte.${sinds}&limit=5000`);
const events = await rest('email_events?select=resend_id,last_event&limit=10000');
const stand = new Map(events.map(e => [e.resend_id, e.last_event]));
const open = verzonden.filter(v => !DEFINITIEF.has(stand.get(v.resend_id)));
console.log(`${verzonden.length} mails in de laatste 30 dagen, ${open.length} nog zonder definitieve status.`);

const nieuw = [], bounces = [], klachten = [];
let onbekend = 0, fout = 0;
for (const v of open) {
  let r;
  for (let poging = 0; poging < 4; poging++) {
    r = await fetch(`https://api.resend.com/emails/${v.resend_id}`, { headers: { authorization: `Bearer ${RESEND}` } });
    if (r.status !== 429) break;
    await sleep(2000 * (poging + 1));
  }
  await sleep(600); // Resend: max 2 verzoeken per seconde
  if (r.status === 404) { onbekend++; continue; }
  if (!r.ok) { fout++; if (fout <= 3) console.error(`Resend HTTP ${r.status} voor ${v.resend_id}`); continue; }
  const mail = await r.json();
  const event = mail.last_event || 'sent';
  if (stand.get(v.resend_id) === event) continue;
  nieuw.push({ resend_id: v.resend_id, token: v.token, campagne: v.campagne, variant: v.variant, last_event: event, bijgewerkt_op: new Date().toISOString() });
  if (event === 'bounced') bounces.push(v.token);
  if (event === 'complained') klachten.push(v.token);
}
for (let i = 0; i < nieuw.length; i += 200) {
  await rest('email_events?on_conflict=resend_id', {
    method: 'POST', headers: { prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(nieuw.slice(i, i + 200)),
  });
}
const nu = new Date().toISOString();
if (bounces.length) await rest(`email_contacten?token=in.(${bounces.join(',')})&bounce_op=is.null`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ bounce_op: nu }) });
if (klachten.length) await rest(`email_contacten?token=in.(${klachten.join(',')})&afgemeld_op=is.null`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ afgemeld_op: nu }) });
const telling = nieuw.reduce((t, e) => ({ ...t, [e.last_event]: (t[e.last_event] || 0) + 1 }), {});
console.log(`${nieuw.length} bijgewerkt ${JSON.stringify(telling)}.${onbekend ? ` ${onbekend} niet gevonden bij Resend (ander team?).` : ''}${fout ? ` ${fout} fouten.` : ''}`);
if (open.length > 15 && onbekend + fout === open.length) { console.error('Geen enkele mail gevonden: RESEND_API_KEY hoort waarschijnlijk bij een ander Resend-team.'); process.exit(1); }
