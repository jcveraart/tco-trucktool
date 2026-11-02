// Shared by the printable and online report. Describes the solved day, never a counterfactual.
const number = (v, d = 0) => Number.isFinite(v) ? new Intl.NumberFormat('nl-NL', { maximumFractionDigits: d }).format(v) : '—';
const percent = v => Number.isFinite(v) ? `${number(100 * v, 1)}%` : '—';
const tripCount = n => `${n} ${n === 1 ? 'rit' : 'ritten'}`;
const categories = {
  nacht: 'Elektrisch · alleen depotladen 17–07 uur',
  overdag: 'Elektrisch · ook depotladen 07–17 uur',
  thuis: 'Elektrisch · met thuisladen',
  onderweg: 'Elektrisch · met laden onderweg',
  geen: 'Elektrisch · geen laadmoment in dagbeeld',
  onbekend: 'Elektrisch · laaddetail ontbreekt',
  diesel: 'Diesel', charter: 'Inhuur', anders: 'Overige aandrijving',
};
export function practicalDay(report, plan, period) {
  const day = plan.dagen?.[period] || {}, axis = plan.tijdas || [];
  const trips = new Map((report.trips || []).map(t => [String(t.id), t]));
  const profiles = new Map((day.laadprofielen || []).map(p => [p.id, p]));
  const energy = (p, kind) => (p?.[kind] || []).reduce((s, kw, i) => s + kw * (axis[i + 1] - axis[i]) / 60, 0);
  const active = values => (values || []).some(v => v > .01);
  const counts = Object.fromEntries(Object.keys(categories).map(k => [k, 0]));
  const vehicles = new Map(); let km = 0, evKm = 0, unknownKm = 0;
  const assignments = day.toewijzing || [];
  for (const t of assignments) {
    const source = trips.get(String(t.rit_id).split('~')[0]);
    const distance = Number.isFinite(t.km) ? t.km : source?.km;
    if (Number.isFinite(distance)) { km += distance; if (t.aandrijving === 'electric') evKm += distance; } else unknownKm++;
    let kind = t.aandrijving === 'charter' ? 'charter' : t.aandrijving === 'diesel' ? 'diesel' : 'anders';
    if (t.aandrijving === 'electric') {
      const p = profiles.get(t.voertuig_id);
      kind = !p ? 'onbekend' : active(p.onderweg) ? 'onderweg' : active(p.thuis) ? 'thuis'
        : p.depot.some((kw, i) => kw > .01 && axis[i] < 1020 && axis[i + 1] > 420) ? 'overdag'
        : active(p.depot) ? 'nacht' : 'geen';
      if (!vehicles.has(t.voertuig_id)) vehicles.set(t.voertuig_id, { name: t.voertuig, trips: [], km: 0, kind, profile: p });
      const v = vehicles.get(t.voertuig_id); v.trips.push(t.rit); v.km += distance || 0;
    }
    counts[kind]++;
  }
  const total = assignments.length, electric = [...vehicles.values()].reduce((s, v) => s + v.trips.length, 0);
  const batteries = (day.accu || []).filter(a => vehicles.has(a.id) && a.capaciteit > 0 && a.kwh?.length).map(a => {
    const low = Math.min(...a.kwh), reserve = a.reserve_pct ?? report.settings?.soc_min;
    return { ...a, low, soc: low / a.capaciteit, margin: Number.isFinite(reserve) ? low / a.capaciteit - reserve : null };
  });
  const tight = batteries.filter(a => a.margin != null).sort((a, b) => a.margin - b.margin)[0];
  const peak = day.net?.length ? Math.max(...day.net) : null;
  const summaries = [
    ['Ritten op deze werkdag', number(total)],
    ['Elektrisch uitgevoerde ritten', `${number(electric)} van ${number(total)} · ${total ? percent(electric / total) : '—'}`],
    ['Ritten met eigen voertuigen', `${number(total - counts.charter)} van ${number(total)} · ${total ? percent((total - counts.charter) / total) : '—'}`],
    ['Elektrische kilometers (inclusief inhuur in totaal)', !unknownKm && km > 0 ? `${number(evKm)} van ${number(km)} km · ${percent(evKm / km)}` : 'Onvoldoende afstandsgegevens'],
    ['Laagste accustand van ingezette wagens', batteries.length ? percent(Math.min(...batteries.map(a => a.soc))) : '—'],
    ['Kleinste marge boven ingestelde accureserve', tight ? `${number(tight.margin * 100, 1)} procentpunt · ${tight.voertuig}` : '—'],
    ['Ruimte op netaansluiting bij berekende piek', peak != null && Number.isFinite(day.grens) ? `${number(day.grens - peak, 1)} kW` : '—'],
  ];
  const breakdown = Object.entries(categories).filter(([key]) => counts[key]).map(([key, label]) => [label, number(counts[key]), total ? percent(counts[key] / total) : '—']);
  const examples = [];
  if (tight) {
    const v = vehicles.get(tight.id);
    examples.push(`${tight.voertuig}: ${tripCount(v.trips.length)} samen, ${number(v.km)} km (${v.trips.slice(0, 3).join(', ')}${v.trips.length > 3 ? ', …' : ''}). De accu daalt tot ${percent(tight.soc)}; de marge boven de ingestelde reserve is ${number(tight.margin * 100, 1)} procentpunt.`);
  }
  const road = [...vehicles.values()].filter(v => v.kind === 'onderweg').sort((a, b) => energy(b.profile, 'onderweg') - energy(a.profile, 'onderweg'))[0];
  if (road) examples.push(`${road.name}: ${number(energy(road.profile, 'onderweg'), 1)} kWh laden onderweg in de ingevoerde laadvensters. Dit betreft ${tripCount(road.profile.ritten_onderweg.length)} (${road.trips.slice(0, 3).join(', ')}); de voertuigdag telt ${tripCount(road.trips.length)}. Laadmomenten moeten beschikbaar blijven in de planning.`);
  const night = [...vehicles.values()].find(v => v.kind === 'nacht');
  if (night) examples.push(`${night.name}: ${tripCount(night.trips.length)} samen, ${number(night.km)} km. In dit plan laadt deze wagen uitsluitend op het depot tussen 17:00 en 07:00 uur (${number(energy(night.profile, 'depot'), 1)} kWh).`);
  if (counts.diesel || counts.charter) examples.push(`${counts.diesel} ritten op diesel en ${counts.charter} met inhuur. Dat zijn plankeuzes; hieruit volgt niet dat deze ritten technisch onmogelijk elektrisch kunnen.`);
  if (!total) examples.push('Geen rittoewijzingen beschikbaar voor deze periode.');
  const notes = [
    'Percentages tellen ritten op de berekende representatieve werkdag, inclusief groeiritten en inhuur. Dit is geen gemeten percentage van alle ritten in een jaar.',
    'Laadcategorieën beoordelen de hele voertuigdag. Alle ritten van een wagen met laden onderweg vallen in die categorie. Volgorde bij combinatie: onderweg, thuis, overdag depot, nacht depot. Dit is de gekozen planning; niet het maximaal haalbare aandeel zonder bijladen.',
    'Laadenergie en accuverloop volgen de ingevoerde omstandigheden. Extra omrijtijd, wachttijd, uitval van laadpunten en vertraging zijn niet apart berekend. Controleer de krapste voertuigdag ook met winterverbruik, belading en echte ritregistraties.',
  ];
  if (!day.laadprofielen) notes.push('Deze oudere berekening bevat geen laaddetail per voertuig. Bereken opnieuw voor de uitsplitsing naar laadwijze.');
  if (tight && tight.margin < .05) examples.push('De krapste wagen houdt minder dan 5 procentpunt boven de ingestelde accureserve over. Bespreek voor deze planning een uitwijklaadpunt of extra laadruimte.');
  return { total, electric, counts, summaries, breakdown, examples, notes };
}
