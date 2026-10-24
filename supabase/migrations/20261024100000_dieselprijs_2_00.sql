-- Vooraf ingevulde dieselprijs vast op € 2,00 per liter excl. btw voor alle voertuigen.
-- De site vult de dieselprijs niet meer uit live_prices ('diesel_excl_btw'); die rij blijft bestaan als naslag.
begin;

update public.vehicle_categories set default_diesel_price_per_l = 2.00, updated_at = now();

commit;
