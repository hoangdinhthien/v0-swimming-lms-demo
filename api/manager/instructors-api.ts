import config from "../config.json";
import { getUserFrontendRole } from "../role-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

export interface CreateInstructorData {
  username: string;
  email: string;
  password: string;
  role: string[];
  phone?: string;
  birthday?: string;
  address?: string;
  is_active?: boolean;
}

export interface InstructorSpecialist {
  _id: string;
  user: string | { _id: string; username: string };
  category: Array<{ _id: string; title: string }> | string[];
  age_types: Array<{ _id: string; title: string }> | string[];
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
}

interface InstructorSpecialistApiResponse {
  data: InstructorSpecialist[];
  message: string;
  statusCode: number;
}

export interface UpdateInstructorSpecialistData {
  category: string[];
  age_types: string[];
}

export async function createInstructor({
  data,
  tenantId,
  token,
}: {
  data: CreateInstructorData;
  tenantId: string;
  token: string;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-tenant-id": tenantId,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/user`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create instructor");
  }

  return await response.json();
}

export async function fetchInstructors({
  tenantId,
  token,
  role = "instructor",
  searchKey, // Add searchKey parameter
}: {
  tenantId?: string;
  token?: string;
  role?: string;
  searchKey?: string;
}) {
  if (!tenantId) {
    return [];
  }

  try {
    // Build URL with searchKey parameter
    let url = role
      ? `${config.API}/v1/workflow-process/manager/users?role=${role}`
      : `${config.API}/v1/workflow-process/manager/users`;

    if (searchKey && searchKey.trim()) {
      url += `&searchKey=${encodeURIComponent(searchKey.trim())}`;
    }

    const headers: Record<string, string> = {
      "x-tenant-id": tenantId,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Add service header for staff users
    if (getUserFrontendRole() === "staff") {
      headers["service"] = "User";
    }

    const res = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("🚨 API request failed:", res.status, res.statusText);
      throw new Error("Failed to fetch instructors");
    }

    const data = await res.json();

    // Try multiple possible data structures
    let instructorsData = null;

    // Option 1: data.data[0][0].data (current expected structure)
    if (data.data?.[0]?.[0]?.data) {
      instructorsData = data.data[0][0].data;

      // Extract user objects from the instructor data
      instructorsData = instructorsData.map((item: any) => {
        if (item.user) {
          return {
            ...item,
            _id: item.user._id,
            username: item.user.username,
            email: item.user.email,
            phone: item.user.phone,
            is_active: item.user.is_active,
            role_front: item.user.role_front,
            featured_image: item.user.featured_image,
            birthday: item.user.birthday,
            address: item.user.address,
            created_at: item.user.created_at,
            updated_at: item.user.updated_at,
          };
        }
        return item;
      });
    }
    // Option 2: data.data (direct array)
    else if (Array.isArray(data.data)) {
      instructorsData = data.data;
    }
    // Option 3: data (direct response)
    else if (Array.isArray(data)) {
      instructorsData = data;
    }
    // Option 4: data.data[0] (single nested level)
    else if (data.data?.[0] && Array.isArray(data.data[0])) {
      instructorsData = data.data[0];
    }

    const result = Array.isArray(instructorsData) ? instructorsData : [];

    return result;
  } catch (error) {
    console.error("🚨 Error in fetchInstructors:", error);
    return [];
  }
}

export async function fetchInstructorDetail({
  instructorId,
  tenantId,
  token,
}: {
  instructorId: string;
  tenantId: string;
  token?: string;
}) {
  if (!instructorId || !tenantId || !token) {
    console.error("Missing instructorId, tenantId, or token", {
      instructorId,
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực hoặc ID huấn luyện viên");
  }
  const url = `${config.API}/v1/workflow-process/manager/user?id=${instructorId}`;
  const headers: Record<string, string> = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy thông tin huấn luyện viên");
  }
  const data = await res.json();
  // Unwrap the nested structure: data.data[0][0][0]
  const instructor = data.data?.[0]?.[0]?.[0];
  return instructor || null;
}

export interface UpdateInstructorData {
  username?: string;
  email?: string;
  password?: string;
  role?: string[];
  phone?: string;
  birthday?: string;
  address?: string;
  is_active?: boolean;
  featured_image?: string[]; // Fixed: should be 'featured_image', not 'feature_image'
}

export async function updateInstructor({
  instructorId,
  data,
  tenantId,
  token,
}: {
  instructorId: string;
  data: UpdateInstructorData;
  tenantId: string;
  token: string;
}) {
  if (!instructorId || !tenantId || !token) {
    console.error("Missing instructorId, tenantId, or token", {
      instructorId,
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực hoặc ID huấn luyện viên");
  }

  const url = `${config.API}/v1/workflow-process/manager/user?id=${instructorId}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    // Try to surface a useful server-side error message so the frontend
    // can parse and map field-specific validation errors.
    try {
      const parsed = JSON.parse(errorText);
      const message = parsed.message || parsed.error || JSON.stringify(parsed);
      throw new Error(message);
    } catch (e) {
      // If response is not JSON, include the raw text
      throw new Error(errorText || `Error (${res.status}): ${res.statusText}`);
    }
  }

  const responseData = await res.json();
  return responseData;
}

/**
 * Fetch instructor specialist information
 * @param searchParams - Optional search parameters using find-common format
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with instructor specialist data
 */
export async function fetchInstructorSpecialist({
  searchParams,
  tenantId,
  token,
}: {
  searchParams?: Record<string, string>;
  tenantId?: string;
  token?: string;
}): Promise<InstructorSpecialist[]> {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing tenant ID or authentication token");
  }

  let url = `${config.API}/v1/workflow-process/manager/instructor/specialist`;
  const queryParams = new URLSearchParams();

  // Add find-common search parameters
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      queryParams.append(`search[${key}]`, value);
    });
  }

  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch instructor specialist: ${response.statusText}`
    );
  }

  const result = await response.json();

  // Parse nested response structure: data[0][0].documents
  const documents = result.data?.[0]?.[0]?.documents || [];

  return documents;
}

/**
 * Create or update instructor specialist information
 * @param userId - The instructor's user ID
 * @param data - The specialist data to create/update
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with updated specialist data
 */
export async function updateInstructorSpecialist({
  userId,
  data,
  tenantId,
  token,
}: {
  userId: string;
  data: UpdateInstructorSpecialistData;
  tenantId?: string;
  token?: string;
}): Promise<InstructorSpecialist> {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing tenant ID or authentication token");
  }

  if (!userId) {
    throw new Error("Missing user ID");
  }

  const url = `${config.API}/v1/workflow-process/manager/instructor/specialist?user=${userId}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Failed to update instructor specialist: ${response.statusText}`
    );
  }

  const result = await response.json();

  return result.data;
}
