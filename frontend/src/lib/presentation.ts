import type { UserRole } from "../types";

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function canAccess(role: UserRole, roles: readonly UserRole[]) {
  return roles.includes(role);
}
