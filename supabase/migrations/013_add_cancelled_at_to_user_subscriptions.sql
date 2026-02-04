-- Add cancelled_at column to user_subscriptions table

ALTER TABLE public.user_subscriptions
	ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

COMMENT ON COLUMN public.user_subscriptions.cancelled_at IS 'Timestamp when the subscription was cancelled';
