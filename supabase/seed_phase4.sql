-- Phase 4 addendum — optional, run after seed.sql + seed_phase3.sql.
--
-- Purely a demo-data convenience: links the one existing sample insight
-- that naturally fits a practice area ("Understanding Cross-Border M&A
-- Structuring (Sample)", category "Deals & Corporate") to the "Corporate &
-- Commercial (Sample)" practice area, so the new "Related Insights" section
-- on that practice area's public page has something to show without
-- needing a manual edit first. Everything else in seed_phase3.sql is
-- untouched — this is a single UPDATE, not a new insert, and safe to skip
-- entirely if you'd rather assign these by hand from /admin/insights.

update insights
set practice_area_id = (select id from practice_areas where slug = 'corporate-commercial')
where slug = 'sample-published-insight';
