/**
 * Fetch Course detail for staff
 */
export async function fetchStaffCourseDetail({
  courseId,
  tenantId,
  token,
}: {
  courseId: string;
  tenantId: string;
  token: string;
}) {
  if (!courseId || !tenantId || !token) {
    throw new Error(
      "Missing required parameters: courseId, tenantId, or token"
    );
  }

  // API expects: search[_id:equal]=courseId as query param, service: Course
  const url = `${config.API}/v1/workflow-process/staff?search[_id:equal]=${courseId}`;

  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
    service: "Course", // Pass Course as 'service' header for course details
    "Content-Type": "application/json",
  };

  console.log(
    `[fetchStaffCourseDetail] Fetching course detail for ID: ${courseId}`
  );
  console.log(`[fetchStaffCourseDetail] URL:`, url);

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[fetchStaffCourseDetail] API error:`, res.status, errorText);
    throw new Error(`Không thể lấy thông tin khoá học: ${res.status}`);
  }

  const responseData = await res.json();
  console.log(`[fetchStaffCourseDetail] Response:`, responseData);

  // Extract course data from nested structure
  // Response structure: { data: [...] }
  const courseData = responseData.data?.[0];

  if (!courseData) {
    throw new Error("Không tìm thấy thông tin khoá học");
  }

  return courseData;
}
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

  console.log(`[fetchStaffSchedules] Fetching schedules from ${startDate} to ${endDate}`);
  console.log(`[fetchStaffSchedules] URL:`, url);

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
  console.log(`[fetchStaffSchedules] Response:`, responseData);

  return responseData.data || [];
}

/**
 * Fetch Student detail for staff
 */
export async function fetchStaffStudentDetail({
  studentId,
  tenantId,
  token,
}: {
  studentId: string;
  tenantId: string;
  token: string;
}) {
  if (!studentId || !tenantId || !token) {
    throw new Error(
      "Missing required parameters: studentId, tenantId, or token"
    );
  }

  const url = `${config.API}/v1/workflow-process/staff?role=member&id=${studentId}`;

  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
    service: "User", // Pass User as 'service' header for student details
    "Content-Type": "application/json",
  };

  console.log(
    `[fetchStaffStudentDetail] Fetching student detail for ID: ${studentId}`
  );
  console.log(`[fetchStaffStudentDetail] URL:`, url);

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(
      `[fetchStaffStudentDetail] API error:`,
      res.status,
      errorText
    );
    throw new Error(`Không thể lấy thông tin học viên: ${res.status}`);
  }

  const responseData = await res.json();
  console.log(`[fetchStaffStudentDetail] Response:`, responseData);

  // Extract student data from nested structure
  // Response structure: { data: { data: [...], meta_data: {...} }, message: "Success", statusCode: 200 }
  const studentData = responseData.data?.data?.[0];

  if (!studentData) {
    throw new Error("Không tìm thấy thông tin học viên");
  }

  return studentData;
}

/**
 * Fetch Instructor detail for staff
 */
export async function fetchStaffInstructorDetail({
  instructorId,
  tenantId,
  token,
}: {
  instructorId: string;
  tenantId: string;
  token: string;
}) {
  if (!instructorId || !tenantId || !token) {
    throw new Error(
      "Missing required parameters: instructorId, tenantId, or token"
    );
  }

  const url = `${config.API}/v1/workflow-process/staff?role=instructor&id=${instructorId}`;

  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
    service: "User", // Pass User as 'service' header for instructor details
    "Content-Type": "application/json",
  };

  console.log(
    `[fetchStaffInstructorDetail] Fetching instructor detail for ID: ${instructorId}`
  );
  console.log(`[fetchStaffInstructorDetail] URL:`, url);

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(
      `[fetchStaffInstructorDetail] API error:`,
      res.status,
      errorText
    );
    throw new Error(`Không thể lấy thông tin giáo viên: ${res.status}`);
  }

  const responseData = await res.json();
  console.log(`[fetchStaffInstructorDetail] Response:`, responseData);

  // Extract instructor data from nested structure
  // Response structure: { data: { data: [...], meta_data: {...} }, message: "Success", statusCode: 200 }
  const instructorData = responseData.data?.data?.[0];

  if (!instructorData) {
    throw new Error("Không tìm thấy thông tin giáo viên");
  }

  return instructorData;
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
