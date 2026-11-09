// Resend-webhook: elke statuswijziging van een verzonden mail (verstuurd,
// bezorgd, bounce, klacht, ...) komt hier direct binnen en wordt in
// public.email_events gezet. Zo loopt "Bezorgd" in het maildashboard vanzelf
// mee, ook als niemand scripts/mail/resend-sync.mjs draait.
// Deploy met verify_jwt = false; echtheid wordt gecontroleerd met de
// Svix-handtekening van Resend (secret RESEND_WEBHOOK_SECRET, whsec_...).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Hoger getal = verder in de bezorging. Een later binnenkomend 'sent' mag een
// 'delivered' niet terugzetten; bounce/klacht/mislukt winnen altijd.
const RANG: Record<string, number> = {
  scheduled: 0, sent: 1, delivery_delayed: 2, delivered: 3, opened: 4, clicked: 5,
  failed: 9, bounced: 9, complained: 10,
};
const tekst = (status: number, body = '') => new Response(body, { status });

async function controleer(req: Request, body: string): Promise<boolean> {
  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET') || '';
  const id = req.headers.get('svix-id'), ts = req.headers.get('svix-timestamp'), sig = req.headers.get('svix-signature');
  if (!secret || !id || !ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 600) return false;
  const sleutel = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', sleutel, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`));
  const verwacht = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return sig.split(' ').some(s => s.split(',')[1] === verwacht);
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return tekst(405);
  const body = await req.text();
  if (!(await controleer(req, body))) return tekst(401, 'ongeldige handtekening');

  let ev: any;
  try { ev = JSON.parse(body); } catch { return tekst(400); }
  const event = String(ev?.type || '').replace(/^email\./, '');
  const resendId = ev?.data?.email_id;
  if (!(event in RANG) || !resendId) return tekst(204); // ander type event: negeren

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Welke verzending hoort erbij? Eerst op Resend-id, anders op adres
  // (laatste verzending naar dat adres zonder Resend-id) en dan het id aanvullen.
  let { data: v } = await supabase.from('email_verzonden')
    .select('id, token, campagne, variant').eq('resend_id', resendId).maybeSingle();
  if (!v) {
    const aan = String((ev.data.to || [])[0] || '').toLowerCase().trim();
    const { data: c } = aan ? await supabase.from('email_contacten').select('token').ilike('email', aan).maybeSingle() : { data: null };
    if (c) {
      const { data: kandidaat } = await supabase.from('email_verzonden')
        .select('id, token, campagne, variant').eq('token', c.token).is('resend_id', null)
        .order('verzonden_op', { ascending: false }).limit(1).maybeSingle();
      if (kandidaat) {
        await supabase.from('email_verzonden').update({ resend_id: resendId }).eq('id', kandidaat.id);
        v = kandidaat;
      }
    }
  }
  if (!v) return tekst(204); // geen campagnemail (bijv. melding van de site)

  const { data: oud } = await supabase.from('email_events').select('last_event').eq('resend_id', resendId).maybeSingle();
  if (!oud || RANG[event] >= (RANG[oud.last_event] ?? 0)) {
    await supabase.from('email_events').upsert({
      resend_id: resendId, token: v.token, campagne: v.campagne, variant: v.variant,
      last_event: event, bijgewerkt_op: new Date().toISOString(),
    }, { onConflict: 'resend_id' });
  }
  const nu = new Date().toISOString();
  if (event === 'bounced' && ev.data?.bounce?.type !== 'Transient') {
    await supabase.from('email_contacten').update({ bounce_op: nu }).eq('token', v.token).is('bounce_op', null);
  }
  if (event === 'complained') {
    await supabase.from('email_contacten').update({ afgemeld_op: nu }).eq('token', v.token).is('afgemeld_op', null);
  }
  return tekst(204);
});
