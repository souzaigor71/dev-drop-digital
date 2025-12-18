-- Add game_id to coupons for game-specific coupons
ALTER TABLE public.coupons ADD COLUMN game_id uuid REFERENCES public.games(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_coupons_game_id ON public.coupons(game_id);