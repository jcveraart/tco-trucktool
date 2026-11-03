-- Bezoekersdashboard: bezoeken koppelen aan kliks uit de e-mailcampagne.
-- /m/ bewaart het token van de ontvanger in de browser; met statistiektoestemming
-- stuurt de site het mee in session_start (props.mail). Deze functie geeft het
-- dashboard daarnaast de kliks, verzendmomenten en bijbehorende contacten.

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
    'intern', coalesce((select jsonb_agg(i.visitor_id) from public.web_intern i), '[]'::jsonb),
    -- E-mail: kliks, verzendmomenten en de contacten die geklikt hebben of via een mail op de site kwamen
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
