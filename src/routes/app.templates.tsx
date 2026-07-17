import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Copy, Eye } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { templates } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/templates")({
  component: Templates,
});

const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

function Templates() {
  const [cat, setCat] = useState("All");
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const list = cat === "All" ? templates : templates.filter((t) => t.category === cat);

  const toggle = (id: string) => setFavs((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div>
      <PageHeader
        title="Templates"
        description="12 professionally designed starting points. Favorite, duplicate, or open in the builder."
      />
      <Tabs value={cat} onValueChange={setCat} className="mb-6">
        <TabsList className="flex-wrap">
          {categories.map((c) => (
            <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((t) => (
          <Card key={t.id} className="group overflow-hidden shadow-elegant transition hover:-translate-y-0.5">
            <div
              className="relative h-40 border-b"
              style={{ background: `linear-gradient(135deg, ${t.accent}22 0%, ${t.accent}0d 100%)` }}
            >
              <button
                onClick={() => toggle(t.id)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:scale-105"
                aria-label="Favorite"
              >
                <Star className={`h-4 w-4 ${favs.has(t.id) ? "fill-brand text-brand" : "text-muted-foreground"}`} />
              </button>
              <div className="absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-1 text-xs backdrop-blur">
                {t.layout}
              </div>
            </div>
            <CardContent className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <div className="font-display text-lg font-semibold">{t.name}</div>
                <Badge variant="secondary">{t.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link to="/app/builder"><Eye className="mr-1.5 h-3.5 w-3.5" /> Use template</Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.success(`Duplicated “${t.name}”`)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}