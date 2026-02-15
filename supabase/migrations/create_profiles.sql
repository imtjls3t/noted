-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin gets full access
CREATE POLICY "Admin full access" ON profiles
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'usual-polo-uphill@duck.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'usual-polo-uphill@duck.com');

-- Users can read their own profile
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Seed existing users
INSERT INTO profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Mark existing premium user
UPDATE profiles SET is_premium = true WHERE email = 'usual-polo-uphill@duck.com';
