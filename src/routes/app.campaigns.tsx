import { createFileRoute } from "@tanstack/react-router";
import { Plus, Play, Pause, Copy, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { campaigns } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/campaigns")({
  component: Campaigns,
});

const statusStyle: Record<string, string> = {
  active: "bg-brand text-brand-foreground",
  scheduled: "bg-secondary",
  paused: "bg-muted",
  ended: "bg-destructive/10 text-destructive",
};

function Campaigns() {
  return (
    <div>
      <PageHeader
        title="Banner campaigns"
        description="Marketing-owned campaigns that appear inside every signature."
        actions={<Button onClick={() => toast.info("Opening campaign builder (mock)")}><Plus className="mr-1.5 h-4 w-4" /> New campaign</Button>}
      />

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => {
              const ctr = c.views ? ((c.clicks / c.views) * 100).toFixed(2) : "0.00";
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.banner}</div>
                  </TableCell>
                  <TableCell><Badge className={statusStyle[c.status]}>{c.status}</Badge></TableCell>
                  <TableCell className="text-sm">{c.audience}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.starts} → {c.ends}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{c.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{c.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{ctr}%</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => toast.success(c.status === "paused" ? "Resumed" : "Paused")}>
                      {c.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => toast.success("Duplicated")}><Copy className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => toast.success("Ended")}><XCircle className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}