-- Eigen gebruik herkennen op netwerk.
-- Wie het e-mail- of bezoekersdashboard opent, registreert daarmee zijn netwerk
-- als intern (gehasht met een geheim zout; IPv6 op /64). Elk event, elke
-- berekening en elke mailklik vanaf zo'n netwerk krijgt intern = true.
-- Van andere bezoekers wordt niets van het IP-adres bewaard, ook geen hash.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.instellingen (sleutel text primary key, waarde text not null);
insert into private.instellingen values ('ip_zout', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (sleutel) do nothing;

create table if not exists public.web_intern_net (
  sleutel       text primary key,
  label         text,
  toegevoegd_op timestamptz not null default now(),
  laatst_gezien timestamptz not null default now(),
  -- Telefoonnetwerken delen IP-adressen met veel mensen: die gelden maar kort
  geldig_dagen  int not null default 90
);
alter table public.web_intern_net add column if not exists geldig_dagen int not null default 90;
alter table public.web_intern_net enable row level security;
revoke all on public.web_intern_net from anon, authenticated;

create or replace function private.ip_sleutel(ip text)
returns text language plpgsql stable security definer set search_path = '' as $$
declare n text;
begin
  if ip is null or ip = '' then return null; end if;
  begin
    n := case when position(':' in ip) > 0 then network(set_masklen(ip::inet, 64))::text else host(ip::inet) end;
  exception when others then return null;
  end;
  return encode(extensions.digest((select waarde from private.instellingen where sleutel = 'ip_zout') || n, 'sha256'), 'hex');
end $$;

create or replace function private.is_intern_net()
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare h json; ip text;
begin
  begin h := nullif(current_setting('request.headers', true), '')::json; exception when others then return false; end;
  if h is null then return false; end if;
  ip := coalesce(h->>'cf-connecting-ip', split_part(h->>'x-forwarded-for', ',', 1));
  return exists (select 1 from public.web_intern_net n where n.sleutel = private.ip_sleutel(trim(ip)) and n.laatst_gezien > now() - make_interval(days => n.geldig_dagen));
end $$;
grant usage on schema private to anon, authenticated;
revoke all on function private.ip_sleutel(text) from public, anon, authenticated;
grant execute on function private.is_intern_net() to anon, authenticated;

alter table public.web_events  add column if not exists intern boolean not null default false;
alter table public.calc_runs   add column if not exists intern boolean not null default false;
alter table public.email_kliks add column if not exists intern boolean not null default false;

create or replace function public.markeer_intern_net()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.intern := coalesce(private.is_intern_net(), false);
  return new;
end $$;

drop trigger if exists a_intern_net on public.web_events;
create trigger a_intern_net before insert on public.web_events for each row execute function public.markeer_intern_net();
drop trigger if exists a_intern_net on public.calc_runs;
create trigger a_intern_net before insert on public.calc_runs for each row execute function public.markeer_intern_net();
drop trigger if exists a_intern_net on public.email_kliks;
create trigger a_intern_net before insert on public.email_kliks for each row execute function public.markeer_intern_net();

-- Door de dashboards (edge functions) aangeroepen bij een geslaagde login
drop function if exists public.registreer_intern_net(text, text);
create or replace function public.registreer_intern_net(ip text, label text, dagen int default 90)
returns text language plpgsql security definer set search_path = '' as $$
declare s text := private.ip_sleutel(ip);
begin
  if s is null then return null; end if;
  insert into public.web_intern_net (sleutel, label, geldig_dagen) values (s, left(label, 60), greatest(1, least(dagen, 365)))
  on conflict (sleutel) do update set laatst_gezien = now(), label = excluded.label, geldig_dagen = excluded.geldig_dagen;
  return s;
end $$;
revoke all on function public.registreer_intern_net(text, text, int) from public, anon, authenticated;
grant execute on function public.registreer_intern_net(text, text, int) to service_role;

-- Sitebezoek per mailontvanger (via het token uit /m/, op browserniveau)
create or replace function public.dashboard_mail_bezoek()
returns jsonb language sql stable security definer set search_path = '' as $$
  with koppel as (
    select distinct e.props->>'mail' as token, e.visitor_id
    from public.web_events e
    where e.event = 'session_start' and e.props ? 'mail' and e.visitor_id is not null
  ), ev as (
    select k.token, e.* from koppel k join public.web_events e on e.visitor_id = k.visitor_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'token', token, 'sessies', sessies, 'weergaven', weergaven, 'sec', sec, 'berekend', berekend,
    'eerste', eerste, 'laatst', laatst, 'paginas', paginas, 'land', land, 'intern', intern)), '[]'::jsonb)
  from (
    select token,
      count(distinct session_id) as sessies,
      count(*) filter (where event = 'page_view') as weergaven,
      coalesce(sum(least((props->>'sec')::numeric, 3600)) filter (where event = 'page_leave'), 0) as sec,
      bool_or(event = 'wizard_complete') as berekend,
      min(received_at) as eerste, max(received_at) as laatst,
      (select jsonb_agg(distinct x.page) from ev x where x.token = ev.token and x.event = 'page_view') as paginas,
      max(land) as land, bool_or(intern) as intern
    from ev group by token
  ) t;
$$;
revoke all on function public.dashboard_mail_bezoek() from public, anon, authenticated;
grant execute on function public.dashboard_mail_bezoek() to service_role;

-- Bezoekersdashboard: intern-vlag en interne netwerken erbij
-- events: [tijd, event, pagina, consent, visitor, sessie, props, ua_klasse, browser, os, land, intern]
-- calc:   [tijd, visitor, sessie, vt, goedkoper, trigger, modus, model_id, km, jaren, verschil_jaar, consent, intern]
-- kliks:  [tijd, token, campagne, variant, link, bot, intern]
create or replace function public.dashboard_bezoekers(van timestamptz)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'events', coalesce((
      select jsonb_agg(jsonb_build_array(
        e.received_at, e.event, e.page, e.consent, e.visitor_id, e.session_id,
        e.props, e.ua_klasse, e.browser, e.os, e.land, e.intern) order by e.received_at)
      from public.web_events e
      where e.received_at >= van and e.event not in ('scroll_depth', 'test_ping')
    ), '[]'::jsonb),
    'calc', coalesce((
      select jsonb_agg(jsonb_build_array(c.received_at, c.visitor_id, c.session_id, c.vt, c.goedkoper, c.trigger,
        c.modus, c.model_id, c.km, c.jaren, c.verschil_jaar, c.consent, c.intern) order by c.received_at)
      from public.calc_runs c where c.received_at >= van
    ), '[]'::jsonb),
    'intern', coalesce((select jsonb_agg(i.visitor_id) from public.web_intern i), '[]'::jsonb),
    'netwerken', coalesce((select jsonb_agg(jsonb_build_array(left(n.sleutel, 10), n.label, n.toegevoegd_op, n.laatst_gezien, n.geldig_dagen) order by n.laatst_gezien desc) from public.web_intern_net n), '[]'::jsonb),
    'kliks', coalesce((
      select jsonb_agg(jsonb_build_array(k.ontvangen_op, k.token, k.campagne, k.variant, k.link, k.bot, k.intern) order by k.ontvangen_op)
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

-- Netwerk weer als extern markeren (vanuit het dashboard, op prefix van de sleutel)
create or replace function public.verwijder_intern_net(prefix text)
returns void language sql security definer set search_path = '' as $$
  delete from public.web_intern_net where left(sleutel, 10) = left(prefix, 10) and length(prefix) >= 10;
$$;
revoke all on function public.verwijder_intern_net(text) from public, anon, authenticated;
grant execute on function public.verwijder_intern_net(text) to service_role;
