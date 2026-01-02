-- Create donations table for public supporter wall
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Anyone can view public donations
CREATE POLICY "Anyone can view public donations"
ON public.donations
FOR SELECT
USING (is_public = true);

-- Anyone can insert donations (no auth required for PIX)
CREATE POLICY "Anyone can create donations"
ON public.donations
FOR INSERT
WITH CHECK (true);

-- Admins can manage all donations
CREATE POLICY "Admins can manage donations"
ON public.donations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));