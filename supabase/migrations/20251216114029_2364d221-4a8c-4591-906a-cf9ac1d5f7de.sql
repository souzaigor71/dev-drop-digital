-- Create posts table for text publications
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Admins can manage posts
CREATE POLICY "Admins can manage posts"
ON public.posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view posts
CREATE POLICY "Anyone can view posts"
ON public.posts
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();