import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

/**
 * The AI no longer writes raw HTML (which produced plain, inconsistent output).
 * It now acts as an art director: it picks 3 templates from our engine, chooses
 * accent colors, and writes CTA copy + a rationale. The client renders each spec
 * through the template engine, so results are always polished and email-safe.
 */

const TEMPLATE_IDS = [
  "accent-bar", "header-band", "corner-frame", "split-vertical", "stacked-center",
  "minimal-line", "sales-cta", "photo-card", "banner-hero", "right-rail",
  "underline-executive", "duotone", "legal-standard", "gradient-edge",
  "mono-chip", "grid-mark", "pulse-motion", "noir-motion", "noir-type",
  "brand-footer", "contact-panel", "labeled-classic", "agency-split", "badge-pill", "panel-pop",
] as const;

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

const Variant = z.object({
  templateId: z.enum(TEMPLATE_IDS),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fontSize: z.number().int().min(11).max(18).default(13),
  font: z.string().default("Arial, Helvetica, sans-serif"),
  photoShape: z.enum(["round", "square"]).default("round"),
  showPhoto: z.boolean().default(true),
  showLogo: z.boolean().default(true),
  showSocials: z.boolean().default(true),
  showCTA: z.boolean().default(false),
  showLegal: z.boolean().default(false),
  ctaText: z.string().optional(),
  rationale: z.string(),
});
const AiOutput = z.object({ variants: z.array(Variant).min(1).max(3) });
export type AiVariant = z.infer<typeof Variant>;

const SYSTEM = `You are SignatureFlow's art director. Given a design brief, choose signature designs from this template catalog:

accent-bar (corporate, vertical brand bar) · header-band (bold reversed color band) · corner-frame (luxury editorial frame, serif) · split-vertical (classic logo + divider) · stacked-center (centered minimal) · minimal-line (two plain lines) · sales-cta (CTA-forward with underline) · photo-card (creative tinted card, ringed portrait) · banner-hero (compact identity + campaign banner) · right-rail (tech, tinted side rail) · underline-executive (heavy accent rule under name) · duotone (solid color identity block) · legal-standard (restrained serif + disclaimer) · gradient-edge (angled brand edge, premium) · mono-chip (contacts as rounded chips, modern) · grid-mark (Swiss editorial grid, oversized initial) · pulse-motion (animated accent bar, energetic) · noir-motion (dark studio card, cream name, pulsing arrow — agencies/media) · noir-type (dark monospace card, blinking cursor — developers/tech) · brand-footer (white card, rounded brand bar footer) · contact-panel (icon-bulleted contact grid + social pill) · labeled-classic (ringed portrait, labeled contact rows) · agency-split (studio letterhead, two-tone name) · badge-pill (oversized stacked name, bold role pill) · panel-pop (solid side panel, reversed text)

Return STRICT JSON only, no markdown, matching:
{"variants":[{"templateId":"...","accent":"#RRGGBB","fontSize":13,"font":"Arial, Helvetica, sans-serif","photoShape":"round","showPhoto":true,"showLogo":true,"showSocials":true,"showCTA":false,"showLegal":false,"ctaText":"optional","rationale":"one sentence on why this fits the brief"}]}

Rules:
- Return exactly 3 DIFFERENT templateIds, best match first.
- Pick accent colors that match the brief's industry and mood (never default to blue for everything).
- showCTA true + short ctaText when the brief mentions sales, bookings, meetings, or conversion.
- showLegal true for legal / finance / healthcare / enterprise briefs.
- serif-leaning briefs (luxury, law, editorial) → corner-frame or legal-standard with Georgia font.`;

/** Deterministic fallback so the feature never dead-ends. */
function fallbackVariants(brief: string): z.infer<typeof AiOutput> {
  const b = brief.toLowerCase();
  const pick = (): [string, string][] => {
    if (/(sale|cta|meeting|book|convert|pipeline)/.test(b))
      return [["sales-cta", "#16A34A"], ["banner-hero", "#7C3AED"], ["accent-bar", "#EA580C"]];
    if (/(legal|law|counsel|complian|finance|bank)/.test(b))
      return [["legal-standard", "#374151"], ["corner-frame", "#8B6F3B"], ["split-vertical", "#0F172A"]];
    if (/(luxur|premium|elegant|editorial|serif)/.test(b))
      return [["corner-frame", "#B45309"], ["stacked-center", "#171717"], ["underline-executive", "#111111"]];
    if (/(creativ|studio|design|agency|portfolio)/.test(b))
      return [["photo-card", "#DB2777"], ["gradient-edge", "#F97316"], ["duotone", "#7C3AED"]];
    if (/(tech|saas|software|startup|product)/.test(b))
      return [["right-rail", "#0EA5E9"], ["duotone", "#2563EB"], ["header-band", "#4F46E5"]];
    if (/(minimal|simple|clean|plain)/.test(b))
      return [["minimal-line", "#404040"], ["stacked-center", "#171717"], ["accent-bar", "#111111"]];
    return [["accent-bar", "#F97316"], ["header-band", "#EA580C"], ["gradient-edge", "#DB2777"]];
  };
  return {
    variants: pick().map(([templateId, accent], i) => ({
      templateId: templateId as (typeof TEMPLATE_IDS)[number],
      accent,
      fontSize: 13,
      font: /legal|corner/.test(templateId) ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif",
      photoShape: "round" as const,
      showPhoto: true,
      showLogo: true,
      showSocials: true,
      showCTA: /sales|banner/.test(templateId),
      showLegal: templateId === "legal-standard",
      ctaText: /sales|banner/.test(templateId) ? "Book a meeting" : undefined,
      rationale: i === 0 ? "Closest match to your brief." : "Alternative direction worth comparing.",
    })),
  };
}

export const generateSignatureDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DesignInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return fallbackVariants(data.brief);

    const gateway = createLovableAiGatewayProvider(apiKey);
    const employee = data.employee ?? {};
    const empLines = Object.entries(employee)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        system: SYSTEM,
        prompt: `Design brief:\n${data.brief}\n\nPerson:\n${empLines || "(unknown — generic professional)"}\n\nReturn the JSON now.`,
      });
      const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = AiOutput.safeParse(JSON.parse(clean));
      if (parsed.success) {
        // de-dupe templates if the model repeated itself
        const seen = new Set<string>();
        parsed.data.variants = parsed.data.variants.filter((v) =>
          seen.has(v.templateId) ? false : (seen.add(v.templateId), true),
        );
        if (parsed.data.variants.length > 0) return parsed.data;
      }
      return fallbackVariants(data.brief);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("429")) throw new Error("Rate limit reached — try again in a moment.");
      if (message.includes("402")) throw new Error("AI credits exhausted. Add credits in workspace settings.");
      return fallbackVariants(data.brief);
    }
  });
