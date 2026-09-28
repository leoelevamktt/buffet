-- Esquema não destrutivo. O conteúdo administrativo permanece privado na API.
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
