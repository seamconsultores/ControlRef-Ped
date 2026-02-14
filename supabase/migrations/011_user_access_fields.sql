-- Add access control fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS aduana_access TEXT,
ADD COLUMN IF NOT EXISTS patente_access TEXT;

-- Update the handle_new_user function to include these new fields
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, aduana_access, patente_access)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'operativo'),
    new.raw_user_meta_data->>'aduana_access',
    new.raw_user_meta_data->>'patente_access'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
