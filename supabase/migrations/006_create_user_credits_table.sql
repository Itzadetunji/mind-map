-- User Subscriptions and Credits System
-- Supports subscription tiers with monthly credit allowances + one-time credit purchases

-- Subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('free', 'hobby', 'pro');

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription
CREATE POLICY "Users can view own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscription record
CREATE POLICY "Users can insert own subscription" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- User credits table (tracks available credits)
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL DEFAULT 30, -- Free tier default
    monthly_credits_remaining INTEGER NOT NULL DEFAULT 30, -- Resets each billing cycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Enable Row Level Security
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own credits
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own credits record
CREATE POLICY "Users can insert own credits" ON user_credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own credits
CREATE POLICY "Users can update own credits" ON user_credits
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get monthly credit allowance based on tier
CREATE OR REPLACE FUNCTION get_tier_monthly_credits(tier subscription_tier)
RETURNS INTEGER AS $$
BEGIN
    CASE tier
        WHEN 'free' THEN RETURN 30;
        WHEN 'hobby' THEN RETURN 75;
        WHEN 'pro' THEN RETURN 150;
        ELSE RETURN 30;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to automatically create subscription and credits record for new users
CREATE OR REPLACE FUNCTION create_user_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Create free tier subscription
    INSERT INTO public.user_subscriptions (user_id, tier)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create credits with free tier default (30 credits)
    INSERT INTO public.user_credits (user_id, credits, monthly_credits_remaining)
    VALUES (NEW.id, 30, 30)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription and credits when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_subscription_on_signup();

-- Credit transaction history for auditing
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive for additions, negative for usage
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('initial', 'subscription', 'purchase', 'usage', 'bonus', 'refund', 'monthly_reset')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for credit transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Enable Row Level Security for transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to reset monthly credits (called by cron or on subscription renewal)
CREATE OR REPLACE FUNCTION reset_monthly_credits(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_tier subscription_tier;
    v_monthly_credits INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT tier INTO v_tier FROM user_subscriptions WHERE user_id = p_user_id;
    
    IF v_tier IS NULL THEN
        v_tier := 'free';
    END IF;
    
    -- Get monthly credit allowance for tier
    v_monthly_credits := get_tier_monthly_credits(v_tier);
    
    -- Reset monthly credits (add to existing purchased credits)
    UPDATE user_credits 
    SET monthly_credits_remaining = v_monthly_credits,
        credits = credits + v_monthly_credits
    WHERE user_id = p_user_id;
    
    -- Log transaction
    INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, v_monthly_credits, 'monthly_reset', 'Monthly credit allowance for ' || v_tier || ' tier');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
