ALTER TABLE buffet_mfa_challenges
  ADD COLUMN IF NOT EXISTS email_code_hash char(64),
  ADD COLUMN IF NOT EXISTS setup_session_hash char(64),
  DROP CONSTRAINT IF EXISTS buffet_mfa_challenges_stage_check,
  DROP CONSTRAINT IF EXISTS buffet_mfa_challenges_auth_method_check,
  ADD CONSTRAINT buffet_mfa_challenges_stage_check CHECK (stage IN ('invite','setup','verify','email')),
  ADD CONSTRAINT buffet_mfa_challenges_auth_method_check CHECK (auth_method IN ('invitation','recovery','profile')),
  DROP CONSTRAINT IF EXISTS buffet_mfa_challenges_email_code_check,
  ADD CONSTRAINT buffet_mfa_challenges_email_code_check CHECK ((stage='email') = (email_code_hash IS NOT NULL)),
  DROP CONSTRAINT IF EXISTS buffet_mfa_challenges_setup_session_check,
  ADD CONSTRAINT buffet_mfa_challenges_setup_session_check CHECK ((auth_method IS NOT DISTINCT FROM 'profile') = (setup_session_hash IS NOT NULL));
