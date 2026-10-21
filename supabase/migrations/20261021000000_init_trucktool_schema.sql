-- ==============================================================================
-- SUPABASE / POSTGRESQL SCHEMA & SEED FOR ELECTRIC COMMERCIAL VEHICLES & TCO TOOL
-- Generated from Stekker of diesel (tco-trucktool) repository
-- Covers: Vehicle Categories, Models, AanZET Subsidies, International Tolls,
--         and Calculator Presets / Parameters.
-- ==============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. VEHICLE CATEGORIES
-- ------------------------------------------------------------------------------
create table if not exists public.vehicle_categories (
    id text primary key, -- 'trekker', 'bakwagen', 'bestel', 'bus'
    name text not null,
    slug text not null unique,
    sub_title text not null,
    is_truck boolean not null default false,
    regulatory_scheme text not null default 'geen', -- 'az' (AanZET) or 'geen'
    default_annual_km integer not null,
    default_toll_km integer not null default 0,
    default_work_days integer not null default 250,
    default_depreciation_years integer not null default 6,
    default_residual_value_pct numeric(5,2) not null default 10.0,
    default_diesel_price_per_l numeric(5,2) not null default 2.00,
    default_electricity_price_per_kwh numeric(5,2) not null default 0.25,
    default_ere_yield_per_kwh numeric(5,2) not null default 0.12,
    default_diesel_consumption numeric(6,2) not null,
    default_electric_consumption numeric(6,2) not null,
    default_battery_kwh numeric(6,1) not null,
    default_insurance_diesel_annual numeric(10,2) not null,
    default_insurance_electric_annual numeric(10,2) not null,
    default_maintenance_diesel_per_km numeric(5,3) not null,
    default_maintenance_electric_per_km numeric(5,3) not null,
    default_toll_diesel_per_km numeric(5,3) not null default 0.000,
    default_toll_electric_per_km numeric(5,3) not null default 0.000,
    quick_select_km integer[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.vehicle_categories enable row level security;
create policy "Allow public read-only access to vehicle_categories"
    on public.vehicle_categories for select using (true);

-- ------------------------------------------------------------------------------
-- 2. COMPANY SIZES & CRITERIA (FOR SUBSIDIES LIKE AANZET)
-- ------------------------------------------------------------------------------
create table if not exists public.company_sizes (
    id text primary key, -- 'groot', 'middelgroot', 'klein'
    name text not null,
    fte_criteria text not null,
    turnover_criteria text not null,
    criteria_operator text not null default 'en', -- 'en' or 'of'
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

alter table public.company_sizes enable row level security;
create policy "Allow public read-only access to company_sizes"
    on public.company_sizes for select using (true);

-- ------------------------------------------------------------------------------
-- 3. AANZET SUBSIDY TIERS
-- ------------------------------------------------------------------------------
create table if not exists public.aanzet_subsidies (
    id uuid primary key default uuid_generate_v4(),
    vehicle_class text not null, -- 'N2' or 'N3'
    company_size_id text not null references public.company_sizes(id) on delete cascade,
    subsidy_percentage numeric(5,3) not null, -- e.g. 0.290 = 29%
    max_subsidy_amount numeric(10,2) not null, -- e.g. 115200.00
    valid_from date not null default '2026-01-01',
    valid_until date,
    notes text,
    created_at timestamptz not null default now(),
    unique(vehicle_class, company_size_id)
);

alter table public.aanzet_subsidies enable row level security;
create policy "Allow public read-only access to aanzet_subsidies"
    on public.aanzet_subsidies for select using (true);

-- ------------------------------------------------------------------------------
-- 4. INTERNATIONAL TOLL RATES
-- ------------------------------------------------------------------------------
create table if not exists public.international_toll_rates (
    id text primary key, -- 'vl', 'wa', 'fr', 'de', 'it', 'pl', 'at'
    country_code varchar(3) not null,
    region_name text not null,
    electric_rate_per_km numeric(5,3) not null,
    diesel_rate_per_km numeric(5,3) not null,
    notes text,
    created_at timestamptz not null default now()
);

alter table public.international_toll_rates enable row level security;
create policy "Allow public read-only access to international_toll_rates"
    on public.international_toll_rates for select using (true);

-- ------------------------------------------------------------------------------
-- 5. VEHICLE MODELS (THE CORE FLEET / CATALOGUE)
-- ------------------------------------------------------------------------------
create table if not exists public.vehicle_models (
    id text primary key, -- e.g. 'mercedes-benz-eactros-600'
    category_id text not null references public.vehicle_categories(id) on delete restrict,
    brand text not null,
    model text not null,
    status text not null default 'nu' check (status in ('nu', 'komt')), -- 'nu' (available) or 'komt' (announced)
    release_year integer,
    
    -- Battery & Capacity (in kWh)
    gross_battery_kwh numeric(6,1),
    gross_battery_text text,
    usable_battery_kwh numeric(6,1),
    usable_battery_text text,
    estimated_usable_battery_kwh numeric(6,1),
    advertised_battery_kwh numeric(6,1),
    advertised_battery_text text,
    derived_method text,
    
    -- Range & Consumption
    range_km integer not null,
    range_text text,
    range_condition text,
    consumption_kwh_per_100km numeric(6,1),
    
    -- Charging
    dc_fast_charge_kw integer,
    mcs_charge_kw integer, -- Megawatt Charging System
    
    -- Pricing (Electric)
    indicative_price_eur numeric(10,2),
    indicative_price_text text,
    price_source_name text,
    price_source_url text,
    
    -- Reference Diesel Model & Price
    diesel_ref_model text,
    diesel_ref_price_eur numeric(10,2),
    diesel_ref_consumption_l_per_100km numeric(5,1),
    diesel_price_source_name text,
    diesel_price_source_url text,
    
    -- Weight & Classification
    gvw_kg integer,
    gvw_class text,
    
    -- Description & Primary Sources
    description text not null,
    source_name text,
    source_url text,
    last_verified_at date default '2026-10-21',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_vehicle_models_category on public.vehicle_models(category_id);
create index if not exists idx_vehicle_models_brand on public.vehicle_models(brand);
create index if not exists idx_vehicle_models_status on public.vehicle_models(status);

alter table public.vehicle_models enable row level security;
create policy "Allow public read-only access to vehicle_models"
    on public.vehicle_models for select using (true);

-- ------------------------------------------------------------------------------
-- 6. CONVENIENT VIEW: COMPUTED USABLE BATTERY & EFFECTIVE RANGE
-- ------------------------------------------------------------------------------
create or replace view public.vw_vehicle_models_catalog as
select 
    vm.id,
    vm.brand,
    vm.model,
    vc.name as category_name,
    vc.id as category_id,
    vm.status,
    vm.release_year,
    coalesce(vm.usable_battery_kwh, vm.estimated_usable_battery_kwh, vm.advertised_battery_kwh, vm.gross_battery_kwh) as effective_battery_kwh,
    vm.range_km,
    vm.consumption_kwh_per_100km,
    vm.dc_fast_charge_kw,
    vm.mcs_charge_kw,
    vm.indicative_price_eur,
    vm.diesel_ref_model,
    vm.diesel_ref_price_eur,
    vm.description,
    vm.source_name,
    vm.source_url
from public.vehicle_models vm
join public.vehicle_categories vc on vm.category_id = vc.id;

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- 1. Vehicle Categories Seed
insert into public.vehicle_categories (
    id, name, slug, sub_title, is_truck, regulatory_scheme,
    default_annual_km, default_toll_km, default_work_days, default_depreciation_years, default_residual_value_pct,
    default_diesel_price_per_l, default_electricity_price_per_kwh, default_ere_yield_per_kwh,
    default_diesel_consumption, default_electric_consumption, default_battery_kwh,
    default_insurance_diesel_annual, default_insurance_electric_annual,
    default_maintenance_diesel_per_km, default_maintenance_electric_per_km,
    default_toll_diesel_per_km, default_toll_electric_per_km, quick_select_km
) values
('trekker', 'Trekker', 'trekker', 'N3 · met oplegger', true, 'az',
 100000, 75000, 250, 6, 10.0, 2.00, 0.25, 0.12, 30.0, 115.0, 540.0, 7000.0, 9500.0, 0.120, 0.080, 0.201, 0.038, '{60000,80000,100000,120000,150000}'),
('bakwagen', 'Bakwagen', 'bakwagen', 'N2 of N3 · distributie', true, 'az',
 50000, 40000, 250, 7, 10.0, 2.00, 0.25, 0.12, 25.0, 100.0, 300.0, 4500.0, 6500.0, 0.100, 0.060, 0.155, 0.030, '{30000,40000,50000,60000,80000}'),
('bestel', 'Bestelbus', 'bestelbus', 'N1 · tot 3.500 kg', false, 'geen',
 30000, 0, 230, 5, 20.0, 2.00, 0.25, 0.12, 9.0, 25.0, 70.0, 2000.0, 2500.0, 0.060, 0.040, 0.000, 0.000, '{15000,20000,30000,40000,50000}'),
('bus', 'Bus', 'bus', 'M3 · streek of touring', false, 'geen',
 70000, 0, 300, 10, 10.0, 2.00, 0.25, 0.12, 32.0, 120.0, 450.0, 8000.0, 10000.0, 0.200, 0.140, 0.000, 0.000, '{40000,60000,70000,90000,120000}')
on conflict (id) do update set
    name = excluded.name,
    sub_title = excluded.sub_title,
    is_truck = excluded.is_truck,
    regulatory_scheme = excluded.regulatory_scheme,
    default_annual_km = excluded.default_annual_km,
    default_toll_km = excluded.default_toll_km,
    default_diesel_consumption = excluded.default_diesel_consumption,
    default_electric_consumption = excluded.default_electric_consumption,
    default_battery_kwh = excluded.default_battery_kwh;

-- 2. Company Sizes Seed
insert into public.company_sizes (id, name, fte_criteria, turnover_criteria, criteria_operator, sort_order) values
('groot', 'Groot', '≥ 250', '> € 50 miljoen', 'of', 1),
('middelgroot', 'Middelgroot', '< 250', '< € 50 miljoen', 'en', 2),
('klein', 'Klein of non-profit', '< 50', '< € 10 miljoen', 'en', 3)
on conflict (id) do nothing;

-- 3. AanZET Subsidies Seed
insert into public.aanzet_subsidies (vehicle_class, company_size_id, subsidy_percentage, max_subsidy_amount) values
('N3', 'groot', 0.111, 43900.00),
('N3', 'middelgroot', 0.210, 83200.00),
('N3', 'klein', 0.290, 115200.00),
('N2', 'groot', 0.061, 15200.00),
('N2', 'middelgroot', 0.120, 29900.00),
('N2', 'klein', 0.148, 36900.00)
on conflict (vehicle_class, company_size_id) do update set
    subsidy_percentage = excluded.subsidy_percentage,
    max_subsidy_amount = excluded.max_subsidy_amount;

-- 4. International Toll Rates Seed
insert into public.international_toll_rates (id, country_code, region_name, electric_rate_per_km, diesel_rate_per_km, notes) values
('vl', 'B', 'Vlaanderen', 0.038, 0.245, null),
('wa', 'B', 'Wallonië', 0.205, 0.205, null),
('fr', 'F', 'Frankrijk', 0.300, 0.300, 'Tolwegen in concessie, gemiddeld tarief'),
('de', 'D', 'Duitsland', 0.000, 0.348, 'Elektrisch vooralsnog vrijgesteld van Lkw-Maut'),
('it', 'I', 'Italië', 0.200, 0.200, 'Tolwegen in concessie, gemiddeld tarief'),
('pl', 'PL', 'Polen', 0.130, 0.130, null),
('at', 'A', 'Oostenrijk', 0.118, 0.509, null)
on conflict (id) do update set
    electric_rate_per_km = excluded.electric_rate_per_km,
    diesel_rate_per_km = excluded.diesel_rate_per_km,
    notes = excluded.notes;

-- 5. Vehicle Models Seed (67 Models)

insert into public.vehicle_models (
    id, category_id, brand, model, status, release_year,
    gross_battery_kwh, gross_battery_text, usable_battery_kwh, usable_battery_text,
    estimated_usable_battery_kwh, advertised_battery_kwh, advertised_battery_text, derived_method,
    range_km, range_text, range_condition, consumption_kwh_per_100km,
    dc_fast_charge_kw, mcs_charge_kw,
    indicative_price_eur, indicative_price_text, price_source_name, price_source_url,
    diesel_ref_model, diesel_ref_price_eur, diesel_ref_consumption_l_per_100km, diesel_price_source_name, diesel_price_source_url,
    gvw_kg, gvw_class, description, source_name, source_url, last_verified_at
) values
('mercedes-benz-eactros-600', 'trekker', 'Mercedes-Benz', 'eActros 600', 'nu', null, 621, null, 600, null, null, null, null, null, 500, 'tot 500', null, 103, 400, 1000, null, null, null, null, null, null, null, null, null, null, null, 'Drie LFP-accupakketten: 621 kWh geïnstalleerd en 600 kWh bruikbaar. Fabrieksbereik tot 500 km, afhankelijk van gewicht en omstandigheden. CCS tot 400 kW en voorbereid op megawattladen.', 'Mercedes-Benz Trucks', 'https://www.mercedes-benz-trucks.com/content/dam/brandhub/markets/gb/files/product-sheets/eActros-600-product-sheet.pdf.coredownload.pdf', '2026-10-21'),
('tesla-semi-europa', 'trekker', 'Tesla', 'Semi (Europa)', 'komt', 2027, null, null, null, null, 550, null, null, null, 550, null, null, 100, null, 800, null, null, null, null, null, null, null, null, null, null, null, 'Aangekondigd voor Europa, leveringen vanaf 2027. Tesla noemt 550 km bij 40 ton en een verbruik van ongeveer 1 kWh per km. De accugrootte is nog niet bekendgemaakt. Laadt tot 800 kW.', 'Tesla', 'https://www.tesla.com/en_GB/semi', '2026-10-21'),
('volvo-fh-aero-electric', 'trekker', 'Volvo', 'FH Aero Electric', 'nu', null, 780, null, 725, null, null, null, null, null, 700, null, null, null, null, 700, null, null, null, null, 'Volvo FH 420 diesel', 115000, null, 'autozeitung.de', 'https://www.autozeitung.de/volvo-fh-2024-preis-motoren-207714.html', null, null, '780 kWh geïnstalleerd, waarvan 725 kWh bruikbaar. In productie sinds september 2026.', 'electrive', 'https://www.electrive.com/2026/04/14/volvo-trucks-increases-range-of-flagship-e-truck-to-700-km/', '2026-10-21'),
('daf-xf-electric', 'trekker', 'DAF', 'XF Electric', 'nu', null, 525, '210–525', 462, '185–462', null, null, null, null, 500, 'tot 500', null, null, 325, null, null, null, null, null, null, null, null, null, null, null, null, 'De accu kies je in stappen, zodat je niet meer gewicht en geld meeneemt dan je inzet vraagt. In serieproductie sinds september 2025.', 'electrive', 'https://www.electrive.com/2025/09/22/daf-begins-series-production-of-xd-and-xf-electric-electric-trucks', '2026-10-21'),
('man-etgx-nieuwe-generatie-2027', 'trekker', 'MAN', 'eTGX (nieuwe generatie 2027)', 'komt', 2027, null, null, null, null, null, 552, null, null, 660, 'tot 660', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Aangekondigde 4×2-generatie met zes accupakketten van samen maximaal 552 kWh. De 660 km is een interne richtwaarde bij 20 °C, 60% belading en snelweginzet. Verkoopstart gepland voor april 2027, productie vanaf zomer 2027. MAN specificeert hier geen exacte bruikbare capaciteit.', 'MAN Truck & Bus', 'https://www.man.eu/global/en/truck/all-models/the-man-tgx/the-man-etgx/the-new-man-etgx.html', '2026-10-21'),
('scania-r-serie-elektrisch', 'trekker', 'Scania', 'R-serie elektrisch', 'nu', null, null, null, 560, null, null, null, null, null, 515, 'tot 515', null, null, 375, 750, null, null, null, null, null, null, null, null, null, null, null, 'Configuratie met 560 kWh bruikbaar: Scania noemt maximaal 515 km bij 42 ton treingewicht, 560 km bij 29 ton en 360 km bij 64 ton. De later aangekondigde 720 km gebruikt extra accu’s achter de cabine en wordt daarom niet met deze accu gecombineerd.', 'Scania', 'https://www.scania.com/group/en/home/products-and-services/trucks/battery-electric-truck.html', '2026-10-21'),
('renault-trucks-e-tech-t-780', 'trekker', 'Renault Trucks', 'E-Tech T 780', 'nu', null, 780, null, null, null, 741, null, null, 'afgeleid uit 95% van 780 kWh; maximaal gebruiksvenster', 660, 'tot 660', null, null, 350, 700, null, null, null, null, null, null, null, null, null, null, null, '6×2-trekker met 780 kWh en maximaal 660 km volgens Renault Trucks. De fabrikant noemt een gebruiksvenster tot 95%; de hier afgeleide 741 kWh is dus een indicatieve maximale bruikbare energie, geen afzonderlijk gepubliceerde netto capaciteit. CCS tot 350 kW en MCS tot 700 kW.', 'Renault Trucks', 'https://www.renault-trucks.com/en/newsroom/press-releases/long-haul-operations-now-within-reach-renault-trucks-electric-tractors', '2026-10-21'),
('iveco-s-eway', 'trekker', 'Iveco', 'S-eWay', 'nu', null, 603, null, null, null, 585, null, null, 'afgeleid uit 97% van 603 kWh, afgerond', 600, 'tot 600', null, null, 350, null, null, null, null, null, null, null, null, null, null, null, null, 'De LFP-uitvoering heeft 603 kWh geïnstalleerde capaciteit, waarvan volgens IVECO 97% bruikbaar is (afgerond 585 kWh). Fabrieksbereik tot 600 km. DC-snelladen tot 350 kW; belading en rijprofiel bepalen het praktijkbereik.', 'IVECO', 'https://www.iveco.com/estonia/-/media/IVECOdotcom/Content/Products/S-eWay_2026/Brochure/IVECO-S-eWay_EN.pdf?rev=-1', '2026-10-21'),
('mercedes-benz-eactros-300-400', 'bakwagen', 'Mercedes-Benz', 'eActros 300/400', 'nu', null, 448, '336–448', 388, '291–388', null, null, null, null, 400, '330–400', null, null, 160, null, 300000, 'reported', 'boerse-online.de', 'https://www.boerse-online.de/dpa-afx/roundup-mercedes-startet-serienproduktion-von-e-lkw-128851.html', null, null, null, null, null, null, null, 'Drie (300) of vier (400) accupakketten van 112 kWh, waarvan elk 97 kWh bruikbaar. De 400 km is gemeten in distributie zonder aanhanger bij 20 °C.', 'Mercedes-Benz Trucks', 'https://www.mercedes-benz-trucks.com/en_GB/emobility/world/your-benefits/usability.html', '2026-10-21'),
('daf-xd-electric', 'bakwagen', 'DAF', 'XD Electric', 'nu', null, 525, '210–525', 462, '185–462', null, null, null, null, 500, 'tot 500', null, null, 325, null, null, null, null, null, null, null, null, null, null, null, null, 'Dezelfde accu-opbouw als de XF Electric, voor regionale distributie.', 'DAF', 'https://dealers.daf.com/-/media/files/document-library/infosheets/electric/daf-xd-electric-infosheet-xde-en-556205.pdf', '2026-10-21'),
('daf-xb-electric', 'bakwagen', 'DAF', 'XB Electric', 'nu', null, 282, '141–282', 248, '124–248', null, null, null, null, 350, 'tot 350', null, null, 150, null, null, null, null, null, null, null, null, null, null, null, null, 'Lichte distributie van 12 tot 19 ton. Snelladen van 20 naar 80% duurt 40 tot 70 minuten.', 'DAF', 'https://www.daf.co.uk/-/media/files/document-library/infosheets/electric/daf-xb-electric-infosheet-xbe-en-556205.pdf', '2026-10-21'),
('volvo-fm-electric', 'bakwagen', 'Volvo', 'FM Electric', 'nu', null, 540, '360–540', 460, null, null, null, null, null, 470, 'tot 470', null, null, 350, null, null, null, null, null, null, null, null, null, null, null, 'n3', 'De actuele generatie met vier tot zes accupakketten: maximaal 540 kWh geïnstalleerd en 460 kWh bruikbaar. Volvo noemt tot 470 km; de opbouw en inzet bepalen het daadwerkelijke bereik. DC-laden van 20 tot 80% in ongeveer 65 minuten.', 'Volvo Trucks Nederland', 'https://www.volvotrucks.nl/nl-nl/trucks/electric/volvo-fm-electric.html', '2026-10-21'),
('man-etgl', 'bakwagen', 'MAN', 'eTGL', 'nu', null, 160, null, 160, null, null, null, null, null, 235, null, null, null, 250, null, null, null, null, null, null, null, null, null, null, 12000, 'n2', '12-tonner voor de stad, met twee pakketten van 80 kWh. Van 10 naar 80% in ongeveer 30 minuten, tot 6,6 ton laadvermogen.', 'electrive', 'https://www.electrive.com/2024/09/04/man-adds-12-tonne-model-to-its-electric-truck-portfolio', '2026-10-21'),
('renault-trucks-e-tech-d-16-t', 'bakwagen', 'Renault Trucks', 'E-Tech D 16 t', 'nu', null, 375, null, null, null, null, null, null, null, 330, null, null, null, 150, null, null, null, null, null, null, null, null, null, null, null, null, 'Vier accupakketten, samen 375 kWh. Met een uur DC-laden onderweg ongeveer 450 km.', 'Renault Trucks', 'https://www.renault-trucks.de/sites/default/files/2024-09/Renault%20Trucks%20E-TECH%20D16%20MED%20P4x2_0.pdf', '2026-10-21'),
('mercedes-benz-esprinter', 'bestel', 'Mercedes-Benz', 'eSprinter', 'nu', null, null, null, 81, null, null, null, null, null, 268, '268', null, null, 115, null, 49900, 'reported', 'wensink.nl', 'https://www.wensink.nl/p/mercedes-benz-esprinter-314-l2-h2-rwd-pro-81kwh-55986781', null, null, null, null, null, 3500, null, 'N1-voorbeeld: gesloten bestelwagen L2 met 81 kWh bruikbare accu en 3,5 ton toegestane massa. Mercedes-Benz publiceert voor deze Nederlandse L2-configuratie 268 km WLTP. De grotere 113 kWh-uitvoering met hogere toegestane massa heeft andere waarden; laaduitrusting verschilt per uitvoering.', 'Mercedes-Benz Nederland', 'https://certified.vans.mercedes-benz.nl/mercedes-benz/esprinter/esprinter-320-bestelwagen-l2/occ21613999', '2026-10-21'),
('ford-e-transit', 'bestel', 'Ford', 'E-Transit', 'nu', null, null, null, 89, null, null, null, null, null, 341, '341', null, 26.1, 180, null, 60000, 'list', 'fordmediacenter.nl', 'https://fordmediacenter.nl/ford-e-transit-met-extra-grote-actieradius-nu-te-bestellen-vanaf-e-59-995/', null, null, null, null, null, 3500, null, 'N1-bestelwagen 350 L3H2 Trend met 89 kWh bruikbaar en 135 kW motor. De Europese prijslijst noemt 341 km WLTP gecombineerd en 26,1 kWh/100 km voor deze 3,5-tonuitvoering. De eerder genoemde 402 km hoort bij een zwaardere, op 90 km/u begrensde uitvoering. DC tot 180 kW.', 'Ford Europa (Finland)', 'https://www.ford.fi/content/dam/guxeu/fi/documents/pricelists/cv/transit-van/PL-ford-e-transit.pdf', '2026-10-21'),
('renault-master-e-tech', 'bestel', 'Renault', 'Master E-Tech', 'nu', null, null, null, null, null, null, 87, null, null, 410, 'tot 410', null, null, 130, null, 45900, 'reported', 'anwb.nl', 'https://www.anwb.nl/zakelijk/elektrisch-rijden/elektrische-bestelautos/renault-master-e-tech', null, null, null, null, null, 3500, null, 'N1-referentie met 87 kWh long-range-accu en 3,5 ton toegestane massa. Renault communiceert tot 410 km WLTP voor deze generatie. De 460 km van de 4-tonuitvoering wordt hier niet als N1-bereik gebruikt. Carrosserie, uitrusting en snelheid beïnvloeden het bereik; DC tot 130 kW.', 'Renault', 'https://www.renault.is/cars/master-e-tech-rafmagn/master.html', '2026-10-21'),
('fiat-e-ducato', 'bestel', 'Fiat', 'E-Ducato', 'nu', null, 110.6, null, 97.8, null, null, null, null, null, 378, '378', null, 29.4, 150, null, 53700, null, null, null, 'Fiat Ducato L3H2 140 pk', 35700, 9.9, 'fiat.nl', 'https://www.fiat.nl/content/dam/fiat2023/nl/professional/prijslijsten/ducato/prijslijst-fiat-ducato-my26-per-1-april-2026.pdf', 3500, null, 'N1 L3H2 gesloten bestelwagen van 3,5 ton. De Nederlandse prijslijst van 1 september 2026 noemt 110,6 kWh geïnstalleerd, 97,8 kWh bruikbaar, 378 km WLTP gecombineerd en 29,4 kWh/100 km. Catalogusprijs € 53.700 excl. btw en opties. De 424 km van de 4,25-tonversie wordt hier niet gebruikt. AC standaard 22 kW.', 'Fiat Professional Nederland', 'https://www.fiat.nl/professional/modellen/e-ducato/prijslijst', '2026-10-21'),
('mercedes-benz-ecitaro', 'bus', 'Mercedes-Benz', 'eCitaro', 'nu', null, 666, '444–666', null, null, null, null, null, null, 600, 'tot 600', null, null, 300, null, null, null, null, null, null, null, null, null, null, null, null, 'Stadsbus met vier tot zes NMC4-pakketten van 111 kWh. Mercedes noemt tot 600 km, ook aan het eind van de accuduur. 10 jaar accugarantie.', 'Mercedes-Benz Bus', 'https://www.mercedes-benz-bus.com/en_DE/models/ecitaro.html', '2026-10-21'),
('mercedes-benz-ecitaro-g', 'bus', 'Mercedes-Benz', 'eCitaro G', 'nu', null, 777, '444–777', null, null, null, null, null, null, 480, 'tot 480', null, null, 300, null, 950000, 'reported', 'electrive.net', 'https://www.electrive.net/2026/06/09/kiel-bestellt-28-e-gelenkbusse-bei-daimler-buses/', null, null, null, null, null, null, null, 'Gelede stadsbus met tot zeven NMC4-pakketten.', 'Mercedes-Benz Bus', 'https://www.mercedes-benz-bus.com/en_DE/models/ecitaro.html', '2026-10-21'),
('vdl-citea-le-122', 'bus', 'VDL', 'Citea LE-122', 'nu', null, 575, null, null, null, null, null, null, null, 600, '500–600', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Nieuwe generatie met de accu in de vloer in plaats van op het dak. VDL noemt 500 tot 600 km, en 250 km in een strenge winter.', 'electrive', 'https://www.electrive.net/2025/03/21/transdev-bestellt-42-elektrobusse-bei-vdl/', '2026-10-21'),
('yutong-t12e-touringcar', 'bus', 'Yutong', 'T12E touringcar', 'nu', null, 400, null, null, null, null, null, null, null, 350, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Elektrische touringcar met LFP-accu en een verbruik onder 1,05 kWh per km. Een Oostenrijkse vervoerder rekent met ongeveer 380 km.', 'electrive', 'https://www.electrive.com/2026/02/26/three-battery-electric-yutong-coaches-deployed-in-austria/', '2026-10-21'),
('citroen-e-berlingo-van', 'bestel', 'Citroën', 'ë-Berlingo Van', 'nu', null, null, null, null, null, null, 54, null, null, 337, 'tot 337', 'WLTP gecombineerd', null, 100, null, 27800, 'list', 'wassinkautogroep.nl', 'https://www.wassinkautogroep.nl/content/uploads/2024/11/Prijslijst-citroen-e-berlingo-van-per-1-januari-2026.pdf', null, null, null, null, null, null, null, 'Compacte elektrische bestelwagen. De actuele Nederlandse modelpagina noemt 54 kWh en maximaal 337 km WLTP gecombineerd; de uitvoering en uitrusting bepalen het werkelijke homologatiebereik.', 'Citroën Nederland', 'https://www.citroen.nl/modellen/bedrijfswagens/e-berlingo-van.html', '2026-10-21'),
('citroen-e-jumpy-comfort-range', 'bestel', 'Citroën', 'ë-Jumpy Comfort Range', 'nu', null, null, null, null, null, null, 75, null, null, 356, 'tot 356', 'WLTP gecombineerd', null, 100, null, 43400, 'list', 'citroen.nl', 'https://www.citroen.nl/content/dam/citroen/netherlands/b2b/local-content/brochures-prijslijsten/model/jumpy/17042026-Prijzen-en-specificaties-e-Jumpy.pdf', null, null, null, null, null, null, null, 'Middelgrote bestelwagen met de 75 kWh-accu. Citroën noemt voor Comfort Range maximaal 356 km WLTP gecombineerd. Ook verkrijgbaar als Urban Range met een kleinere accu.', 'Citroën Nederland', 'https://www.citroen.nl/modellen/bedrijfswagens/e-jumpy.html', '2026-10-21'),
('peugeot-e-partner', 'bestel', 'Peugeot', 'E-Partner', 'nu', null, null, null, null, null, null, 50, null, null, 343, 'tot 343', 'WLTP gecombineerd', null, 100, null, null, null, null, null, null, null, null, null, null, null, null, 'Compacte bestelwagen met een 50 kWh-accu. Peugeot noemt maximaal 343 km WLTP; beschikbare lengtes, uitrusting en belading beïnvloeden de actieradius.', 'Peugeot Nederland', 'https://www.peugeot.nl/showroom/peugeot-partner/elektrisch.html', '2026-10-21'),
('peugeot-e-expert-75-kwh', 'bestel', 'Peugeot', 'E-Expert 75 kWh', 'nu', null, null, null, null, null, null, 75, null, null, 352, 'tot 352', 'WLTP gecombineerd', null, 100, null, null, null, null, null, null, null, null, null, null, null, null, 'Middelgrote elektrische bestelwagen met de 75 kWh-accu en maximaal 352 km WLTP gecombineerd. De kleinere 49 kWh-uitvoering haalt volgens Peugeot tot 223 km.', 'Peugeot Nederland', 'https://www.peugeot.nl/showroom/peugeot-expert/faq.html', '2026-10-21'),
('opel-combo-cargo-electric', 'bestel', 'Opel', 'Combo Cargo Electric', 'nu', null, null, null, null, null, null, 50, null, null, 343, 'tot 343', 'WLTP gecombineerd', null, 100, null, 27800, 'list', 'opel.nl', 'https://www.opel.nl/bedrijfswagens/combo-modellen/nieuwe-combo-electric/overzicht.html', 'Opel Combo Cargo diesel', 20400, null, 'opel.nl', 'https://www.opel.nl/bedrijfswagens/combo-modellen/nieuwe-combo/overzicht.html', null, null, 'Compacte elektrische bestelwagen met een 50 kWh-accu. De Nederlandse modelpagina noemt maximaal 343 km; de gekozen uitvoering en opties bepalen het homologatiebereik. Leverbaar in twee lengtes.', 'Opel Nederland', 'https://www.opel.nl/bedrijfswagens/combo-modellen/nieuwe-combo-electric/overzicht.html', '2026-10-21'),
('opel-vivaro-electric-75-kwh', 'bestel', 'Opel', 'Vivaro Electric 75 kWh', 'nu', null, null, null, null, null, null, 75, null, null, 350, 'tot 350', 'WLTP gecombineerd', null, 100, null, null, null, null, null, null, null, null, null, null, null, null, 'Middelgrote elektrische bestelwagen met de 75 kWh-accu. Opel noemt in zijn elektrische modellenoverzicht maximaal 350 km WLTP. Leverbaar in twee lengtes en meerdere carrosserievarianten.', 'Opel Nederland', 'https://www.opel.nl/elektrisch-rijden/elektrische-bedrijfswagens.html', '2026-10-21'),
('fiat-e-doblo', 'bestel', 'Fiat', 'E-Doblò', 'nu', null, null, null, null, null, null, 50, null, null, 343, 'tot 343', 'WLTP gecombineerd', null, 100, null, null, null, null, null, null, null, null, null, null, null, null, 'Compacte elektrische bestelwagen met de 50 kWh-accu en maximaal 343 km WLTP gecombineerd. Verkrijgbaar in de lengtes M en XL; volgens Fiat is laden tot 80% in circa 30 minuten mogelijk.', 'Fiat Professional Nederland', 'https://www.fiat.nl/professional/modellen/e-doblo', '2026-10-21'),
('fiat-e-scudo-75-kwh', 'bestel', 'Fiat', 'E-Scudo 75 kWh', 'nu', null, null, null, null, null, null, 75, null, null, 352, 'tot 352', 'WLTP gecombineerd', null, 100, null, null, null, null, null, null, null, null, null, null, null, null, 'Middelgrote bestelwagen met de 75 kWh-accu. Fiat noemt maximaal 352 km WLTP gecombineerd en circa 45 minuten snelladen tot 80%. Het bereik verschilt per carrosserie en uitvoering.', 'Fiat Professional Nederland', 'https://www.fiat.nl/professional/modellen/e-scudo/features', '2026-10-21'),
('toyota-proace-city-electric', 'bestel', 'Toyota', 'Proace City Electric', 'nu', null, null, null, null, null, null, 50, null, null, 330, 'tot 330', 'WLTP gecombineerd', null, 100, null, 27900, 'list', 'toyota.nl', 'https://www.toyota.nl/modellen/proace-city/prijzen-en-acties', null, null, null, null, null, null, null, 'Compacte elektrische bestelwagen met de 50 kWh-accu. Toyota noemt in zijn Nederlandse bereikoverzicht en FAQ maximaal 330 km WLTP gecombineerd. Verkrijgbaar als L1 en Long L2.', 'Toyota Nederland', 'https://www.toyota.nl/modellen/proace-city', '2026-10-21'),
('toyota-proace-electric-75-kwh', 'bestel', 'Toyota', 'Proace Electric 75 kWh', 'nu', null, null, null, null, null, null, 75, null, null, 350, 'tot 350', 'WLTP gecombineerd', null, 100, null, null, null, null, null, null, null, null, null, null, null, null, 'Middelgrote elektrische bestelwagen met de 75 kWh-accu en maximaal 350 km WLTP gecombineerd. Ook leverbaar met een kleinere accu van 50 kWh; carrosserie en uitrusting beïnvloeden het bereik.', 'Toyota Nederland', 'https://www.toyota.nl/modellen/proace', '2026-10-21'),
('renault-kangoo-van-e-tech-electric', 'bestel', 'Renault', 'Kangoo Van E-Tech electric', 'nu', null, null, null, 45, null, null, null, null, null, 295, 'tot 295', 'WLTP gecombineerd', 19, 80, null, 28000, 'list', 'cdn.group.renault.com', 'https://cdn.group.renault.com/ren/nl/brochures-en-prijslijsten/prijslijsten/kangoo-etech-electric-prijslijst.pdf', null, null, null, null, null, null, null, 'Compacte bestelwagen met 45 kWh bruikbare accucapaciteit. De actuele Nederlandse modelpagina noemt maximaal 295 km WLTP, afhankelijk van uitvoering, uitrusting en lader. DC-snelladen is afhankelijk van de gekozen laaduitrusting.', 'Renault Nederland', 'https://bedrijfswagens.renault.nl/modellen/kangoo-e-tech-electric.html?bodyTypeCode=PT1261_kastenwagen', '2026-10-21'),
('nissan-townstar-ev-van', 'bestel', 'Nissan', 'Townstar EV Van', 'nu', null, null, null, null, null, null, 44, null, null, 301, 'tot 301', 'WLTP gecombineerd', 18.6, null, null, 32000, 'reported', 'stam.nl', 'https://www.stam.nl/nissan/modellen/nissan-townstar/prijzen/', null, null, null, null, null, null, null, 'Compacte elektrische bestelwagen in de lengtes L1 en L2. De actuele Nederlandse aandrijflijnpagina noemt 44 kWh en maximaal 301 km WLTP gecombineerd. Laaduitrusting en bereik verschillen per versie.', 'Nissan Nederland', 'https://www.nissan.nl/voertuigen/nieuw/townstar/motor.html', '2026-10-21'),
('mercedes-benz-ecitan', 'bestel', 'Mercedes-Benz', 'eCitan', 'nu', null, null, null, null, null, null, 45, null, null, 284, 'tot 284', 'WLTP gecombineerd', null, 75, null, 34300, 'reported', 'laadpunt.nl', 'https://www.laadpunt.nl/laadpaal-kennisbank/elektrische-bestelwagens/', null, null, null, null, null, null, null, 'Compacte gesloten bestelwagen met een 45 kWh-accu en maximaal 284 km WLTP gecombineerd. Mercedes-Benz Nederland noemt DC-snelladen tot 75 kW als optie. Beschikbaarheid en laaduitrusting verschillen per versie.', 'Mercedes-Benz Nederland', 'https://www.mercedes-benz.nl/vans/models/ecitan/panel-van/overview.html', '2026-10-21'),
('ford-e-transit-custom', 'bestel', 'Ford', 'E-Transit Custom', 'nu', null, null, null, 71, null, null, null, null, null, 370, 'tot 370', null, null, 125, null, 44400, 'reported', 'hedinautomotive.nl', 'https://www.hedinautomotive.nl/ford/modellen/e-transit-custom', null, null, null, null, null, null, null, 'Modeljaar 2026 met 71 kWh bruikbaar. Fabrieksopgave tot 370 km WLTP; 10–80% laden duurt circa 29 minuten. Bereik varieert per uitvoering.', 'Ford Nederland', 'https://fordmediacenter.nl/meer-kilometers-minder-wachttijd-ford-e-transit-custom-geeft-jouw-werkdag-een-upgrade/', '2026-10-21'),
('ford-e-transit-courier', 'bestel', 'Ford', 'E-Transit Courier', 'nu', null, null, null, null, null, null, 46, null, null, 325, 'tot 325', null, null, 100, null, 28400, 'list', 'anwb.nl', 'https://www.anwb.nl/zakelijk/elektrisch-rijden/elektrische-bestelautos/ford-e-transit-courier', null, null, null, null, null, null, null, 'Bijgewerkte 46 kWh-uitvoering uit 2026. Tot 325 km WLTP en AC-laden met 11 kW; 10–80% DC-laden in minder dan 30 minuten.', 'Ford Nederland', 'https://fordmediacenter.nl/ford-e-transit-courier-krijgt-grotere-batterij-meer-actieradius-verbeterde-connectiviteit-en-inzetbaarheid/', '2026-10-21'),
('volkswagen-id-buzz-cargo', 'bestel', 'Volkswagen', 'ID. Buzz Cargo', 'nu', null, null, null, 79, null, null, null, null, null, 459, 'tot 459', null, 19.9, 185, null, 40000, 'list', 'vwbedrijfswagens.nl', 'https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/prijslijsten-en-brochures/id--buzz-cargo/Prijslijst-ID-Buzz-Cargo.pdf', null, null, null, null, null, null, null, 'Cargo met 79 kWh netto en 210 kW achterwielaandrijving: tot 459 km WLTP gecombineerd. De 4MOTION-versie en de kleinere 59 kWh-accu hebben een ander bereik. Laadvolume 3,9 m³.', 'Volkswagen Bedrijfswagens', 'https://www.vwbedrijfswagens.nl/nl/modellen/id-buzz-cargo.html', '2026-10-21'),
('volkswagen-e-transporter', 'bestel', 'Volkswagen', 'e-Transporter', 'nu', null, null, null, 70.9, null, null, null, null, null, 372, 'tot 372', null, null, 125, null, 47000, 'list', 'autoblog.nl', 'https://www.autoblog.nl/nieuws/dit-kost-de-volkswagen-e-transporter-in-nederland-6978674', null, null, null, null, null, null, null, 'Bijgewerkte accu met 70,9 kWh bruikbaar. Tot 372 km WLTP, afhankelijk van uitvoering; 10–80% snelladen duurt circa 29 minuten. Keuze uit twee lengtes en twee dakhoogtes.', 'Volkswagen Bedrijfswagens', 'https://www.vwbedrijfswagens.nl/nl/modellen/e-transporter.html', '2026-10-21'),
('renault-trafic-van-e-tech-nieuwe-generatie', 'bestel', 'Renault', 'Trafic Van E-Tech (nieuwe generatie)', 'komt', 2026, null, null, null, null, null, 81, null, null, 470, 'tot 470', null, null, 190, null, null, null, null, null, null, null, null, null, null, null, null, 'Nieuwe 800V-generatie met 81 kWh long range, L1H1. Volgens Renault bestelbaar medio november 2026. De opgegeven 470 km en laadprestaties zijn voorlopig, in afwachting van WLTP-typegoedkeuring; 60 kWh volgt in 2027.', 'Renault Nederland', 'https://bedrijfswagens.renault.nl/trafic-van/trafic-e-tech-electric.html', '2026-10-21'),
('opel-movano-electric', 'bestel', 'Opel', 'Movano Electric', 'nu', null, null, null, null, null, null, 110, null, null, 430, 'tot 430', null, null, 150, null, 51000, 'list', 'opel.nl', 'https://www.opel.nl/bedrijfswagens/movano-modellen/nieuwe-movano-electric/brochure-prijslijst.html', null, null, null, null, null, null, null, '110 kWh-accu en tot 430 km WLTP volgens Opel, afhankelijk van carrosserie en opties. Tot 17 m³ laadvolume; DC-laden tot 80% duurt circa 55 minuten.', 'Opel Nederland', 'https://www.opel.nl/bedrijfswagens/movano-modellen/nieuwe-movano-electric/overzicht.html', '2026-10-21'),
('peugeot-e-boxer', 'bestel', 'Peugeot', 'E-Boxer', 'nu', null, null, null, null, null, null, 110, null, null, 424, 'tot 424', null, null, 150, null, 53700, 'list', 'peugeot.nl', 'https://www.peugeot.nl/showroom/peugeot-boxer.html', null, null, null, null, null, null, null, '110 kWh-uitvoering met een fabrieksopgave tot 424 km WLTP gecombineerd, afhankelijk van carrosserie en toegestane massa. Tot 17 m³ laadvolume; 0–80% DC-laden in circa 55 minuten.', 'Peugeot Nederland', 'https://www.peugeot.nl/content/dam/peugeot/netherlands/b2c/brochures/model/boxer/11032026-Prijzen-en-specificaties-Peugeot-E-Boxer.pdf', '2026-10-21'),
('citroen-e-jumper', 'bestel', 'Citroën', 'ë-Jumper', 'nu', null, null, null, null, null, null, 110, null, null, 424, 'tot 424', null, null, 150, null, null, null, null, null, null, null, null, null, null, null, null, '110 kWh-uitvoering: tot 424 km WLTP gecombineerd, afhankelijk van configuratie. Laadvolume 13–17 m³. Snelladen van 0 naar 80% duurt volgens Citroën circa 55 minuten.', 'Citroën Nederland', 'https://www.citroen.nl/modellen/bedrijfswagens/e-jumper.html', '2026-10-21'),
('toyota-proace-max-electric', 'bestel', 'Toyota', 'Proace Max Electric', 'nu', null, null, null, null, null, null, 110, null, null, 424, 'tot 424', null, null, 150, null, null, null, null, null, null, null, null, null, null, null, null, '110 kWh-accu met tot 424 km gecombineerd WLTP-bereik volgens Toyota Nederland. Verkrijgbaar als L3H2, L3H3 en L4H3; bereik verschilt per uitvoering. Tot 17 m³ laadvolume.', 'Toyota Nederland', 'https://www.toyota.nl/modellen/proace-max', '2026-10-21'),
('iveco-edaily', 'bestel', 'IVECO', 'eDaily', 'nu', null, 74, null, null, null, null, null, null, null, 265, 'tot 265', null, null, 80, null, null, null, null, null, null, null, null, null, null, null, null, '35S-bestelwagen (3,5 ton) met twee geïnstalleerde 37 kWh-modules. WLTP-opgave 265 km voor H1 met wielbasis 3.520 mm onder de testvoorwaarden uit de brochure. De vaak genoemde 400 km is een stedelijke simulatie voor andere configuraties.', 'IVECO Nederland', 'https://info.iveco.nl/hubfs/Brochure%20IVECO%20eDaily.pdf?hsLang=nl-nl', '2026-10-21'),
('maxus-edeliver-3', 'bestel', 'Maxus', 'eDeliver 3', 'nu', null, null, null, null, null, null, 50, null, null, 227, null, null, null, 57, null, null, null, null, null, null, null, null, null, null, null, null, 'Gesloten bestelwagen L1 met 50 kWh-accu volgens de actuele Nederlandse prijslijst: 227 km WLTP gecombineerd, 322 km in de stad. Laadvolume 4,8 m³. De chassis-cabine heeft andere waarden.', 'Maxus Nederland', 'https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-3-v3.pdf', '2026-10-21'),
('maxus-edeliver-5', 'bestel', 'Maxus', 'eDeliver 5', 'nu', null, null, null, null, null, null, 64, null, null, 335, null, null, null, 70, null, null, null, null, null, null, null, null, null, null, null, null, 'L1H1 met 64 kWh-accu: 335 km WLTP gecombineerd en 6,6 m³ laadvolume. Hogere of langere carrosserieën halen minder kilometers. DC-laden van 20 naar 80% duurt circa 36 minuten.', 'Maxus Nederland', 'https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-5-v2.pdf', '2026-10-21'),
('maxus-edeliver-7', 'bestel', 'Maxus', 'eDeliver 7', 'nu', null, null, null, null, null, null, 88, null, null, 370, null, null, null, 90, null, null, null, null, null, null, null, null, null, null, null, null, 'L1H1 met 88 kWh-accu: 370 km WLTP gecombineerd. Er zijn ook 77 kWh-, langere, hogere en AWD-uitvoeringen met afwijkend bereik. DC-laden van 20 naar 80% duurt circa 43 minuten.', 'Maxus Nederland', 'https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-7-v7.pdf', '2026-10-21'),
('maxus-edeliver-9', 'bestel', 'Maxus', 'eDeliver 9', 'nu', null, null, null, null, null, null, 88, null, null, 347, null, null, null, 90, null, 45000, 'reported', 'maxusdealer.nl', 'https://maxusdealer.nl/maxus-elektrische-bedrijfswagens/edeliver-9', null, null, null, null, null, null, null, 'L2H2 met 88 kWh-accu: 347 km WLTP gecombineerd volgens de Nederlandse prijslijst. Dit is de vernieuwde uitvoering; oudere 89 kWh-versies hebben andere specificaties. Laadvolume 9,7 m³.', 'Maxus Nederland', 'https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-9-v4.pdf', '2026-10-21'),
('volvo-fl-electric', 'bakwagen', 'Volvo', 'FL Electric', 'nu', null, null, null, null, null, null, 565, null, null, 450, 'tot 450', null, null, 150, null, null, null, null, null, null, null, null, null, null, null, null, 'Compact distributiechassis voor 12 tot 18,6 ton. Hier staat de grootste accukeuze van 565 kWh met de door Volvo opgegeven maximale actieradius; een kleinere accu biedt meer laadvermogen. Volvo specificeert op deze pagina niet of de capaciteit bruto of bruikbaar is.', 'Volvo Trucks', 'https://www.volvotrucks.com/en-en/trucks/electric/volvo-fl-electric.html', '2026-10-21'),
('volvo-fe-electric', 'bakwagen', 'Volvo', 'FE Electric', 'nu', null, null, null, null, null, null, 375, null, null, 275, 'tot 275', null, null, 150, null, null, null, null, null, null, null, null, null, null, null, 'n3', 'Distributie-, bouw- en inzamelchassis tot 28 ton, ook met lage instap. Grootste accukeuze van 375 kWh. Volvo geeft tot 275 km op; de opbouw en inzet bepalen de haalbare afstand. Bruto of bruikbaar wordt bij deze capaciteit niet vermeld.', 'Volvo Trucks', 'https://www.volvotrucks.com/en-en/trucks/electric/volvo-fe-electric.html', '2026-10-21'),
('volvo-fm-low-entry', 'bakwagen', 'Volvo', 'FM Low Entry', 'nu', null, null, null, null, null, null, 360, null, null, 200, 'tot 200', null, null, 250, null, null, null, null, null, null, null, null, null, null, null, 'n3', 'Lage cabine voor stadsdistributie en gemeentelijke inzet tot 32 ton. Vier accupakketten van samen 360 kWh; Volvo noemt tot 200 km. De bron maakt geen onderscheid tussen bruto en bruikbare accucapaciteit.', 'Volvo Trucks', 'https://www.volvotrucks.com/en-en/trucks/electric/volvo-fm-low-entry.html', '2026-10-21'),
('volvo-fmx-electric', 'bakwagen', 'Volvo', 'FMX Electric', 'nu', null, 540, null, 460, null, null, null, null, null, 470, 'tot 470', null, null, 350, null, null, null, null, null, null, null, null, null, null, null, 'n3', 'Elektrisch bouwchassis voor onder meer kipper, kraan of betonmixer. Grootste uitvoering met zes accupakketten: 540 kWh geïnstalleerd en maximaal 460 kWh bruikbaar. Volvo noemt tot 470 km; opbouw, belading en terrein beïnvloeden de actieradius.', 'Volvo Trucks', 'https://www.volvotrucks.com/en-en/trucks/electric/volvo-fmx-electric.html', '2026-10-21'),
('fuso-ecanter-9c18e-l', 'bakwagen', 'FUSO', 'eCanter 9C18e L', 'nu', null, 124, null, 116, null, null, null, null, null, 200, 'tot 200', null, null, 104, null, null, null, null, null, null, null, null, null, null, 8550, 'n2', 'Licht chassis van 8,55 ton met het L-accupakket: 124 kWh geïnstalleerd, 116 kWh bruikbaar. De 200 km is door FUSO getest met gesloten laadbak, 50% van het laadvermogen en 20 °C. AC-laden kan met 22 kW.', 'FUSO technische gegevens', 'https://www.fuso-trucks.com/wp-content/uploads/sites/2/2024/05/eCanter_Technical-Datasheets_2024_EN_855T.pdf', '2026-10-21'),
('man-etgm-4-accupakketten', 'bakwagen', 'MAN', 'eTGM (4 accupakketten)', 'komt', 2026, null, null, 320, null, null, null, null, null, 480, 'tot 480', null, null, 375, null, null, null, null, null, null, null, null, null, null, null, 'n3', 'Distributiechassis van 16,01 tot 16,5 ton. Vier pakketten geven 320 kWh bruikbaar en volgens MAN tot 480 km zonder aanhanger; met aanhanger noemt MAN maximaal 285 km. Interne fabriekswaarden. Productiestart verwacht in december 2026.', 'MAN Truck & Bus', 'https://www.man.eu/uk/en/truck/all-models/the-man-tgm-and-man-tgl/the-man-etgm/overview.html', '2026-10-21'),
('man-etgs-4-2-chassis', 'bakwagen', 'MAN', 'eTGS 4×2 chassis', 'nu', null, null, null, 480, null, null, null, null, null, 820, 'tot 820', null, null, 375, 750, null, null, null, null, null, null, null, null, null, null, 'n3', 'Zwaar distributiechassis met zes accupakketten en 480 kWh bruikbaar. MAN noemt maximaal 820 km als interne richtwaarde bij solo-inzet, 20 °C, 60% belading en gunstig stads- en regionaal verkeer. Dit is geen snelweg- of WLTP-actieradius; laat de eigen inzet doorrekenen.', 'MAN Truck & Bus', 'https://www.man.eu/uk/en/truck/all-models/the-man-tgs/the-man-etgs/overview.html', '2026-10-21'),
('renault-trucks-e-tech-d-wide-375', 'bakwagen', 'Renault Trucks', 'E-Tech D Wide 375', 'nu', null, null, null, null, null, null, 375, null, null, 315, 'tot 315', null, null, 150, null, null, null, null, null, null, null, null, null, null, null, 'n3', 'Distributie- en inzamelchassis van 19 tot 26 ton. Dit betreft de configuratie met maximaal 375 kWh en tot 315 km uit de fabrieksdocumentatie. Renault vermeldt bij deze capaciteit niet expliciet bruto of bruikbaar. Het rijprofiel en de opbouw bepalen het praktijkbereik.', 'Renault Trucks', 'https://www.renault-trucks.at/press-release/renault-trucks-e-tech-d-wide-erste-praxiseinsatze', '2026-10-21'),
('solaris-urbino-12-electric-modulair', 'bus', 'Solaris', 'Urbino 12 electric (modulair)', 'nu', null, null, null, null, null, null, 600, '> 600', null, 600, '> 600', 'SORT 2', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Stadsbus van 12 meter met modulaire aandrijving. Solaris noemt zes dakpakketten met samen meer dan 600 kWh en een bereik boven 600 km op basis van SORT 2-verbruik. Exacte bruto/netto-capaciteit en laadvermogen worden op deze pagina niet gespecificeerd. Ook pantograafladen is mogelijk.', 'Solaris Bus & Coach', 'https://www.solarisbus.com/en/urbino-12-electric-with-modular-drive', '2026-10-21'),
('solaris-urbino-18-electric-modulair', 'bus', 'Solaris', 'Urbino 18 electric (modulair)', 'nu', null, null, null, null, null, null, 800, '> 800', null, 600, 'tot 600', 'e-SORT 2', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Gelede stadsbus van 18 meter. De grootste accuconfiguratie bevat meer dan 800 kWh; Solaris geeft 600 km op, berekend uit het e-SORT 2-verbruik. Exacte bruto/netto-capaciteit en laadvermogen worden op deze pagina niet gespecificeerd. Laden via stekker of pantograaf.', 'Solaris Bus & Coach', 'https://www.solarisbus.com/en/urbino-18-electric', '2026-10-21'),
('man-lion-s-city-10-e', 'bus', 'MAN', 'Lion’s City 10 E', 'nu', null, 356, null, 320, null, null, null, null, null, 310, 'tot 310', null, null, 150, null, null, null, null, null, null, null, null, null, null, null, null, 'Compacte stadsbus van circa 10,6 meter met vier pakketten. De 320 kWh bruikbaar en tot 310 km horen bij de Maximum Range-accustrategie; belading, route en klimaatregeling beïnvloeden het bereik.', 'MAN brochure Lion’s City E', 'https://www.man.eu/content/dam/man/countries/doc/bw-master/bus/eventassets-1/Brochure-MAN-Lions-City-E-IT.pdf/_jcr_content/renditions/original./Brochure-MAN-Lions-City-E-IT.pdf', '2026-10-21'),
('man-lion-s-city-12-e', 'bus', 'MAN', 'Lion’s City 12 E', 'nu', null, 445, null, 400, null, null, null, null, null, 380, 'tot 380', null, null, 150, null, null, null, null, null, null, null, null, null, null, null, null, 'Stadsbus van circa 12,2 meter met vijf pakketten. Deze 445 kWh-configuratie biedt maximaal 400 kWh bruikbaar bij de Maximum Range-accustrategie. MAN noemt tot 380 km onder gunstige inzetomstandigheden.', 'MAN brochure Lion’s City E', 'https://www.man.eu/content/dam/man/countries/doc/bw-master/bus/eventassets-1/Brochure-MAN-Lions-City-E-IT.pdf/_jcr_content/renditions/original./Brochure-MAN-Lions-City-E-IT.pdf', '2026-10-21'),
('man-lion-s-city-18-e', 'bus', 'MAN', 'Lion’s City 18 E', 'nu', null, 623, null, 560, null, null, null, null, null, 350, 'tot 350', null, null, 150, null, null, null, null, null, null, null, null, null, null, null, null, 'Gelede stadsbus van circa 18,1 meter met zeven pakketten. Tot 560 kWh bruikbaar volgens de Maximum Range-accustrategie. Het technische fabrieksblad noemt 350 km onder gunstige omstandigheden, afhankelijk van accustrategie, belading en klimaatregeling.', 'MAN technische gegevens', 'https://media.man.eu/is/content/MAN/man_lions_city_datenblatt_18-E_ENpdf', '2026-10-21'),
('byd-ebus-b12-b', 'bus', 'BYD', 'eBus B12.b', 'nu', null, null, null, null, null, null, 500, null, null, 600, 'tot 600', null, null, null, null, 457000, 'order', 'truckandbusbuilder.com', 'https://truckandbusbuilder.com/article/2024/02/25/belgian-transport-operator-orders-92-byd-electric-buses', null, null, null, null, null, null, null, 'Stadsbus van 12 meter met Blade Battery in het chassis en plaats voor maximaal 105 reizigers. BYD noemt maximaal 500 kWh en tot 600 km op één lading. De bron specificeert de testcyclus, bruto/netto-capaciteit en het laadvermogen niet.', 'BYD Europe', 'https://bydeurope.com/byd-ebus-b12', '2026-10-21'),
('karsan-e-ata-12', 'bus', 'Karsan', 'e-ATA 12', 'nu', null, null, null, null, null, null, 528, null, null, 500, 'tot 500', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'Lagevloer-stadsbus van 12 meter met een LFP-accu tot 528 kWh. Karsan noemt 500 km onder realistische omstandigheden, afhankelijk van accugrootte en rijprofiel; er staat geen gestandaardiseerde testcyclus bij. Laden via DC-stekker en optioneel pantograaf; bruto/netto en laadpiek niet gespecificeerd.', 'Karsan', 'https://www.karsan.com/en/electric-bus/e-ata-12', '2026-10-21'),
('man-etgx-huidige-generatie', 'trekker', 'MAN', 'eTGX (huidige generatie)', 'nu', null, null, null, null, null, null, 480, null, null, 570, 'tot 570', null, null, 375, 750, null, null, null, null, null, null, null, null, null, null, null, '4×2-trekker met zes accupakketten, samen 480 kWh volgens de technische modeltabel. De 570 km is een interne richtwaarde onder gunstige omstandigheden, geen WLTP-cijfer. De apart vermelde nieuwe generatie met 660 km volgt in 2027.', 'MAN Truck & Bus', 'https://www.man.eu/uk/en/truck/all-models/the-man-tgx/the-man-etgx/overview.html', '2026-10-21'),
('renault-trucks-e-tech-t-540', 'trekker', 'Renault Trucks', 'E-Tech T 540', 'nu', null, null, null, null, null, null, 540, null, null, 450, 'tot 450', null, null, 350, null, null, null, null, null, null, null, null, null, null, null, null, 'Elektrische 4×2-trekker voor regionaal vervoer, met maximaal 540 kWh en tot 450 km volgens Renault Trucks. Bereik is afhankelijk van treingewicht en inzet. DC-snelladen via CCS tot 350 kW.', 'Renault Trucks', 'https://www.renault-trucks.com/en/newsroom/press-releases/long-haul-operations-now-within-reach-renault-trucks-electric-tractors', '2026-10-21'),
('renault-trucks-e-tech-t-585', 'trekker', 'Renault Trucks', 'E-Tech T 585', 'nu', null, null, null, null, null, null, 585, null, null, 500, 'tot 500', null, null, 350, null, null, null, null, null, null, null, null, null, null, null, null, '6×2-trekker met e-as, afgestemd op laadvermogen. Renault Trucks noemt 585 kWh en maximaal 500 km. Andere belading, opbouw en omstandigheden geven een ander bereik; CCS-laden tot 350 kW.', 'Renault Trucks', 'https://www.renault-trucks.com/en/newsroom/press-releases/long-haul-operations-now-within-reach-renault-trucks-electric-tractors', '2026-10-21')
on conflict (id) do update set
    category_id = excluded.category_id,
    brand = excluded.brand,
    model = excluded.model,
    status = excluded.status,
    release_year = excluded.release_year,
    gross_battery_kwh = excluded.gross_battery_kwh,
    gross_battery_text = excluded.gross_battery_text,
    usable_battery_kwh = excluded.usable_battery_kwh,
    usable_battery_text = excluded.usable_battery_text,
    estimated_usable_battery_kwh = excluded.estimated_usable_battery_kwh,
    advertised_battery_kwh = excluded.advertised_battery_kwh,
    range_km = excluded.range_km,
    consumption_kwh_per_100km = excluded.consumption_kwh_per_100km,
    dc_fast_charge_kw = excluded.dc_fast_charge_kw,
    mcs_charge_kw = excluded.mcs_charge_kw,
    indicative_price_eur = excluded.indicative_price_eur,
    diesel_ref_model = excluded.diesel_ref_model,
    diesel_ref_price_eur = excluded.diesel_ref_price_eur,
    description = excluded.description,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    last_verified_at = excluded.last_verified_at,
    updated_at = now();
