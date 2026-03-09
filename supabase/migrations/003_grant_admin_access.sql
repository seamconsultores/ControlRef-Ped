-- 003_grant_admin_access.sql
-- Assign Default Access to 'Admin' and 'Rescued' users

-- 1. Give everyone access to '240' (Nuevo Laredo) and '3834' (Patente Base)
UPDATE public.profiles
SET 
    access_aduanas = COALESCE(access_aduanas, '{}') || '{240}',
    access_patentes = COALESCE(access_patentes, '{}') || '{3834}',
    aduana = '240',
    patente = '3834'
WHERE 
    role IN ('admin', 'director') 
    AND NOT ('240' = ANY(access_aduanas)); -- Only update if missing

-- 2. Verify Result
SELECT email, role, access_aduanas, access_patentes FROM public.profiles;
