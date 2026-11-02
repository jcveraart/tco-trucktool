// SQL tegen de live Supabase via de Management API (persoonlijke access token,
// sbp_...). De repo heeft geen service-role key; dit is het schrijfpad dat ook
// voor migraties is gebruikt. Token alleen via env SUPABASE_ACCESS_TOKEN.
const REF = 'zarvyblveyomngypwvhw';

const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function sql(query) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN ontbreekt (sbp_-token uit Supabase)');
  for (let poging = 0; ; poging++) {
    const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const text = await r.text();
    if (r.ok) return JSON.parse(text || '[]');
    if (r.status === 429 && poging < 6) { await sleep(1500 * (poging + 1)); continue; }
    throw new Error(`Supabase SQL HTTP ${r.status}: ${text.slice(0, 400)}`);
  }
}
