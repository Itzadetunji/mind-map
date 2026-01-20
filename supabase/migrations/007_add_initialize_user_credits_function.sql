-- Add function to initialize user credits (bypasses RLS for server-side operations)
-- This function can be called from server-side code using the anon key

-- Use RETURNS SETOF instead of RETURNS TABLE to avoid column name conflicts
CREATE OR REPLACE FUNCTION initialize_user_credits(p_user_id UUID)
RETURNS SETOF public.user_credits AS $$
DECLARE
    v_result public.user_credits%ROWTYPE;
BEGIN
    -- Try to insert credits with free tier default (30 credits)
    INSERT INTO public.user_credits (user_id, credits, monthly_credits_remaining)
    VALUES (p_user_id, 30, 30)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING * INTO v_result;
    
    -- If insert succeeded, return the new row
    IF v_result.id IS NOT NULL THEN
        RETURN NEXT v_result;
    ELSE
        -- If insert failed due to conflict, return the existing row
        RETURN QUERY
        SELECT * FROM public.user_credits uc
        WHERE uc.user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION initialize_user_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_credits(UUID) TO anon;

-- Function to deduct credits (bypasses RLS for server-side operations)
-- This function can be called from server-side code using the anon key
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
    
    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, -p_amount, 'usage', p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT) TO anon;
