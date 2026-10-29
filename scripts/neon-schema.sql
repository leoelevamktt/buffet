-- Esquema não destrutivo para o painel multiusuário do Buffet Akela.
CREATE TABLE IF NOT EXISTS buffet_workspace (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  revision bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT buffet_workspace_object CHECK(jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS buffet_login_attempts (
  ip text PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS buffet_users (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL CHECK (role IN ('admin','operador')),
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE TABLE IF NOT EXISTS buffet_sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES buffet_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_buffet_sessions_user ON buffet_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_buffet_sessions_expiry ON buffet_sessions(expires_at);

CREATE TABLE IF NOT EXISTS buffet_security_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event text NOT NULL,
  user_id uuid,
  ip text NOT NULL,
  user_agent text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_buffet_security_events_time ON buffet_security_events(created_at);

ALTER TABLE buffet_users ADD COLUMN IF NOT EXISTS mfa_secret text,
  ADD COLUMN IF NOT EXISTS mfa_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mfa_enabled_at timestamptz,
  ADD COLUMN IF NOT EXISTS mfa_last_counter bigint;
ALTER TABLE buffet_sessions ADD COLUMN IF NOT EXISTS mfa_version integer,
  ADD COLUMN IF NOT EXISTS mfa_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS master_unlocked_until timestamptz;

CREATE TABLE IF NOT EXISTS buffet_mfa_invitations (
  user_id uuid PRIMARY KEY REFERENCES buffet_users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  password_proof char(64) NOT NULL,
  mfa_version integer NOT NULL,
  created_by uuid REFERENCES buffet_users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS buffet_mfa_challenges (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES buffet_users(id) ON DELETE CASCADE,
  password_proof char(64) NOT NULL,
  mfa_version integer NOT NULL,
  stage text NOT NULL CHECK(stage IN ('invite','setup','verify')),
  auth_method text CHECK(auth_method IN ('invitation','recovery')),
  invitation_hash char(64), recovery_hash char(64), pending_secret text,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT buffet_mfa_pending_secret CHECK((stage='setup' AND pending_secret IS NOT NULL AND auth_method IS NOT NULL) OR (stage<>'setup' AND pending_secret IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_buffet_mfa_challenges_expiry ON buffet_mfa_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_buffet_mfa_challenges_user ON buffet_mfa_challenges(user_id);
CREATE TABLE IF NOT EXISTS buffet_mfa_recovery_codes (
  user_id uuid NOT NULL REFERENCES buffet_users(id) ON DELETE CASCADE,
  code_hash char(64) NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,code_hash)
);
