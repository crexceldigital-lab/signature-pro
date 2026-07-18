import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  MCP_TOOLS, MCP_TOOL_NAMES, executeTool, getQuotaState, hashKey, type McpActor,
} from "@/lib/mcp/registry.server";
import { mcpDb } from "@/lib/mcp/db.server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/* Shared: resolve the caller's org + role + email */
async function callerContext(supabase: SupabaseClient<Database>, userId: string) {
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("org_id,email").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile?.org_id) throw new Error("Your profile has no organization.");
  return {
    orgId: profile.org_id as string,
    email: (profile.email as string) ?? "user",
    role: (roleRow?.role as string) ?? "owner",
  };
}

export const getAgentAccessState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { orgId, role } = await callerContext(context.supabase, context.userId);
    const [keys, perms, quota] = await Promise.all([
      mcpDb.from("mcp_api_keys")
        .select("id,name,key_prefix,last_used_at,revoked_at,created_at")
        .eq("org_id", orgId).order("created_at", { ascending: false }),
      mcpDb.from("mcp_tool_permissions").select("role,tool,allowed").eq("org_id", orgId),
      getQuotaState(orgId),
    ]);
    const { data: lastCall } = await mcpDb.from("mcp_audit_logs")
      .select("created_at,status").eq("org_id", orgId).not("api_key_id", "is", null)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return {
      role,
      tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
      keys: keys.data ?? [],
      permissions: perms.data ?? [],
      quota,
      lastAgentCall: lastCall ?? null,
    };
  });

export const createMcpKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ name: z.string().min(2).max(60) }).parse(i))
  .handler(async ({ data, context }) => {
    const { orgId, role } = await callerContext(context.supabase, context.userId);
    if (role !== "owner" && role !== "admin") throw new Error("Only owners and admins can create API keys.");
    const secret = `sfk_${randomBytes(24).toString("base64url")}`;
    const { error } = await mcpDb.from("mcp_api_keys").insert({
      org_id: orgId,
      created_by: context.userId,
      name: data.name.trim(),
      key_prefix: secret.slice(0, 12),
      key_hash: hashKey(secret),
    });
    if (error) throw new Error(error.message);
    return { key: secret }; // shown once, never stored in plaintext
  });

export const revokeMcpKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { orgId, role } = await callerContext(context.supabase, context.userId);
    if (role !== "owner" && role !== "admin") throw new Error("Only owners and admins can revoke keys.");
    const { error } = await mcpDb.from("mcp_api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id).eq("org_id", orgId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setToolPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    role: z.enum(["marketing", "hr", "employee", "agent"]),
    tool: z.enum(MCP_TOOL_NAMES as [string, ...string[]]),
    allowed: z.boolean(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { orgId, role } = await callerContext(context.supabase, context.userId);
    if (role !== "owner" && role !== "admin") throw new Error("Only owners and admins can change permissions.");
    const { error } = await mcpDb.from("mcp_tool_permissions").upsert(
      { org_id: orgId, role: data.role, tool: data.tool, allowed: data.allowed },
      { onConflict: "org_id,role,tool" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setQuota = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    per_minute_limit: z.number().int().min(1).max(600),
    daily_limit: z.number().int().min(10).max(100000),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { orgId, role } = await callerContext(context.supabase, context.userId);
    if (role !== "owner" && role !== "admin") throw new Error("Only owners and admins can change quotas.");
    const { error } = await mcpDb.from("mcp_quotas").upsert({ org_id: orgId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    tool: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().int().min(1).max(200).default(50),
  }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    const { orgId } = await callerContext(context.supabase, context.userId);
    let q = mcpDb.from("mcp_audit_logs")
      .select("id,actor,tool,input_summary,status,result_summary,duration_ms,created_at,api_key_id")
      .eq("org_id", orgId).order("created_at", { ascending: false }).limit(data.limit);
    if (data.tool) q = q.eq("tool", data.tool);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows;
  });

/** Test console: run a tool as the logged-in user (same gate as agents). */
export const runToolAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    tool: z.enum(MCP_TOOL_NAMES as [string, ...string[]]),
    args: z.record(z.string(), z.unknown()).default({}),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { orgId, role, email } = await callerContext(context.supabase, context.userId);
    const actor: McpActor = { orgId, role, actorLabel: email, userId: context.userId };
    return executeTool(actor, data.tool, data.args as Record<string, unknown>);
  });
