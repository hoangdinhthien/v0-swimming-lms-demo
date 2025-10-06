import config from "./config.json";

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
  departments?: string[];
  position?: string;
  start_date?: string;
  bio?: string;
  emergency_contact?: string;
  address?: string;
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
}: {
  tenantId: string;
  token: string;
  filters?: StaffFilters;
}): Promise<Staff[]> {
  console.log("Fetching staff for tenant:", tenantId, "with filters:", filters);

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
    if (filters.search) {
      params.append("search", filters.search);
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
    console.log("Fetching staff from URL:", url);

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
    console.log("Staff API response:", data);

    // Handle the specific nested array response format
    // Response structure: { data: [[{ data: [...], meta_data: {...} }]], message: "Success", statusCode: 200 }
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const nestedData = data.data[0];
      if (Array.isArray(nestedData) && nestedData.length > 0) {
        const actualData = nestedData[0];
        if (actualData && actualData.data && Array.isArray(actualData.data)) {
          console.log("Found staff data:", actualData.data);
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
  console.log(
    "Fetching staff detail for user ID:",
    staffId,
    "tenant:",
    tenantId
  );

  try {
    // Since we're getting the user._id, we need to find the staff record by filtering the list
    // First get all staff and find the one with matching user._id
    const staffList = await fetchStaff({
      tenantId,
      token: token || "",
    });

    console.log("Staff list for detail lookup:", staffList);

    // Find the staff member with matching user._id
    const staffMember = staffList.find(
      (staff: Staff) => staff.user._id === staffId
    );

    if (!staffMember) {
      console.error("Staff member not found with user ID:", staffId);
      throw new Error(`Staff member not found with user ID: ${staffId}`);
    }

    console.log("Found staff detail data:", staffMember);
    return staffMember;
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
  console.log("Creating staff for tenant:", tenantId, "with data:", staffData);

  try {
    // Use the workflow-process endpoint pattern for creation
    const url = buildApiUrl("/v1/workflow-process/manager/user");
    console.log("Creating staff at URL:", url);

    const requestBody = {
      ...staffData,
      tenant_id: tenantId,
      role: "staff", // Ensure role is set to staff
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
    console.log("Create staff API response:", data);

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
  console.log(
    "Updating staff with user ID:",
    staffId,
    "for tenant:",
    tenantId,
    "with updates:",
    updates
  );

  try {
    // Use the correct POST endpoint with user ID as query parameter
    const url = buildApiUrl(`/v1/workflow-process/manager/user?id=${staffId}`);
    console.log("Updating staff at URL:", url);

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

    console.log("Request body for staff update:", requestBody);

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
    console.log("Update staff API response:", data);

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
    console.log("Update successful, fetching updated staff detail");
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
  console.log("Deleting staff:", staffId, "for tenant:", tenantId);

  try {
    // Use the workflow-process endpoint pattern for deletion
    const url = buildApiUrl(`/v1/workflow-process/manager/users/${staffId}`);
    console.log("Deleting staff at URL:", url);

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
    console.log("Delete staff API response:", data);

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
  console.log("Fetching staff statistics for tenant:", tenantId);

  try {
    const url = buildApiUrl(`/staff/statistics?tenant_id=${tenantId}`);
    console.log("Fetching staff statistics from URL:", url);

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
    console.log("Staff statistics API response:", data);

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
  console.log(
    "Toggling staff status:",
    staffId,
    "to",
    isActive ? "active" : "inactive"
  );

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
  console.log("Bulk updating staff:", staffIds, "with updates:", updates);

  try {
    const url = buildApiUrl("/staff/bulk-update");
    console.log("Bulk updating staff at URL:", url);

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
    console.log("Bulk update staff API response:", data);

    return {
      success: true,
      updated: data.updated || staffIds.length,
    };
  } catch (error) {
    console.error("Error bulk updating staff:", error);
    throw error;
  }
}
