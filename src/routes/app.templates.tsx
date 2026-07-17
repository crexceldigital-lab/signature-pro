import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Eye, Search, Crown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TEMPLATES,
  SAMPLE_DATA,
  sampleStyleFor,
  type TemplateDef,
} from "@/lib/signature-templates";

export const Route = createFileRoute("/app/templates")({
  component: Templates,
});

const categories = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

/** Renders the real signature HTML, scaled down to fit the card. */
function TemplateThumb({ t }: { t: TemplateDef }) {
  const html = useMemo(() => t.render(SAMPLE_DATA, sampleStyleFor(t)), [t]);
  return (
    <div className="pointer-events-none relative h-44 overflow-hidden border-b bg-white">
      <div
        className="absolute left-4 top-4 origin-top-left"
        style={{ transform: "scale(0.62)", width: "160%" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

function Templates() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<Set<string>>(new Set());

  const list = TEMPLATES.filter(
    (t) =>
      (cat === "All" || t.category === cat) &&
      (q.trim() === "" ||
        `${t.name} ${t.category} ${t.description}`.toLowerCase().includes(q.toLowerCase())),
  );

  const toggle = (id: string) =>
    setFavs((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div>
      <PageHeader
        title="Templates"
        description={`${TEMPLATES.length} professionally designed signatures. Every preview is the real, email-safe HTML.`}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs value={cat} onValueChange={setCat}>
          <TabsList className="flex-wrap">
            {categories.map((c) => (
              <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs…" className="pl-8" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((t) => (
          <Card key={t.id} className="group overflow-hidden shadow-elegant transition hover:-translate-y-0.5">
            <div className="relative">
              <TemplateThumb t={t} />
              <button
                onClick={() => toggle(t.id)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border bg-background/90 backdrop-blur transition hover:scale-105"
                aria-label="Favorite"
              >
                <Star className={`h-4 w-4 ${favs.has(t.id) ? "fill-brand text-brand" : "text-muted-foreground"}`} />
              </button>
              {t.premium && (
                <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                  <Crown className="h-3 w-3" /> PRO
                </div>
              )}
            </div>
            <CardContent className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border"
                  style={{ background: t.defaultAccent }}
                  aria-hidden
                />
                <div className="font-display text-lg font-semibold">{t.name}</div>
                <Badge variant="secondary">{t.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-4">
                <Button asChild size="sm" className="w-full">
                  <Link to="/app/builder" search={{ template: t.id }}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Use this template
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {list.length === 0 && (
        <div className="grid h-40 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No templates match “{q}”.
        </div>
      )}
    </div>
  );
}
