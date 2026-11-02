// Notion <-> Supabase voor het e-mailsysteem.
//
//   node scripts/mail/notion-sync.mjs --setup     eigenschappen toevoegen + dashboardpagina maken
//   node scripts/mail/notion-sync.mjs             synchroniseren (leads in, stappen terug, dashboard bijwerken)
//
// Richting 1: Leads ("Klanten & leads") met e-mailadres -> email_contacten.
// Richting 2: per lead terug naar Notion: E-mail stap (Niet gemaild / Verstuurd /
//   Geopend / Geklikt / Afgemeld), variant, kliks, laatste klik, afmelding.
//   De verkoop-Fase in Notion wordt niet aangeraakt; de e-mailstap is een eigen veld.
// Env: NOTION_TOKEN, SUPABASE_ACCESS_TOKEN.
import { sql } from './supabase-sql.mjs';
import { sqlStr, emailLabel } from './core.mjs';

const DB = '1c5cf07d-8338-422a-8dd6-3ac4c0abb0dc'; // Klanten & leads
const HOME = '408c947c-3de3-81e7-8413-f76c725b56f8'; // Stekker of Diesel
const N = (() => {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN ontbreekt');
  return async (method, url, body) => {
    for (let poging = 0; ; poging++) {
    const r = await fetch('https://api.notion.com/v1' + url, {
      method, headers: { authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 429 && poging < 6) { await new Promise(w => setTimeout(w, 1500 * (poging + 1))); continue; }
    if (!r.ok) throw new Error(`Notion HTTP ${r.status}: ${data.message || ''}`);
    return data;
    }
  };
})();

const text = p => (p?.rich_text || p?.title || []).map(x => x.plain_text).join('') || null;

async function allLeads() {
  const out = []; let cursor;
  do {
    const q = await N('POST', `/databases/${DB}/query`, { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) });
    out.push(...q.results); cursor = q.has_more ? q.next_cursor : null;
  } while (cursor);
  return out;
}

async function setup() {
  await N('PATCH', `/databases/${DB}`, { properties: {
    'E-mail stap': { select: { options: [
      { name: 'Niet gemaild', color: 'gray' }, { name: 'Verstuurd', color: 'blue' },
      { name: 'Geopend', color: 'yellow' }, { name: 'Geklikt', color: 'green' },
      { name: 'Afgemeld', color: 'red' }, { name: 'Bounce', color: 'red' }] } },
    'E-mail variant': { select: { options: [{ name: '1a', color: 'purple' }, { name: '1b', color: 'orange' }, { name: 'a', color: 'purple' }, { name: 'b', color: 'orange' }] } },
    'E-mail kliks': { number: {} },
    'Laatste klik': { date: {} },
    'Laatste e-mail': { date: {} },
  } });
  console.log('Notion-eigenschappen voor e-mailstappen staan klaar.');
}

async function leadsToSupabase(leads) {
  // In batches van 50: losse queries per lead struikelen over de rate-limit
  // van de Supabase Management API (429).
  const rijen = [];
  for (const lead of leads) {
    const p = lead.properties, email = (p['E-mail']?.email || '').toLowerCase();
    if (!email) continue;
    const segment = p.Voertuigtypes?.multi_select?.[0]?.name?.toLowerCase() || null;
    rijen.push(`(${sqlStr(email)}, ${sqlStr(text(p.Bedrijf))}, ${sqlStr(text(p.Contactpersoon))}, ${sqlStr(segment)}, 'notion', ${sqlStr(lead.id)})`);
  }
  for (let i = 0; i < rijen.length; i += 50) {
    await sql(`insert into public.email_contacten (email, bedrijf, naam, segment, bron, notion_page_id)
      values ${rijen.slice(i, i + 50).join(',')}
      on conflict (email) do update set bedrijf = excluded.bedrijf, naam = excluded.naam,
        segment = excluded.segment, notion_page_id = excluded.notion_page_id`);
  }
  console.log(`${rijen.length} leads naar Supabase gesynchroniseerd.`);
  return rijen.length;
}

const stepOf = r => r.afgemeld ? 'Afgemeld' : r.bounce ? 'Bounce' : r.geklikt ? 'Geklikt'
  : r.geopend ? 'Geopend' : r.verstuurd ? 'Verstuurd' : 'Niet gemaild';

async function stepsBackToNotion(leads) {
  const rows = await sql(`select c.notion_page_id, c.afgemeld_op is not null as afgemeld, c.bounce_op is not null as bounce,
      exists (select 1 from public.email_verzonden v where v.token = c.token) as verstuurd,
      (select v.variant from public.email_verzonden v where v.token = c.token order by v.verzonden_op desc limit 1) as variant,
      (select v.campagne from public.email_verzonden v where v.token = c.token order by v.verzonden_op desc limit 1) as campagne,
      (select max(v.verzonden_op) from public.email_verzonden v where v.token = c.token) as laatste_mail,
      exists (select 1 from public.email_events e where e.token = c.token and e.last_event = 'opened') as geopend,
      (select count(*) from analytics.email_kliks_geklasseerd k where k.token = c.token and k.klasse = 'menselijk') as kliks,
      (select max(k.ontvangen_op) from analytics.email_kliks_geklasseerd k where k.token = c.token and k.klasse = 'menselijk') as laatste_klik,
      exists (select 1 from analytics.email_kliks_geklasseerd k where k.token = c.token and k.klasse = 'menselijk') as geklikt
    from public.email_contacten c where c.notion_page_id is not null`);
  const byPage = new Map(rows.map(r => [r.notion_page_id, r]));
  let updated = 0;
  for (const lead of leads) {
    const r = byPage.get(lead.id);
    if (!r) continue;
    const props = {
      'E-mail stap': { select: { name: stepOf(r) } },
      'E-mail kliks': { number: Number(r.kliks) || 0 },
    };
    if (r.variant) props['E-mail variant'] = { select: { name: emailLabel(r.campagne, r.variant) } };
    if (r.laatste_klik) props['Laatste klik'] = { date: { start: r.laatste_klik } };
    if (r.laatste_mail) props['Laatste e-mail'] = { date: { start: String(r.laatste_mail).slice(0, 10) } };
    await N('PATCH', `/pages/${lead.id}`, { properties: props });
    updated++;
  }
  console.log(`${updated} leads bijgewerkt met hun e-mailstap.`);
}

const rt = s => ({ rich_text: [{ type: 'text', text: { content: String(s ?? '') } }] });
async function dashboard() {
  const search = await N('POST', '/search', { query: 'E-maildashboard', filter: { value: 'page', property: 'object' } });
  let page = search.results.find(p => p.parent?.page_id === HOME);
  if (!page) {
    page = await N('POST', '/pages', { parent: { page_id: HOME }, properties: { title: [{ type: 'text', text: { content: 'E-maildashboard' } }] } });
    console.log('Dashboardpagina aangemaakt:', page.id);
  }
  const old = await N('GET', `/blocks/${page.id}/children?page_size=100`);
  for (const b of old.results) await N('DELETE', `/blocks/${b.id}`);
  const results = await sql('select * from analytics.email_resultaten');
  const perLink = await sql('select * from analytics.email_kliks_per_link limit 20');
  const recent = await sql('select * from analytics.email_laatste_kliks limit 20');
  const head = t => ({ object: 'block', type: 'heading_2', heading_2: rt(t) });
  const para = t => ({ object: 'block', type: 'paragraph', paragraph: rt(t) });
  const paraLink = (voor, tekst, url, na) => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: [
    { type: 'text', text: { content: voor } },
    { type: 'text', text: { content: tekst, link: { url } }, annotations: { bold: true } },
    { type: 'text', text: { content: na } }] } });
  const row = cells => ({ object: 'block', type: 'table_row', table_row: { cells: cells.map(c => [{ type: 'text', text: { content: String(c ?? '') } }]) } });
  const table = (headCells, rows) => ({ tableBlock: headCells, tableRows: rows });
  const blocks = [
    head('E-maildashboard'),
    paraLink('Interactief dashboard met grafieken en individuele kliks: ', 'Open het lokale dashboard', 'http://127.0.0.1:4173/', ' (werkt als de dashboardserver draait: node scripts/mail/dashboard.mjs --serve).'),
    para(`Bijgewerkt: ${new Date().toLocaleString('nl-NL')}. Klikken zonder scanners; afmeldingen via de afmeldlink in elke mail.`),
    head('Resultaten per campagne en variant'),
    ...(results.length ? [table(['Campagne', 'E-mail', 'Verzonden', 'Unieke klikkers', 'Kliks', 'Klik %', 'Afmeldingen', 'Afmeld %'],
      results.map(r => [r.campagne, emailLabel(r.campagne, r.variant), r.verzonden, r.unieke_klikkers, r.kliks, r.klik_pct, r.afmeldingen, r.afmeld_pct]))]
      : [para('Nog geen verzendingen.')]),
    head('Klikken per link'),
    ...(perLink.length ? [table(['Campagne', 'E-mail', 'Link', 'Kliks', 'Unieke klikkers', 'Scanner-kliks'],
      perLink.map(r => [r.campagne, emailLabel(r.campagne, r.variant), r.link, r.kliks, r.unieke_klikkers, r.scanner_kliks]))]
      : [para('Nog geen klikken.')]),
    head('Laatste klikken per klant'),
    ...(recent.length ? recent.map(r => ({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: rt(`${new Date(r.ontvangen_op).toLocaleString('nl-NL')} · ${r.bedrijf || r.email} · ${r.campagne} (${emailLabel(r.campagne, r.variant)}) · link: ${r.link}`) }))
      : [para('Nog geen klikken van klanten.')]),
  ];
  for (const b of blocks) {
    if (b.tableBlock) {
      await N('PATCH', '/blocks/' + page.id + '/children', { children: [{ object: 'block', type: 'table', table: { table_width: b.tableBlock.length, has_column_header: true, children: [row(b.tableBlock), ...b.tableRows.map(row)] } }] });
    } else {
      await N('PATCH', `/blocks/${page.id}/children`, { children: [b] });
    }
  }
  console.log('Dashboard bijgewerkt:', `https://www.notion.so/${page.id.replaceAll('-', '')}`);
}

if (process.argv.includes('--setup')) { await setup(); process.exit(0); }
const leads = await allLeads();
console.log(`${leads.length} leads in Notion.`);
await leadsToSupabase(leads);
await stepsBackToNotion(leads);
await dashboard();
console.log('Sync klaar.');
