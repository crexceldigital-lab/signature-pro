declare module "@lovable.dev/cloud-auth-js" {
  export type LovableAuthResult = {
    redirected?: boolean;
    error?: Error | null;
    tokens?: unknown;
  };

  export type SignInOptions = {
    redirect_uri?: string;
    extraParams?: Record<string, string>;
  };

  export function createLovableAuth(): {
    signInWithOAuth: (
      provider: "google" | "apple" | "microsoft" | "lovable",
      opts?: SignInOptions
    ) => Promise<LovableAuthResult>;
  };

  export default createLovableAuth;
}
