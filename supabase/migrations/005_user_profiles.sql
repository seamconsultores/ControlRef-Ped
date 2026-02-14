-- Create enum for user roles
-- Updated based on new requirements: operativo, gerente/coordinador, director/admin, socio_comercial
CREATE TYPE user_role AS ENUM ('admin', 'director', 'gerente', 'coordinador', 'operativo', 'socio_comercial', 'cliente');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'operativo',
  full_name TEXT,
  rfc TEXT, -- For clients
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Public Read: Users can read their own profile
CREATE POLICY "Users can read own profile" 
  ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- 2. Management Read: Admins, Directors, Managers can read all profiles (to assign tasks/seals)
CREATE POLICY "Management can read all profiles" 
  ON profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'director', 'gerente', 'coordinador')
    )
  );

-- 3. Admin Update: Only Admins/Directors can update roles
CREATE POLICY "Admins can update profiles" 
  ON profiles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- 4. User Update: Users can update their own basic info
CREATE POLICY "Users can update own basic info" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id); 

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'operativo')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
