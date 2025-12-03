import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import config from "../config.json";
import { getUserFrontendRole } from "../role-utils";

// Define types for the slot detail API response
export interface Pool {
  _id: string;
  title: string;
  type: string;
  dimensions: string;
  depth: string;
  capacity: number;
  maintance_status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface Classroom {
  _id: string;
  name: string;
  course: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  member?: string[]; // Optional member array
}

export interface SlotSchedule {
  _id: string;
  slot: string; // Slot ID reference
  date: string;
  classroom: Classroom;
  pool: Pool | Pool[]; // Can be single object or array
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface SlotDetail {
  _id: string;
  title: string;
  start_time: number;
  end_time: number;
  duration: string;
  start_minute: number;
  end_minute: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  schedules: SlotSchedule[];
}

export interface SlotDetailApiResponse {
  data: SlotDetail[][][];
  message: string;
  statusCode: number;
}

/**
 * Fetch slot detail data from the API
 * @param slotId - The ID of the slot to fetch details for
 * @param date - The date for the slot (YYYY-MM-DD format)
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with the slot detail information
 */
export const fetchSlotDetail = async (
  slotId: string,
  date: string,
  tenantId?: string,
  token?: string
): Promise<SlotDetail> => {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!slotId || !date) {
    throw new Error("Slot ID and date are required");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/slot?id=${slotId}&date=${date}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
        ...(getUserFrontendRole() === "staff" && { service: "Slot" }),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch slot details: ${response.status}`);
  }

  const result: SlotDetailApiResponse = await response.json();

  // The API returns nested arrays, so we need to flatten them and get the first slot detail
  let slotDetail: SlotDetail | null = null;
  if (result.data && Array.isArray(result.data)) {
    result.data.forEach((outerArray: any) => {
      if (Array.isArray(outerArray)) {
        outerArray.forEach((innerArray: any) => {
          if (Array.isArray(innerArray) && innerArray.length > 0) {
            slotDetail = innerArray[0]; // Get the first (and should be only) slot detail
          }
        });
      }
    });
  }

  if (!slotDetail) {
    throw new Error("No slot detail found in response");
  }

  return slotDetail;
};

/**
 * Helper function to normalize pool data to always be an array
 * @param pool - Pool data that can be a single object or array
 * @returns Array of Pool objects
 */
export const normalizePools = (pool: Pool | Pool[] | undefined): Pool[] => {
  if (!pool) return [];
  if (Array.isArray(pool)) return pool;
  return [pool];
};

/**
 * Format time display from hour and minute
 * @param hour - Hour value
 * @param minute - Minute value
 * @returns Formatted time string (HH:MM)
 */
export const formatTime = (hour: number, minute: number): string => {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Get the time range for a slot
 * @param slotDetail - The slot detail object
 * @returns Formatted time range string
 */
export const getSlotTimeRange = (slotDetail: SlotDetail): string => {
  const startTime = formatTime(slotDetail.start_time, slotDetail.start_minute);
  const endTime = formatTime(slotDetail.end_time, slotDetail.end_minute);
  return `${startTime} - ${endTime}`;
};

/**
 * Fetch all slots from the API
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with array of all slots
 */
export const fetchAllSlots = async (
  tenantId?: string,
  token?: string
): Promise<SlotDetail[]> => {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const response = await fetch(`${config.API}/v1/workflow-process/slots`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": finalTenantId,
      Authorization: `Bearer ${finalToken}`,
      ...(getUserFrontendRole() === "staff" && { service: "Slot" }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch slots: ${response.status}`);
  }

  const result: SlotDetailApiResponse = await response.json();

  // The API returns nested arrays, so we need to flatten them
  let slots: SlotDetail[] = [];
  if (result.data && Array.isArray(result.data)) {
    result.data.forEach((outerArray: any) => {
      if (Array.isArray(outerArray)) {
        outerArray.forEach((innerArray: any) => {
          if (Array.isArray(innerArray)) {
            slots = slots.concat(innerArray);
          }
        });
      }
    });
  }

  // Sort slots by start time
  return slots.sort((a, b) => {
    const timeA = a.start_time * 60 + a.start_minute;
    const timeB = b.start_time * 60 + b.start_minute;
    return timeA - timeB;
  });
};

// Define types for creating/updating slots
export interface CreateSlotData {
  title: string;
  start_time: number;
  end_time: number;
  duration: string;
  start_minute: number;
  end_minute: number;
}

export interface UpdateSlotData extends CreateSlotData {}

/**
 * Create a new slot
 * @param slotData - The slot data to create
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with the created slot information
 */
export const createSlot = async (
  slotData: CreateSlotData,
  tenantId?: string,
  token?: string
): Promise<SlotDetail> => {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/slot`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
        ...(getUserFrontendRole() === "staff" && { service: "Slot" }),
      },
      body: JSON.stringify(slotData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to create slot: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data;
};

/**
 * Update an existing slot
 * @param slotId - The ID of the slot to update
 * @param slotData - The updated slot data
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with the updated slot information
 */
export const updateSlot = async (
  slotId: string,
  slotData: UpdateSlotData,
  tenantId?: string,
  token?: string
): Promise<SlotDetail> => {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!slotId) {
    throw new Error("Slot ID is required");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/slot?id=${slotId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
        ...(getUserFrontendRole() === "staff" && { service: "Slot" }),
      },
      body: JSON.stringify(slotData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to update slot: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data;
};

/**
 * Delete a slot
 * @param slotId - The ID of the slot to delete
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with the deletion result
 */
export const deleteSlot = async (
  slotId: string,
  tenantId?: string,
  token?: string
): Promise<{ message: string }> => {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!slotId) {
    throw new Error("Slot ID is required");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/slot?id=${slotId}`,
    {
      method: "DELETE",
      headers: {
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
        ...(getUserFrontendRole() === "staff" && { service: "Slot" }),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to delete slot: ${response.status}`
    );
  }

  const result = await response.json();
  return { message: result.message || "Slot deleted successfully" };
};
