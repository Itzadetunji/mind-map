-- Alternative simpler approach: Use Supabase's built-in HTTP function
-- This requires the http extension to be enabled in your Supabase project

-- Enable http extension (if available)
-- Note: You may need to enable this in Supabase Dashboard > Database > Extensions
-- CREATE EXTENSION IF NOT EXISTS http;

-- Create a function that calls the welcome-email Edge Function via HTTP
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  edge_function_url text;
BEGIN
  -- Your Supabase project URL
  edge_function_url := 'https://hkvyxxzezsxyowjzzwlk.supabase.co/functions/v1/welcome-email';

  -- Build the payload in the format expected by the Edge Function
  payload := jsonb_build_object(
    'new', jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'user_metadata', NEW.raw_user_meta_data
    )
  );

  -- Call the Edge Function via HTTP
  -- Note: This uses the http extension. If pg_net is available, use that instead.
  -- For pg_net, use: PERFORM net.http_post(...)
  PERFORM http_post(
    edge_function_url,
    payload::text,
    'application/json'
  );

  RAISE LOG 'Welcome email trigger called for user: %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to send welcome email for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();
