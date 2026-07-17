import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SignatureFlow" },
      { name: "description", content: "Sign in or create your SignatureFlow account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/app/dashboard" });
  }, [isAuthenticated, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") {
      toast.success("Reset link sent", { description: `Check ${email} for password reset instructions.` });
      setMode("signin");
      return;
    }
    if (!email || !password) return toast.error("Please fill all fields");
    login(email, mode === "signup" ? name : undefined);
    toast.success(mode === "signup" ? "Welcome to SignatureFlow" : "Signed in");
    navigate({ to: "/app/dashboard" });
  };

  const social = (provider: string) => {
    login(`demo@${provider}.com`, "Demo User");
    toast.success(`Signed in with ${provider}`);
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block relative bg-hero border-r">
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">SignatureFlow</span>
          </Link>
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-balance">
              "Rolled out to 340 people in a single afternoon."
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              — Priya Nair, Marketing Director at Acme Studio
            </p>
          </div>
          <div className="text-xs text-muted-foreground">© SignatureFlow</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-elegant">
          <CardContent className="p-8">
            <div className="mb-6 lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-display text-lg font-semibold">SignatureFlow</span>
              </Link>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {mode === "forgot" ? "Reset password" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "forgot"
                ? "We'll email you a secure reset link."
                : "Sign in to manage your signatures and team."}
            </p>

            {mode !== "forgot" && (
              <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>
                <TabsContent value="signin" />
                <TabsContent value="signup" />
              </Tabs>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ava Kirsch" className="mt-1.5" />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="mt-1.5" required />
              </div>
              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground">
                      Forgot?
                    </button>
                  </div>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" required />
                </div>
              )}
              <Button type="submit" className="w-full">
                {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </Button>
            </form>

            {mode === "forgot" ? (
              <button onClick={() => setMode("signin")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
                ← Back to sign in
              </button>
            ) : (
              <>
                <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  or continue with
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => social("Google")}>Google</Button>
                  <Button variant="outline" onClick={() => social("Microsoft")}>Microsoft</Button>
                </div>
              </>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to our Terms and Privacy policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}