import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "owner" | "admin" | "marketing" | "hr" | "employee";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  org: string;
  orgId: string | null;
  avatar?: string;
}

interface AuthCtx {
  user: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

async function loadProfile(u: User): Promise<Profile> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, org_id, organizations(name)")
    .eq("id", u.id)
    .maybeSingle();
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", u.id)
    .maybeSingle();
  const org = (profile as { organizations?: { name?: string } } | null)?.organizations?.name;
  return {
    id: u.id,
    name: profile?.full_name || (u.user_metadata?.full_name as string) || (u.email?.split("@")[0] ?? "Member"),
    email: profile?.email || u.email || "",
    role: (roleRow?.role as Role) ?? "owner",
    org: org ?? "Workspace",
    orgId: profile?.org_id ?? null,
    avatar: profile?.avatar_url ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        // Defer supabase call to avoid deadlock in the callback
        setTimeout(() => {
          loadProfile(s.user).then((p) => mounted && setUser(p)).catch(() => {});
        }, 0);
      } else {
        setUser(null);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const p = await loadProfile(data.session.user);
        if (mounted) setUser(p);
      }
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <Ctx.Provider value={{ user, session, isAuthenticated: !!session, loading, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}