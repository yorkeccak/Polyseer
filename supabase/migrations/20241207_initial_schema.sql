-- Initial schema creation for Polyseer
-- Run this migration in your Supabase SQL editor

-- ============================================
-- 1. CREATE users TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Valyu OAuth metadata
  valyu_sub TEXT,
  valyu_user_type TEXT,
  valyu_organisation_id TEXT,
  valyu_organisation_name TEXT,

  -- Subscription info (legacy, kept for compatibility)
  subscription_tier TEXT DEFAULT 'valyu',
  subscription_status TEXT DEFAULT 'active'
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_valyu_sub ON public.users(valyu_sub);

-- ============================================
-- 2. CREATE analysis_sessions TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  -- Legacy column (kept for backward compatibility)
  polymarket_slug TEXT,

  -- Platform-agnostic columns
  market_url TEXT NOT NULL,
  platform TEXT DEFAULT 'polymarket',
  market_identifier TEXT NOT NULL,
  market_question TEXT,

  -- Analysis results
  forecast_result JSONB,
  analysis_steps JSONB,
  full_response TEXT,

  -- Metadata
  p0 NUMERIC(5, 4),
  p_neutral NUMERIC(5, 4),
  p_aware NUMERIC(5, 4),
  drivers JSONB,
  duration_seconds INTEGER,
  valyu_cost NUMERIC(10, 6) DEFAULT 0,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analysis_sessions
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON public.analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_platform ON public.analysis_sessions(platform);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_completed ON public.analysis_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_created_at ON public.analysis_sessions(created_at DESC);

-- ============================================
-- 3. CREATE featured_markets TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.featured_markets (
  id SERIAL PRIMARY KEY,

  -- Market identification
  slug TEXT NOT NULL,
  question TEXT NOT NULL,
  category TEXT,

  -- Platform-specific URLs
  polymarket_url TEXT NOT NULL,
  market_url TEXT, -- Generic market URL for multi-platform support
  platform TEXT DEFAULT 'polymarket',

  -- Market metadata
  volume BIGINT NOT NULL DEFAULT 0,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_odds JSONB,

  -- Display configuration
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for featured_markets
CREATE INDEX IF NOT EXISTS idx_featured_markets_is_active ON public.featured_markets(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_markets_sort_order ON public.featured_markets(sort_order);
CREATE INDEX IF NOT EXISTS idx_featured_markets_platform ON public.featured_markets(platform);
CREATE INDEX IF NOT EXISTS idx_featured_markets_slug ON public.featured_markets(slug);

-- ============================================
-- 4. CREATE triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for analysis_sessions table
DROP TRIGGER IF EXISTS update_analysis_sessions_updated_at ON public.analysis_sessions;
CREATE TRIGGER update_analysis_sessions_updated_at
    BEFORE UPDATE ON public.analysis_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for featured_markets table
DROP TRIGGER IF EXISTS update_featured_markets_updated_at ON public.featured_markets;
CREATE TRIGGER update_featured_markets_updated_at
    BEFORE UPDATE ON public.featured_markets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_markets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for analysis_sessions table
DROP POLICY IF EXISTS "Users can view own sessions" ON public.analysis_sessions;
CREATE POLICY "Users can view own sessions" ON public.analysis_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.analysis_sessions;
CREATE POLICY "Users can insert own sessions" ON public.analysis_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.analysis_sessions;
CREATE POLICY "Users can update own sessions" ON public.analysis_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.analysis_sessions;
CREATE POLICY "Users can delete own sessions" ON public.analysis_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for featured_markets table (public read access)
DROP POLICY IF EXISTS "Featured markets are publicly readable" ON public.featured_markets;
CREATE POLICY "Featured markets are publicly readable" ON public.featured_markets
    FOR SELECT USING (true);

-- ============================================
-- Summary of tables created:
-- ============================================
-- 1. users: User accounts with Valyu OAuth metadata
-- 2. analysis_sessions: Market analysis history
-- 3. featured_markets: Curated trending markets for homepage
--
-- All tables have:
-- - Proper indexes for performance
-- - Row Level Security (RLS) enabled
-- - Automatic updated_at timestamps
-- ============================================
