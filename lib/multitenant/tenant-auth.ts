import type { TenantRole } from "./types";

export interface TenantSession {
  tenantId: string;
  userId: string;
  email: string;
  role: TenantRole;
  companyName: string;
}

const ROLE_PERMISSIONS: Record<TenantRole, string[]> = {
  owner:    ["*"],
  admin:    ["read", "write", "manage_users", "view_billing"],
  manager:  ["read", "write", "manage_leads"],
  operator: ["read", "write_limited"],
  viewer:   ["read"],
};

export function hasPermission(role: TenantRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes("*") || perms.includes(permission);
}

export function canAccessAiCompany(role: TenantRole): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

export function canManageUsers(role: TenantRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewBilling(role: TenantRole): boolean {
  return role === "owner" || role === "admin";
}

// Cookie name for per-tenant admin session
export const TENANT_ADMIN_COOKIE = "cb_admin";

// Super admin cookie (platform-level)
export const SUPER_ADMIN_COOKIE  = "cb_super_admin";
