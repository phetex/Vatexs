-- Aggregated views for the admin analytics dashboard. Plain views (not
-- security definer) so they run with the querying user's own row security
-- on analytics_events — only admins get rows back, everyone else gets none.

create or replace view public.analytics_event_summary as
select event_name, count(*) as event_count, count(distinct anon_id) as unique_devices
from public.analytics_events
group by event_name
order by event_count desc;

create or replace view public.analytics_daily_summary as
select date_trunc('day', created_at)::date as day, count(*) as event_count, count(distinct anon_id) as unique_devices
from public.analytics_events
group by 1
order by 1 desc
limit 30;
