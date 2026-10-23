-- Factcheck 23-10-2026: standaardwaarden, tol en drie modellen bijgewerkt.
-- Bronnen:
--   diesel: CBS 80416ned, 19-10-2026 € 2,456 incl. btw = € 2,03 excl. btw
--   ERE: marktkoers ± € 0,35 per ERE in week 43 = bruto ± € 0,12 per kWh, netto na commissie ± € 0,10
--   vrachtwagenheffing 2026: 18 tot 32 ton, Euro VI, CO2-klasse 1 € 0,182 en klasse 5 € 0,037 (vrachtwagenheffing.nl)
--   Oostenrijk: ASFINAG GO-Maut 2026, 4+ assen, Euro VI CO2-klasse 1 € 0,5724, emissievrij € 0,1189
--   Vlaanderen: Viapass, sinds 1-7-2026 met CO2-toeslag, Euro VI klasse 1 boven 32 ton € 0,286
--   Duitsland: Bundestag 13-11-2025, emissievrije Lkw tolvrij tot 30-6-2031
--   MAN eTGS: MAN-tabel, 6 pakketten 480 kWh, 600 km solo in distributie
--   MAN eTGX nieuwe generatie: electrive 14-9-2026, 552 kWh bruto, 528 kWh netto, 660 km (4x2)
--   Renault E-Tech T 780: electrive 30-6-2026, MCS tot 720 kW
begin;

update public.vehicle_categories set default_diesel_price_per_l = 2.03, default_ere_yield_per_kwh = 0.10, updated_at = now();
update public.vehicle_categories set default_toll_diesel_per_km = 0.182, default_toll_electric_per_km = 0.037 where id = 'bakwagen';

insert into public.live_prices (id, value, measured_on, source)
values ('diesel_excl_btw', 2.03, '2026-10-19', 'CBS 80416ned, pompprijs diesel 2,456 incl. btw')
on conflict (id) do update set value = excluded.value, measured_on = excluded.measured_on, source = excluded.source, updated_at = now();

update public.international_toll_rates set diesel_rate_per_km = 0.286, notes = 'Diesel: Euro VI boven 32 ton, met CO₂-toeslag sinds 1 juli 2026. Het tarief voor elektrisch is een schatting' where id = 'vl';
update public.international_toll_rates set notes = 'Elektrisch betaalt hetzelfde als Euro VI. Indicatief tarief' where id = 'wa';
update public.international_toll_rates set notes = 'Vrijstelling voor elektrisch loopt tot 1 juli 2031' where id = 'de';
update public.international_toll_rates set electric_rate_per_km = 0.119, diesel_rate_per_km = 0.572, notes = 'Tarieven 2026, 4 of meer assen' where id = 'at';
update public.international_toll_rates set notes = 'Gemiddeld tarief' where id = 'pl';

update public.vehicle_models set range_km = 600, range_text = 'tot 600',
  description = 'Zwaar distributiechassis met zes accupakketten en 480 kWh bruikbaar. MAN noemt maximaal 600 km voor een solovoertuig in distributie (0,8 kWh per km) en 400 km met aanhanger op de snelweg. De vaak genoemde 800 km per dag haal je alleen met tussentijds laden.',
  last_verified_at = '2026-10-23'
where id = 'man-etgs-4-2-chassis';

update public.vehicle_models set gross_battery_kwh = 552, usable_battery_kwh = 528, advertised_battery_kwh = null,
  description = 'Nieuwe generatie, getoond op de IAA in september 2026. De 4×2-trekker heeft zes accupakketten: 552 kWh geïnstalleerd en 528 kWh bruikbaar, voor tot 660 km bij 20 °C, 60% belading en snelweginzet. De 6×2 met een zevende pakket haalt tot 720 km. Verkoopstart gepland voor april 2027, productie vanaf zomer 2027.',
  last_verified_at = '2026-10-23'
where id = 'man-etgx-nieuwe-generatie-2027';

update public.vehicle_models set mcs_charge_kw = 720,
  description = replace(description, 'MCS tot 700 kW', 'MCS tot 720 kW'),
  last_verified_at = '2026-10-23'
where id = 'renault-trucks-e-tech-t-780';

commit;
