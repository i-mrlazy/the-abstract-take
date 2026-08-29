-- ==============================================================================
-- THE ABSTRACT TAKE — HARDENED LEAST-PRIVILEGE DATABASE PERMISSIONS
-- Safe to execute multiple times on existing Supabase projects.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SCHEMA USAGE GRANTS
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. FUNCTION EXECUTION GRANTS
-- ------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.is_admin() TO postgres, anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. RESET / CLEAN PREVIOUS TABLE PRIVILEGES FOR CLIENT ROLES
-- ------------------------------------------------------------------------------
REVOKE ALL ON TABLE 
  profiles, 
  reviews, 
  recommendation_lists, 
  what_to_watch_next, 
  comments, 
  newsletter_subscribers, 
  site_settings, 
  tags 
FROM anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. SERVICE ROLE & POSTGRES PRIVILEGES (Full Backend CRUD Access)
-- ------------------------------------------------------------------------------
GRANT ALL ON TABLE profiles TO postgres, service_role;
GRANT ALL ON TABLE reviews TO postgres, service_role;
GRANT ALL ON TABLE recommendation_lists TO postgres, service_role;
GRANT ALL ON TABLE what_to_watch_next TO postgres, service_role;
GRANT ALL ON TABLE comments TO postgres, service_role;
GRANT ALL ON TABLE newsletter_subscribers TO postgres, service_role;
GRANT ALL ON TABLE site_settings TO postgres, service_role;
GRANT ALL ON TABLE tags TO postgres, service_role;

-- ------------------------------------------------------------------------------
-- 5. LEAST-PRIVILEGE CLIENT ROLE GRANTS (Governed by RLS Policies)
-- ------------------------------------------------------------------------------

-- Profiles: Public can view, authenticated can update own profile
GRANT SELECT ON TABLE profiles TO anon;
GRANT SELECT, UPDATE ON TABLE profiles TO authenticated;

-- Reviews: Public read-only for published content
GRANT SELECT ON TABLE reviews TO anon, authenticated;

-- Recommendation Lists: Public read-only
GRANT SELECT ON TABLE recommendation_lists TO anon, authenticated;

-- What to Watch Next: Public read-only
GRANT SELECT ON TABLE what_to_watch_next TO anon, authenticated;

-- Comments: Public can read and submit comments
GRANT SELECT, INSERT ON TABLE comments TO anon, authenticated;

-- Newsletter Subscribers: Public can ONLY insert/subscribe (NO SELECT to protect emails)
GRANT INSERT ON TABLE newsletter_subscribers TO anon, authenticated;

-- Site Settings: Public read-only
GRANT SELECT ON TABLE site_settings TO anon, authenticated;

-- Tags: Public read-only
GRANT SELECT ON TABLE tags TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 6. SEQUENCES & DEFAULT PRIVILEGES
-- NOTE: In PostgreSQL, ALTER DEFAULT PRIVILEGES applies ONLY to objects created
-- in the future by the target role (e.g. postgres). It does not universally grant
-- access to objects created by arbitrary roles.
-- Future tables must receive explicit GRANT statements upon creation.
-- No automatic client-role privileges (anon/authenticated) are granted for future tables.
-- ------------------------------------------------------------------------------
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;

-- ------------------------------------------------------------------------------
-- 7. PERMISSION VERIFICATION QUERY
-- ------------------------------------------------------------------------------
SELECT 
  table_name, 
  grantee, 
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS granted_privileges
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND grantee IN ('service_role', 'anon', 'authenticated')
  AND table_name IN (
    'profiles', 
    'reviews', 
    'recommendation_lists', 
    'what_to_watch_next', 
    'comments', 
    'newsletter_subscribers', 
    'site_settings', 
    'tags'
  )
GROUP BY table_name, grantee
ORDER BY table_name, grantee;
