-- Add approval and logo fields to advertisements
ALTER TABLE public.advertisements
	ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

ALTER TABLE public.advertisements
	ADD COLUMN IF NOT EXISTS logo_url text;

COMMENT ON COLUMN public.advertisements.approved IS 'Whether the advertisement is approved to display';
COMMENT ON COLUMN public.advertisements.logo_url IS 'Optional logo URL for the advertisement';
