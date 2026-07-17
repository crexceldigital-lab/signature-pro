import { createFileRoute, Link } from "@tanstack/react-router";
import { PenSquare, Users, LayoutTemplate, Megaphone, ArrowRight, Activity } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { monthlyTrends, mockEmployees, campaigns } from "@/lib/mock-data";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
});

const activity = [
  { who: "Ava Kirsch", what: "updated the Executive template", when: "12m ago" },
  { who: "Priya Nair", what: "launched Summer Product Launch campaign", when: "48m ago" },
  { who: "Marcus Alvarado", what: "invited 4 sales teammates", when: "2h ago" },
  { who: "Jonas Weber", what: "duplicated Modern Grid template", when: "yesterday" },
  { who: "Sofia Bianchi", what: "bulk imported 12 employees", when: "yesterday" },
];

function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Everything happening across your signatures, banners, and team."
        actions={
          <Button asChild>
            <Link to="/app/builder">
              <PenSquare className="mr-1.5 h-4 w-4" /> New signature
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Signatures" value="1,284" delta={12} icon={PenSquare} hint="vs last month" />
        <StatCard label="Employees" value={mockEmployees.length} delta={4} icon={Users} hint="active this week" />
        <StatCard label="Active templates" value={9} delta={-2} icon={LayoutTemplate} hint="in use" />
        <StatCard label="Banner campaigns" value={campaigns.filter((c) => c.status === "active").length} delta={20} icon={Megaphone} hint="live now" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-elegant">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Engagement</div>
                <div className="font-display text-xl font-semibold">Views · Clicks · QR scans</div>
              </div>
              <Badge variant="secondary">Last 7 months</Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="views" stroke="var(--color-brand)" fill="url(#v)" strokeWidth={2} />
                  <Area type="monotone" dataKey="clicks" stroke="var(--color-chart-2)" fill="url(#c)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Recent activity</div>
                <div className="font-display text-xl font-semibold">Team pulse</div>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <ul className="space-y-4">
              {activity.map((a, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  <div className="flex-1">
                    <div>
                      <span className="font-medium">{a.who}</span>{" "}
                      <span className="text-muted-foreground">{a.what}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{a.when}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { title: "Design a signature", body: "Open the visual builder with live email preview.", to: "/app/builder" },
          { title: "Invite your team", body: "CSV import, roles, and department mapping.", to: "/app/employees" },
          { title: "Launch a banner", body: "Schedule a marketing banner across every signature.", to: "/app/campaigns" },
        ].map((c) => (
          <Card key={c.title} className="group cursor-pointer transition hover:-translate-y-0.5 hover:shadow-elegant">
            <CardContent className="p-6">
              <div className="font-display text-lg font-semibold">{c.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
              <Button asChild variant="link" className="mt-3 px-0">
                <Link to={c.to}>
                  Get started <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}