import { createFileRoute } from "@tanstack/react-router";
import { Eye, MousePointerClick, QrCode, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { monthlyTrends, topCountries, campaigns, mockEmployees } from "@/lib/mock-data";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
});

function Analytics() {
  const totalViews = monthlyTrends.reduce((s, m) => s + m.views, 0);
  const totalClicks = monthlyTrends.reduce((s, m) => s + m.clicks, 0);
  const totalScans = monthlyTrends.reduce((s, m) => s + m.scans, 0);
  const topBanner = [...campaigns].sort((a, b) => b.clicks - a.clicks)[0];
  const topEmployee = mockEmployees[0];

  return (
    <div>
      <PageHeader title="Analytics" description="Signature views, banner clicks, QR scans, and top performers." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Signature views" value={totalViews.toLocaleString()} delta={18} icon={Eye} />
        <StatCard label="Banner clicks" value={totalClicks.toLocaleString()} delta={9} icon={MousePointerClick} />
        <StatCard label="QR scans" value={totalScans.toLocaleString()} delta={22} icon={QrCode} />
        <StatCard label="Top banner CTR" value={((topBanner.clicks / Math.max(topBanner.views, 1)) * 100).toFixed(1) + "%"} icon={Trophy} hint={topBanner.name} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-elegant">
          <CardContent className="p-6">
            <div className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Monthly trend</div>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="views" stroke="var(--color-brand)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="clicks" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="scans" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Top countries</div>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={topCountries} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="country" stroke="var(--color-muted-foreground)" fontSize={12} width={120} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Bar dataKey="views" fill="var(--color-brand)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Most active employee</div>
            <div className="mt-3 font-display text-2xl font-semibold">{topEmployee.firstName} {topEmployee.lastName}</div>
            <div className="text-sm text-muted-foreground">{topEmployee.jobTitle} · {topEmployee.department}</div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><div className="text-muted-foreground">Sends</div><div className="font-semibold">2,431</div></div>
              <div><div className="text-muted-foreground">Opens</div><div className="font-semibold">1,872</div></div>
              <div><div className="text-muted-foreground">Clicks</div><div className="font-semibold">421</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Devices</div>
            <div className="mt-4 space-y-3">
              {[
                { name: "Desktop — macOS Mail", v: 42 },
                { name: "Desktop — Outlook", v: 28 },
                { name: "Mobile — iOS Mail", v: 18 },
                { name: "Web — Gmail", v: 12 },
              ].map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{d.name}</span>
                    <span className="text-muted-foreground">{d.v}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${d.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}