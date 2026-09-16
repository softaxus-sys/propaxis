import type { Role } from "@prisma/client";

/**
 * Central permission table. Route middleware AND server actions/services both
 * check this — never trust the route guard alone, since server actions can be
 * invoked directly. See docs/ARCHITECTURE.md §8.
 */
export const PERMISSIONS = {
  "listing:create": ["AGENT", "AGENCY_ADMIN", "ADMIN"],
  "listing:publish": ["AGENT", "AGENCY_ADMIN", "ADMIN"],
  "listing:delete": ["AGENCY_ADMIN", "ADMIN"],
  "lead:view:own": ["AGENT", "AGENCY_ADMIN", "ADMIN"],
  "lead:view:agency": ["AGENCY_ADMIN", "ADMIN"],
  "project:manage": ["DEVELOPER", "ADMIN"],
  "verification:review": ["ADMIN"],
  "admin:access": ["ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function requireRole(role: Role | undefined | null, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
