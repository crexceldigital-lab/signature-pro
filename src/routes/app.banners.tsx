import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/app/banners")({
  component: Banners,
});

const gallery = [
  { title: "Meet Atlas 2.0", subtitle: "Ship faster. Learn faster.", accent: "oklch(0.7 0.16 200)" },
  { title: "Q3 Webinar", subtitle: "Register now — free", accent: "oklch(0.75 0.18 130)" },
  { title: "We're hiring", subtitle: "Join the engineering team", accent: "oklch(0.65 0.2 340)" },
  { title: "Case study", subtitle: "How Acme scaled to 10×", accent: "oklch(0.7 0.15 40)" },
];

function Banners() {
  return (
    <div>
      <PageHeader
        title="Marketing banners"
        description="Reusable banners you can attach to a signature or campaign."
        actions={<Button onClick={() => toast.info("Banner editor (mock)")}><Plus className="mr-1.5 h-4 w-4" /> New banner</Button>}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {gallery.map((b) => (
          <Card key={b.title} className="overflow-hidden shadow-elegant">
            <div className="flex h-40 items-center justify-between p-6 text-primary-foreground" style={{ background: `linear-gradient(135deg, ${b.accent}, oklch(0.2 0.02 260))` }}>
              <div>
                <div className="font-display text-2xl font-semibold">{b.title}</div>
                <div className="mt-1 text-sm opacity-80">{b.subtitle}</div>
              </div>
              <Button variant="secondary" size="sm">Learn more →</Button>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input className="mt-1" defaultValue={b.title} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Link</Label>
                  <Input className="mt-1" defaultValue="https://acmestudio.com" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}