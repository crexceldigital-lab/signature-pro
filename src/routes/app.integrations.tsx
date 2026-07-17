import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/integrations")({
  component: Integrations,
});

const providers = [
  {
    id: "google",
    name: "Google Workspace",
    description: "Deploy signatures across every Gmail user in your workspace, automatically synced when employees change.",
    scopes: ["gmail.settings.sendAs", "admin.directory.user.readonly"],
    color: "from-red-500/20 to-yellow-400/10",
  },
  {
    id: "microsoft",
    name: "Microsoft 365",
    description: "Push transport rules for Outlook and Exchange Online — server-side signatures across every mailbox.",
    scopes: ["Mail.Send", "User.Read.All", "Organization.ReadWrite.All"],
    color: "from-blue-500/20 to-cyan-400/10",
  },
];

function Integrations() {
  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect your mail provider to deploy signatures automatically across every employee."
        actions={<Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> OAuth 2.0 · Read-only until deploy</Badge>}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {providers.map((p) => (
          <Card key={p.id} className="overflow-hidden shadow-elegant">
            <div className={`h-24 bg-gradient-to-br ${p.color} border-b`} />
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <div className="font-display text-lg font-semibold">{p.name}</div>
                <Badge variant="outline" className="ml-auto">Not connected</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-4">
                <div className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Requested scopes</div>
                <ul className="space-y-1 text-xs">
                  {p.scopes.map((s) => (
                    <li key={s} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      <code className="rounded bg-muted px-1.5 py-0.5">{s}</code>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                className="mt-5 w-full"
                onClick={() => toast.info("OAuth flow launching soon", { description: `Admin consent for ${p.name} will be requested here.` })}
              >
                Connect {p.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}