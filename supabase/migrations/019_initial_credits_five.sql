-- Set initial user credits to 5 (on signup and when initializing via RPC)

-- 1. initialize_user_credits: give 5 credits when creating a row
CREATE OR REPLACE FUNCTION initialize_user_credits(p_user_id UUID)
RETURNS SETOF public.user_credits AS $$
DECLARE
    v_result public.user_credits%ROWTYPE;
BEGIN
    INSERT INTO public.user_credits (user_id, credits, monthly_credits_remaining)
    VALUES (p_user_id, 5, 5)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING * INTO v_result;

    IF v_result.id IS NOT NULL THEN
        RETURN NEXT v_result;
    ELSE
        RETURN QUERY
        SELECT * FROM public.user_credits uc
        WHERE uc.user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Signup trigger: new users get 5 credits
CREATE OR REPLACE FUNCTION create_user_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_subscriptions (user_id, tier)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_credits (user_id, credits, monthly_credits_remaining)
    VALUES (NEW.id, 5, 5)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
