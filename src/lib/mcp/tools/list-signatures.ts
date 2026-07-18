import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "list_signatures",
  title: "List signatures",
  description: "List signatures in the signed-in user's organization.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
    employee_id: z.string().uuid().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, employee_id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    let q = supabaseForUser(ctx)
      .from("signatures")
      .select("id, name, employee_id, template_id, status, created_at, updated_at")
      .limit(limit ?? 50);
    if (employee_id) q = q.eq("employee_id", employee_id);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { signatures: data ?? [] },
    };
  },
});