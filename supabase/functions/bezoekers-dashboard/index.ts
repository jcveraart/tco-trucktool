// Bezoekersdashboard achter dezelfde toegangscode als het e-maildashboard
// (secret DASHBOARD_CODE, pogingen in email_dashboard_pogingen, max 15 mislukte
// per IP per uur). Haalt met de service-role de events op via
// public.dashboard_bezoekers() en zet ze in de publieke template.
// De browser waarmee het dashboard wordt geopend, komt in public.web_intern.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TEMPLATE_URL = 'https://stekkerofdiesel.nl/assets/bezoekersdashboard-template.html';
const CORS = {
  'Access-Control-Allow-Origin': 'https://stekkerofdiesel.nl',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Het netwerk van wie het dashboard opent telt voortaan als intern (gehasht in de database).
// Telefoonnetwerken delen IP-adressen met veel mensen: die gelden 2 dagen, vaste netwerken 90.
async function registreerNetwerk(supabase: any, req: Request, ip: string, bron: string) {
  if (!ip || ip === 'onbekend') return;
  const ua = req.headers.get('user-agent') || '';
  const mobiel = /iphone|android|mobile/i.test(ua);
  const label = `${bron} · ${mobiel ? 'mobiel' : 'vast'} · ${new Date().toISOString().slice(0, 10)}`;
  await supabase.rpc('registreer_intern_net', { ip, label, dagen: mobiel ? 2 : 90 });
}
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

  const body = await req.json().catch(() => ({}));
  const juist = String(body.code || '') === (Deno.env.get('DASHBOARD_CODE') || '');
  await supabase.from('email_dashboard_pogingen').insert({ ip, geslaagd: juist });
  if (!juist) return json(401, { error: 'onjuiste_code' });

  await registreerNetwerk(supabase, req, ip, 'Bezoekersdashboard');
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

  const dagen = Math.min(365, Math.max(1, Number(body.dagen) || 90));
  const van = new Date(Date.now() - dagen * 86400_000).toISOString();
  const [rpc, templateResp] = await Promise.all([
    supabase.rpc('dashboard_bezoekers', { van }),
    fetch(TEMPLATE_URL),
  ]);
  if (rpc.error) return json(500, { error: String(rpc.error.message || 'query_fout') });
  if (!templateResp.ok) return json(502, { error: 'template_niet_bereikbaar' });

  const data = { gegenereerd: new Date().toISOString(), dagen, ...(rpc.data as Record<string, unknown>) };
  const template = await templateResp.text();
  const html = template.replace('__DATA__', () => JSON.stringify(data).replace(/</g, '\\u003c'));
  return new Response(html, { headers: { ...CORS, 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
});
