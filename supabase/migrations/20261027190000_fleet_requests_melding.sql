-- Vlootanalyse: elke nieuwe aanvraag wordt naar info@stekkerofdiesel.nl gemaild (scripts/vlootmelding.mjs).
-- notified_at houdt bij welke aanvragen al gemaild zijn. Bezoekers kunnen deze kolom niet zetten of lezen.

alter table public.fleet_requests add column if not exists notified_at timestamptz;

create index if not exists fleet_requests_niet_gemeld on public.fleet_requests (created_at) where notified_at is null;

-- Bezoekers mogen alleen de formuliervelden invullen, niet status of notified_at.
revoke insert on public.fleet_requests from anon;
grant insert (company, contact_name, email, phone, fleet_size, message, calc_link) on public.fleet_requests to anon;
