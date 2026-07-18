import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{
    data: {
      client?: { name?: string; client_id?: string };
      scope?: string;
      redirect_url?: string;
      redirect_to?: string;
    } | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
  denyAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
};

function authOAuth(): OAuthNs {
  return (supabase.auth as unknown as { oauth: OAuthNs }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await authOAuth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen grid place-items-center p-6">
      <Card className="max-w-md">
        <CardContent className="p-8">
          <h1 className="font-display text-xl font-semibold">Authorization error</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {String((error as Error)?.message ?? error)}
          </p>
        </CardContent>
      </Card>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await authOAuth().approveAuthorization(authorization_id)
      : await authOAuth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";

  return (
    <main className="min-h-screen grid place-items-center bg-hero p-6">
      <Card className="w-full max-w-md shadow-elegant">
        <CardContent className="p-8">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">SignatureFlow</span>
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
            Connect {clientName} to your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clientName} will be able to call SignatureFlow's enabled tools while you are signed in.
            Your organization's RLS policies still decide what data it can read or write.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>• Read your employees, templates, signatures, and campaigns</li>
            <li>• Generate signature HTML for members of your organization</li>
          </ul>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => decide(true)}>
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}