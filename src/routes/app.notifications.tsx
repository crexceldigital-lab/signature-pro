import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, CheckCheck, AlertTriangle, Info, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notifications as seed } from "@/lib/mock-data";

export const Route = createFileRoute("/app/notifications")({
  component: Notifications,
});

const iconFor = {
  success: <Check className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
};

const colorFor: Record<string, string> = {
  success: "bg-brand/20 text-foreground",
  info: "bg-secondary text-secondary-foreground",
  warning: "bg-chart-3/20 text-foreground",
  error: "bg-destructive/10 text-destructive",
};

function Notifications() {
  const [list, setList] = useState(seed);
  const unread = list.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Successes, errors, invitations, and campaign updates in one place."
        actions={
          <Button variant="outline" onClick={() => setList(list.map((n) => ({ ...n, read: true })))}>
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{unread} unread</Badge>
        <span>· {list.length} total</span>
      </div>

      <div className="space-y-2">
        {list.map((n) => (
          <Card key={n.id} className="flex items-start gap-4 p-4 shadow-elegant">
            <div className={`grid h-9 w-9 place-items-center rounded-md ${colorFor[n.type]}`}>{iconFor[n.type]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{n.title}</div>
                {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
              </div>
              <div className="text-sm text-muted-foreground">{n.body}</div>
            </div>
            <div className="text-xs text-muted-foreground">{n.time}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}