-- 001_schema_patch.sql
-- Fix Missing Columns & Trigger Cache Reload

BEGIN;

-- 1. Fix Profiles (full_name)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

-- 2. Fix Noticias (created_at)
ALTER TABLE public.noticias 
ADD COLUMN IF NOT EXISTS created_at timestamptz default now();

-- 3. Ensure Consecutivos exists
CREATE TABLE IF NOT EXISTS public.consecutivos (
  id uuid default uuid_generate_v4() PRIMARY KEY,
  tabla text NOT NULL UNIQUE, 
  valor bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- 4. Enable RLS and Policies for Consecutivos (if created)
ALTER TABLE public.consecutivos ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consecutivos' AND policyname = 'Consecutivos readable') THEN
        CREATE POLICY "Consecutivos readable" ON consecutivos FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consecutivos' AND policyname = 'Consecutivos writable') THEN
        CREATE POLICY "Consecutivos writable" ON consecutivos FOR ALL USING (true);
    END IF;
END $$;

-- 5. Reload API Schema Cache
NOTIFY pgrst, 'reload config';

COMMIT;
