-- Migration: Update daily credits to be subscription-based
-- Users only get credits if they have an active subscription
-- Hobby: 5 daily credits, max 30/month, 35 initial on subscription
-- Pro: 5 daily credits, max 150/month, 70 initial on subscription

-- Add last_daily_credit_claimed_at column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_credits' AND column_name = 'last_daily_credit_claimed_at'
  ) THEN
    ALTER TABLE user_credits ADD COLUMN last_daily_credit_claimed_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Add monthly_credits_used column to track credits claimed this billing period
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_credits' AND column_name = 'monthly_credits_used'
  ) THEN
    ALTER TABLE user_credits ADD COLUMN monthly_credits_used int DEFAULT 0;
  END IF;
END $$;

-- Function to claim daily credits based on subscription
-- p_timezone: IANA timezone string (e.g. 'America/New_York')
CREATE OR REPLACE FUNCTION claim_daily_credits(p_user_id uuid, p_timezone text DEFAULT 'UTC')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription record;
  v_credits record;
  v_last_claimed timestamptz;
  v_days_elapsed int;
  v_daily_amount int := 5; -- 5 credits per day for both tiers
  v_monthly_max int;
  v_credits_to_add int := 0;
  v_updated_credits int;
  v_subscription_start date;
  v_subscription_end date;
  v_today date;
  v_claim_start_date date;
  v_monthly_used int;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- No subscription record found
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'No subscription found', 'added', 0);
  END IF;

  -- Check if user has a paid subscription (hobby or pro)
  IF v_subscription.tier = 'free' OR v_subscription.tier IS NULL THEN
    RETURN json_build_object('success', true, 'message', 'Free tier - no daily credits', 'added', 0);
  END IF;

  -- Check if subscription is active (has valid period)
  IF v_subscription.current_period_start IS NULL OR v_subscription.current_period_end IS NULL THEN
    RETURN json_build_object('success', true, 'message', 'Subscription period not set', 'added', 0);
  END IF;

  -- Calculate today in user's timezone
  v_today := (now() AT TIME ZONE p_timezone)::date;
  v_subscription_start := (v_subscription.current_period_start AT TIME ZONE p_timezone)::date;
  v_subscription_end := (v_subscription.current_period_end AT TIME ZONE p_timezone)::date;

  -- Check if subscription has expired
  IF v_today > v_subscription_end THEN
    RETURN json_build_object('success', true, 'message', 'Subscription expired', 'added', 0);
  END IF;

  -- Set monthly max based on tier
  IF v_subscription.tier = 'hobby' THEN
    v_monthly_max := 30;
  ELSIF v_subscription.tier = 'pro' THEN
    v_monthly_max := 150;
  ELSE
    v_monthly_max := 0;
  END IF;

  -- Get user's credit record
  SELECT * INTO v_credits
  FROM user_credits
  WHERE user_id = p_user_id;

  -- If no credit record, create one
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits, monthly_credits_remaining, monthly_credits_used, last_daily_credit_claimed_at)
    VALUES (p_user_id, 0, 0, 0, NULL)
    RETURNING * INTO v_credits;
  END IF;

  v_last_claimed := v_credits.last_daily_credit_claimed_at;
  v_monthly_used := COALESCE(v_credits.monthly_credits_used, 0);

  -- Determine the start date for counting days
  -- If never claimed, start from subscription start date
  -- If last claimed before current subscription period, start from subscription start
  IF v_last_claimed IS NULL THEN
    v_claim_start_date := v_subscription_start;
  ELSE
    v_claim_start_date := GREATEST(
      (v_last_claimed AT TIME ZONE p_timezone)::date + 1, -- Day after last claim
      v_subscription_start -- Or subscription start if that's later (new period)
    );
  END IF;

  -- Reset monthly_credits_used if we're in a new billing period
  IF v_last_claimed IS NOT NULL AND (v_last_claimed AT TIME ZONE p_timezone)::date < v_subscription_start THEN
    v_monthly_used := 0;
  END IF;

  -- Calculate days eligible for credits (from claim_start_date to today, inclusive of today)
  v_days_elapsed := v_today - v_claim_start_date + 1;
  
  -- If already claimed today or in the future relative to subscription, no credits
  IF v_days_elapsed <= 0 THEN
    RETURN json_build_object('success', true, 'message', 'Already claimed today', 'added', 0, 'new_total', v_credits.credits);
  END IF;

  -- Calculate potential credits
  v_credits_to_add := v_days_elapsed * v_daily_amount;

  -- Cap at monthly max minus what's already been used this month
  IF (v_monthly_used + v_credits_to_add) > v_monthly_max THEN
    v_credits_to_add := GREATEST(0, v_monthly_max - v_monthly_used);
  END IF;

  -- If nothing to add (hit monthly cap)
  IF v_credits_to_add <= 0 THEN
    RETURN json_build_object('success', true, 'message', 'Monthly credit limit reached', 'added', 0, 'new_total', v_credits.credits, 'monthly_used', v_monthly_used, 'monthly_max', v_monthly_max);
  END IF;

  -- Update credits
  UPDATE user_credits
  SET 
    credits = credits + v_credits_to_add,
    monthly_credits_used = v_monthly_used + v_credits_to_add,
    last_daily_credit_claimed_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_updated_credits;

  RETURN json_build_object(
    'success', true, 
    'added', v_credits_to_add, 
    'new_total', v_updated_credits, 
    'days', v_days_elapsed,
    'monthly_used', v_monthly_used + v_credits_to_add,
    'monthly_max', v_monthly_max
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error and return graceful failure
  RAISE NOTICE 'Error in claim_daily_credits: %', SQLERRM;
  RETURN json_build_object('success', false, 'message', 'An error occurred', 'added', 0);
END;
$$;

-- Function to initialize credits upon subscription
-- Called when a user subscribes to a plan
CREATE OR REPLACE FUNCTION initialize_subscription_credits(p_user_id uuid, p_tier text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_initial_credits int;
  v_updated_credits int;
BEGIN
  -- Set initial credits based on tier
  IF p_tier = 'hobby' THEN
    v_initial_credits := 35;
  ELSIF p_tier = 'pro' THEN
    v_initial_credits := 70;
  ELSE
    RETURN json_build_object('success', false, 'message', 'Invalid tier');
  END IF;

  -- Upsert user credits
  INSERT INTO user_credits (user_id, credits, monthly_credits_remaining, monthly_credits_used, last_daily_credit_claimed_at)
  VALUES (p_user_id, v_initial_credits, 0, 0, now())
  ON CONFLICT (user_id) DO UPDATE SET
    credits = user_credits.credits + v_initial_credits,
    monthly_credits_used = 0, -- Reset monthly counter for new subscription
    last_daily_credit_claimed_at = now(),
    updated_at = now()
  RETURNING credits INTO v_updated_credits;

  RETURN json_build_object('success', true, 'initial_credits', v_initial_credits, 'new_total', v_updated_credits);
END;
$$;
