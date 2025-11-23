import config from "@/api/config.json";

/**
 * Generic function to fetch staff data for a specific module
 * This API requires the module name to be passed in the 'service' header
 */
export async function fetchStaffData({
  module,
  tenantId,
  token,
  additionalParams = {},
}: {
  module: string; // Module name from staff permissions (e.g., "Class", "Course", "Order", etc.)
  tenantId: string;
  token: string;
  additionalParams?: Record<string, string | number>; // Additional query parameters
}): Promise<any> {
  if (!module || !tenantId || !token) {
    throw new Error("Missing required parameters: module, tenantId, or token");
  }

  // Build query string from additional parameters
  const queryParams = new URLSearchParams();
  Object.entries(additionalParams).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });
  const queryString = queryParams.toString();

  const url = `${config.API}/v1/workflow-process/staff${
    queryString ? `?${queryString}` : ""
  }`;

  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
    service: module, // Pass the module as 'service' header
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(
      `[fetchStaffData] API error for ${module}:`,
      res.status,
      errorText
    );
    throw new Error(`Không thể lấy dữ liệu ${module}: ${res.status}`);
  }

  const data = await res.json();

  return data;
}

/**
 * Fetch Schedule data for staff
 */
export async function fetchStaffSchedules(startDate: string, endDate: string) {
  const { getSelectedTenant } = await import("@/utils/tenant-utils");
  const { getAuthToken } = await import("@/api/auth-utils");

  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId || !token) {
    throw new Error("Missing required tenant ID or authentication token");
  }

  const url = `${config.API}/v1/workflow-process/staff/schedules?startDate=${startDate}&endDate=${endDate}`;

  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
    service: "Class",
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[fetchStaffSchedules] API error:`, res.status, errorText);
    throw new Error(`Không thể lấy dữ liệu lịch học: ${res.status}`);
  }

  const responseData = await res.json();

  return responseData.data || [];
}

// Helper function to check if staff has permission for a specific module and action
export function hasStaffPermission(
  staffPermissions: any,
  module: string,
  action: string
): boolean {
  if (!staffPermissions?.permission) return false;

  return staffPermissions.permission.some(
    (perm: any) => perm.module.includes(module) && perm.action.includes(action)
  );
}

// Specific functions for different modules
export async function fetchStaffCourses(
  additionalParams?: Record<string, string | number>,
  tenantId?: string,
  token?: string
) {
  const finalTenantId =
    tenantId || (await import("@/utils/tenant-utils")).getSelectedTenant();
  const finalToken = token || (await import("@/api/auth-utils")).getAuthToken();
  if (!finalTenantId || !finalToken) throw new Error("Missing tenant or token");
  return fetchStaffData({
    module: "Course",
    tenantId: finalTenantId,
    token: finalToken,
    additionalParams: additionalParams || {},
  });
}

export async function fetchStaffClasses(
  additionalParams?: Record<string, string | number>,
  tenantId?: string,
  token?: string
) {
  const finalTenantId =
    tenantId || (await import("@/utils/tenant-utils")).getSelectedTenant();
  const finalToken = token || (await import("@/api/auth-utils")).getAuthToken();
  if (!finalTenantId || !finalToken) throw new Error("Missing tenant or token");
  return fetchStaffData({
    module: "Class",
    tenantId: finalTenantId,
    token: finalToken,
    additionalParams: additionalParams || {},
  });
}

export async function fetchStaffOrders(
  additionalParams?: Record<string, string | number>,
  tenantId?: string,
  token?: string
) {
  const finalTenantId =
    tenantId || (await import("@/utils/tenant-utils")).getSelectedTenant();
  const finalToken = token || (await import("@/api/auth-utils")).getAuthToken();
  if (!finalTenantId || !finalToken) throw new Error("Missing tenant or token");
  return fetchStaffData({
    module: "Order",
    tenantId: finalTenantId,
    token: finalToken,
    additionalParams: additionalParams || {},
  });
}

export async function fetchStaffUsers(
  additionalParams?: Record<string, string | number>,
  tenantId?: string,
  token?: string
) {
  const finalTenantId =
    tenantId || (await import("@/utils/tenant-utils")).getSelectedTenant();
  const finalToken = token || (await import("@/api/auth-utils")).getAuthToken();
  if (!finalTenantId || !finalToken) throw new Error("Missing tenant or token");
  return fetchStaffData({
    module: "User",
    tenantId: finalTenantId,
    token: finalToken,
    additionalParams: additionalParams || {},
  });
}

export async function fetchStaffNews(
  additionalParams?: Record<string, string | number>,
  tenantId?: string,
  token?: string
) {
  const finalTenantId =
    tenantId || (await import("@/utils/tenant-utils")).getSelectedTenant();
  const finalToken = token || (await import("@/api/auth-utils")).getAuthToken();
  if (!finalTenantId || !finalToken) throw new Error("Missing tenant or token");
  return fetchStaffData({
    module: "News",
    tenantId: finalTenantId,
    token: finalToken,
    additionalParams: additionalParams || {},
  });
}

export async function fetchStaffBlogs(
  additionalParams?: Record<string, string | number>,
  tenantId?: string,
  token?: string
) {
  const finalTenantId =
    tenantId || (await import("@/utils/tenant-utils")).getSelectedTenant();
  const finalToken = token || (await import("@/api/auth-utils")).getAuthToken();
  if (!finalTenantId || !finalToken) throw new Error("Missing tenant or token");
  return fetchStaffData({
    module: "Blog",
    tenantId: finalTenantId,
    token: finalToken,
    additionalParams: additionalParams || {},
  });
}

export async function fetchStaffApplications(
  additionalParams?: Record<string, string | number>,
  tenantId?: string,
  token?: string
) {
  const finalTenantId =
    tenantId || (await import("@/utils/tenant-utils")).getSelectedTenant();
  const finalToken = token || (await import("@/api/auth-utils")).getAuthToken();
  if (!finalTenantId || !finalToken) throw new Error("Missing tenant or token");
  return fetchStaffData({
    module: "Application",
    tenantId: finalTenantId,
    token: finalToken,
    additionalParams: additionalParams || {},
  });
}

// Types for common API responses (you can extend these based on actual API responses)
export interface StaffDataResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
