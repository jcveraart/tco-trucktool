-- Wegenbelasting (motorrijtuigenbelasting) voor vrachtwagens: diesel en elektrisch gelijk.
-- Zo bedacht: voor een vrachtauto hangt de mrb af van gewicht, assen en vering, niet van de brandstof.
-- Sinds 1 juli 2026 is het onder 12 ton EUR 0 en vanaf 12 ton tot 1 januari 2027 ook EUR 0; daarna geldt het
-- Europese minimumtarief, hooguit EUR 232,25 per kwartaal. De trekker gaat naar EUR 925 per jaar (schuifstap 25),
-- de bakwagen houdt EUR 800 voor diesel en elektrisch krijgt hetzelfde bedrag.
-- De kolommen default_roadtax_* staan niet in eerdere migraties; deze update draait alleen als ze bestaan.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'vehicle_categories'
               and column_name = 'default_roadtax_electric_annual') then
    update public.vehicle_categories
       set default_roadtax_diesel_annual = 925, default_roadtax_electric_annual = 925, updated_at = now()
     where id = 'trekker';
    update public.vehicle_categories
       set default_roadtax_diesel_annual = 800, default_roadtax_electric_annual = 800, updated_at = now()
     where id = 'bakwagen';
  end if;
end $$;
