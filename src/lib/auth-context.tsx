import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "owner" | "admin" | "marketing" | "hr" | "employee";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  org: string;
  avatar?: string;
}

interface AuthCtx {
  user: MockUser | null;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "signatureflow.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const login = (email: string, name?: string) => {
    const u: MockUser = {
      id: "u_" + Math.random().toString(36).slice(2, 8),
      name: name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      role: "owner",
      org: "Acme Studio",
    };
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}