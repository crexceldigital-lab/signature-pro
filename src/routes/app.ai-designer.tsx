import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Wand2, Loader2, Copy, PencilRuler } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generateSignatureDesign, type AiVariant } from "@/lib/ai.functions";
import { defaultSignature, type SignatureData, type SignatureStyle } from "@/lib/signature";
import { renderSignature, getTemplate } from "@/lib/signature-templates";

export const Route = createFileRoute("/app/ai-designer")({
  component: AiDesigner,
});

const presets = [
  "Minimal executive signature with brand accent bar and social icons.",
  "Bold sales rep signature with clickable CTA button and calendar link.",
  "Creative studio signature with portrait avatar and portfolio link.",
  "Enterprise legal signature with confidentiality footer and clean typography.",
  "Luxury real-estate signature with gold serif and framed layout.",
  "Tech startup signature with side rail and product-blue accent.",
];

function styleFromVariant(v: AiVariant): SignatureStyle {
  return {
    layout: "photo-left",
    accent: v.accent,
    font: v.font,
    fontSize: v.fontSize,
    photoShape: v.photoShape,
    divider: "solid",
    showPhoto: v.showPhoto,
    showBanner: false,
    showSocials: v.showSocials,
    showQR: false,
    showLegal: v.showLegal,
    showCTA: v.showCTA,
    showLogo: v.showLogo,
    templateId: v.templateId,
  };
}

function AiDesigner() {
  const navigate = useNavigate();
  const [brief, setBrief] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [variants, setVariants] = useState<AiVariant[]>([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const runFn = useServerFn(generateSignatureDesign);

  const previewData: SignatureData = useMemo(
    () => ({
      ...defaultSignature,
      firstName: firstName || defaultSignature.firstName,
      lastName: lastName || defaultSignature.lastName,
      jobTitle: jobTitle || defaultSignature.jobTitle,
      company: company || defaultSignature.company,
      email: email || defaultSignature.email,
      phone: phone || defaultSignature.phone,
      website: website || defaultSignature.website,
      ctaText: variants[selected]?.ctaText || defaultSignature.ctaText,
    }),
    [firstName, lastName, jobTitle, company, email, phone, website, variants, selected],
  );

  const selectedHtml = useMemo(() => {
    const v = variants[selected];
    return v ? renderSignature(previewData, styleFromVariant(v)) : "";
  }, [variants, selected, previewData]);

  const run = async () => {
    if (!brief.trim()) return toast.error("Add a brief describing the signature you want.");
    setBusy(true);
    try {
      const res = await runFn({
        data: {
          brief,
          employee: { firstName, lastName, jobTitle, company, email, phone, website },
        },
      });
      setVariants(res.variants);
      setSelected(0);
      toast.success(`${res.variants.length} designs generated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(selectedHtml);
    toast.success("HTML copied");
  };

  const openInBuilder = () => {
    const v = variants[selected];
    if (!v) return;
    void navigate({ to: "/app/builder", search: { template: v.templateId } });
  };

  return (
    <div>
      <PageHeader
        title="AI Signature Designer"
        description="Describe the vibe. The AI art-directs 3 distinct designs from our template engine — always polished, always email-safe."
        actions={<Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> Powered by Lovable AI</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 shadow-elegant">
          <CardContent className="space-y-4 p-6">
            <div>
              <Label>Design brief</Label>
              <Textarea
                rows={5}
                className="mt-1.5"
                placeholder="e.g. Bold agency signature, orange brand color, big CTA to book a call…"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setBrief(p)}
                    className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                  >
                    {p.split(" ").slice(0, 3).join(" ")}…
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name</Label><Input className="mt-1.5" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div><Label>Last name</Label><Input className="mt-1.5" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
              <div className="col-span-2"><Label>Job title</Label><Input className="mt-1.5" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></div>
              <div className="col-span-2"><Label>Company</Label><Input className="mt-1.5" value={company} onChange={(e) => setCompany(e.target.value)} /></div>
              <div><Label>Email</Label><Input className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Phone</Label><Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="col-span-2"><Label>Website</Label><Input className="mt-1.5" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
            </div>

            <Button onClick={run} disabled={busy} className="w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {busy ? "Art-directing…" : "Generate 3 designs"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          {variants.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {variants.map((v, i) => {
                const t = getTemplate(v.templateId);
                const html = renderSignature(previewData, styleFromVariant(v));
                const active = i === selected;
                return (
                  <button
                    key={`${v.templateId}-${i}`}
                    onClick={() => setSelected(i)}
                    className={`overflow-hidden rounded-lg border bg-white text-left transition ${
                      active ? "border-brand ring-2 ring-brand/40" : "hover:border-foreground/30"
                    }`}
                    aria-pressed={active}
                  >
                    <div className="pointer-events-none relative h-24 overflow-hidden">
                      <div
                        className="absolute left-2 top-2 origin-top-left"
                        style={{ transform: "scale(0.35)", width: "285%" }}
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    </div>
                    <div className="border-t bg-background px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: v.accent }} />
                        {t?.name ?? v.templateId}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{v.rationale}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Preview</div>
                  <div className="font-display text-lg font-semibold">Live email preview</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openInBuilder} disabled={!variants.length}>
                    <PencilRuler className="mr-1.5 h-3.5 w-3.5" /> Open in builder
                  </Button>
                  <Button variant="outline" size="sm" onClick={copy} disabled={!selectedHtml}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy HTML
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6">
                {selectedHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedHtml }} />
                ) : (
                  <div className="grid h-64 place-items-center text-sm text-muted-foreground">
                    Your AI-generated designs will appear here.
                  </div>
                )}
              </div>
              {selectedHtml && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-muted-foreground">View generated HTML</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{selectedHtml}</pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
