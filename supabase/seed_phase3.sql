-- Seeds mock/placeholder CMS content for Phase 3 review, per project-plan.md
-- §10: "Only CMS-managed entities ... get mock seed rows, clearly labeled as
-- placeholder ... directly editable/replaceable from the dashboard once real
-- content is ready." Run after 0001_init.sql, 0002_phase3.sql, and seed.sql
-- (this depends on the bootstrap superAdmin existing, for insights.submitted_by).
--
-- Every title/name below carries "(Sample)" so nobody mistakes this for real
-- firm content in a screenshot or a demo.

-- ============ Practice Areas (6 — one per placeholder icon in ASSETS.practiceIcons) ============

insert into practice_areas (slug, title, short_description, icon_key, order_index, status, seo_title, seo_description) values
  ('litigation', 'Litigation & Dispute Resolution (Sample)', 'Representing clients in commercial and civil disputes before courts and tribunals.', 'litigation', 0, 'published', 'Litigation & Dispute Resolution (Sample)', 'Sample seed content — replace via /admin/practice-areas.'),
  ('corporate-commercial', 'Corporate & Commercial (Sample)', 'Advisory on incorporation, governance, contracts, and day-to-day commercial matters.', 'corporate_commercial', 1, 'published', null, null),
  ('banking-finance', 'Banking & Finance (Sample)', 'Structuring and documenting lending, security, and regulatory-compliance matters.', 'banking_finance', 2, 'published', null, null),
  ('arbitration-adr', 'Arbitration & ADR (Sample)', 'Domestic and cross-border arbitration, mediation, and alternative dispute resolution.', 'arbitration_adr', 3, 'draft', null, null),
  ('real-estate', 'Real Estate (Sample)', 'Due diligence, title verification, and transactional support for property matters.', 'real_estate', 4, 'published', null, null),
  ('white-collar', 'White Collar & Investigations (Sample)', 'Advisory and defense in regulatory and white-collar investigations.', 'white_collar', 5, 'published', null, null);

-- ============ Team Members (4) ============

insert into team_members (slug, name, designation, bio, email, order_index, status) values
  ('priya-sharma', 'Priya Sharma (Sample)', 'Senior Partner', null, 'priya.sharma@utkarsh-sample.internal', 0, 'published'),
  ('arjun-mehta', 'Arjun Mehta (Sample)', 'Partner', null, 'arjun.mehta@utkarsh-sample.internal', 1, 'published'),
  ('kavita-rao', 'Kavita Rao (Sample)', 'Senior Associate', null, 'kavita.rao@utkarsh-sample.internal', 2, 'published'),
  ('rohan-desai', 'Rohan Desai (Sample)', 'Associate', null, 'rohan.desai@utkarsh-sample.internal', 3, 'draft');

insert into team_practice_areas (team_member_id, practice_area_id)
select tm.id, pa.id from team_members tm, practice_areas pa
where (tm.slug, pa.slug) in (
  ('priya-sharma', 'litigation'),
  ('priya-sharma', 'arbitration-adr'),
  ('arjun-mehta', 'corporate-commercial'),
  ('arjun-mehta', 'banking-finance'),
  ('kavita-rao', 'real-estate'),
  ('rohan-desai', 'white-collar')
);

-- ============ Insight Categories ============

insert into insight_categories (name, slug) values
  ('Deals & Corporate (Sample)', 'deals-corporate'),
  ('Dispute Resolution (Sample)', 'dispute-resolution'),
  ('Regulatory Updates (Sample)', 'regulatory-updates'),
  ('Firm News (Sample)', 'firm-news');

-- ============ Insights (5 — one per status, plus one external_link, so the ============
-- ============ /admin/insights status tabs and the review workflow are all reviewable end-to-end) ============

insert into insights (slug, title, excerpt, cover_image_url, category_id, author_id, post_type, tags, status, submitted_by, published_at, seo_title, seo_description)
select
  'sample-published-insight',
  'Understanding Cross-Border M&A Structuring (Sample)',
  'A look at how cross-border deal structures are evolving for Indian-linked transactions.',
  null,
  (select id from insight_categories where slug = 'deals-corporate'),
  (select id from team_members where slug = 'arjun-mehta'),
  'original',
  array['m&a', 'cross-border'],
  'published',
  a.id,
  now() - interval '10 days',
  null, null
from admins a where a.login_id = 'superadmin@utkarsh.internal';

insert into insights (slug, title, excerpt, category_id, author_id, post_type, tags, status, submitted_by)
select
  'sample-draft-insight',
  'Draft: Recent Changes to Arbitration Procedure (Sample)',
  'Work-in-progress summary of recent procedural amendments.',
  (select id from insight_categories where slug = 'dispute-resolution'),
  (select id from team_members where slug = 'priya-sharma'),
  'original',
  array['arbitration'],
  'draft',
  a.id
from admins a where a.login_id = 'superadmin@utkarsh.internal';

insert into insights (slug, title, excerpt, category_id, author_id, post_type, tags, status, submitted_by)
select
  'sample-pending-review-insight',
  'Pending Review: New RBI Guidelines Explained (Sample)',
  'Submitted for editorial review — exercises the publish/reject workflow (§5.1).',
  (select id from insight_categories where slug = 'regulatory-updates'),
  (select id from team_members where slug = 'kavita-rao'),
  'original',
  array['banking', 'regulatory'],
  'pending_review',
  a.id
from admins a where a.login_id = 'superadmin@utkarsh.internal';

insert into insights (slug, title, excerpt, category_id, author_id, post_type, tags, status, rejection_note, submitted_by)
select
  'sample-rejected-insight',
  'Rejected Draft: Firm Anniversary Announcement (Sample)',
  'Kept as a sample so the rejected-state UI (status tab + rejection note banner) has something to show.',
  (select id from insight_categories where slug = 'firm-news'),
  (select id from team_members where slug = 'rohan-desai'),
  'original',
  '{}',
  'rejected',
  'Sample rejection note — needs a shorter headline and a quote from a partner before resubmitting.',
  a.id
from admins a where a.login_id = 'superadmin@utkarsh.internal';

insert into insights (slug, title, excerpt, category_id, author_id, post_type, external_url, source_name, tags, status, submitted_by, published_at)
select
  'sample-external-link-insight',
  'Partner Quoted in Bar & Bench (Sample)',
  'A sample external-link post (§5.5) — full content lives on the source site, this is the excerpt + outbound link.',
  (select id from insight_categories where slug = 'firm-news'),
  (select id from team_members where slug = 'priya-sharma'),
  'external_link',
  'https://www.barandbench.com/',
  'Bar & Bench',
  array['press'],
  'published',
  a.id,
  now() - interval '3 days'
from admins a where a.login_id = 'superadmin@utkarsh.internal';

-- ============ Offices (2) ============

insert into offices (name, address, city, phone, email, is_headquarters, order_index) values
  ('Delhi Office (Sample)', '123 Sample Marg, Connaught Place', 'New Delhi', '+91-11-0000-0000', 'delhi@utkarsh-sample.internal', true, 0),
  ('Mumbai Office (Sample)', '456 Sample Road, Nariman Point', 'Mumbai', '+91-22-0000-0000', 'mumbai@utkarsh-sample.internal', false, 1);
