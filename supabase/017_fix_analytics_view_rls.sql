-- Views created via migrations run as a privileged role, so by default they
-- evaluate RLS as the view's creator, not the querying user — silently
-- bypassing the "admins only" policy on analytics_events. security_invoker
-- makes the view re-check RLS as whoever is actually running the query.
alter view public.analytics_event_summary set (security_invoker = true);
alter view public.analytics_daily_summary set (security_invoker = true);
