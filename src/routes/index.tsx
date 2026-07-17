import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Zap, Shield, Users, LineChart, Palette, MailCheck, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  { icon: Palette, title: "Visual signature builder", body: "Drag, drop, and style — every change reflected in a pixel-accurate live preview." },
  { icon: MailCheck, title: "Bulletproof email HTML", body: "Table-based, inline-styled output tested against Outlook, Gmail, Apple Mail, and more." },
  { icon: Users, title: "Organization-wide rollout", body: "Enforce brand across every teammate. Bulk CSV import, roles, and departments." },
  { icon: LineChart, title: "Campaign analytics", body: "Track views, clicks, CTR, QR scans and top performers across every signature." },
  { icon: QrCode, title: "Smart QR & CTAs", body: "Auto-generated QR codes, meeting links, and call-to-action buttons per employee." },
  { icon: Shield, title: "Enterprise-ready", body: "Role-based access, audit logs, SSO-ready architecture, and secure storage." },
];

const stats = [
  { v: "12K+", l: "Signatures deployed" },
  { v: "99.4%", l: "Client compatibility" },
  { v: "42 min", l: "Avg. rollout time" },
  { v: "6.1×", l: "Banner CTR uplift" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">SignatureFlow</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#templates" className="hover:text-foreground">Templates</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">
                Start free <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 gap-1 border-brand/40 bg-brand/10 text-foreground">
              <Zap className="h-3 w-3" /> New — AI banner suggestions
            </Badge>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl">
              Every teammate's email,{" "}
              <span className="italic text-muted-foreground">perfectly on brand.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
              Design, deploy, and measure enterprise email signatures — with a builder engineers trust and marketers actually enjoy.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Start free <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/app/builder">See the builder</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card • Free for teams up to 5
            </p>
          </div>

          {/* Preview card */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border bg-card p-2 shadow-elegant">
              <div className="rounded-xl bg-surface-2 p-6">
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                  <span className="ml-3 text-xs text-muted-foreground">signatureflow.app/builder</span>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Editor</div>
                    <div className="space-y-2">
                      {["Full name", "Job title", "Company", "Phone", "LinkedIn"].map((f) => (
                        <div key={f} className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-xs">
                          <span className="w-20 text-muted-foreground">{f}</span>
                          <span className="flex-1 truncate">•••••••••••</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-white p-5 text-black">
                    <div className="text-[11px] uppercase tracking-widest text-neutral-400">Live preview</div>
                    <div className="mt-4 flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-neutral-200" />
                      <div className="flex-1 text-[13px] leading-snug">
                        <div className="text-base font-semibold text-neutral-900">Ava Kirsch</div>
                        <div className="text-neutral-500">Chief Executive Officer · Acme Studio</div>
                        <div className="mt-2 text-neutral-700">ava@acmestudio.com · +1 (415) 555-0101</div>
                        <div className="mt-3 inline-block rounded-md bg-[#84CC16] px-3 py-1.5 text-xs font-semibold text-neutral-900">
                          Book a meeting →
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="text-center">
                <div className="font-display text-3xl font-semibold">{s.v}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-surface-2/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-14 max-w-2xl">
            <div className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Platform</div>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-balance">
              A signature system, not a signature generator.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border-border/60 shadow-elegant">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand/20 text-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Templates strip */}
      <section id="templates" className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Templates</div>
              <h2 className="font-display text-4xl font-semibold tracking-tight">12 gallery-ready starts.</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/app/templates">Browse gallery</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {["Corporate", "Executive", "Minimal", "Modern", "Creative", "Sales", "Luxury", "Tech"].map((n, i) => (
              <div key={n} className="rounded-xl border bg-card p-6 shadow-elegant transition hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="mb-4 h-24 rounded-md" style={{ background: `linear-gradient(135deg, oklch(0.9 0.03 ${i * 40}) 0%, oklch(0.95 0.02 ${(i * 40 + 90) % 360}) 100%)` }} />
                <div className="text-sm font-semibold">{n}</div>
                <div className="text-xs text-muted-foreground">Template</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-balance">
            Ship a brand-perfect signature to every mailbox this week.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
            Free for teams up to 5. Pro plans starting at $4 per user per month.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/app/builder">Open the builder</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} SignatureFlow. Crafted for teams that care about brand.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
