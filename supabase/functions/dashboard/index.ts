// Gegevens voor het dashboard op /maildashboard/ (site, calculator en e-mail in één keer), als JSON.
// Achter dezelfde toegangscode als voorheen (secret DASHBOARD_CODE, pogingen in
// email_dashboard_pogingen, max 15 mislukte per IP per uur). De pagina zelf is statisch
// en bevat geen gegevens; die komen pas hier vandaan nadat de code klopt.
// Tabellen worden per duizend rijen opgehaald, zodat niets wordt afgekapt.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': 'https://stekkerofdiesel.nl',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json', 'cache-control': 'no-store' } });

// Het netwerk van wie het dashboard opent telt voortaan als intern (gehasht in de database).
// Telefoonnetwerken delen IP-adressen met veel mensen: die gelden 2 dagen, vaste netwerken 90.
async function registreerNetwerk(supabase: any, req: Request, ip: string) {
  if (!ip || ip === 'onbekend') return;
  const mobiel = /iphone|android|mobile/i.test(req.headers.get('user-agent') || '');
  const label = `Dashboard · ${mobiel ? 'mobiel' : 'vast'} · ${new Date().toISOString().slice(0, 10)}`;
  await supabase.rpc('registreer_intern_net', { ip, label, dagen: mobiel ? 2 : 90 });
}

// Alle rijen van een tabel, per duizend (de API geeft er nooit meer per keer)
async function alles(supabase: any, tabel: string, kolommen: string, volgorde: string, filter?: (q: any) => any) {
  const uit: unknown[] = [];
  for (let van = 0; van < 200_000; van += 1000) {
    let q = supabase.from(tabel).select(kolommen).order(volgorde).range(van, van + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${tabel}: ${error.message}`);
    uit.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return uit;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'onbekend';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const uurGeleden = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase.from('email_dashboard_pogingen')
    .select('id', { count: 'exact', head: true }).eq('ip', ip).eq('geslaagd', false).gte('poging_op', uurGeleden);
  if ((count || 0) >= 15) return json(429, { error: 'te_veel_pogingen' });

  const body = await req.json().catch(() => ({}));
  const juist = String(body.code || '') === (Deno.env.get('DASHBOARD_CODE') || '');
  await supabase.from('email_dashboard_pogingen').insert({ ip, geslaagd: juist });
  if (!juist) return json(401, { error: 'onjuiste_code' });

  await registreerNetwerk(supabase, req, ip);
  // Netwerk handmatig weer extern maken
  if (typeof body.net_weg === 'string' && /^[0-9a-f]{10}$/.test(body.net_weg)) {
    const r = await supabase.rpc('verwijder_intern_net', { prefix: body.net_weg });
    return r.error ? json(500, { error: r.error.message }) : json(200, { ok: true });
  }
  // Eigen browser automatisch als intern markeren
  if (typeof body.vid === 'string' && UUID.test(body.vid)) {
    await supabase.from('web_intern').upsert({ visitor_id: body.vid, label: 'Dashboard geopend' }, { onConflict: 'visitor_id', ignoreDuplicates: true });
  }
  // Handmatig een bezoeker intern maken of terugzetten
  if (body.intern && typeof body.intern.visitor_id === 'string' && UUID.test(body.intern.visitor_id)) {
    const r = body.intern.aan
      ? await supabase.from('web_intern').upsert({ visitor_id: body.intern.visitor_id, label: 'Handmatig' }, { onConflict: 'visitor_id' })
      : await supabase.from('web_intern').delete().eq('visitor_id', body.intern.visitor_id);
    return r.error ? json(500, { error: r.error.message }) : json(200, { ok: true });
  }

  const dagen = Math.min(365, Math.max(1, Number(body.dagen) || 365));
  const van = new Date(Date.now() - dagen * 86400_000).toISOString();
  try {
    const [bz, contacten, verzonden, kliks, events, afmeldingen, bezoek, landingen, calc, aanvragen] = await Promise.all([
      supabase.rpc('dashboard_bezoekers', { van }).then((r: any) => { if (r.error) throw new Error('dashboard_bezoekers: ' + r.error.message); return r.data; }),
      alles(supabase, 'email_contacten', 'token, email, bedrijf, naam, segment, bron, toegevoegd_op, afgemeld_op, bounce_op, notion_page_id', 'token'),
      alles(supabase, 'email_verzonden', 'token, campagne, variant, verzonden_op, resend_id, gepland_voor, test, dienst', 'verzonden_op'),
      alles(supabase, 'email_kliks', 'id, ontvangen_op, token, campagne, variant, link, bot, ua, intern', 'id'),
      alles(supabase, 'email_events', 'resend_id, token, campagne, variant, last_event, bijgewerkt_op', 'bijgewerkt_op'),
      alles(supabase, 'email_afmeldingen', 'ontvangen_op, token, email, campagne', 'ontvangen_op'),
      supabase.rpc('dashboard_mail_bezoek').then((r: any) => r.data || []),
      supabase.rpc('dashboard_mail_landingen').then((r: any) => r.data || []),
      alles(supabase, 'calc_runs', 'id, received_at, consent, visitor_id, session_id, reeks, nr, trigger, modus, vt, model_id, km, jaren, goedkoper, verschil_jaar, invoer, gewijzigd, voertuig, uitkomst, bron, intern', 'id', (q: any) => q.gte('received_at', van)),
      alles(supabase, 'fleet_requests', 'id, created_at, company, contact_name, email, phone, fleet_size, message, calc_link, status', 'created_at'),
    ]);
    return json(200, {
      v: 2, gegenereerd: new Date().toISOString(), dagen, bz,
      ml: { contacten, verzonden, kliks, events, afmeldingen, bezoek, landingen },
      extra: { calc, aanvragen },
    });
  } catch (e) {
    return json(500, { error: String((e as Error).message || 'query_fout') });
  }
});
