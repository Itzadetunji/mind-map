-- Remove credit transactions table and update functions to stop using it

-- Drop the table
DROP TABLE IF EXISTS credit_transactions CASCADE;

-- Update deduct_credits function to remove transaction logging
CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT 'Credit usage'
)
RETURNS VOID AS $$
DECLARE
    v_current_credits INTEGER;
BEGIN
    -- Get current credits using table alias to be explicit
    SELECT uc.credits INTO v_current_credits
    FROM public.user_credits uc
    WHERE uc.user_id = p_user_id;
    
    -- Check if user has enough credits
    IF v_current_credits IS NULL THEN
        RAISE EXCEPTION 'User credits record not found';
    END IF;
    
    IF v_current_credits < p_amount THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;
    
    -- Deduct credits using table alias
    UPDATE public.user_credits uc
    SET credits = uc.credits - p_amount
    WHERE uc.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update reset_monthly_credits function to remove transaction logging
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
