-- Migration: Platform-agnostic schema for multi-platform support (Polymarket, Kalshi, etc.)
-- Run this migration in your Supabase SQL editor

-- ============================================
-- 1. UPDATE analysis_sessions TABLE
-- ============================================

-- Add new platform-agnostic columns
ALTER TABLE public.analysis_sessions
  ADD COLUMN IF NOT EXISTS market_url TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS market_identifier TEXT,
  ADD COLUMN IF NOT EXISTS valyu_cost NUMERIC(10, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrate existing polymarket_slug data to new columns
UPDATE public.analysis_sessions
SET
  market_url = CASE
    WHEN polymarket_slug LIKE 'http%' THEN polymarket_slug
    ELSE 'https://polymarket.com/event/' || polymarket_slug
  END,
  platform = 'polymarket',
  market_identifier = CASE
    WHEN polymarket_slug LIKE '%polymarket.com%' THEN
      REGEXP_REPLACE(polymarket_slug, '^.*polymarket\.com/event/', '')
    ELSE polymarket_slug
  END
WHERE market_url IS NULL AND polymarket_slug IS NOT NULL;

-- Make polymarket_slug nullable (keeping for backward compatibility during transition)
ALTER TABLE public.analysis_sessions
  ALTER COLUMN polymarket_slug DROP NOT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_platform ON public.analysis_sessions(platform);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_completed ON public.analysis_sessions(user_id, completed_at DESC);

-- ============================================
-- 2. UPDATE users TABLE (remove Polar billing)
-- ============================================

-- Remove Polar-specific columns (optional - you can keep them for historical data)
-- Uncomment these lines if you want to drop the columns:
-- ALTER TABLE public.users DROP COLUMN IF EXISTS polar_customer_id;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_tier;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_status;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS analyses_remaining;

-- For now, just update default values to reflect no more billing tiers
ALTER TABLE public.users
  ALTER COLUMN subscription_tier SET DEFAULT 'valyu',
  ALTER COLUMN subscription_status SET DEFAULT 'active';

-- Update existing users to reflect new system
UPDATE public.users
SET
  subscription_tier = 'valyu',
  subscription_status = 'active',
  updated_at = NOW()
WHERE subscription_tier IN ('free', 'pro') OR subscription_status = 'inactive';

-- ============================================
-- 3. UPDATE featured_markets TABLE for multi-platform
-- ============================================

-- Add platform column to featured_markets
ALTER TABLE public.featured_markets
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'polymarket',
  ADD COLUMN IF NOT EXISTS market_url TEXT;

-- Migrate existing polymarket_url to market_url
UPDATE public.featured_markets
SET market_url = polymarket_url
WHERE market_url IS NULL AND polymarket_url IS NOT NULL;

-- Add index for platform filtering
CREATE INDEX IF NOT EXISTS idx_featured_markets_platform ON public.featured_markets(platform);

-- ============================================
-- 4. Create trigger for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to analysis_sessions if not exists
DROP TRIGGER IF EXISTS update_analysis_sessions_updated_at ON public.analysis_sessions;
CREATE TRIGGER update_analysis_sessions_updated_at
    BEFORE UPDATE ON public.analysis_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to users if not exists
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Summary of changes:
-- ============================================
-- analysis_sessions:
--   - Added: market_url, platform, market_identifier, valyu_cost, error_message, updated_at
--   - Modified: polymarket_slug is now nullable
--   - Data migrated from polymarket_slug to new columns
--
-- users:
--   - Defaults changed to 'valyu' tier and 'active' status
--   - Existing users updated to new system
--
-- featured_markets:
--   - Added: platform, market_url columns
--   - Data migrated from polymarket_url to market_url
-- ============================================
