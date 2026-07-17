import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShieldCheck, CheckCircle2, Unplug, KeyRound, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getIntegrationState, beginOAuth, disconnectIntegration } from "@/lib/oauth.functions";

export const Route = createFileRoute("/app/integrations")({
  component: Integrations,
});

type Provider = "google" | "microsoft";

const providers: {
  id: Provider;
  name: string;
  description: string;
  scopes: string[];
  color: string;
  setup: { console: string; url: string; steps: string[] };
}[] = [
  {
    id: "google",
    name: "Google Workspace",
    description: "Deploy signatures across every Gmail user in your workspace, automatically synced when employees change.",
    scopes: ["gmail.settings.basic", "admin.directory.user.readonly"],
    color: "from-red-500/20 to-yellow-400/10",
    setup: {
      console: "Google Cloud Console",
      url: "https://console.cloud.google.com/apis/credentials",
      steps: [
        "Create an OAuth client ID (type: Web application).",
        "Add redirect URI: https://YOUR-DOMAIN/oauth/callback",
        "Enable the Gmail API and Admin SDK API for the project.",
        "Save GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET as environment secrets, then redeploy.",
      ],
    },
  },
  {
    id: "microsoft",
    name: "Microsoft 365",
    description: "Connect Outlook and Exchange Online. Note: pushing signatures to every mailbox additionally requires Exchange admin consent.",
    scopes: ["User.Read", "Mail.Send", "offline_access"],
    color: "from-blue-500/20 to-cyan-400/10",
    setup: {
      console: "Azure Portal → App registrations",
      url: "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
      steps: [
        "New registration → supported accounts: any organizational directory.",
        "Add a Web redirect URI: https://YOUR-DOMAIN/oauth/callback",
        "Certificates & secrets → new client secret.",
        "Save MICROSOFT_OAUTH_CLIENT_ID and MICROSOFT_OAUTH_CLIENT_SECRET as environment secrets, then redeploy.",
      ],
    },
  },
];

interface State {
  configured: Record<Provider, boolean>;
  connections: { provider: Provider; status: string; email?: string; connectedAt: string }[];
}

function Integrations() {
  const fetchState = useServerFn(getIntegrationState);
  const runBegin = useServerFn(beginOAuth);
  const runDisconnect = useServerFn(disconnectIntegration);
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);

  const load = useCallback(async () => {
    try {
      setState((await fetchState()) as State);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load integrations");
    }
  }, [fetchState]);

  useEffect(() => { void load(); }, [load]);

  const connect = async (provider: Provider) => {
    setBusy(provider);
    try {
      const nonce = crypto.randomUUID().replace(/-/g, "");
      sessionStorage.setItem("oauth_state", nonce);
      sessionStorage.setItem("oauth_provider", provider);
      const { url } = await runBegin({
        data: { provider, redirectUri: `${window.location.origin}/oauth/callback`, state: nonce },
      });
      window.location.href = url;
    } catch (e) {
      setBusy(null);
      toast.error(e instanceof Error ? e.message : "Could not start sign-in");
    }
  };

  const disconnect = async (provider: Provider) => {
    setBusy(provider);
    try {
      await runDisconnect({ data: { provider } });
      toast.success("Disconnected");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disconnect");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect your mail provider to deploy signatures automatically across every employee."
        actions={<Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> OAuth 2.0 · Read-only until deploy</Badge>}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {providers.map((p) => {
          const configured = state?.configured?.[p.id] ?? false;
          const conn = state?.connections?.find((c) => c.provider === p.id && c.status === "connected");
          const loading = state === null;
          return (
            <Card key={p.id} className="hover-lift overflow-hidden shadow-elegant">
              <div className={`h-24 border-b bg-gradient-to-br ${p.color}`} />
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <div className="font-display text-lg font-semibold">{p.name}</div>
                  {loading ? (
                    <Badge variant="outline" className="ml-auto">…</Badge>
                  ) : conn ? (
                    <Badge className="ml-auto bg-brand text-brand-foreground">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-auto">Not connected</Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                {conn?.email && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Signed in as <span className="font-medium text-foreground">{conn.email}</span>
                  </p>
                )}
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

                {conn ? (
                  <Button
                    variant="outline"
                    className="mt-5 w-full"
                    disabled={busy === p.id}
                    onClick={() => void disconnect(p.id)}
                  >
                    {busy === p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
                    Disconnect
                  </Button>
                ) : configured ? (
                  <Button className="mt-5 w-full" disabled={busy === p.id} onClick={() => void connect(p.id)}>
                    {busy === p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Connect {p.name}
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="mt-5 w-full" disabled={loading}>
                        <KeyRound className="mr-2 h-4 w-4" /> Setup required
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Set up {p.name}</DialogTitle>
                        <DialogDescription>
                          One-time setup in {p.setup.console}. After the secrets are saved and the app is redeployed, this button becomes “Connect”.
                        </DialogDescription>
                      </DialogHeader>
                      <ol className="list-decimal space-y-2 pl-5 text-sm">
                        {p.setup.steps.map((step) => <li key={step}>{step}</li>)}
                      </ol>
                      <a
                        href={p.setup.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                      >
                        Open {p.setup.console} →
                      </a>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
