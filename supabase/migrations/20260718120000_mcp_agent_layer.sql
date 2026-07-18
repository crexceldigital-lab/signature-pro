-- ============================================================
-- MCP Agent Layer: API keys, per-role tool permissions,
-- audit log, and usage quotas.
-- ============================================================

-- API keys agents use to call POST /api/mcp (hash stored, never the key)
CREATE TABLE public.mcp_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,          -- first 12 chars, for display: sfk_ab12cd34
  key_hash TEXT NOT NULL UNIQUE,     -- sha256 hex of full key
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mcp_keys_org ON public.mcp_api_keys(org_id);

-- Which roles may call which tools. Absence of a row = allowed (default-open),
-- a row with allowed=false blocks. Admin/owner are always allowed.
CREATE TABLE public.mcp_tool_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                -- owner/admin/marketing/hr/employee/agent
  tool TEXT NOT NULL,                -- e.g. list_employees
  allowed BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(org_id, role, tool)
);

-- Every MCP tool call (from agents via API key, or users via the test console)
CREATE TABLE public.mcp_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.mcp_api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor TEXT NOT NULL,               -- key name or user email
  tool TEXT NOT NULL,
  input_summary TEXT,
  status TEXT NOT NULL,              -- ok | denied | rate_limited | error
  result_summary TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mcp_audit_org_time ON public.mcp_audit_logs(org_id, created_at DESC);

-- Per-org quotas (one row per org; defaults if absent)
CREATE TABLE public.mcp_quotas (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  per_minute_limit INTEGER NOT NULL DEFAULT 30,
  daily_limit INTEGER NOT NULL DEFAULT 1000
);

-- Grants + RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcp_api_keys, public.mcp_tool_permissions, public.mcp_quotas TO authenticated;
GRANT SELECT ON public.mcp_audit_logs TO authenticated;
GRANT ALL ON public.mcp_api_keys, public.mcp_tool_permissions, public.mcp_audit_logs, public.mcp_quotas TO service_role;

ALTER TABLE public.mcp_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_tool_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mcp keys org" ON public.mcp_api_keys FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "mcp perms org" ON public.mcp_tool_permissions FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "mcp audit org read" ON public.mcp_audit_logs FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "mcp quotas org" ON public.mcp_quotas FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));
