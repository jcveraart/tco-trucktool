-- Bpm voor een nieuwe diesel bestelbus.
-- Zo bedacht: sinds 1 januari 2025 betaalt een nieuwe diesel bestelauto ook voor ondernemers bpm, naar de CO2-uitstoot
-- (EUR 76,57 per gram in 2026). Een elektrische bestelauto is vrijgesteld. Het voorbeeld rekent met 190 g/km, afgerond EUR 14.500.
alter table public.vehicle_categories add column if not exists default_bpm_diesel numeric(10,2) not null default 0;
update public.vehicle_categories set default_bpm_diesel = 14500, updated_at = now() where id = 'bestel';
update public.vehicle_categories set default_bpm_diesel = 0, updated_at = now() where id in ('trekker','bakwagen','bus');
