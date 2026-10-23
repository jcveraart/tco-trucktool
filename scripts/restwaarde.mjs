// Wekelijkse verzamelaar voor de restwaarde-index van stekkerofdiesel.nl.
// Leest de pagina's uit bronnen.json, laat Claude de voertuigen met prijs eruit halen,
// bewaart ze in Supabase (residual_listings) en mailt prijsalarmen voor nieuwe treffers.
//
// Nodig: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Optioneel: RESEND_API_KEY, MAIL_FROM.
// Proefdraaien zonder iets op te slaan of te mailen: node restwaarde.mjs --droog

import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const DROOG = process.argv.includes("--droog");
const SB = process.env.SUPABASE_URL || "https://zarvyblveyomngypwvhw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = "https://stekkerofdiesel.nl";
const MODEL = "claude-opus-5-5";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["voertuigen"],
  properties: {
    voertuigen: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "fuel", "brand", "model", "year", "km", "price", "url"],
        properties: {
          category: { type: "string", enum: ["trekker", "bakwagen", "bestel", "bus"] },
          fuel: { type: "string", enum: ["e", "d"] },
          brand: { type: "string" },
          model: { type: "string" },
          year: { type: ["integer", "null"] },
          km: { type: ["integer", "null"] },
          price: { type: "integer" },
          url: { type: ["string", "null"] },
        },
      },
    },
  },
};

const PROMPT = `Hieronder staat de tekst van een Nederlandse of Europese pagina met tweedehands bedrijfsvoertuigen ({kind}).
Haal er elk voertuig uit waarvan een prijs in euro's te zien is.
- category: trekker (trekker of trekkende eenheid), bakwagen (vrachtwagen met bak, N2 of N3), bestel (bestelbus of bestelauto tot 3500 kg), bus (touringcar, streekbus of stadsbus). Laat personenauto's en aanhangers weg.
- fuel: e voor volledig elektrisch, d voor diesel. Laat hybride, waterstof en gas weg.
- price: prijs exclusief btw in hele euro's. Staat er alleen een prijs inclusief btw, deel die door 1,21. Bij een veiling: het hoogste bod of de verkoopprijs.
- year: jaar van eerste toelating, km: kilometerstand, url: de link naar het voertuig als die in de tekst staat. Onbekend is null.
Verzin niets: wat niet in de tekst staat, laat je weg.

{tekst}`;

const bronnen = JSON.parse(await readFile(new URL("./bronnen.json", import.meta.url), "utf8")).bronnen.filter((b) => b.actief);
if (!bronnen.length) {
  console.log("Geen actieve bronnen in bronnen.json.");
  process.exit(0);
}
if (!DROOG && !SB_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");

const claude = new Anthropic();

function paginaTekst(html, basis) {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<a\s[^>]*href="([^"#]+)"[^>]*>/gi, (_, h) => {
      try { return ` [${new URL(h, basis).href}] `; } catch { return " "; }
    })
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&euro;/g, "€").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .slice(0, 120000);
}

async function haalOp(bron) {
  const r = await fetch(bron.url, { headers: { "user-agent": "stekkerofdiesel.nl restwaarde-index (+https://stekkerofdiesel.nl/#restwaarde)", "accept-language": "nl" } });
  if (!r.ok) throw new Error(`${bron.naam}: HTTP ${r.status}`);
  const tekst = paginaTekst(await r.text(), bron.url);
  const stream = claude.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: PROMPT.replace("{kind}", bron.kind === "auction" ? "veilinguitslagen" : "advertenties").replace("{tekst}", tekst) }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason !== "end_turn") throw new Error(`${bron.naam}: gestopt met ${msg.stop_reason}`);
  const json = msg.content.find((b) => b.type === "text")?.text;
  const jaar = new Date().getFullYear();
  return JSON.parse(json).voertuigen
    .filter((v) => v.price >= 500 && v.price <= 2000000 && (v.year == null || (v.year >= 1995 && v.year <= jaar)) && (v.km == null || (v.km >= 0 && v.km <= 3000000)))
    .map((v) => {
      const url = v.url && /^https?:\/\//.test(v.url) ? v.url : null;
      // Zonder eigen link telt de combinatie van kenmerken als sleutel, zodat dezelfde advertentie niet elke week opnieuw meetelt
      const sleutel = url || [bron.url, v.brand, v.model, v.year, v.km, v.price].join("|");
      return {
        url_hash: createHash("sha256").update(sleutel).digest("hex"),
        url, source: bron.naam, kind: bron.kind,
        category: v.category, fuel: v.fuel, brand: v.brand || null, model: v.model || null,
        year: v.year, km: v.km, price: v.price,
      };
    });
}

async function sb(pad, opties = {}) {
  const r = await fetch(`${SB}/rest/v1/${pad}`, {
    ...opties,
    headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}`, "content-type": "application/json", ...opties.headers },
  });
  if (!r.ok) throw new Error(`Supabase ${pad}: HTTP ${r.status} ${await r.text()}`);
  const tekst = await r.text();
  return tekst ? JSON.parse(tekst) : null;
}

const eur = (n) => "€ " + Math.round(n).toLocaleString("nl-NL");
const naam = (v) => [v.brand, v.model].filter(Boolean).join(" ") || "Voertuig";

async function mail(alarm, treffers) {
  const regels = treffers.map((v) => `<li><a href="${v.url || SITE + "/#restwaarde"}">${naam(v)}</a>${v.year ? `, ${v.year}` : ""}${v.km != null ? `, ${v.km.toLocaleString("nl-NL")} km` : ""}: ${eur(v.price)} excl. btw</li>`).join("");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Stekker of diesel <prijsalarm@stekkerofdiesel.nl>",
      to: alarm.email,
      subject: treffers.length === 1 ? `Prijsalarm: ${naam(treffers[0])} voor ${eur(treffers[0].price)}` : `Prijsalarm: ${treffers.length} voertuigen onder ${eur(alarm.max_price)}`,
      html: `<p>Deze voertuigen passen bij je prijsalarm:</p><ul>${regels}</ul><p style="color:#666;font-size:13px">Geen mail meer? <a href="${SITE}/?afmelden=${alarm.token}">Zet het prijsalarm uit</a>.</p>`,
    }),
  });
  if (!r.ok) throw new Error(`Resend: HTTP ${r.status} ${await r.text()}`);
}

let nieuw = [];
for (const bron of bronnen) {
  try {
    const rijen = await haalOp(bron);
    console.log(`${bron.naam}: ${rijen.length} voertuigen`);
    if (DROOG) { console.log(rijen.slice(0, 5)); continue; }
    if (!rijen.length) continue;
    const opgeslagen = await sb("residual_listings?on_conflict=url_hash", {
      method: "POST",
      headers: { prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify(rijen),
    });
    nieuw = nieuw.concat(opgeslagen);
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
console.log(`Nieuw opgeslagen: ${nieuw.length}`);

if (!DROOG && nieuw.length && process.env.RESEND_API_KEY) {
  const alarmen = await sb("price_alerts?active=eq.true&select=id,token,email,category,fuel,max_price,model");
  for (const alarm of alarmen) {
    const zoek = (alarm.model || "").toLowerCase().trim();
    const passend = nieuw.filter((v) => v.category === alarm.category && v.fuel === alarm.fuel && v.price <= alarm.max_price && (!zoek || naam(v).toLowerCase().includes(zoek)));
    if (!passend.length) continue;
    const al = await sb(`price_alert_hits?alert_id=eq.${alarm.id}&listing_id=in.(${passend.map((v) => v.id).join(",")})&select=listing_id`);
    const treffers = passend.filter((v) => !al.some((h) => h.listing_id === v.id)).slice(0, 10);
    if (!treffers.length) continue;
    try {
      await mail(alarm, treffers);
      await sb("price_alert_hits", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify(treffers.map((v) => ({ alert_id: alarm.id, listing_id: v.id }))) });
      console.log(`Prijsalarm verstuurd: ${treffers.length} treffers`);
    } catch (e) {
      console.error(e.message);
      process.exitCode = 1;
    }
  }
}
