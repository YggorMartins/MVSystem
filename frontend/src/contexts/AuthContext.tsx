import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { UserRole } from "../types";

interface Session {
  email: string;
  role: UserRole;
}
interface AuthValue {
  session: Session | null;
  login(email: string, password: string): Promise<void>;
  logout(): void;
}
const AuthContext = createContext<AuthValue | null>(null);

function decodeToken(token: string): { role?: UserRole } {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem("mvs_session");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    const expire = () => setSession(null);
    window.addEventListener("mvs:session-expired", expire);
    return () => window.removeEventListener("mvs:session-expired", expire);
  }, []);
  const value = useMemo<AuthValue>(
    () => ({
      session,
      async login(email, password) {
        const { token } = await api<{ token: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const next = { email, role: decodeToken(token).role ?? ("caixa" as UserRole) };
        localStorage.setItem("mvs_token", token);
        localStorage.setItem("mvs_session", JSON.stringify(next));
        setSession(next);
      },
      logout() {
        localStorage.removeItem("mvs_token");
        localStorage.removeItem("mvs_session");
        setSession(null);
      },
    }),
    [session],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider ausente");
  return value;
}
