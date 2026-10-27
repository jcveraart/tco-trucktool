// Mailt elke nieuwe vlootanalyse-aanvraag (tabel fleet_requests) naar info@stekkerofdiesel.nl.
// Antwoorden gaan via reply-to direct naar de aanvrager. Daarna krijgt de rij notified_at.
//
// Nodig: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY. Optioneel: SUPABASE_URL, MAIL_FROM, MAIL_TO.

const SB = process.env.SUPABASE_URL || "https://zarvyblveyomngypwvhw.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND = process.env.RESEND_API_KEY;
const TO = process.env.MAIL_TO || "info@stekkerofdiesel.nl";
const FROM = process.env.MAIL_FROM || "Stekker of Diesel <aanvraag@stekkerofdiesel.nl>";

if (!SB_KEY || !RESEND) {
  console.log("SUPABASE_SERVICE_ROLE_KEY of RESEND_API_KEY ontbreekt, niets verstuurd.");
  process.exit(0);
}

async function sb(pad, opties = {}) {
  const r = await fetch(`${SB}/rest/v1/${pad}`, {
    ...opties,
    headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}`, "content-type": "application/json", ...opties.headers },
  });
  const tekst = await r.text();
  if (!r.ok) throw new Error(`Supabase ${pad}: HTTP ${r.status} ${tekst}`);
  return tekst ? JSON.parse(tekst) : null;
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const regel = (k, v) => (v ? `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td style="padding:4px 0">${v}</td></tr>` : "");

let rijen;
try {
  rijen = await sb("fleet_requests?notified_at=is.null&order=created_at&limit=20&select=id,created_at,company,contact_name,email,phone,fleet_size,message,calc_link");
} catch (e) {
  if (/notified_at/.test(e.message)) {
    console.log("Kolom notified_at bestaat nog niet: pas migratie 20261027190000_fleet_requests_melding.sql toe.");
    process.exit(0);
  }
  throw e;
}

for (const a of rijen) {
  const html = `<p>Nieuwe aanvraag voor een vlootanalyse. Beantwoord deze mail om direct te reageren.</p><table style="border-collapse:collapse;font:14px/1.5 sans-serif">${[
    regel("Bedrijf", esc(a.company)),
    regel("Naam", esc(a.contact_name)),
    regel("E-mail", `<a href="mailto:${esc(a.email)}">${esc(a.email)}</a>`),
    regel("Telefoon", esc(a.phone)),
    regel("Vloot", a.fleet_size ? `${esc(a.fleet_size)} voertuigen` : ""),
    regel("Bericht", esc(a.message).replace(/\n/g, "<br>")),
    regel("Berekening", a.calc_link ? `<a href="${esc(a.calc_link)}">Open de berekening</a>` : ""),
    regel("Ontvangen", new Date(a.created_at).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })),
  ].join("")}</table>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${RESEND}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to: TO, reply_to: a.email, subject: `Vlootanalyse: ${a.company}`, html }),
  });
  if (!r.ok) {
    console.error(`Resend: HTTP ${r.status} ${await r.text()}`);
    process.exitCode = 1;
    continue;
  }
  await sb(`fleet_requests?id=eq.${a.id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ notified_at: new Date().toISOString() }) });
  console.log(`Aanvraag gemaild: ${a.id}`);
}
console.log(`Nieuwe aanvragen: ${rijen.length}`);
