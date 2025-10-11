import config from "@/api/config.json";

// Types for staff permissions
export interface PermissionModule {
  module: string[];
  action: string[];
  noReview?: boolean;
  haveReview?: boolean;
}

export interface StaffPermission {
  _id: string;
  user: string;
  permission: PermissionModule[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface AvailablePermission {
  module: string[];
  action: string[];
  haveReview: boolean;
}

// API Response types
export interface StaffPermissionResponse {
  data: [[[StaffPermission]]];
  message: string;
  statusCode: number;
}

export interface AvailablePermissionsResponse {
  data: [[[AvailablePermission[]]]];
  message: string;
  statusCode: number;
}

/**
 * Get all available permissions/modules that manager can assign to staff
 */
export async function fetchAvailablePermissions({
  tenantId,
  token,
}: {
  tenantId: string;
  token: string;
}): Promise<AvailablePermission[]> {
  if (!tenantId || !token) {
    throw new Error("Missing tenantId or token");
  }

  const url = `${config.API}/v1/workflow-process/manager/staff-permission/list`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
    "Content-Type": "application/json",
  };

  console.log("[fetchAvailablePermissions] URL:", url);
  console.log("[fetchAvailablePermissions] Headers:", headers);

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy danh sách quyền hạn");
  }

  const data: AvailablePermissionsResponse = await res.json();
  console.log("[fetchAvailablePermissions] Response:", data);

  // Unwrap the nested structure to get the permissions array
  const permissions = data.data?.[0]?.[0]?.[0] || [];
  return permissions;
}

/**
 * Update staff permissions (Manager function)
 */
export async function updateStaffPermissions({
  userId,
  permissions,
  tenantId,
  token,
}: {
  userId: string;
  permissions: PermissionModule[];
  tenantId: string;
  token: string;
}): Promise<void> {
  if (!userId || !tenantId || !token) {
    throw new Error("Missing required parameters");
  }

  const url = `${config.API}/v1/workflow-process/manager/staff-permission?user=${userId}`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
    "Content-Type": "application/json",
  };

  const requestBody = {
    permission: permissions,
  };

  console.log("[updateStaffPermissions] URL:", url);
  console.log("[updateStaffPermissions] Headers:", headers);
  console.log("[updateStaffPermissions] Body:", requestBody);

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể cập nhật quyền hạn nhân viên");
  }

  const data = await res.json();
  console.log("[updateStaffPermissions] Response:", data);
}

/**
 * Get staff permissions (Staff function - for logged in staff)
 */
export async function fetchStaffPermissions({
  tenantId,
  token,
}: {
  tenantId: string;
  token: string;
}): Promise<StaffPermission | null> {
  if (!tenantId || !token) {
    throw new Error("Missing tenantId or token");
  }

  const url = `${config.API}/v1/workflow-process/staff/permission`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
    "Content-Type": "application/json",
  };

  console.log("[fetchStaffPermissions] URL:", url);
  console.log("[fetchStaffPermissions] Headers:", headers);

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy quyền hạn nhân viên");
  }

  const data: StaffPermissionResponse = await res.json();
  console.log("[fetchStaffPermissions] Response:", data);

  // Unwrap the nested structure to get the staff permission
  const staffPermission = data.data?.[0]?.[0]?.[0] || null;
  return staffPermission;
}

// Utility functions for working with permissions

/**
 * Check if staff has permission for a specific module and action
 */
export function hasPermission(
  staffPermission: StaffPermission | null,
  module: string,
  action: string
): boolean {
  if (!staffPermission?.permission) return false;

  return staffPermission.permission.some(
    (perm) => perm.module.includes(module) && perm.action.includes(action)
  );
}

/**
 * Check if staff has review permission for a module
 */
export function hasReviewPermission(
  staffPermission: StaffPermission | null,
  module: string
): boolean {
  if (!staffPermission?.permission) return false;

  const modulePermission = staffPermission.permission.find((perm) =>
    perm.module.includes(module)
  );

  return modulePermission?.noReview === false;
}

/**
 * Get allowed modules for staff
 */
export function getAllowedModules(
  staffPermission: StaffPermission | null
): string[] {
  if (!staffPermission?.permission) return [];

  const modules = new Set<string>();
  staffPermission.permission.forEach((perm) => {
    perm.module.forEach((mod) => modules.add(mod));
  });

  return Array.from(modules);
}

/**
 * Map module names to UI navigation items
 */
export function getModuleNavigationMapping(): Record<string, string> {
  return {
    Course: "courses",
    Order: "transactions",
    Class: "classes",
    User: "students", // assuming User module refers to students
    News: "news",
    Blog: "news", // assuming Blog is part of news
    Application: "applications",
  };
}

/**
 * Get allowed navigation items for staff based on permissions
 */
export function getAllowedNavigationItems(
  staffPermission: StaffPermission | null
): string[] {
  const allowedModules = getAllowedModules(staffPermission);
  const mapping = getModuleNavigationMapping();

  const allowedNavItems = new Set<string>();

  allowedModules.forEach((module) => {
    const navItem = mapping[module];
    if (navItem) {
      allowedNavItems.add(navItem);
    }
  });

  return Array.from(allowedNavItems);
}
