-- Bezoekersdashboard (/maildashboard/bezoekers/)
-- 1. Browser, besturingssysteem en bot-herkenning per event, server-side uit de
--    user-agent van het verzoek. De volledige user-agent wordt niet bewaard.
-- 2. Lijst met interne browsers (Jan, Max, tests) die het dashboard apart houdt.
-- 3. Eén functie die de ruwe events voor het dashboard teruggeeft (alleen service-role).

alter table public.web_events
  add column if not exists ua_klasse text check (ua_klasse in ('mens', 'bot')),
  add column if not exists browser   text check (char_length(browser) <= 20),
  add column if not exists os        text check (char_length(os) <= 20);

create or replace function public.web_events_ua()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  h  json;
  ua text;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    h := null;
  end;
  if h is null then
    return new;
  end if;
  ua := lower(coalesce(h->>'user-agent', ''));
  new.ua_klasse := case
    when ua = '' or ua ~ '(bot|crawl|spider|slurp|headless|lighthouse|pagespeed|phantom|puppeteer|playwright|selenium|python|curl|wget|httpclient|okhttp|go-http|java/|node-fetch|axios|preview|facebookexternalhit|scanner|monitor)'
      then 'bot' else 'mens' end;
  new.browser := case
    when ua like '%edg/%'          then 'Edge'
    when ua like '%opr/%'          then 'Opera'
    when ua like '%samsungbrowser%' then 'Samsung'
    when ua ~ '(firefox|fxios)'    then 'Firefox'
    when ua ~ '(chrome|crios|chromium)' then 'Chrome'
    when ua like '%safari%'        then 'Safari'
    else 'Overig' end;
  new.os := case
    when ua ~ '(iphone|ipad|ipod)' then 'iOS'
    when ua like '%android%'       then 'Android'
    when ua like '%windows%'       then 'Windows'
    when ua like '%mac os x%'      then 'macOS'
    when ua like '%cros%'          then 'ChromeOS'
    when ua like '%linux%'         then 'Linux'
    else 'Overig' end;
  return new;
end;
$$;

drop trigger if exists web_events_ua on public.web_events;
create trigger web_events_ua before insert on public.web_events
  for each row execute function public.web_events_ua();

-- Interne browsers: worden in het dashboard apart gehouden van echte bezoekers.
-- Het dashboard voegt de browser waarmee je het opent automatisch toe.
create table if not exists public.web_intern (
  visitor_id    uuid primary key,
  label         text,
  toegevoegd_op timestamptz not null default now()
);
alter table public.web_intern enable row level security;
revoke all on public.web_intern from anon, authenticated;

insert into public.web_intern (visitor_id, label) values
  ('967570de-6d36-4e9b-b9e9-23843529b8b0', 'Jan (vaste browser)'),
  ('8f1d597f-23a4-4600-a42d-eda0a844c3a8', 'Intern (en-GB, 1536 px)')
on conflict (visitor_id) do nothing;

-- Ruwe events voor het dashboard, compact als arrays:
-- [tijd, event, pagina, consent, visitor, sessie, props, ua_klasse, browser, os]
create or replace function public.dashboard_bezoekers(van timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'events', coalesce((
      select jsonb_agg(jsonb_build_array(
        e.received_at, e.event, e.page, e.consent, e.visitor_id, e.session_id,
        e.props, e.ua_klasse, e.browser, e.os) order by e.received_at)
      from public.web_events e
      where e.received_at >= van and e.event not in ('scroll_depth', 'test_ping')
    ), '[]'::jsonb),
    'calc', coalesce((
      select jsonb_agg(jsonb_build_array(c.received_at, c.visitor_id, c.session_id, c.vt, c.goedkoper, c.trigger) order by c.received_at)
      from public.calc_runs c
      where c.received_at >= van
    ), '[]'::jsonb),
    'intern', coalesce((select jsonb_agg(i.visitor_id) from public.web_intern i), '[]'::jsonb)
  );
$$;

revoke all on function public.dashboard_bezoekers(timestamptz) from public, anon, authenticated;
grant execute on function public.dashboard_bezoekers(timestamptz) to service_role;
