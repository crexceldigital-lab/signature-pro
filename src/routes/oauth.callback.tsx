import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { completeOAuth } from "@/lib/oauth.functions";

export const Route = createFileRoute("/oauth/callback")({
  component: OAuthCallback,
  validateSearch: (s: Record<string, unknown>) => ({
    code: typeof s.code === "string" ? s.code : undefined,
    state: typeof s.state === "string" ? s.state : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
});

function OAuthCallback() {
  const { code, state, error } = Route.useSearch();
  const navigate = useNavigate();
  const runComplete = useServerFn(completeOAuth);
  const [status, setStatus] = useState<"working" | "done" | "failed">("working");
  const [message, setMessage] = useState("Finishing the connection…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      if (error) {
        setStatus("failed");
        setMessage(error === "access_denied" ? "You cancelled the consent screen." : `Provider error: ${error}`);
        return;
      }
      const saved = sessionStorage.getItem("oauth_state");
      const provider = sessionStorage.getItem("oauth_provider") as "google" | "microsoft" | null;
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_provider");

      if (!code || !state || !provider || state !== saved) {
        setStatus("failed");
        setMessage("Invalid or expired sign-in attempt. Please try connecting again.");
        return;
      }
      try {
        const res = await runComplete({
          data: { provider, code, redirectUri: `${window.location.origin}/oauth/callback` },
        });
        setStatus("done");
        setMessage(`${provider === "google" ? "Google Workspace" : "Microsoft 365"} connected${res.email ? ` as ${res.email}` : ""}.`);
        setTimeout(() => void navigate({ to: "/app/integrations" }), 1200);
      } catch (e) {
        setStatus("failed");
        setMessage(e instanceof Error ? e.message : "Connection failed.");
      }
    })();
  }, [code, state, error, navigate, runComplete]);

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-elegant">
        {status === "working" && <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />}
        {status === "done" && <CheckCircle2 className="mx-auto h-8 w-8 text-brand" />}
        {status === "failed" && <XCircle className="mx-auto h-8 w-8 text-destructive" />}
        <p className="mt-4 text-sm text-foreground">{message}</p>
        {status === "failed" && (
          <button
            onClick={() => void navigate({ to: "/app/integrations" })}
            className="mt-4 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Back to integrations
          </button>
        )}
      </div>
    </div>
  );
}
