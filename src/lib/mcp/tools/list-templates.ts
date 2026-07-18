import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "list_templates",
  title: "List signature templates",
  description: "List signature templates visible to the user (marketplace + org).",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
    category: z.string().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, category }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    let q = supabaseForUser(ctx)
      .from("templates")
      .select("id, name, category, description, tags, is_public")
      .limit(limit ?? 50);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { templates: data ?? [] },
    };
  },
});