import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ */
/*  Real OAuth 2.0 for Google Workspace + Microsoft 365.               */
/*                                                                     */
/*  Required environment variables (set in Lovable Cloud → Secrets     */
/*  or your deploy env):                                               */
/*    GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET              */
/*    MICROSOFT_OAUTH_CLIENT_ID / MICROSOFT_OAUTH_CLIENT_SECRET        */
/*                                                                     */
/*  Register the redirect URI  https://<your-domain>/oauth/callback    */
/*  in Google Cloud Console and Azure App Registration.                */
/* ------------------------------------------------------------------ */

const PROVIDERS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "openid",
      "email",
      "https://www.googleapis.com/auth/gmail.settings.basic",
      "https://www.googleapis.com/auth/admin.directory.user.readonly",
    ],
    idEnv: "GOOGLE_OAUTH_CLIENT_ID",
    secretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
  },
  microsoft: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: ["openid", "email", "profile", "offline_access", "User.Read", "Mail.Send"],
    idEnv: "MICROSOFT_OAUTH_CLIENT_ID",
    secretEnv: "MICROSOFT_OAUTH_CLIENT_SECRET",
  },
} as const;

type Provider = keyof typeof PROVIDERS;
const ProviderSchema = z.enum(["google", "microsoft"]);

function creds(provider: Provider) {
  const p = PROVIDERS[provider];
  const clientId = process.env[p.idEnv];
  const clientSecret = process.env[p.secretEnv];
  return { ...p, clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

/** Which providers have credentials set + the user's current connections. */
export const getIntegrationState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("integrations")
      .select("provider,status,metadata,created_at")
      .eq("user_id", context.userId);
    return {
      configured: {
        google: creds("google").configured,
        microsoft: creds("microsoft").configured,
      },
      connections: (data ?? []).map((r) => ({
        provider: r.provider as Provider,
        status: r.status,
        email: (r.metadata as Record<string, unknown> | null)?.email as string | undefined,
        connectedAt: r.created_at,
      })),
    };
  });

const BeginInput = z.object({
  provider: ProviderSchema,
  redirectUri: z.string().url(),
  state: z.string().min(16).max(128),
});

/** Build the provider consent URL. The provider enforces the registered redirect URI. */
export const beginOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => BeginInput.parse(i))
  .handler(async ({ data }) => {
    const c = creds(data.provider);
    if (!c.configured) {
      throw new Error(
        `${data.provider === "google" ? "Google" : "Microsoft"} OAuth is not configured. Add ${c.idEnv} and ${c.secretEnv} to your environment secrets.`,
      );
    }
    const params = new URLSearchParams({
      client_id: c.clientId!,
      redirect_uri: data.redirectUri,
      response_type: "code",
      scope: c.scopes.join(" "),
      state: data.state,
    });
    if (data.provider === "google") {
      params.set("access_type", "offline");
      params.set("prompt", "consent");
    }
    return { url: `${c.authUrl}?${params.toString()}` };
  });

const CompleteInput = z.object({
  provider: ProviderSchema,
  code: z.string().min(4),
  redirectUri: z.string().url(),
});

/** Exchange the auth code for tokens and persist the connection. */
export const completeOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompleteInput.parse(i))
  .handler(async ({ data, context }) => {
    const c = creds(data.provider);
    if (!c.configured) throw new Error("Provider not configured");

    const res = await fetch(c.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: c.clientId!,
        client_secret: c.clientSecret!,
        code: data.code,
        grant_type: "authorization_code",
        redirect_uri: data.redirectUri,
      }),
    });
    const tokens = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      id_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !tokens.access_token) {
      throw new Error(tokens.error_description || tokens.error || "Token exchange failed");
    }

    // Best-effort email from the id_token payload (not signature-verified —
    // used for display only, never for authorization).
    let email: string | undefined;
    if (tokens.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());
        email = payload.email;
      } catch { /* display-only, ignore */ }
    }

    // org_id from the user's profile
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("org_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile?.org_id) throw new Error("Your profile has no organization yet.");

    const { error } = await context.supabase.from("integrations").upsert(
      {
        org_id: profile.org_id,
        user_id: context.userId,
        provider: data.provider,
        status: "connected",
        // NOTE: base64-encoded, not encrypted. For production, wrap with
        // Supabase Vault or KMS before launch.
        connection_key_ciphertext: Buffer.from(
          JSON.stringify({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000,
          }),
        ).toString("base64"),
        metadata: { email, scope: tokens.scope, has_refresh: Boolean(tokens.refresh_token) },
      },
      { onConflict: "org_id,provider,user_id" },
    );
    if (error) throw new Error(error.message);

    return { ok: true as const, provider: data.provider, email };
  });

export const disconnectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ provider: ProviderSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("integrations")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", data.provider);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
