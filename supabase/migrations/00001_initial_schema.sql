-- ============================================================================
-- LoopMagic Database Schema
-- Initial migration: profiles, properties, analyses tables with RLS
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Profiles Table (extends Supabase Auth users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Properties Table (scraped property data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- LoopNet reference
  loopnet_url TEXT NOT NULL,
  listing_id TEXT,

  -- Basic info
  property_name TEXT,
  address JSONB NOT NULL, -- { streetAddress, city, state, zipCode, fullAddress }

  -- Financial
  price NUMERIC,
  price_per_unit NUMERIC,
  price_per_sf NUMERIC,
  cap_rate TEXT,
  noi NUMERIC,
  gross_income NUMERIC,

  -- Property details
  property_type TEXT,
  property_subtype TEXT,
  building_size NUMERIC,
  units INTEGER,
  year_built INTEGER,
  year_renovated INTEGER,
  building_class TEXT,

  -- Full raw data
  raw_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS properties_user_id_idx ON properties(user_id);
CREATE INDEX IF NOT EXISTS properties_loopnet_url_idx ON properties(loopnet_url);

-- ============================================================================
-- Analyses Table (analysis results)
-- ============================================================================

CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Analysis inputs
  assumptions JSONB NOT NULL, -- FinalAssumptions

  -- Analysis outputs
  excel_metrics JSONB, -- ExcelMetrics from generated Excel
  deal_analysis JSONB, -- DealAnalysis from Claude

  -- File storage
  excel_file_path TEXT, -- Path in Supabase Storage

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  error_message TEXT,

  -- Performance metrics
  scrape_duration_ms INTEGER,
  cleaner_duration_ms INTEGER,
  analysis_duration_ms INTEGER,
  total_duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON analyses(user_id);
CREATE INDEX IF NOT EXISTS analyses_property_id_idx ON analyses(property_id);
CREATE INDEX IF NOT EXISTS analyses_status_idx ON analyses(status);
CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON properties
  FOR DELETE USING (auth.uid() = user_id);

-- Analyses policies
CREATE POLICY "Users can view own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON analyses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Updated At Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Storage Bucket Setup (run in Supabase dashboard or via API)
-- ============================================================================

-- Note: Run this in Supabase SQL Editor or dashboard:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('excel-files', 'excel-files', false);
--
-- CREATE POLICY "Users can upload their own files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'excel-files' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can view their own files"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'excel-files' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can delete their own files"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'excel-files' AND auth.uid()::text = (storage.foldername(name))[1]);
