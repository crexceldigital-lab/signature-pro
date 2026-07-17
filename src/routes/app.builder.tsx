import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Code2, Printer, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePreview } from "@/components/signature-preview";
import { ImageUpload } from "@/components/image-upload";
import { defaultSignature, defaultStyle, downloadFile, type SignatureData, type SignatureStyle } from "@/lib/signature";
import { renderSignature, TEMPLATES, SAMPLE_DATA, sampleStyleFor, getTemplate } from "@/lib/signature-templates";
import { toast } from "sonner";

export const Route = createFileRoute("/app/builder")({
  component: Builder,
  validateSearch: (search: Record<string, unknown>): { template?: string } => ({
    template: typeof search.template === "string" ? search.template : undefined,
  }),
});

function Builder() {
  const { template } = Route.useSearch();
  const [data, setData] = useState<SignatureData>(defaultSignature);
  const [style, setStyle] = useState<SignatureStyle>(defaultStyle);
  const html = useMemo(() => renderSignature(data, style), [data, style]);

  // Coming from the Templates gallery: load that design + its accent
  useEffect(() => {
    const t = getTemplate(template);
    if (t) setStyle((s) => ({ ...s, templateId: t.id, accent: t.defaultAccent }));
  }, [template]);

  const set = <K extends keyof SignatureData>(k: K, v: SignatureData[K]) => setData((d) => ({ ...d, [k]: v }));
  const setSocial = (k: keyof SignatureData["socials"], v: string) =>
    setData((d) => ({ ...d, socials: { ...d.socials, [k]: v } }));
  const setS = <K extends keyof SignatureStyle>(k: K, v: SignatureStyle[K]) => setStyle((s) => ({ ...s, [k]: v }));

  const pickTemplate = (id: string) => {
    const t = getTemplate(id);
    setStyle((s) => ({ ...s, templateId: id, accent: t?.defaultAccent ?? s.accent }));
  };

  const copy = async (content: string, label: string) => {
    await navigator.clipboard.writeText(content);
    toast.success(`${label} copied to clipboard`);
  };

  const copyRich = async () => {
    try {
      const blob = new Blob([html], { type: "text/html" });
      const item = new ClipboardItem({ "text/html": blob, "text/plain": new Blob([html], { type: "text/plain" }) });
      await navigator.clipboard.write([item]);
      toast.success("Rich signature copied — paste into your email client");
    } catch {
      await navigator.clipboard.writeText(html);
      toast.success("Copied as HTML (rich clipboard not supported)");
    }
  };

  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Signature</title></head><body>${html}</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div>
      <PageHeader
        title="Signature Builder"
        description="Pick a design, add your details and logo, and export email-safe HTML."
        actions={
          <>
            <Button variant="outline" onClick={copyRich}><Copy className="mr-1.5 h-4 w-4" /> Copy rich text</Button>
            <Button onClick={() => copy(html, "HTML")}><Code2 className="mr-1.5 h-4 w-4" /> Copy HTML</Button>
          </>
        }
      />

      {/* Template picker strip */}
      <div className="mb-6 -mx-1 overflow-x-auto pb-2">
        <div className="flex gap-3 px-1">
          {TEMPLATES.map((t) => {
            const active = style.templateId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => pickTemplate(t.id)}
                className={`relative w-52 shrink-0 overflow-hidden rounded-lg border bg-white text-left transition ${
                  active ? "border-brand ring-2 ring-brand/40" : "hover:border-foreground/30"
                }`}
                aria-pressed={active}
              >
                <div className="pointer-events-none relative h-20 overflow-hidden">
                  <div
                    className="absolute left-2 top-2 origin-top-left"
                    style={{ transform: "scale(0.3)", width: "330%" }}
                    dangerouslySetInnerHTML={{ __html: t.render(SAMPLE_DATA, sampleStyleFor(t)) }}
                  />
                </div>
                <div className="flex items-center justify-between border-t bg-background px-2.5 py-1.5">
                  <span className="truncate text-xs font-medium">{t.name}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-brand" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
        <Card className="shadow-elegant">
          <CardContent className="p-0">
            <Tabs defaultValue="content">
              <TabsList className="w-full rounded-none border-b bg-transparent p-0">
                <TabsTrigger value="content" className="flex-1 rounded-none">Content</TabsTrigger>
                <TabsTrigger value="images" className="flex-1 rounded-none">Images</TabsTrigger>
                <TabsTrigger value="style" className="flex-1 rounded-none">Style</TabsTrigger>
                <TabsTrigger value="modules" className="flex-1 rounded-none">Modules</TabsTrigger>
                <TabsTrigger value="export" className="flex-1 rounded-none">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name"><Input value={data.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
                  <Field label="Last name"><Input value={data.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
                </div>
                <Field label="Pronouns"><Input value={data.pronouns ?? ""} onChange={(e) => set("pronouns", e.target.value)} /></Field>
                <Field label="Job title"><Input value={data.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} /></Field>
                <Field label="Department"><Input value={data.department ?? ""} onChange={(e) => set("department", e.target.value)} /></Field>
                <Field label="Company"><Input value={data.company} onChange={(e) => set("company", e.target.value)} /></Field>
                <Field label="Email"><Input value={data.email} onChange={(e) => set("email", e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone"><Input value={data.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
                  <Field label="Mobile"><Input value={data.mobile ?? ""} onChange={(e) => set("mobile", e.target.value)} /></Field>
                </div>
                <Field label="Website"><Input value={data.website ?? ""} onChange={(e) => set("website", e.target.value)} /></Field>
                <Field label="Address"><Input value={data.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
                <div className="border-t pt-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Socials</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="LinkedIn"><Input value={data.socials.linkedin ?? ""} onChange={(e) => setSocial("linkedin", e.target.value)} /></Field>
                    <Field label="X"><Input value={data.socials.x ?? ""} onChange={(e) => setSocial("x", e.target.value)} /></Field>
                    <Field label="Instagram"><Input value={data.socials.instagram ?? ""} onChange={(e) => setSocial("instagram", e.target.value)} /></Field>
                    <Field label="YouTube"><Input value={data.socials.youtube ?? ""} onChange={(e) => setSocial("youtube", e.target.value)} /></Field>
                    <Field label="TikTok"><Input value={data.socials.tiktok ?? ""} onChange={(e) => setSocial("tiktok", e.target.value)} /></Field>
                    <Field label="WhatsApp"><Input value={data.socials.whatsapp ?? ""} onChange={(e) => setSocial("whatsapp", e.target.value)} /></Field>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">CTA & QR</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="CTA text"><Input value={data.ctaText ?? ""} onChange={(e) => set("ctaText", e.target.value)} /></Field>
                    <Field label="CTA link"><Input value={data.ctaLink ?? ""} onChange={(e) => set("ctaLink", e.target.value)} /></Field>
                  </div>
                  <Field label="QR target URL"><Input value={data.qrUrl ?? ""} onChange={(e) => set("qrUrl", e.target.value)} /></Field>
                  <Field label="Legal disclaimer"><Textarea value={data.legal ?? ""} onChange={(e) => set("legal", e.target.value)} rows={3} /></Field>
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-5 p-5">
                <ImageUpload
                  label="Company logo"
                  folder="logos"
                  value={data.logoUrl ?? ""}
                  onChange={(url) => set("logoUrl", url)}
                  hint="PNG or SVG with transparent background works best. Shown wherever the selected template places the brand mark."
                />
                <div className="border-t pt-5">
                  <ImageUpload
                    label="Profile photo"
                    folder="photos"
                    value={data.photoUrl ?? ""}
                    onChange={(url) => set("photoUrl", url)}
                    hint="Square images crop cleanest. Toggle round/square under Style."
                  />
                </div>
                <div className="border-t pt-5">
                  <ImageUpload
                    label="Marketing banner"
                    folder="banners"
                    value={data.bannerUrl ?? ""}
                    onChange={(url) => set("bannerUrl", url)}
                    hint="Recommended 520×120px. Link it below."
                  />
                  <div className="mt-3">
                    <Field label="Banner link"><Input value={data.bannerLink ?? ""} onChange={(e) => set("bannerLink", e.target.value)} /></Field>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-5 p-5">
                <Field label="Font">
                  <Select value={style.font} onValueChange={(v) => setS("font", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial, Helvetica, sans-serif">Arial / Helvetica</SelectItem>
                      <SelectItem value="Georgia, 'Times New Roman', serif">Georgia</SelectItem>
                      <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                      <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                      <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={`Font size — ${style.fontSize}px`}>
                  <Slider min={11} max={18} step={1} value={[style.fontSize]} onValueChange={([v]) => setS("fontSize", v)} />
                </Field>
                <Field label="Accent color">
                  <div className="flex items-center gap-2">
                    <input type="color" value={style.accent} onChange={(e) => setS("accent", e.target.value)} className="h-9 w-14 cursor-pointer rounded-md border bg-transparent" />
                    <Input value={style.accent} onChange={(e) => setS("accent", e.target.value)} />
                  </div>
                </Field>
                <Field label="Photo shape">
                  <Select value={style.photoShape} onValueChange={(v) => setS("photoShape", v as SignatureStyle["photoShape"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round">Round</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </TabsContent>

              <TabsContent value="modules" className="space-y-3 p-5">
                {([
                  ["showLogo", "Company logo"],
                  ["showPhoto", "Profile photo"],
                  ["showBanner", "Marketing banner"],
                  ["showSocials", "Social icons"],
                  ["showQR", "QR code"],
                  ["showCTA", "CTA button"],
                  ["showLegal", "Legal disclaimer"],
                ] as const).map(([k, label]) => (
                  <div key={k} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">Toggle in generated signature</div>
                    </div>
                    <Switch checked={style[k]} onCheckedChange={(v) => setS(k, v)} />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="export" className="space-y-3 p-5">
                <Button className="w-full justify-start" variant="outline" onClick={() => copy(html, "HTML")}>
                  <Code2 className="mr-2 h-4 w-4" /> Copy HTML source
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={copyRich}>
                  <Copy className="mr-2 h-4 w-4" /> Copy rich signature
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => downloadFile("signature.html", html)}>
                  <Download className="mr-2 h-4 w-4" /> Download .html
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={print}>
                  <Printer className="mr-2 h-4 w-4" /> Print preview
                </Button>
                <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  Output uses table-based HTML with inline CSS — compatible with Outlook, Gmail, Apple Mail, Yahoo, and Thunderbird.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <SignaturePreview data={data} style={style} />
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Generated HTML</div>
                <Button size="sm" variant="ghost" onClick={() => copy(html, "HTML")}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                </Button>
              </div>
              <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <code>{html}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
