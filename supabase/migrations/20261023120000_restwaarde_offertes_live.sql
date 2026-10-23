-- Offertes, restwaarde-index, prijsalarm, praktijkverbruik en live prijzen voor stekkerofdiesel.nl
-- De site gebruikt de publishable key: bezoekers mogen hier alleen toevoegen of samengevatte cijfers lezen.
-- De wekelijkse verzamelaar (scripts/restwaarde.mjs, GitHub Actions) schrijft met de service-role-key.

-- ===== Offerte aanvragen via een model =====
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  model_id text not null check (char_length(model_id) <= 200),
  model_name text not null check (char_length(model_name) <= 200),
  category text check (category in ('trekker', 'bakwagen', 'bestel', 'bus')),
  company text not null check (char_length(company) between 1 and 200),
  contact_name text not null check (char_length(contact_name) between 1 and 200),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 50),
  quantity text check (quantity in ('1', '2-5', '6+')),
  calc_link text check (char_length(calc_link) <= 4000),
  status text not null default 'nieuw' check (status in ('nieuw', 'doorgestuurd', 'afgerond', 'vervallen'))
);
alter table public.quote_requests enable row level security;
grant insert on public.quote_requests to anon;
drop policy if exists "site kan offertes aanvragen" on public.quote_requests;
create policy "site kan offertes aanvragen" on public.quote_requests
  for insert to anon with check (status = 'nieuw');

-- ===== Restwaarde: gemelde verkoopprijzen (anoniem) =====
create table if not exists public.residual_reports (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  category text not null check (category in ('trekker', 'bakwagen', 'bestel', 'bus')),
  fuel text not null check (fuel in ('e', 'd')),
  brand_model text check (char_length(brand_model) <= 120),
  year int not null check (year between 1995 and 2030),
  km int check (km between 0 and 3000000),
  price int not null check (price between 500 and 2000000),
  approved boolean not null default true
);
alter table public.residual_reports enable row level security;
grant insert on public.residual_reports to anon;
drop policy if exists "site kan verkoopprijs melden" on public.residual_reports;
create policy "site kan verkoopprijs melden" on public.residual_reports
  for insert to anon with check (approved and created_at > now() - interval '1 minute');

-- ===== Restwaarde: advertenties en veilinguitslagen van de verzamelaar =====
create table if not exists public.residual_listings (
  id bigint generated always as identity primary key,
  url_hash text not null unique,
  url text,
  source text not null,
  kind text not null check (kind in ('listing', 'auction')),
  observed_on date not null default current_date,
  category text not null check (category in ('trekker', 'bakwagen', 'bestel', 'bus')),
  fuel text not null check (fuel in ('e', 'd')),
  brand text,
  model text,
  year int check (year between 1995 and 2030),
  km int check (km between 0 and 3000000),
  price int not null check (price between 500 and 2000000)
);
alter table public.residual_listings enable row level security;
revoke all on public.residual_listings from anon, authenticated;

-- Mediaanprijs per aandrijving, voertuig en leeftijd. Veilinguitslagen en meldingen zijn echte verkoopprijzen;
-- vraagprijzen uit advertenties tellen voor 90% mee, omdat er meestal nog vanaf gaat.
create or replace view public.residual_index as
with alles as (
  select fuel, category, extract(year from observed_on)::int - year as age,
         case when kind = 'auction' then price else price * 0.9 end as p
  from public.residual_listings
  where year is not null and observed_on > current_date - interval '18 months'
  union all
  select fuel, category, extract(year from created_at)::int - year, price
  from public.residual_reports
  where approved and created_at > now() - interval '24 months'
)
select fuel, category, age, round(percentile_cont(0.5) within group (order by p))::int as median_price, count(*)::int as n
from alles
where age between 1 and 10
group by fuel, category, age;
grant select on public.residual_index to anon, authenticated;

-- ===== Prijsalarm =====
create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  category text not null check (category in ('trekker', 'bakwagen', 'bestel', 'bus')),
  fuel text not null check (fuel in ('e', 'd')),
  max_price int not null check (max_price between 1000 and 2000000),
  model text check (char_length(model) <= 120),
  active boolean not null default true
);
alter table public.price_alerts enable row level security;
grant insert (email, category, fuel, max_price, model) on public.price_alerts to anon;
drop policy if exists "site kan prijsalarm aanzetten" on public.price_alerts;
create policy "site kan prijsalarm aanzetten" on public.price_alerts
  for insert to anon with check (active);

-- Welke advertenties al gemaild zijn, zodat niemand twee keer dezelfde krijgt
create table if not exists public.price_alert_hits (
  alert_id uuid not null references public.price_alerts (id) on delete cascade,
  listing_id bigint not null references public.residual_listings (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (alert_id, listing_id)
);
alter table public.price_alert_hits enable row level security;
revoke all on public.price_alert_hits from anon, authenticated;

-- Afmelden via de link in de mail: zet het alarm uit en wist het e-mailadres
create or replace function public.unsubscribe_price_alert(p_token uuid)
returns boolean language sql security definer set search_path = public as $$
  with u as (
    update public.price_alerts set active = false, email = 'afgemeld@stekkerofdiesel.nl'
    where token = p_token and active returning 1
  ) select exists (select 1 from u);
$$;
revoke all on function public.unsubscribe_price_alert(uuid) from public;
grant execute on function public.unsubscribe_price_alert(uuid) to anon;

-- ===== Praktijkverbruik: gemiddeld ingevuld verbruik per model uit afgeronde berekeningen =====
-- Alleen als de bezoeker het verbruik zelf heeft aangepast (dan staat 'le' in de invoer), en pas vanaf 5 bezoekers.
create or replace view public.model_usage as
select props->>'model' as model_id,
       round(avg((props->'inputs'->>'le')::numeric), 1) as le,
       count(distinct visitor_id)::int as n
from public.web_events
where event = 'wizard_complete'
  and props->>'model' is not null
  and props->'inputs' ? 'le'
  and (props->'inputs'->>'le') ~ '^[0-9]+(\.[0-9]+)?$'
  and (props->'inputs'->>'le')::numeric between 5 and 200
group by 1
having count(distinct visitor_id) >= 5;
grant select on public.model_usage to anon, authenticated;

-- ===== Live prijzen: dieselprijs (CBS) en stroomverschil nacht/dag (EnergyZero) =====
create table if not exists public.live_prices (
  id text primary key,
  value numeric not null,
  measured_on date,
  source text,
  updated_at timestamptz not null default now()
);
alter table public.live_prices enable row level security;
grant select on public.live_prices to anon, authenticated;
drop policy if exists "iedereen kan live prijzen lezen" on public.live_prices;
create policy "iedereen kan live prijzen lezen" on public.live_prices for select to anon, authenticated using (true);

insert into public.live_prices (id, value, measured_on, source) values
  ('night_spread', 0.03, current_date, 'aanname')
on conflict (id) do nothing;

-- Ophalen gaat in twee stappen met pg_net: eerst de aanvragen versturen, een paar minuten later de antwoorden verwerken.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.live_price_requests (
  kind text primary key,
  request_id bigint not null,
  sent_at timestamptz not null default now()
);
alter table public.live_price_requests enable row level security;
revoke all on public.live_price_requests from anon, authenticated;

create or replace function public.live_prices_request()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  van text := to_char((now() at time zone 'UTC') - interval '30 days', 'YYYY-MM-DD"T"00:00:00.000"Z"');
  tot text := to_char((now() at time zone 'UTC'), 'YYYY-MM-DD"T"00:00:00.000"Z"');
begin
  insert into public.live_price_requests (kind, request_id) values
    ('diesel', net.http_get('https://opendata.cbs.nl/ODataApi/odata/80416ned/TypedDataSet?$orderby=Perioden%20desc&$top=1&$select=Perioden,Diesel_2')),
    ('stroom', net.http_get('https://api.energyzero.nl/v1/energyprices?fromDate=' || van || '&tillDate=' || tot || '&interval=4&usageType=1&inclBtw=false'))
  on conflict (kind) do update set request_id = excluded.request_id, sent_at = now();
end $$;

create or replace function public.live_prices_collect()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  body jsonb;
  per text;
  diesel numeric;
  nacht numeric;
  gem numeric;
begin
  -- Diesel: CBS geeft de gemiddelde pompprijs inclusief btw per dag
  select r.content::jsonb into body
  from public.live_price_requests q join net._http_response r on r.id = q.request_id
  where q.kind = 'diesel' and r.status_code = 200;
  if body is not null then
    per := regexp_replace(body->'value'->0->>'Perioden', '[^0-9]', '', 'g');
    diesel := (body->'value'->0->>'Diesel_2')::numeric;
    if diesel between 0.8 and 4 then
      insert into public.live_prices (id, value, measured_on, source, updated_at)
      values ('diesel_excl_btw', round(diesel / 1.21, 3), case when length(per) >= 8 then to_date(left(per, 8), 'YYYYMMDD') else current_date end, 'CBS 80416ned', now())
      on conflict (id) do update set value = excluded.value, measured_on = excluded.measured_on, source = excluded.source, updated_at = now();
    end if;
  end if;

  -- Stroom: verschil tussen het daggemiddelde en de nachturen (0 tot 6 uur) op de stroombeurs, laatste 30 dagen
  select r.content::jsonb into body
  from public.live_price_requests q join net._http_response r on r.id = q.request_id
  where q.kind = 'stroom' and r.status_code = 200;
  if body is not null then
    select avg((p->>'price')::numeric),
           avg((p->>'price')::numeric) filter (where extract(hour from ((p->>'readingDate')::timestamptz at time zone 'Europe/Amsterdam')) < 6)
      into gem, nacht
    from jsonb_array_elements(body->'Prices') p;
    if gem is not null and nacht is not null then
      insert into public.live_prices (id, value, measured_on, source, updated_at)
      values ('night_spread', greatest(0, round(gem - nacht, 3)), current_date, 'EnergyZero day-ahead', now())
      on conflict (id) do update set value = excluded.value, measured_on = excluded.measured_on, source = excluded.source, updated_at = now();
    end if;
  end if;
end $$;

revoke all on function public.live_prices_request() from public, anon, authenticated;
revoke all on function public.live_prices_collect() from public, anon, authenticated;

-- Elke ochtend: om 7:00 UTC ophalen, om 7:10 verwerken
select cron.unschedule(jobid) from cron.job where jobname in ('live-prijzen-ophalen', 'live-prijzen-verwerken');
select cron.schedule('live-prijzen-ophalen', '0 7 * * *', $$select public.live_prices_request()$$);
select cron.schedule('live-prijzen-verwerken', '10 7 * * *', $$select public.live_prices_collect()$$);
