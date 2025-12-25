import config from "../config.json";
import { getUserFrontendRole } from "../role-utils";

// Helper function to build API URL
function buildApiUrl(endpoint: string): string {
  return `${config.API}${endpoint}`;
}

// Helper function to create headers
function createHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  return headers;
}

// Staff interfaces
export interface StaffUser {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  is_active: boolean;
  role?: string[];
  featured_image?: any;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  parent_id?: string | null;
  role_front?: string[];
  address?: string;
}

export interface Permission {
  module: string[];
  action: string[];
  noReview: boolean;
}

export interface AvailablePermission {
  module: string[];
  action: string[];
  haveReview: boolean;
}

export interface StaffWithPermissions {
  _id: string;
  user: StaffUser;
  permission: Permission[];
  created_at: string;
  updated_at?: string;
  created_by?: any;
  updated_by?: any;
  tenant_id: string;
}

export interface Staff {
  _id: string;
  user: StaffUser;
  tenant_id: string;
  department?: string[];
  position?: string;
  start_date?: string;
  bio?: string;
  emergency_contact?: string;
  address?: string;
  created_at: string;
  updated_at?: string;
  classesAsInstructor?: any[];
  classesAsMember?: any[];
}

export interface CreateStaffRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  birthday?: string;
  address?: string;
  featured_image?: string[];
  departments?: string[];
  position?: string;
  start_date?: string;
  bio?: string;
  emergency_contact?: string;
  is_active?: boolean;
  avatar?: string[]; // Base64 image data
}

export interface UpdateStaffRequest {
  username?: string;
  email?: string;
  phone?: string;
  departments?: string[];
  position?: string;
  start_date?: string;
  bio?: string;
  emergency_contact?: string;
  address?: string;
  is_active?: boolean;
  avatar?: string;
  featured_image?: any; // For avatar uploads
  role_front?: string[]; // User roles
  password?: string; // For password updates
  parent_id?: string; // For hierarchical relationships
  birthday?: string; // Date of birth
}

export interface StaffFilters {
  status?: "active" | "inactive" | "all";
  department?: string;
  position?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Fetch all staff members
export async function fetchStaff({
  tenantId,
  token,
  filters = {},
  searchKey,
}: {
  tenantId: string;
  token: string;
  filters?: StaffFilters;
  searchKey?: string;
}): Promise<Staff[]> {
  try {
    // Build query parameters - using the actual API endpoint
    const params = new URLSearchParams();
    params.append("role", "staff"); // Filter for staff members only

    if (filters.status && filters.status !== "all") {
      params.append(
        "is_active",
        filters.status === "active" ? "true" : "false"
      );
    }
    if (filters.department) {
      params.append("department", filters.department);
    }
    if (filters.position) {
      params.append("position", filters.position);
    }
    // Support both filters.search and searchKey
    const searchValue = searchKey?.trim() || filters.search;
    if (searchValue) {
      params.append("searchKey", searchValue);
    }
    if (filters.page) {
      params.append("page", filters.page.toString());
    }
    if (filters.limit) {
      params.append("limit", filters.limit.toString());
    }

    // Use the actual API endpoint
    const url = buildApiUrl(
      `/v1/workflow-process/manager/users?${params.toString()}`
    );

    // Create headers with both token and tenant ID
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch staff:", response.status, errorText);
      throw new Error(`Failed to fetch staff: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Handle the specific nested array response format
    // Response structure: { data: [[{ data: [...], meta_data: {...} }]], message: "Success", statusCode: 200 }
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const nestedData = data.data[0];
      if (Array.isArray(nestedData) && nestedData.length > 0) {
        const actualData = nestedData[0];
        if (actualData && actualData.data && Array.isArray(actualData.data)) {
          return actualData.data;
        }
      }
    }

    console.warn("Unexpected staff API response format:", data);
    return [];
  } catch (error) {
    console.error("Error fetching staff:", error);
    throw error;
  }
}

// Fetch staff member detail with permissions
export async function fetchStaffDetailWithModule({
  staffId,
  tenantId,
  token,
}: {
  staffId: string;
  tenantId: string;
  token?: string;
}): Promise<StaffWithPermissions | null> {
  try {
    const url = buildApiUrl(
      `/v1/workflow-process/manager/staff-permission?user=${staffId}`
    );

    // Create headers with both token and tenant ID
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch staff with permissions:",
        response.status,
        errorText
      );
      throw new Error(
        `Failed to fetch staff with permissions: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    // Handle the specific nested array response format
    // Response structure: { data: [[[{ _id, user, permission, ... }]]], message: "Success", statusCode: 200 }
    // or when empty: { data: [[[]]], message: "Success", statusCode: 200 }
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const nestedData = data.data[0];
      if (Array.isArray(nestedData) && nestedData.length > 0) {
        const actualData = nestedData[0];
        if (Array.isArray(actualData)) {
          // Check if actualData is an empty array (no permissions/staff data)
          if (actualData.length === 0) {
            return null; // Return null to trigger fallback to fetchStaffDetail
          }
          // This is the new format: triple nested arrays with data
          return actualData[0];
        } else if (
          actualData &&
          actualData.documents &&
          Array.isArray(actualData.documents) &&
          actualData.documents.length > 0
        ) {
          // Fallback to old format with documents property

          return actualData.documents[0];
        } else if (actualData && actualData._id) {
          // Direct object format

          return actualData;
        }
      }
    }

    // Staff member not found - this is expected behavior when staff has no permissions

    return null; // Return null instead of throwing error
  } catch (error) {
    // Only log actual errors, not 404s which are expected
    if (error instanceof Error && !error.message.includes("404")) {
      console.error("Error fetching staff detail with permissions:", error);
    }
    return null; // Return null on error too
  }
}

// Fetch staff member detail
export async function fetchStaffDetail({
  staffId,
  tenantId,
  token,
}: {
  staffId: string;
  tenantId: string;
  token?: string;
}): Promise<Staff> {
  try {
    // Use the direct endpoint to get staff detail by user ID
    const url = buildApiUrl(`/v1/workflow-process/manager/user?id=${staffId}`);

    // Create headers with both token and tenant ID
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch staff detail:",
        response.status,
        errorText
      );
      throw new Error(
        `Failed to fetch staff detail: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    // Handle the specific nested array response format
    // Response structure: { data: [[[{ _id, user, classesAsInstructor, classesAsMember }]]], message: "Success", statusCode: 200 }
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const nestedData = data.data[0];
      if (Array.isArray(nestedData) && nestedData.length > 0) {
        const actualData = nestedData[0];
        if (Array.isArray(actualData) && actualData.length > 0) {
          return actualData[0];
        }
      }
    }

    console.error("Staff member not found with user ID:", staffId);
    throw new Error(`Staff member not found with user ID: ${staffId}`);
  } catch (error) {
    console.error("Error fetching staff detail:", error);
    throw error;
  }
}

// Create new staff member
export async function createStaff({
  tenantId,
  token,
  staffData,
}: {
  tenantId: string;
  token: string;
  staffData: CreateStaffRequest;
}): Promise<Staff> {
  try {
    // Use the workflow-process endpoint pattern for creation
    const url = buildApiUrl("/v1/workflow-process/manager/user");

    const requestBody = {
      ...staffData,
      tenant_id: tenantId,
      role: ["staff"], // Ensure role is set to staff as array
    };

    // Create headers with both token and tenant ID
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create staff:", response.status, errorText);
      throw new Error(
        `Failed to create staff: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    // Handle similar nested response format
    if (data && data.data) {
      // If it follows the same pattern as the list API
      if (Array.isArray(data.data) && data.data.length > 0) {
        const nestedData = data.data[0];
        if (Array.isArray(nestedData) && nestedData.length > 0) {
          const actualData = nestedData[0];
          if (actualData && actualData.data) {
            return actualData.data;
          }
        }
      } else {
        // If it's a simpler structure
        return data.data;
      }
    } else if (data.staff) {
      return data.staff;
    }

    // Fallback return
    return data;
  } catch (error) {
    console.error("Error creating staff:", error);
    throw error;
  }
}

// Update staff member
export async function updateStaff({
  staffId,
  tenantId,
  token,
  updates,
}: {
  staffId: string;
  tenantId: string;
  token: string;
  updates: UpdateStaffRequest;
}): Promise<Staff> {
  try {
    // Use the correct POST endpoint with user ID as query parameter
    const url = buildApiUrl(`/v1/workflow-process/manager/user?id=${staffId}`);

    // Map the updates to match the API expected fields
    const requestBody: any = {};

    if (updates.username) requestBody.username = updates.username;
    if (updates.email) requestBody.email = updates.email;
    if (updates.phone) requestBody.phone = updates.phone;
    if (updates.address) requestBody.address = updates.address;
    if (updates.featured_image)
      requestBody.featured_image = updates.featured_image;
    // if (updates.role_front) requestBody.role_front = updates.role_front;
    if (typeof updates.is_active === "boolean")
      requestBody.is_active = updates.is_active;
    if (updates.password) requestBody.password = updates.password;

    // Note: parent_id, birthday are available in API but not commonly updated
    // from the staff management interface, so we don't include them unless specifically needed

    // Create headers with both token and tenant ID
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "PUT", // Use POST method as specified
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update staff:", response.status, errorText);
      throw new Error(
        `Failed to update staff: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    // Handle similar nested response format
    if (data && data.data) {
      // If it follows the same pattern as the list API
      if (Array.isArray(data.data) && data.data.length > 0) {
        const nestedData = data.data[0];
        if (Array.isArray(nestedData) && nestedData.length > 0) {
          const actualData = nestedData[0];
          if (actualData && actualData.data) {
            return actualData.data;
          }
        }
      } else {
        // If it's a simpler structure
        return data.data;
      }
    } else if (data.staff) {
      return data.staff;
    }

    // Fallback return - after successful update, fetch the updated data
    return await fetchStaffDetail({
      staffId,
      tenantId,
      token,
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    throw error;
  }
}

// Delete staff member
export async function deleteStaff({
  staffId,
  tenantId,
  token,
}: {
  staffId: string;
  tenantId: string;
  token: string;
}): Promise<{ success: boolean }> {
  try {
    // Use the workflow-process endpoint pattern for deletion
    const url = buildApiUrl(`/v1/workflow-process/manager/users/${staffId}`);

    // Create headers with both token and tenant ID
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to delete staff:", response.status, errorText);
      throw new Error(
        `Failed to delete staff: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    return { success: true };
  } catch (error) {
    console.error("Error deleting staff:", error);
    throw error;
  }
}

// Get staff statistics
export async function getStaffStatistics({
  tenantId,
  token,
}: {
  tenantId: string;
  token: string;
}): Promise<{
  total: number;
  active: number;
  inactive: number;
  departments: string[];
  positions: string[];
}> {
  try {
    const url = buildApiUrl(`/staff/statistics?tenant_id=${tenantId}`);

    const response = await fetch(url, {
      method: "GET",
      headers: createHeaders(token),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch staff statistics:",
        response.status,
        errorText
      );
      throw new Error(
        `Failed to fetch staff statistics: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    // Handle different response formats
    if (data.data) {
      return data.data;
    } else {
      return data;
    }
  } catch (error) {
    console.error("Error fetching staff statistics:", error);
    // Return default statistics if API fails
    return {
      total: 0,
      active: 0,
      inactive: 0,
      departments: [],
      positions: [],
    };
  }
}

// Activate/Deactivate staff member
export async function toggleStaffStatus({
  staffId,
  tenantId,
  token,
  isActive,
}: {
  staffId: string;
  tenantId: string;
  token: string;
  isActive: boolean;
}): Promise<Staff> {
  return updateStaff({
    staffId,
    tenantId,
    token,
    updates: { is_active: isActive },
  });
}

// Bulk operations
export async function bulkUpdateStaff({
  staffIds,
  tenantId,
  token,
  updates,
}: {
  staffIds: string[];
  tenantId: string;
  token: string;
  updates: UpdateStaffRequest;
}): Promise<{ success: boolean; updated: number }> {
  try {
    const url = buildApiUrl("/staff/bulk-update");

    const requestBody = {
      staff_ids: staffIds,
      tenant_id: tenantId,
      updates: updates,
    };

    const response = await fetch(url, {
      method: "PUT",
      headers: createHeaders(token),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to bulk update staff:", response.status, errorText);
      throw new Error(
        `Failed to bulk update staff: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    return {
      success: true,
      updated: data.updated || staffIds.length,
    };
  } catch (error) {
    console.error("Error bulk updating staff:", error);
    throw error;
  }
}

// Fetch available permissions that manager can assign to staff
export async function fetchAvailablePermissions({
  tenantId,
  token,
}: {
  tenantId: string;
  token: string;
}): Promise<AvailablePermission[]> {
  try {
    const url = buildApiUrl(
      "/v1/workflow-process/manager/staff-permission/list"
    );

    // Create headers with both token and tenant ID
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch available permissions:",
        response.status,
        errorText
      );
      throw new Error(
        `Failed to fetch available permissions: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    // Handle the nested array response format: { data: [[[...]]], message: "Success", statusCode: 200 }
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const nestedData = data.data[0];
      if (Array.isArray(nestedData) && nestedData.length > 0) {
        const actualData = nestedData[0];
        if (Array.isArray(actualData)) {
          return actualData;
        }
      }
    }

    console.warn("Unexpected available permissions API response format:", data);
    return [];
  } catch (error) {
    console.error("Error fetching available permissions:", error);
    throw error;
  }
}

// Update staff permissions
export async function updateStaffPermissions({
  staffId,
  tenantId,
  token,
  permissions,
}: {
  staffId: string;
  tenantId: string;
  token: string;
  permissions: Permission[];
}): Promise<{ success: boolean }> {
  try {
    const url = buildApiUrl(
      `/v1/workflow-process/manager/staff-permission?user=${staffId}`
    );

    const requestBody = {
      permission: permissions,
    };

    // Create headers with both token and tenant ID
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to update staff permissions:",
        response.status,
        errorText
      );
      throw new Error(
        `Failed to update staff permissions: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    return { success: true };
  } catch (error) {
    console.error("Error updating staff permissions:", error);
    throw error;
  }
}
