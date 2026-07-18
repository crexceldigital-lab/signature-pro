import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized } from "../supabase";

export default defineTool({
  name: "list_campaigns",
  title: "List marketing campaigns",
  description: "List marketing banner campaigns in the signed-in user's organization.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
    status: z.string().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    let q = supabaseForUser(ctx)
      .from("campaigns")
      .select("id, name, status, start_date, end_date, banner_id, impressions, clicks")
      .limit(limit ?? 50);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { campaigns: data ?? [] },
    };
  },
});