import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Building2, Users, LayoutTemplate, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  component: Admin,
});

const orgs = [
  { id: 1, name: "Acme Studio", plan: "Pro", seats: 24, status: "active" },
  { id: 2, name: "Northwind Trading", plan: "Business", seats: 118, status: "active" },
  { id: 3, name: "Contoso Labs", plan: "Starter", seats: 6, status: "trial" },
  { id: 4, name: "Fabrikam Legal", plan: "Business", seats: 42, status: "past due" },
];

const tickets = [
  { id: "T-2401", subject: "Outlook mobile spacing issue", org: "Acme Studio", priority: "high", status: "open" },
  { id: "T-2400", subject: "How do I bulk-import employees?", org: "Contoso Labs", priority: "low", status: "open" },
  { id: "T-2399", subject: "SSO with Azure AD", org: "Fabrikam Legal", priority: "medium", status: "waiting" },
];

function Admin() {
  return (
    <div>
      <PageHeader title="Admin panel" description="Platform-level administration across organizations, users, and support." />

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value={128} delta={5} icon={Building2} />
        <StatCard label="Users" value={"4,281"} delta={9} icon={Users} />
        <StatCard label="Templates" value={68} delta={2} icon={LayoutTemplate} />
        <StatCard label="Open tickets" value={12} delta={-3} icon={LifeBuoy} />
      </div>

      <Tabs defaultValue="orgs">
        <TabsList className="flex-wrap">
          <TabsTrigger value="orgs">Organizations</TabsTrigger>
          <TabsTrigger value="tickets">Support tickets</TabsTrigger>
          <TabsTrigger value="logs">System logs</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="orgs">
          <Card><CardContent className="p-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Organization</TableHead><TableHead>Plan</TableHead><TableHead>Seats</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {orgs.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell>{o.plan}</TableCell>
                    <TableCell>{o.seats}</TableCell>
                    <TableCell><Badge variant={o.status === "active" ? "default" : "outline"}>{o.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card><CardContent className="p-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>ID</TableHead><TableHead>Subject</TableHead><TableHead>Org</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell>{t.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.org}</TableCell>
                    <TableCell><Badge variant="secondary">{t.priority}</Badge></TableCell>
                    <TableCell><Badge>{t.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card><CardContent className="p-6">
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 font-mono text-xs text-muted-foreground">
{`2026-07-17T09:12:44Z INFO  auth.login user=ava@acmestudio.com
2026-07-17T09:13:02Z INFO  signature.deployed count=42 org=Acme Studio
2026-07-17T09:20:11Z WARN  webhook.retry provider=google_workspace attempt=2
2026-07-17T09:32:08Z INFO  campaign.created id=c6 org=Northwind
2026-07-17T10:04:53Z ERROR sync.failed provider=microsoft_graph reason=token_expired
2026-07-17T10:16:22Z INFO  employee.bulk_import rows=48 org=Fabrikam Legal`}
            </pre>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card><CardContent className="space-y-3 p-6">
            {["New: AI banner suggestions rolling out this week", "Scheduled maintenance July 24, 02:00 UTC", "Compatibility improvements for Outlook 2016 desktop"].map((a) => (
              <div key={a} className="rounded-md border p-4 text-sm">{a}</div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}