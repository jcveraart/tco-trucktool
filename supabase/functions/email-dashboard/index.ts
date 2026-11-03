// E-maildashboard achter toegangscode. De code wordt server-side gecontroleerd
// (secret DASHBOARD_CODE); pas daarna haalt de functie met de service-role de
// maildata op en zet die in de publieke template van de website. Zo staat er
// nooit klantdata openbaar in de sitebestanden.
// Pogingen worden gelogd; alleen mislukte pogingen zijn per IP begrensd
// (max 15 per uur). Geslaagde aanvragen (ook vernieuwen) tellen niet mee.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TEMPLATE_URL = 'https://stekkerofdiesel.nl/assets/maildashboard-template.html';
const CORS = {
  'Access-Control-Allow-Origin': 'https://stekkerofdiesel.nl',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json', 'cache-control': 'no-store' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'onbekend';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const uurGeleden = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase.from('email_dashboard_pogingen')
    .select('id', { count: 'exact', head: true }).eq('ip', ip).eq('geslaagd', false).gte('poging_op', uurGeleden);
  if ((count || 0) >= 15) return json(429, { error: 'te_veel_pogingen' });

  const { code } = await req.json().catch(() => ({ code: '' }));
  const juist = String(code || '') === (Deno.env.get('DASHBOARD_CODE') || '');
  await supabase.from('email_dashboard_pogingen').insert({ ip, geslaagd: juist });
  if (!juist) return json(401, { error: 'onjuiste_code' });

  const [contacten, verzonden, kliks, events, afmeldingen, templateResp] = await Promise.all([
    supabase.from('email_contacten').select('token, email, bedrijf, naam, segment, bron, toegevoegd_op, afgemeld_op, bounce_op, notion_page_id').order('bedrijf'),
    supabase.from('email_verzonden').select('token, campagne, variant, verzonden_op, resend_id, gepland_voor, test').order('verzonden_op'),
    supabase.from('email_kliks').select('id, ontvangen_op, token, campagne, variant, link, bot, ua').order('ontvangen_op', { ascending: false }).limit(10000),
    supabase.from('email_events').select('resend_id, token, campagne, variant, last_event, bijgewerkt_op'),
    supabase.from('email_afmeldingen').select('ontvangen_op, token, email, campagne').order('ontvangen_op'),
    fetch(TEMPLATE_URL),
  ]);
  const fout = [contacten, verzonden, kliks, events, afmeldingen].find(r => r.error);
  if (fout) return json(500, { error: String(fout.error?.message || 'query_fout') });
  if (!templateResp.ok) return json(502, { error: 'template_niet_bereikbaar' });

  // Scanner-classificatie zoals in analytics.email_kliks_geklasseerd (SQL-view
  // is niet via de API bereikbaar, dus hier in code): binnen 60 sec na
  // verzending, of (vrijwel) alle links binnen 10 minuten = vermoedelijke scanner.
  const verzondenOp = new Map((verzonden.data || []).map((v: any) => [v.token + '|' + v.campagne, v.verzonden_op]));
  const perToken = new Map<string, { eerste: string; links: Set<string> }>();
  for (const k of kliks.data || []) {
    const key = k.token + '|' + k.campagne;
    if (!perToken.has(key)) perToken.set(key, { eerste: k.ontvangen_op, links: new Set() });
    const p = perToken.get(key)!;
    if (k.ontvangen_op < p.eerste) p.eerste = k.ontvangen_op;
    p.links.add(k.link);
  }
  const kliksGeklasseerd = (kliks.data || []).map((k: any) => {
    const p = perToken.get(k.token + '|' + k.campagne);
    const vz = verzondenOp.get(k.token + '|' + k.campagne);
    let klasse = 'menselijk';
    if (k.bot) klasse = 'scanner';
    else if (!k.token) klasse = 'onbekend';
    else if (vz && new Date(k.ontvangen_op).getTime() < new Date(vz).getTime() + 60_000) klasse = 'scanner_vermoedelijk';
    else if (p && p.links.size >= 3 && new Date(k.ontvangen_op).getTime() <= new Date(p.eerste).getTime() + 600_000) klasse = 'scanner_vermoedelijk';
    return { ...k, klasse };
  });

  const data = {
    gegenereerd: new Date().toISOString(),
    contacten: contacten.data, verzonden: verzonden.data, kliks: kliksGeklasseerd,
    events: events.data, afmeldingen: afmeldingen.data,
  };
  const template = await templateResp.text();
  const html = template
    .replace('__DATA__', () => JSON.stringify(data).replace(/</g, '\\u003c'))
    .replace('__GEN__', () => new Date().toLocaleString('nl-NL'));
  return new Response(html, { headers: { ...CORS, 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
});
