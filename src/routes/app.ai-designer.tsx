import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Wand2, Loader2, Copy } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generateSignatureDesign } from "@/lib/ai.functions";

export const Route = createFileRoute("/app/ai-designer")({
  component: AiDesigner,
});

const presets = [
  "Minimal executive signature with brand accent bar and social icons.",
  "Bold sales rep signature with clickable CTA button and calendar link.",
  "Creative studio signature with portrait avatar and portfolio link.",
  "Enterprise legal signature with confidentiality footer and clean typography.",
];

function AiDesigner() {
  const [brief, setBrief] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [html, setHtml] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const runFn = useServerFn(generateSignatureDesign);

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
      setHtml(res.html);
      toast.success("Signature generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(html);
    toast.success("HTML copied");
  };

  return (
    <div>
      <PageHeader
        title="AI Signature Designer"
        description="Describe the signature you want. Our AI drafts email-safe, table-based HTML you can install immediately."
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
                placeholder="e.g. Modern minimal signature with a lime accent bar, avatar on the left, LinkedIn + calendar CTA…"
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
              {busy ? "Designing…" : "Generate signature"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-elegant">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Preview</div>
                <div className="font-display text-lg font-semibold">Live email preview</div>
              </div>
              <Button variant="outline" size="sm" onClick={copy} disabled={!html}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy HTML
              </Button>
            </div>
            <div className="rounded-lg border bg-card p-6">
              {html ? (
                <div dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <div className="grid h-64 place-items-center text-sm text-muted-foreground">
                  Your AI-generated signature will appear here.
                </div>
              )}
            </div>
            {html && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-muted-foreground">View generated HTML</summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{html}</pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}