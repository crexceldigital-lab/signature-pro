import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized } from "../supabase";
import { buildSignatureHTML, defaultSignature, defaultStyle, type SignatureData } from "@/lib/signature";

export default defineTool({
  name: "generate_signature_html",
  title: "Generate signature HTML",
  description: "Generate email-safe HTML for an employee's signature. Looks up the employee in the caller's organization and returns rendered HTML.",
  inputSchema: {
    employee_id: z.string().uuid().describe("Employee ID in the caller's organization"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ employee_id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const supabase = supabaseForUser(ctx);
    const { data: emp, error } = await supabase
      .from("employees")
      .select("*, organizations(name, website, logo_url, address)")
      .eq("id", employee_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!emp) return { content: [{ type: "text", text: "Employee not found" }], isError: true };

    const e = emp as Record<string, unknown> & { organizations?: Record<string, unknown> | null };
    const org = e.organizations ?? {};
    const data: SignatureData = {
      ...defaultSignature,
      firstName: String(e.first_name ?? ""),
      lastName: String(e.last_name ?? ""),
      jobTitle: String(e.job_title ?? ""),
      company: String((org as { name?: string }).name ?? ""),
      email: String(e.email ?? ""),
      phone: (e.phone as string) ?? undefined,
      mobile: (e.mobile as string) ?? undefined,
      website: (org as { website?: string }).website ?? undefined,
      address: (org as { address?: string }).address ?? undefined,
      logoUrl: (org as { logo_url?: string }).logo_url ?? undefined,
      photoUrl: (e.photo_url as string) ?? undefined,
      socials: {
        linkedin: (e.linkedin_url as string) ?? undefined,
        x: (e.twitter_url as string) ?? undefined,
      },
    };
    const html = buildSignatureHTML(data, defaultStyle);
    return {
      content: [{ type: "text", text: html }],
      structuredContent: { html, employee_id },
    };
  },
});