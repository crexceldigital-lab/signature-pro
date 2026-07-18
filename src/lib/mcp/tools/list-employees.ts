import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "list_employees",
  title: "List employees",
  description: "List employees in the signed-in user's organization. Returns up to `limit` rows.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional().describe("Max rows (default 50)"),
    search: z.string().optional().describe("Case-insensitive filter on name or email"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, search }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    let query = supabaseForUser(ctx)
      .from("employees")
      .select("id, first_name, last_name, email, job_title, department_id, phone, mobile, active")
      .limit(limit ?? 50);
    if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { employees: data ?? [] },
    };
  },
});