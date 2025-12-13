-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  file_url TEXT,
  file_size TEXT,
  genre TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gallery table for photos and videos
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Create has_role function for admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User roles policies  
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Games policies - public read, admin write
CREATE POLICY "Anyone can view games" ON public.games
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage games" ON public.games
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Gallery policies - public read, admin write
CREATE POLICY "Anyone can view gallery" ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage gallery" ON public.gallery
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for profiles on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create storage buckets for games and gallery
INSERT INTO storage.buckets (id, name, public) VALUES ('games', 'games', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Storage policies
CREATE POLICY "Anyone can view game files" ON storage.objects
  FOR SELECT USING (bucket_id = 'games');

CREATE POLICY "Admins can upload game files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'games' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update game files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'games' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete game files" ON storage.objects
  FOR DELETE USING (bucket_id = 'games' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view gallery files" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update gallery files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gallery files" ON storage.objects
  FOR DELETE USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));