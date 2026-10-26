-- Operational lease in de calculator: standaard meerkilometerprijs per voertuigsoort, in euro per km excl. btw.
-- Minder kilometers rekent de calculator tegen de helft van dit bedrag terug.

alter table public.vehicle_categories
  add column if not exists default_lease_excess_km_eur numeric;

update public.vehicle_categories set default_lease_excess_km_eur = 0.05 where id in ('trekker', 'bakwagen');
update public.vehicle_categories set default_lease_excess_km_eur = 0.07 where id = 'bestel';
update public.vehicle_categories set default_lease_excess_km_eur = 0.06 where id = 'bus';
