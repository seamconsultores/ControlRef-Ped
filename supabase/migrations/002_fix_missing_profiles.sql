-- 002_fix_missing_profiles.sql (CORREGIDO)
-- Fix issues with existing auth users not having a public.profiles row.

-- Insert missing profiles for users who already exist in auth.users
-- NOTE: We do NOT insert into 'full_name' because it is GENERATED ALWAYS.
INSERT INTO public.profiles (id, email, role, first_name, last_name)
SELECT 
    au.id, 
    au.email, 
    'admin', -- Force Admin role for existing dev users to avoid permission issues
    COALESCE(au.raw_user_meta_data->>'first_name', 'Usuario'),
    COALESCE(au.raw_user_meta_data->>'last_name', 'Rescatado')
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Verify
SELECT count(*) as fixed_profiles FROM public.profiles;
