-- Lease-relevante prijzen en catalogusuitbreiding, gecontroleerd 2 november 2026.
-- De leaseprijs op de site wordt geschat uit indicative_price_eur; deze migratie
-- werkt die aankoopprijzen bij en voegt ontbrekende modellen toe.
BEGIN;

-- Correcties op bestaande modellen
UPDATE public.vehicle_models SET range_km=334, range_text='tot 334',
  description='Bijgewerkte 46 kWh-uitvoering uit 2026. Tot 334 km WLTP en AC-laden met 11 kW; 10-80% DC-laden in minder dan 30 minuten.',
  last_verified_at='2026-11-02' WHERE id='ford-e-transit-courier';

UPDATE public.vehicle_models SET
  description='Compacte gesloten bestelbus met een 45 kWh-accu en maximaal 284 km WLTP gecombineerd. Uitlopend model: Mercedes-Benz stopt de Citan/eCitan medio 2026; levering daarna uit voorraad. Beschikbaarheid en laaduitrusting verschillen per versie.',
  last_verified_at='2026-11-02' WHERE id='mercedes-benz-ecitan';

-- eActros 300/400 (generatie 1) vervangen door eActros 400 (generatie 2)
DELETE FROM public.vehicle_models WHERE id='mercedes-benz-eactros-300-400';

INSERT INTO public.vehicle_models
  (id, category_id, brand, model, status, gross_battery_kwh, range_km, range_text, dc_fast_charge_kw,
   description, source_name, source_url, last_verified_at, model_family, variant_label)
VALUES
  ('mercedes-benz-eactros-400','bakwagen','Mercedes-Benz','eActros 400','nu',414,480,'tot 480',400,
   'Tweede generatie eActros 400: twee LFP-accupakketten van samen 414 kWh, tot circa 480 km in distributie-inzet en CCS-laden tot 400 kW. De eerste generatie eActros 300/400 is eind 2025 uit productie gegaan.',
   'Mercedes-Benz Trucks','https://www.daimlertruck.com/en/newsroom/pressrelease/electric-portfolio-grows-mercedes-benz-trucks-starts-production-of-new-eactros-400-generation-at-woerth-plant-53288035','2026-11-02',NULL,NULL)
ON CONFLICT (id) DO UPDATE SET gross_battery_kwh=EXCLUDED.gross_battery_kwh, range_km=EXCLUDED.range_km,
  range_text=EXCLUDED.range_text, dc_fast_charge_kw=EXCLUDED.dc_fast_charge_kw, description=EXCLUDED.description,
  source_name=EXCLUDED.source_name, source_url=EXCLUDED.source_url, last_verified_at=EXCLUDED.last_verified_at;

-- Nieuwe modellen
INSERT INTO public.vehicle_models
  (id, category_id, brand, model, status, advertised_battery_kwh, range_km, range_text,
   indicative_price_eur, indicative_price_text, price_source_name, price_source_url,
   description, source_name, source_url, gvw_kg, last_verified_at, model_family, variant_label)
VALUES
  ('kia-pv5-cargo','bestel','Kia','PV5 Cargo','nu',51.5,291,'tot 291',
   29895,'Vanafprijs voor PV5 Cargo 51,5 kWh. Nederlandse catalogusprijs excl. btw. Gecontroleerd op 2 november 2026.','Kia Nederland','https://www.kia.com/nl/pbv/modellen/pv5-cargo/ontdekken/',
   'Elektrische bestelwagen van Kia op een eigen PBV-platform. 51,5 kWh-uitvoering met tot 291 km WLTP; DC-laden 10-80% in circa 30 minuten.',
   'Kia Nederland','https://www.kia.com/nl/pbv/modellen/pv5-cargo/ontdekken/',3500,'2026-11-02','PV5 Cargo',NULL),
  ('kia-pv5-cargo-71-2-kwh','bestel','Kia','PV5 Cargo 71.2 kWh','nu',71.2,416,'tot 416',
   NULL,NULL,NULL,NULL,
   'Long-range-uitvoering van de Kia PV5 Cargo met 71,2 kWh en tot 416 km WLTP; DC-laden 10-80% in circa 30 minuten.',
   'Kia Nederland','https://www.kia.com/nl/pbv/modellen/pv5-cargo/ontdekken/',3500,'2026-11-02','PV5 Cargo','71.2 kWh'),
  ('nissan-interstar-e','bestel','Nissan','Interstar-e','nu',87,410,'tot 410',
   44900,'Vanafprijs excl. btw volgens Nissan Nederland. Gecontroleerd op 2 november 2026.','Nissan Nederland','https://www.nissan.nl/voertuigen/nieuw/interstar.html',
   'Grote bestelwagen, technisch verwant aan de Renault Master E-Tech. N1-referentie met 87 kWh en tot 410 km WLTP; de 460 km-opgave hoort bij de 4-tonuitvoering. DC-laden tot 130 kW.',
   'Nissan Nederland','https://www.nissan.nl/voertuigen/nieuw/interstar.html',3500,'2026-11-02',NULL,NULL)
ON CONFLICT (id) DO UPDATE SET advertised_battery_kwh=EXCLUDED.advertised_battery_kwh, range_km=EXCLUDED.range_km,
  range_text=EXCLUDED.range_text, indicative_price_eur=EXCLUDED.indicative_price_eur,
  indicative_price_text=EXCLUDED.indicative_price_text, price_source_name=EXCLUDED.price_source_name,
  price_source_url=EXCLUDED.price_source_url, description=EXCLUDED.description,
  source_name=EXCLUDED.source_name, source_url=EXCLUDED.source_url, gvw_kg=EXCLUDED.gvw_kg,
  last_verified_at=EXCLUDED.last_verified_at, model_family=EXCLUDED.model_family, variant_label=EXCLUDED.variant_label;

UPDATE public.vehicle_models SET dc_fast_charge_kw=130 WHERE id='nissan-interstar-e';

INSERT INTO public.vehicle_models
  (id, category_id, brand, model, status, advertised_battery_kwh, range_km, range_text,
   description, source_name, source_url, gvw_kg, last_verified_at)
VALUES
  ('mercedes-benz-evito','bestel','Mercedes-Benz','eVito','nu',66,286,'tot 286',
   'Midsize gesloten bestelwagen met 66 kWh en tot 286 km WLTP. Er is ook een 90 kWh-uitvoering aangekondigd. Nederlandse prijslijst in deze controle niet openbaar bevestigd, daarom geen prijs ingevuld.',
   'Automotive World','https://www.automotiveworld.com/news-releases/even-more-miles-mercedes-benz-evito-panel-van-now-available-with-90-kwh-battery-capacity/',3500,'2026-11-02'),
  ('mercedes-benz-earocs-400','bakwagen','Mercedes-Benz','eArocs 400','nu',414,240,'200-240',
   'Elektrische bouwtruck (8x4) met 414 kWh LFP. Circa 200 km als mixer en 240 km als kipper, afhankelijk van opbouw en inzet.',
   'electrive','https://www.electrive.com/2026/03/30/sales-launch-for-mercedes-earocs-400-construction-truck/',NULL,'2026-11-02'),
  ('renault-trucks-e-tech-d-14t','bakwagen','Renault Trucks','E-Tech D 14T','nu',176,220,'tot 220',
   'Lichte distributietruck van 14 ton met 176 kWh LFP en tot 220 km. Ook als 12-tons uitvoering leverbaar.',
   'Renault Trucks','https://www.renault-trucks.com/en/newsroom/press-releases/gamme-electrique-complete-iaa',NULL,'2026-11-02'),
  ('mercedes-benz-eintouro','bus','Mercedes-Benz','eIntouro','nu',414,500,'tot 500',
   'Elektrische intercitybus met LFP-accu tot 414 kWh en tot 500 km. Eerste leveringen in 2026.',
   'Electric Cars Report','https://www.electriccarsreport.com/2024/11/daimler-buses-unveils-mercedes-benz-eintouro-intercity-electric-bus/',NULL,'2026-11-02')
ON CONFLICT (id) DO UPDATE SET advertised_battery_kwh=EXCLUDED.advertised_battery_kwh, range_km=EXCLUDED.range_km,
  range_text=EXCLUDED.range_text, description=EXCLUDED.description, source_name=EXCLUDED.source_name,
  source_url=EXCLUDED.source_url, last_verified_at=EXCLUDED.last_verified_at;

INSERT INTO public.vehicle_models
  (id, category_id, brand, model, status, gross_battery_kwh, gross_battery_text, usable_battery_kwh, usable_battery_text, range_km, range_text, dc_fast_charge_kw,
   description, source_name, source_url, last_verified_at)
VALUES
  ('iveco-s-eway-rigid','bakwagen','IVECO','S-eWay Rigid','nu',490,NULL,NULL,NULL,400,'tot 400',350,
   'Bakwagenversie van de S-eWay met tot 490 kWh en tot 400 km. De trekkeruitvoering staat apart in de catalogus.',
   'electrive','https://www.electrive.com/2025/06/13/iveco-to-start-fitting-the-s-eway-with-lfp-batteries-from-2026/','2026-11-02'),
  ('daf-xg-electric','trekker','DAF','XG Electric','nu',525,'210-525',462,'185-462',500,'tot 500',350,
   'Grote trekker boven de XF, in serieproductie sinds mei 2026. Accu in stappen tot 525 kWh; XG+ laadt tot 350 kW.',
   'Electric Cars Report','https://electriccarsreport.com/2026/05/daf-begins-series-production-of-xg-electric-and-xg-electric-trucks/','2026-11-02')
ON CONFLICT (id) DO UPDATE SET gross_battery_kwh=EXCLUDED.gross_battery_kwh, range_km=EXCLUDED.range_km,
  range_text=EXCLUDED.range_text, dc_fast_charge_kw=EXCLUDED.dc_fast_charge_kw, description=EXCLUDED.description,
  source_name=EXCLUDED.source_name, source_url=EXCLUDED.source_url, last_verified_at=EXCLUDED.last_verified_at;

COMMIT;
