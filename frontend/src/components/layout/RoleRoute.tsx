import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { UserRole } from "../../types";
import { canAccess } from "../../lib/presentation";

export function RoleRoute({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { session } = useAuth();
  return session && canAccess(session.role, roles) ? children : <Navigate to="/" replace />;
}
