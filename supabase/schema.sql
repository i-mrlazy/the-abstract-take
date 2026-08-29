-- ==============================================================================
-- THE ABSTRACT TAKE — PRODUCTION POSTGRESQL DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL with Supabase Auth & RLS
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES & USER ROLES (Linked to Supabase Auth auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT UNIQUE, -- References auth.users(id) in Supabase
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ------------------------------------------------------------------------------
-- 2. REVIEWS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  original_title TEXT,
  type TEXT NOT NULL CHECK (type IN ('Movie', 'Series', 'Mini Series', 'Anime', 'Documentary', 'Special')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'scheduled', 'archived')),
  release_year INTEGER NOT NULL,
  director TEXT NOT NULL DEFAULT '',
  cast_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  runtime TEXT NOT NULL DEFAULT '2h 00m',
  genres JSONB NOT NULL DEFAULT '[]'::jsonb,
  poster_url TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  poster_alt TEXT,
  banner_alt TEXT,
  abstract_score INTEGER NOT NULL CHECK (abstract_score >= 1 AND abstract_score <= 100),
  my_take TEXT NOT NULL,
  streaming_platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  pros JSONB NOT NULL DEFAULT '[]'::jsonb,
  cons JSONB NOT NULL DEFAULT '[]'::jsonb,
  verdict_text TEXT NOT NULL,
  should_you_watch TEXT NOT NULL DEFAULT 'Must Watch' CHECK (should_you_watch IN ('Must Watch', 'Recommended', 'For Fans', 'Skip')),
  long_form_review TEXT NOT NULL,
  spoiler_free_take TEXT,
  spoiler_section TEXT,
  favorite_scene TEXT NOT NULL DEFAULT '',
  favorite_quote TEXT NOT NULL DEFAULT '',
  publish_date TEXT NOT NULL,
  scheduled_date TEXT,
  updated_date TEXT,
  author_name TEXT NOT NULL DEFAULT 'The Abstract Take',
  author_title TEXT NOT NULL DEFAULT 'Editor-in-Chief & Film Critic',
  author_avatar_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Movies',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  views_count INTEGER NOT NULL DEFAULT 1,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes INTEGER NOT NULL DEFAULT 3,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_latest_take BOOLEAN NOT NULL DEFAULT false,
  is_editor_pick BOOLEAN NOT NULL DEFAULT false,
  is_hidden_gem BOOLEAN NOT NULL DEFAULT false,
  synopsis TEXT,
  trailer_url TEXT,
  language TEXT,
  country TEXT,
  seo_meta_title TEXT,
  seo_meta_description TEXT,
  seo_keywords JSONB DEFAULT '[]'::jsonb,
  seo_og_image TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'google_sheets_automation')),
  automation_row_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_slug ON reviews(slug);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(type);
CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews(category);
CREATE INDEX IF NOT EXISTS idx_reviews_publish_date ON reviews(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_abstract_score ON reviews(abstract_score DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_automation_row ON reviews(automation_row_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_is_latest ON reviews(is_latest_take);

-- ------------------------------------------------------------------------------
-- 3. RECOMMENDATION LISTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendation_lists (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  category TEXT NOT NULL DEFAULT 'Personal Favorites',
  description TEXT NOT NULL,
  curator_name TEXT NOT NULL DEFAULT 'The Abstract Take',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_date TEXT NOT NULL,
  reads_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_lists_slug ON recommendation_lists(slug);
CREATE INDEX IF NOT EXISTS idx_rec_lists_category ON recommendation_lists(category);

-- ------------------------------------------------------------------------------
-- 4. WHAT TO WATCH NEXT TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS what_to_watch_next (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Movie',
  release_year INTEGER NOT NULL,
  director TEXT NOT NULL DEFAULT '',
  poster_url TEXT NOT NULL,
  banner_url TEXT,
  abstract_score INTEGER NOT NULL,
  mood_tag TEXT NOT NULL,
  personal_commentary TEXT NOT NULL,
  where_to_watch TEXT NOT NULL,
  publish_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'scheduled')),
  scheduled_date TEXT,
  ready_for_newsletter BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. COMMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  review_title TEXT,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  likes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'hidden')),
  reply_to_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_comments_review_id ON comments(review_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- ------------------------------------------------------------------------------
-- 6. NEWSLETTER SUBSCRIBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  preference TEXT NOT NULL DEFAULT 'all'
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON newsletter_subscribers(status);

-- ------------------------------------------------------------------------------
-- 7. SITE SETTINGS TABLE (Single Row Configuration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_settings',
  site_title TEXT NOT NULL,
  site_tagline TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_bio TEXT NOT NULL,
  creator_avatar TEXT NOT NULL,
  twitter_url TEXT NOT NULL,
  letterboxd_url TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  default_og_image TEXT NOT NULL,
  analytics_id TEXT NOT NULL,
  newsletter_headline TEXT NOT NULL,
  newsletter_subheadline TEXT NOT NULL,
  enable_comments BOOLEAN NOT NULL DEFAULT true,
  auto_approve_comments BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. TAGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & ACCESS CONTROL ARCHITECTURE
-- ==============================================================================

-- Helper function to check if current Supabase Auth user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid()::text AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_to_watch_next ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL USING (public.is_admin());

-- 2. Reviews Policies
CREATE POLICY "Published reviews are viewable by everyone" ON reviews
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins have full access to reviews" ON reviews
  FOR ALL USING (public.is_admin());

-- 3. Recommendation Lists Policies
CREATE POLICY "Published recommendation lists are viewable by everyone" ON recommendation_lists
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins have full access to recommendation lists" ON recommendation_lists
  FOR ALL USING (public.is_admin());

-- 4. What To Watch Next Policies
CREATE POLICY "Published what to watch items are viewable by everyone" ON what_to_watch_next
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins have full access to what to watch items" ON what_to_watch_next
  FOR ALL USING (public.is_admin());

-- 5. Comments Policies
CREATE POLICY "Approved comments are viewable by everyone" ON comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can submit a comment" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins have full access to comments" ON comments
  FOR ALL USING (public.is_admin());

-- 6. Newsletter Subscribers Policies
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view and manage subscribers" ON newsletter_subscribers
  FOR ALL USING (public.is_admin());

-- 7. Site Settings Policies
CREATE POLICY "Site settings are readable by everyone" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update site settings" ON site_settings
  FOR ALL USING (public.is_admin());

-- 8. Tags Policies
CREATE POLICY "Tags are readable by everyone" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (public.is_admin());
