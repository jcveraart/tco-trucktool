-- Overzicht per losse klik en per e-mailadres in beide dashboards
-- 1. dashboard_bezoekers: kliks met id en user-agent, verzonden met mail-variant,
--    contacten = iedereen die een echte mail kreeg (plus wie klikte of kwam).
-- 2. dashboard_mail_landingen: elke paginaweergave die uit een mail kwam (utm_source=email),
--    met de sessie die erop volgde, voor het e-maildashboard.

-- kliks:     [tijd, token, campagne, variant, link, bot, intern, id, ua]
-- verzonden: [token, campagne, verzonden_op, test, variant]
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
      select jsonb_agg(jsonb_build_array(k.ontvangen_op, k.token, k.campagne, k.variant, k.link, k.bot, k.intern, k.id, left(k.ua, 300)) order by k.ontvangen_op)
      from public.email_kliks k where k.ontvangen_op >= van and k.token is not null
    ), '[]'::jsonb),
    'verzonden', coalesce((
      select jsonb_agg(jsonb_build_array(v.token, v.campagne, v.verzonden_op, v.test, v.variant))
      from public.email_verzonden v where v.verzonden_op >= van - interval '30 days'
    ), '[]'::jsonb),
    'contacten', coalesce((
      select jsonb_agg(jsonb_build_array(c.token, c.bedrijf, c.naam, c.email, c.segment))
      from public.email_contacten c
      where c.token in (select v.token from public.email_verzonden v where v.verzonden_op >= van - interval '30 days')
         or c.token in (select k.token from public.email_kliks k where k.ontvangen_op >= van)
         or c.token::text in (select e.props->>'mail' from public.web_events e where e.received_at >= van and e.props ? 'mail')
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.dashboard_bezoekers(timestamptz) from public, anon, authenticated;
grant execute on function public.dashboard_bezoekers(timestamptz) to service_role;

-- [tijd, pagina, consent, sessie, campagne, content, browser, os, land, ua_klasse, intern, webdriver,
--  sessie_weergaven, sessie_sec, sessie_paginas, sessie_berekend, sessie_einde]
create or replace function public.dashboard_mail_landingen()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_array(
    l.received_at, l.page, l.consent, l.session_id, l.props->>'utm_campaign', l.props->>'utm_content',
    l.browser, l.os, l.land, l.ua_klasse, l.intern, coalesce((l.props->>'wd')::boolean, false),
    s.weergaven, s.sec, s.paginas, s.berekend, s.einde) order by l.received_at), '[]'::jsonb)
  from public.web_events l
  left join lateral (
    select count(*) filter (where e.event = 'page_view') as weergaven,
      coalesce(sum(least((e.props->>'sec')::numeric, 3600)) filter (where e.event = 'page_leave'), 0) as sec,
      (select jsonb_agg(x.page order by x.received_at) from public.web_events x where x.session_id = l.session_id and x.event = 'page_view') as paginas,
      bool_or(e.event = 'wizard_complete') as berekend,
      max(e.received_at) as einde
    from public.web_events e where l.session_id is not null and e.session_id = l.session_id
  ) s on true
  where l.event = 'page_view' and l.props->>'utm_source' = 'email' and l.received_at >= now() - interval '120 days';
$$;
revoke all on function public.dashboard_mail_landingen() from public, anon, authenticated;
grant execute on function public.dashboard_mail_landingen() to service_role;
