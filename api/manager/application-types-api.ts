import { getAuthToken } from "../auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";

export interface ApplicationType {
  _id: string;
  title: string;
  type: string[]; // Array of user roles that can use this application type
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface ApplicationTypeResponse {
  data: ApplicationType[][][]; // Based on the API response structure
  message: string;
  statusCode: number;
}

export interface CreateApplicationTypeRequest {
  title: string;
  type: string[];
}

export interface UpdateApplicationTypeRequest {
  title: string;
  type: string[];
}

const BASE_URL =
  "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/v1/workflow-process/manager/application/type";

/**
 * Get list of application types filtered by role
 */
export async function getApplicationTypes(
  role?: string
): Promise<ApplicationType[]> {
  try {
    const token = getAuthToken();
    const tenantId = getSelectedTenant();

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const url = role ? `${BASE_URL}?role=${role}` : BASE_URL;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApplicationTypeResponse = await response.json();

    // Extract the application types from the nested array structure
    const applicationTypes = result.data?.[0]?.[0] || [];

    return applicationTypes;
  } catch (error) {
    console.error("Error fetching application types:", error);
    throw error;
  }
}

/**
 * Create a new application type
 */
export async function createApplicationType(
  data: CreateApplicationTypeRequest
): Promise<void> {
  try {
    const token = getAuthToken();
    const tenantId = getSelectedTenant();

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error creating application type:", error);
    throw error;
  }
}

/**
 * Update an existing application type
 */
export async function updateApplicationType(
  id: string,
  data: UpdateApplicationTypeRequest
): Promise<void> {
  try {
    const token = getAuthToken();
    const tenantId = getSelectedTenant();

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating application type:", error);
    throw error;
  }
}

/**
 * Delete an application type
 */
export async function deleteApplicationType(id: string): Promise<void> {
  try {
    const token = getAuthToken();
    const tenantId = getSelectedTenant();

    if (!token || !tenantId) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-tenant-id": tenantId,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting application type:", error);
    throw error;
  }
}

/**
 * Get role display name in Vietnamese
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: { [key: string]: string } = {
    member: "Học viên",
    instructor: "Giảng viên",
    staff: "Nhân viên",
    manager: "Quản lý",
  };

  return roleMap[role] || role;
}

/**
 * Get role color class for badges
 */
export function getRoleColorClass(role: string): string {
  const colorMap: { [key: string]: string } = {
    member:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    instructor:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    staff:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    manager:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  };

  return (
    colorMap[role] ||
    "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800"
  );
}
