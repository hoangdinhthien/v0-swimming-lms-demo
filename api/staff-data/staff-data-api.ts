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

  console.log(`[fetchStaffData] Fetching ${module} data with service header`);
  console.log(`[fetchStaffData] URL:`, url);
  console.log(`[fetchStaffData] Headers:`, headers);

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
  console.log(`[fetchStaffData] ${module} response:`, data);

  return data;
}

/**
 * Fetch Course data for staff
 */
export async function fetchStaffCourses(page = 1, limit = 10) {
  const { getSelectedTenant } = await import("@/utils/tenant-utils");
  const { getAuthToken } = await import("@/api/auth-utils");

  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId || !token) {
    throw new Error("Missing required tenant ID or authentication token");
  }

  return fetchStaffData({
    module: "Course",
    tenantId,
    token,
    additionalParams: { page, limit },
  });
}

/**
 * Fetch Class data for staff
 */
export async function fetchStaffClasses(page = 1, limit = 10) {
  const { getSelectedTenant } = await import("@/utils/tenant-utils");
  const { getAuthToken } = await import("@/api/auth-utils");

  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId || !token) {
    throw new Error("Missing required tenant ID or authentication token");
  }

  return fetchStaffData({
    module: "Class",
    tenantId,
    token,
    additionalParams: { page, limit },
  });
}

/**
 * Fetch Order data for staff
 */
export async function fetchStaffOrders(page = 1, limit = 10) {
  const { getSelectedTenant } = await import("@/utils/tenant-utils");
  const { getAuthToken } = await import("@/api/auth-utils");

  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId || !token) {
    throw new Error("Missing required tenant ID or authentication token");
  }

  return fetchStaffData({
    module: "Order",
    tenantId,
    token,
    additionalParams: { page, limit },
  });
}

/**
 * Fetch User data for staff (includes students, instructors)
 */
export async function fetchStaffUsers({
  tenantId,
  token,
  role,
  page = 1,
  limit = 10,
}: {
  tenantId: string;
  token: string;
  role?: "member" | "instructor" | "staff" | "manager"; // Optional filter by role
  page?: number;
  limit?: number;
}) {
  const additionalParams: Record<string, string | number> = { page, limit };
  if (role) {
    additionalParams.role = role;
  }

  return fetchStaffData({
    module: "User",
    tenantId,
    token,
    additionalParams,
  });
}

/**
 * Fetch Students data for staff (members only)
 */
export async function fetchStaffStudents(page = 1, limit = 10) {
  const { getSelectedTenant } = await import("@/utils/tenant-utils");
  const { getAuthToken } = await import("@/api/auth-utils");

  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId || !token) {
    throw new Error("Missing required tenant ID or authentication token");
  }

  return fetchStaffData({
    module: "User",
    tenantId,
    token,
    additionalParams: { page, limit, role: "member" },
  });
}

/**
 * Fetch Instructors data for staff (instructors only)
 */
export async function fetchStaffInstructors(page = 1, limit = 10) {
  const { getSelectedTenant } = await import("@/utils/tenant-utils");
  const { getAuthToken } = await import("@/api/auth-utils");

  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId || !token) {
    throw new Error("Missing required tenant ID or authentication token");
  }

  return fetchStaffData({
    module: "User",
    tenantId,
    token,
    additionalParams: { page, limit, role: "instructor" },
  });
}

/**
 * Fetch News data for staff
 */
export async function fetchStaffNews(page = 1, limit = 10) {
  const { getSelectedTenant } = await import("@/utils/tenant-utils");
  const { getAuthToken } = await import("@/api/auth-utils");

  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId || !token) {
    throw new Error("Missing required tenant ID or authentication token");
  }

  return fetchStaffData({
    module: "News",
    tenantId,
    token,
    additionalParams: { page, limit },
  });
}

/**
 * Fetch Blog data for staff
 */
export async function fetchStaffBlogs({
  tenantId,
  token,
  page = 1,
  limit = 10,
}: {
  tenantId: string;
  token: string;
  page?: number;
  limit?: number;
}) {
  return fetchStaffData({
    module: "Blog",
    tenantId,
    token,
    additionalParams: { page, limit },
  });
}

/**
 * Fetch Application data for staff
 */
export async function fetchStaffApplications(page = 1, limit = 10) {
  const { getSelectedTenant } = await import("@/utils/tenant-utils");
  const { getAuthToken } = await import("@/api/auth-utils");

  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId || !token) {
    throw new Error("Missing required tenant ID or authentication token");
  }

  return fetchStaffData({
    module: "Application",
    tenantId,
    token,
    additionalParams: { page, limit },
  });
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
