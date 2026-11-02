-- Wegenbelasting (MRB) per elektrisch model, per jaar in euro's.
-- Berekend zoals in de calculator (mrbJaar): bestelbus op geschat ledig gewicht
-- (gvw minus ca. 1.000 kg laadvermogen, grijs kenteken), vrachtwagen en bus op
-- toegestane maximummassa. Zonder bekende massa geldt het categorietarief.
alter table public.vehicle_models add column if not exists roadtax_annual_eur numeric;

update public.vehicle_models set roadtax_annual_eur = case category_id
  when 'bestel' then case
    when gvw_kg is null then 350
    when gvw_kg - 1000 <= 1200 then 210
    when gvw_kg - 1000 <= 1600 then 270
    when gvw_kg - 1000 <= 2000 then 330
    when gvw_kg - 1000 <= 2500 then 390
    when gvw_kg - 1000 <= 3000 then 450
    else 520 end
  when 'bakwagen' then case
    when gvw_kg is null then 725
    when gvw_kg <= 7500 then 400
    when gvw_kg <= 12000 then 575
    when gvw_kg <= 18000 then 725
    when gvw_kg <= 26000 then 850
    else 1000 end
  when 'trekker' then case
    when gvw_kg is null then 1000
    when gvw_kg <= 18000 then 725
    when gvw_kg <= 32000 then 875
    else 1000 end
  when 'bus' then case
    when gvw_kg is null then 1100
    when gvw_kg <= 10000 then 625
    when gvw_kg <= 15000 then 850
    else 1100 end
  else roadtax_annual_eur end;
