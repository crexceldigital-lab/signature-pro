import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const DesignInput = z.object({
  brief: z.string().min(3).max(2000),
  employee: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      jobTitle: z.string().optional(),
      company: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

const SYSTEM = `You are SignatureFlow's senior brand designer. You output ONE production-ready HTML email signature.
Rules:
- Use table-based layout for maximum email client compatibility (Outlook, Gmail, Apple Mail).
- Inline CSS only. No <style> blocks, no external stylesheets, no JavaScript.
- Width max 520px. Font stack: -apple-system, "Segoe UI", Roboto, Arial, sans-serif.
- Include name, title, company, email link, phone tel link where provided.
- Return ONLY the HTML markup for the signature. No prose. No markdown code fences.`;

export const generateSignatureDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DesignInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI Gateway not configured");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const employee = data.employee ?? {};
    const empLines = Object.entries(employee)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    const prompt = `Design brief:\n${data.brief}\n\nEmployee details:\n${empLines || "(use tasteful placeholders)"}\n\nReturn only the HTML signature.`;
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        system: SYSTEM,
        prompt,
      });
      const html = text
        .replace(/^```html\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      return { html };
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI generation failed";
      if (message.includes("429")) throw new Error("Rate limit reached — try again in a moment.");
      if (message.includes("402")) throw new Error("AI credits exhausted. Add credits in workspace settings.");
      throw new Error(message);
    }
  });