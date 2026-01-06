-- Add game_id column to gallery table
ALTER TABLE public.gallery 
ADD COLUMN game_id uuid REFERENCES public.games(id) ON DELETE SET NULL;

-- Add game_id column to posts table
ALTER TABLE public.posts 
ADD COLUMN game_id uuid REFERENCES public.games(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_gallery_game_id ON public.gallery(game_id);
CREATE INDEX idx_posts_game_id ON public.posts(game_id);