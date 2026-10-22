-- ==============================================================================
-- Uitvoeringen binnen een model (bijv. verschillende accu's)
-- Rijen met dezelfde category_id, brand en model_family worden op de
-- modellenpagina als één model getoond, met variant_label per uitvoering.
-- Elke uitvoering blijft een eigen rij met eigen accu, bereik en prijs.
-- ==============================================================================

alter table public.vehicle_models
    add column if not exists model_family text,  -- bijv. 'E-Tech T'; null = losstaand model
    add column if not exists variant_label text; -- bijv. '540 kWh · 4×2'

update public.vehicle_models set model_family = 'E-Tech T', variant_label = '540 kWh · 4×2' where id = 'renault-trucks-e-tech-t-540';
update public.vehicle_models set model_family = 'E-Tech T', variant_label = '585 kWh · 6×2 e-as' where id = 'renault-trucks-e-tech-t-585';
update public.vehicle_models set model_family = 'E-Tech T', variant_label = '780 kWh · 6×2' where id = 'renault-trucks-e-tech-t-780';
update public.vehicle_models set model_family = 'eTGX', variant_label = 'Huidige generatie' where id = 'man-etgx-huidige-generatie';
update public.vehicle_models set model_family = 'eTGX', variant_label = 'Nieuwe generatie' where id = 'man-etgx-nieuwe-generatie-2027';
