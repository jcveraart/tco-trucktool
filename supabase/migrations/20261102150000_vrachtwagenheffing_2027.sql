-- Vrachtwagenheffing: tarieven 2027 (aangeleverd door Max, 2-11-2026).
-- Diesel: Euro 6, CO2-klasse 1. Elektrisch: CO2-klasse 5.
--   meer dan 3.500 tot 12.000 kg   € 0,116  /  € 0,026
--   12.000 tot 18.000 kg           € 0,165  /  € 0,036
--   18.000 tot en met 32.000 kg    € 0,187  /  € 0,037  -> bakwagen
--   meer dan 32.000 kg             € 0,206  /  € 0,040  -> trekker
begin;

update public.vehicle_categories set default_toll_diesel_per_km = 0.206, default_toll_electric_per_km = 0.040, updated_at = now() where id = 'trekker';
update public.vehicle_categories set default_toll_diesel_per_km = 0.187, default_toll_electric_per_km = 0.037, updated_at = now() where id = 'bakwagen';

commit;
