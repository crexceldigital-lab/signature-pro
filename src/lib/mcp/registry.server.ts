import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { renderSignature, TEMPLATES, getTemplate, sampleStyleFor } from "@/lib/signature-templates";
import { defaultSignature, type SignatureData } from "@/lib/signature";
import { mcpDb } from "./db.server";

/* ------------------------------------------------------------------ */
/*  MCP tool registry — shared by the HTTP endpoint (/api/mcp, agents  */
/*  with API keys) and the in-app test console (logged-in users).      */
/*  Every call goes through: permission check → rate limit → execute   */
/*  → audit log. No exceptions.                                        */
/* ------------------------------------------------------------------ */

export const MCP_TOOLS = [
  {
    name: "list_employees",
    description: "List employees in the organization. Optional: q (search text), limit (default 25, max 100).",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search in name, email, job title" },
        limit: { type: "number", description: "Max rows (default 25, max 100)" },
      },
    },
  },
  {
    name: "list_templates",
    description: "List all signature template designs with id, name, category, and description.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_signatures",
    description: "List saved signatures for the organization. Optional: limit (default 25, max 100).",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number", description: "Max rows (default 25, max 100)" } },
    },
  },
  {
    name: "list_campaigns",
    description: "List banner campaigns with status, window, views, and clicks.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "generate_signature_html",
    description:
      "Generate email-safe signature HTML. Provide template_id (see list_templates) and either employee_email (to pull their record) or explicit fields. Optional accent hex color.",
    inputSchema: {
      type: "object",
      properties: {
        template_id: { type: "string", description: "Template id, e.g. accent-bar, noir-motion" },
        employee_email: { type: "string", description: "Pull name/title/phone from this employee record" },
        accent: { type: "string", description: "Hex accent color, e.g. #F97316" },
        first_name: { type: "string" },
        last_name: { type: "string" },
        job_title: { type: "string" },
        company: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        website: { type: "string" },
      },
      required: ["template_id"],
    },
  },
] as const;

export type McpToolName = (typeof MCP_TOOLS)[number]["name"];
export const MCP_TOOL_NAMES = MCP_TOOLS.map((t) => t.name) as McpToolName[];

export interface McpActor {
  orgId: string;
  actorLabel: string;         // key name or user email
  role: string;               // owner/admin/... or "agent" for API keys
  apiKeyId?: string;
  userId?: string;
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Resolve a Bearer API key to an org actor. Returns null if invalid/revoked. */
export async function resolveApiKey(bearer: string): Promise<McpActor | null> {
  if (!bearer.startsWith("sfk_")) return null;
  const { data } = await mcpDb
    .from("mcp_api_keys")
    .select("id,org_id,name,revoked_at")
    .eq("key_hash", hashKey(bearer))
    .maybeSingle();
  if (!data || data.revoked_at) return null;
  void mcpDb.from("mcp_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { orgId: data.org_id, actorLabel: data.name, role: "agent", apiKeyId: data.id };
}

async function isAllowed(actor: McpActor, tool: string): Promise<boolean> {
  if (actor.role === "owner" || actor.role === "admin") return true;
  const { data } = await mcpDb
    .from("mcp_tool_permissions")
    .select("allowed")
    .eq("org_id", actor.orgId)
    .eq("role", actor.role)
    .eq("tool", tool)
    .maybeSingle();
  return data ? data.allowed : true; // default-open unless explicitly blocked
}

export interface QuotaState {
  perMinuteLimit: number;
  dailyLimit: number;
  usedThisMinute: number;
  usedToday: number;
}

export async function getQuotaState(orgId: string): Promise<QuotaState> {
  const { data: q } = await mcpDb.from("mcp_quotas").select("per_minute_limit,daily_limit").eq("org_id", orgId).maybeSingle();
  const perMinuteLimit = q?.per_minute_limit ?? 30;
  const dailyLimit = q?.daily_limit ?? 1000;
  const now = Date.now();
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const [{ count: minCount }, { count: dayCount }] = await Promise.all([
    mcpDb.from("mcp_audit_logs").select("id", { count: "exact", head: true })
      .eq("org_id", orgId).in("status", ["ok", "error"]).gte("created_at", new Date(now - 60_000).toISOString()),
    mcpDb.from("mcp_audit_logs").select("id", { count: "exact", head: true })
      .eq("org_id", orgId).in("status", ["ok", "error"]).gte("created_at", dayStart.toISOString()),
  ]);
  return { perMinuteLimit, dailyLimit, usedThisMinute: minCount ?? 0, usedToday: dayCount ?? 0 };
}

async function audit(actor: McpActor, tool: string, status: string, input: unknown, resultSummary: string, ms: number) {
  await mcpDb.from("mcp_audit_logs").insert({
    org_id: actor.orgId,
    api_key_id: actor.apiKeyId ?? null,
    user_id: actor.userId ?? null,
    actor: actor.actorLabel,
    tool,
    input_summary: JSON.stringify(input ?? {}).slice(0, 400),
    status,
    result_summary: resultSummary.slice(0, 300),
    duration_ms: Math.round(ms),
  });
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export interface ToolResult {
  ok: boolean;
  status: "ok" | "denied" | "rate_limited" | "error";
  data?: JsonValue;
  error?: string;
}

/** The single gate every MCP tool call passes through. */
export async function executeTool(actor: McpActor, tool: string, args: Record<string, unknown>): Promise<ToolResult> {
  const started = performance.now();

  if (!MCP_TOOL_NAMES.includes(tool as McpToolName)) {
    return { ok: false, status: "error", error: `Unknown tool: ${tool}` };
  }

  if (!(await isAllowed(actor, tool))) {
    await audit(actor, tool, "denied", args, "blocked by role permission", performance.now() - started);
    return { ok: false, status: "denied", error: `Role '${actor.role}' is not allowed to call ${tool}.` };
  }

  const quota = await getQuotaState(actor.orgId);
  if (quota.usedThisMinute >= quota.perMinuteLimit || quota.usedToday >= quota.dailyLimit) {
    await audit(actor, tool, "rate_limited", args, `minute ${quota.usedThisMinute}/${quota.perMinuteLimit}, day ${quota.usedToday}/${quota.dailyLimit}`, performance.now() - started);
    return { ok: false, status: "rate_limited", error: "Rate limit reached. Try again shortly or raise the quota in Agent Access → Usage." };
  }

  try {
    const data = (await run(actor, tool as McpToolName, args)) as JsonValue;
    const summary = Array.isArray(data) ? `${data.length} rows` : typeof data === "string" ? `${data.length} chars` : "ok";
    await audit(actor, tool, "ok", args, summary, performance.now() - started);
    return { ok: true, status: "ok", data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Tool failed";
    await audit(actor, tool, "error", args, msg, performance.now() - started);
    return { ok: false, status: "error", error: msg };
  }
}

async function run(actor: McpActor, tool: McpToolName, args: Record<string, unknown>): Promise<unknown> {
  const lim = Math.min(Math.max(Number(args.limit) || 25, 1), 100);

  switch (tool) {
    case "list_employees": {
      let query = supabaseAdmin
        .from("employees")
        .select("id,first_name,last_name,email,job_title,phone,status")
        .eq("org_id", actor.orgId).is("archived_at", null).limit(lim);
      const q = typeof args.q === "string" ? args.q.trim() : "";
      if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,job_title.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    }
    case "list_templates":
      return TEMPLATES.map((t) => ({ id: t.id, name: t.name, category: t.category, description: t.description, default_accent: t.defaultAccent }));
    case "list_signatures": {
      const { data, error } = await supabaseAdmin
        .from("signatures").select("id,name,status,created_at,updated_at")
        .eq("org_id", actor.orgId).order("updated_at", { ascending: false }).limit(lim);
      if (error) throw new Error(error.message);
      return data;
    }
    case "list_campaigns": {
      const { data, error } = await supabaseAdmin
        .from("campaigns").select("id,name,status,audience,starts_at,ends_at,views,clicks")
        .eq("org_id", actor.orgId).order("created_at", { ascending: false }).limit(lim);
      if (error) throw new Error(error.message);
      return data;
    }
    case "generate_signature_html": {
      const t = getTemplate(String(args.template_id));
      if (!t) throw new Error(`Unknown template_id. Call list_templates for valid ids.`);
      let d: SignatureData = { ...defaultSignature };
      if (typeof args.employee_email === "string" && args.employee_email) {
        const { data: emp, error } = await supabaseAdmin
          .from("employees")
          .select("first_name,last_name,email,job_title,phone,photo_url")
          .eq("org_id", actor.orgId).ilike("email", args.employee_email).maybeSingle();
        if (error) throw new Error(error.message);
        if (!emp) throw new Error(`No employee with email ${args.employee_email}`);
        d = {
          ...d,
          firstName: emp.first_name, lastName: emp.last_name, email: emp.email,
          jobTitle: emp.job_title ?? "", phone: emp.phone ?? "", photoUrl: emp.photo_url ?? "",
        };
      }
      const override = (k: keyof SignatureData, a: string) => {
        if (typeof args[a] === "string" && args[a]) (d as unknown as Record<string, unknown>)[k] = args[a];
      };
      override("firstName", "first_name"); override("lastName", "last_name");
      override("jobTitle", "job_title"); override("company", "company");
      override("email", "email"); override("phone", "phone"); override("website", "website");
      const style = sampleStyleFor(t, typeof args.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(args.accent) ? { accent: args.accent } : {});
      return renderSignature(d, style);
    }
  }
}
