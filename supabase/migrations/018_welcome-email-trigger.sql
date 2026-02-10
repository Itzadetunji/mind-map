-- Welcome email trigger using pg_net + vault (with local-friendly fallbacks).
-- Prereqs in Supabase Dashboard > Database > Extensions:
--   - pg_net
--   - vault
-- Then add a secret named "service_role_key" in Vault.
-- For local/dev without Vault, set: ALTER DATABASE postgres SET app.service_role_key = '...';
-- Optional: ALTER DATABASE postgres SET app.welcome_email_url = 'https://.../functions/v1/welcome-email';

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION
  WHEN feature_not_supported THEN
    RAISE NOTICE 'pg_net extension not available in this Postgres instance.';
END $$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vault;
EXCEPTION
  WHEN feature_not_supported THEN
    RAISE NOTICE 'vault extension not available in this Postgres instance.';
END $$;

CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  edge_function_url text := COALESCE(
    current_setting('app.welcome_email_url', true),
    'https://hkvyxxzezsxyowjzzwlk.supabase.co/functions/v1/welcome-email'
  );
  service_role_key text;
  headers jsonb;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    EXECUTE 'SELECT vault.get_secret($1)'
      INTO service_role_key
      USING 'service_role_key';
  EXCEPTION
    WHEN undefined_function OR invalid_schema_name THEN
      service_role_key := current_setting('app.service_role_key', true);
  END;

  IF service_role_key IS NULL THEN
    RAISE WARNING 'Missing service role key (vault secret or app.service_role_key).';
    RETURN NEW;
  END IF;

  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || service_role_key,
    'apikey', service_role_key
  );

  payload := jsonb_build_object(
    'new', jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'user_metadata', NEW.raw_user_meta_data
    )
  );

  BEGIN
    PERFORM net.http_post(
      url => edge_function_url,
      headers => headers,
      body => payload
    );
  EXCEPTION
    WHEN undefined_function OR invalid_schema_name THEN
      RAISE WARNING 'pg_net not available; skipping welcome email call.';
      RETURN NEW;
  END;

  RAISE LOG 'Welcome email trigger called for user: %', NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send welcome email for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();
