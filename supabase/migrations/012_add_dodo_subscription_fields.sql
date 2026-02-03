-- Add Dodo Payments fields to user_subscriptions and remove Stripe fields

ALTER TABLE public.user_subscriptions
	DROP COLUMN IF EXISTS stripe_customer_id,
	DROP COLUMN IF EXISTS stripe_subscription_id,
	ADD COLUMN IF NOT EXISTS dodo_customer_id text,
	ADD COLUMN IF NOT EXISTS dodo_subscription_id text;

DROP INDEX IF EXISTS idx_user_subscriptions_stripe_customer_id;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_dodo_customer_id
	ON public.user_subscriptions USING btree (dodo_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_dodo_subscription_id
	ON public.user_subscriptions USING btree (dodo_subscription_id);
