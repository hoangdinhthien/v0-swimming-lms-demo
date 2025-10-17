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
  console.log(
    "[fetchAvailablePermissions] Raw API Response:",
    JSON.stringify(data, null, 2)
  );

  // Unwrap the nested structure to get the permissions array
  // Handle multiple possible response structures
  let permissions: AvailablePermission[] = [];

  if (data?.data) {
    // Try different nested levels
    const nestedData =
      data.data?.[0]?.[0]?.[0] ||
      data.data?.[0]?.[0] ||
      data.data?.[0] ||
      data.data;

    if (Array.isArray(nestedData)) {
      permissions = nestedData;
    } else if (nestedData && typeof nestedData === "object") {
      // If it's an object, try to extract array from common property names
      const objectData = nestedData as any;
      permissions = objectData.permissions || objectData.modules || [];
    }
  }

  // Ensure we always return an array
  if (!Array.isArray(permissions)) {
    console.warn(
      "[fetchAvailablePermissions] Invalid permissions data:",
      permissions
    );
    permissions = [];
  }

  // Remove duplicates based on module name
  const uniquePermissions = permissions.filter((permission, index, self) => {
    const moduleName = permission.module?.[0];
    if (!moduleName) return false;

    // Keep only the first occurrence of each module
    return index === self.findIndex((p) => p.module?.[0] === moduleName);
  });

  console.log(
    "[fetchAvailablePermissions] Deduplicated permissions:",
    uniquePermissions
  );
  console.log(
    "[fetchAvailablePermissions] Removed duplicates:",
    permissions.length - uniquePermissions.length
  );

  return uniquePermissions;
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
    Order: "orders",
    Class: "classes",
    User: "students", // assuming User module refers to students
    News: "news",
    Blog: "news", // assuming Blog is part of news
    Application: "applications",
  };
}

/**
 * Get allowed navigation items for staff based on permissions
 * Only includes modules where staff has GET permission
 */
export function getAllowedNavigationItems(
  staffPermission: StaffPermission | null
): string[] {
  if (!staffPermission?.permission) return [];

  const allowedNavItems = new Set<string>();

  staffPermission.permission.forEach((perm) => {
    // Only include modules where staff has GET permission
    if (perm.action.includes("GET")) {
      perm.module.forEach((module) => {
        switch (module) {
          case "Course":
            allowedNavItems.add("courses");
            break;
          case "Order":
            allowedNavItems.add("orders");
            break;
          case "Class":
            allowedNavItems.add("classes");
            break;
          case "User":
            // User module includes students, instructors, and staff management
            allowedNavItems.add("students");
            allowedNavItems.add("instructors");
            // Note: staff management is only for managers, not included here
            break;
          case "News":
            allowedNavItems.add("news");
            break;
          case "Blog":
            allowedNavItems.add("news"); // Blog is part of news
            break;
          case "Application":
            allowedNavItems.add("applications");
            break;
        }
      });
    }
  });

  return Array.from(allowedNavItems);
}
