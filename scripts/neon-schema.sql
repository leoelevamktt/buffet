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
