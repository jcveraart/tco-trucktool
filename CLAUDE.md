# Claude Development Guidelines: Stekker of diesel (TCO Truck Tool)

## Single Source of Truth: Supabase Database Schema

All vehicle models, categories, default calculation parameters, subsidies, and international toll rates are governed by the canonical **Supabase (PostgreSQL)** database schema. Whenever modifying the website, adding models, or refining calculation logic, **ALWAYS** adhere strictly to the database structure defined below.

Do not introduce ad-hoc field names, divergent keys, or arbitrary data models.

---

## Canonical Database Tables

### 1. `vehicle_categories`
- `id` (text, primary key): `'trekker'`, `'bakwagen'`, `'bestel'`, `'bus'`
- `name` (text): Display name in Dutch (e.g., `'Trekker'`, `'Bakwagen'`)
- `slug` (text, unique)
- `sub_title` (text): e.g., `'N3 · met oplegger'`
- `is_truck` (boolean): `true` for heavy goods vehicles (trekker, bakwagen), `false` for vans/buses
- `regulatory_scheme` (text): `'az'` (AanZET eligible) or `'geen'`
- Default calculation assumptions:
  - `default_annual_km` (int), `default_toll_km` (int), `default_work_days` (int)
  - `default_depreciation_years` (int), `default_residual_value_pct` (numeric)
  - `default_diesel_price_per_l` (numeric), `default_electricity_price_per_kwh` (numeric), `default_ere_yield_per_kwh` (numeric)
  - `default_diesel_consumption` (numeric, L/100km), `default_electric_consumption` (numeric, kWh/100km), `default_battery_kwh` (numeric)
  - `default_insurance_diesel_annual` (numeric), `default_insurance_electric_annual` (numeric)
  - `default_maintenance_diesel_per_km` (numeric), `default_maintenance_electric_per_km` (numeric)
  - `default_toll_diesel_per_km` (numeric), `default_toll_electric_per_km` (numeric)
  - `quick_select_km` (integer array)

### 2. `vehicle_models`
- `id` (text, primary key): Kebab-case slug, e.g. `'mercedes-benz-eactros-600'`
- `category_id` (text, foreign key -> `vehicle_categories.id`)
- `brand` (text): Manufacturer name (e.g. `'Mercedes-Benz'`, `'Volvo'`, `'Tesla'`)
- `model` (text): Commercial model name
- `status` (text): `'nu'` (available/in production) or `'komt'` (announced/upcoming)
- `release_year` (int, nullable): Expected year if status is `'komt'`
- Battery specifications (in kWh):
  - `usable_battery_kwh` (numeric, net usable capacity)
  - `gross_battery_kwh` (numeric, total installed capacity)
  - `estimated_usable_battery_kwh` (numeric, derived when only gross or range is published)
  - `advertised_battery_kwh` (numeric, when manufacturer publishes without gross/net distinction)
  - `usable_battery_text`, `gross_battery_text`, `advertised_battery_text` (text, for ranges like `'210–525'`)
  - `derived_method` (text, explanation of derivation if applicable)
- Range & Consumption:
  - `range_km` (int): WLTP or standardized realistic range
  - `range_text` (text, optional: e.g. `'tot 500'`)
  - `range_condition` (text, optional notes on test conditions)
  - `consumption_kwh_per_100km` (numeric)
- Charging:
  - `dc_fast_charge_kw` (int, CCS max power in kW)
  - `mcs_charge_kw` (int, Megawatt Charging System power in kW)
- Pricing & Reference Diesel Comparison:
  - `indicative_price_eur` (numeric)
  - `indicative_price_text` (text)
  - `price_source_name`, `price_source_url` (text)
  - `diesel_ref_model` (text, e.g. `'Volvo FH 420 diesel'`)
  - `diesel_ref_price_eur` (numeric)
  - `diesel_ref_consumption_l_per_100km` (numeric)
  - `diesel_price_source_name`, `diesel_price_source_url` (text)
- Classification & Verification:
  - `gvw_kg` (int), `gvw_class` (text)
  - `description` (text, Dutch description and notes)
  - `source_name`, `source_url` (text, primary spec source)
  - `last_verified_at` (date)

### 3. `company_sizes` & `aanzet_subsidies`
- `company_sizes`: `'groot'`, `'middelgroot'`, `'klein'` with FTE and turnover thresholds
- `aanzet_subsidies`:
  - `vehicle_class` (`'N2'` or `'N3'`)
  - `company_size_id` (foreign key)
  - `subsidy_percentage` (e.g. 0.29 for Klein N3)
  - `max_subsidy_amount` (e.g. €115,200 for Klein N3, €43,900 for Groot N3)

### 4. `international_toll_rates`
- `id` (text: `'vl'`, `'wa'`, `'fr'`, `'de'`, `'it'`, `'pl'`, `'at'`)
- `country_code` (text), `region_name` (text)
- `electric_rate_per_km` (numeric)
- `diesel_rate_per_km` (numeric)
- `notes` (text)

---

## Rules for AI & Human Contributors

1. **Schema Compliance**: Any addition or modification to models must supply the required schema columns. Never omit `category_id`, `brand`, `model`, `range_km`, `status`, or `description`.
2. **Battery Standard**: Keep gross vs. usable distinction explicit. Do not combine the battery size of one variant with the range or price of another variant.
3. **Database Migrations**: Any schema evolution must be added as a numbered SQL file under `supabase/migrations/`.
4. **Client-side Fetching**: When loading data from Supabase, select using canonical column names (`category_id`, `usable_battery_kwh`, `range_km`, etc.). If offline caching or fallback is maintained in `index.html`, keep the data fields mapped 1:1 to the Supabase schema.
5. **Catalog Tests**: Ensure `tests/catalog.test.cjs` passes and validates against the Supabase schema constraints.
