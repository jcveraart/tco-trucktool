-- Meer meten voor het bezoekersdashboard
-- 1. Land per event uit de Cloudflare-header cf-ipcountry (het IP-adres zelf wordt niet bewaard).
-- 2. Zonder toestemming ook anoniem: hoe lang een pagina open stond (page_leave) en de laadsnelheid (perf).
-- 3. Dashboardfunctie geeft land en meer velden van berekeningen terug.

alter table public.web_events
  add column if not exists land text check (land ~ '^[A-Z0-9]{2}$');

create or replace function public.web_events_ua()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  h  json;
  ua text;
  c  text;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    h := null;
  end;
  if h is null then
    return new;
  end if;
  c := upper(coalesce(h->>'cf-ipcountry', ''));
  if c ~ '^[A-Z]{2}$' and c not in ('XX', 'T1') then new.land := c; end if;
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

drop policy if exists "site kan events toevoegen" on public.web_events;
create policy "site kan events toevoegen" on public.web_events
  for insert to anon, authenticated
  with check (
    received_at > now() - interval '1 minute'
    and (consent = 'stat' or event in ('page_view', 'consent', 'page_leave', 'perf'))
  );

create index if not exists calc_runs_received_idx on public.calc_runs (received_at);

-- events: [tijd, event, pagina, consent, visitor, sessie, props, ua_klasse, browser, os, land]
-- calc:   [tijd, visitor, sessie, vt, goedkoper, trigger, modus, model_id, km, jaren, verschil_jaar, consent]
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
        e.props, e.ua_klasse, e.browser, e.os, e.land) order by e.received_at)
      from public.web_events e
      where e.received_at >= van and e.event not in ('scroll_depth', 'test_ping')
    ), '[]'::jsonb),
    'calc', coalesce((
      select jsonb_agg(jsonb_build_array(c.received_at, c.visitor_id, c.session_id, c.vt, c.goedkoper, c.trigger,
        c.modus, c.model_id, c.km, c.jaren, c.verschil_jaar, c.consent) order by c.received_at)
      from public.calc_runs c
      where c.received_at >= van
    ), '[]'::jsonb),
    'intern', coalesce((select jsonb_agg(i.visitor_id) from public.web_intern i), '[]'::jsonb),
    'kliks', coalesce((
      select jsonb_agg(jsonb_build_array(k.ontvangen_op, k.token, k.campagne, k.variant, k.link, k.bot) order by k.ontvangen_op)
      from public.email_kliks k where k.ontvangen_op >= van and k.token is not null
    ), '[]'::jsonb),
    'verzonden', coalesce((
      select jsonb_agg(jsonb_build_array(v.token, v.campagne, v.verzonden_op, v.test))
      from public.email_verzonden v where v.verzonden_op >= van - interval '30 days'
    ), '[]'::jsonb),
    'contacten', coalesce((
      select jsonb_agg(jsonb_build_array(c.token, c.bedrijf, c.naam, c.email, c.segment))
      from public.email_contacten c
      where c.token in (select k.token from public.email_kliks k where k.ontvangen_op >= van)
         or c.token::text in (select e.props->>'mail' from public.web_events e where e.received_at >= van and e.props ? 'mail')
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.dashboard_bezoekers(timestamptz) from public, anon, authenticated;
grant execute on function public.dashboard_bezoekers(timestamptz) to service_role;
