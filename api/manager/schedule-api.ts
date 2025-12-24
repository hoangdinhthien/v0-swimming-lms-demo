import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getUserFrontendRole } from "../role-utils";
import config from "../config.json";

// Define types for the schedule API response
export interface Slot {
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
}

export interface Course {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  category?: string[];
  session_number?: number;
  session_number_duration?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  tenant_id?: string;
  is_active?: boolean;
  slug?: string;
  media?: string[];
}

export interface Classroom {
  _id: string;
  name: string;
  course: Course | string; // Can be Course object or string ID
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  member?: string[]; // Optional member array
  instructor?: string; // Optional instructor ID
}

export interface Pool {
  _id: string;
  title: string;
  type?: string;
  dimensions?: string;
  depth?: string;
  capacity?: number;
  maintance_status?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface Instructor {
  _id: string;
  username: string;
  email?: string;
  phone?: string;
  featured_image?: string[];
  password?: string;
  role_front?: string[];
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  is_active?: boolean;
  parent_id?: any;
  role?: string[];
  address?: string;
  birthday?: string;
}

export interface ScheduleEvent {
  _id: string;
  date: string;
  day_of_week?: number; // Backend uses: 0=Wed, 1=Thu, 2=Fri, 3=Sat, 4=Sun, 5=Mon, 6=Tue (Wednesday-start with modulo-7)
  slot: Slot; // Single slot object, not array
  classroom: Classroom; // Single classroom object, not array
  pool: Pool; // Single pool object, not array
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  instructor?: Instructor; // Optional instructor object
}

export interface PoolOverflowWarning {
  totalMembers: number;
  poolCapacity: number;
  overCapacity: number;
  date: string;
  slot: Slot;
  pool: Pool;
}

export interface ScheduleApiResponse {
  data: ScheduleEvent[][][];
  message: string;
  statusCode: number;
}

export interface FirstSlotResponse {
  data: [[[ScheduleEvent]]];
  message: string;
  statusCode: number;
}

/**
 * Fetch the first slot/schedule event for a specific class
 * @param classId - The ID of the class to fetch first slot for
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with the first schedule event or null if not found
 */
export const fetchFirstSlotByClassId = async (
  classId: string,
  tenantId?: string,
  token?: string
): Promise<ScheduleEvent | null> => {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Tenant ID and token are required");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/schedules/get-first-slot?class=${classId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch first slot: ${response.status} ${errorText}`
    );
  }

  const result: FirstSlotResponse = await response.json();

  // Unwrap nested structure similar to other schedule APIs
  if (result.data && Array.isArray(result.data) && result.data.length > 0) {
    const level1 = result.data[0];
    if (Array.isArray(level1) && level1.length > 0) {
      const level2 = level1[0];
      if (Array.isArray(level2) && level2.length > 0) {
        return level2[0] as ScheduleEvent;
      }
    }
  }

  return null;
};

// Parameters for fetching schedule data
export interface FetchScheduleParams {
  startDate: Date;
  endDate: Date;
  tenantId?: string;
  token?: string;
  service?: string;
}

/**
 * Fetch schedule data from the API
 * @param params - The parameters for fetching schedule data
 * @returns Promise with the flattened schedule events and pool overflow warnings
 */
export const fetchScheduleData = async (
  params: FetchScheduleParams
): Promise<ScheduleDataResult> => {
  const { startDate, endDate, tenantId, token } = params;
  let { service } = params;

  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  // Automatically add service header for staff users if not provided
  if (!service && getUserFrontendRole() === "staff") {
    service = "Schedule";
  }

  // Format dates as YYYY-MM-DD for the API using local date components
  // Avoid using toISOString() because it converts to UTC and can shift the date
  // when the local timezone is behind UTC (e.g. results in previous day).
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}`;
  };

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/schedules?startDate=${startDateStr}&endDate=${endDateStr}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
        ...(service ? { service } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch schedule: ${response.status}`);
  }

  const result: ScheduleApiResponse = await response.json();

  // The API returns nested arrays: data[0][0] = events, data[0][1] = pool overflow warnings
  const flattenedEvents: ScheduleEvent[] = [];
  const poolOverflowWarnings: PoolOverflowWarning[] = [];

  if (result.data && Array.isArray(result.data)) {
    result.data.forEach((outerArray: any) => {
      if (Array.isArray(outerArray)) {
        // First array [0] contains schedule events
        if (outerArray[0] && Array.isArray(outerArray[0])) {
          flattenedEvents.push(...outerArray[0]);
        }
        // Second array [1] contains pool overflow warnings (only if pools exceed capacity)
        if (outerArray[1] && Array.isArray(outerArray[1])) {
          poolOverflowWarnings.push(...outerArray[1]);
        }
      }
    });
  }

  return {
    events: flattenedEvents,
    poolOverflowWarnings,
  };
};

/**
 * Fetch schedule data for a specific month
 * @param date - Any date within the month to fetch
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with schedule events and pool overflow warnings for the month
 */
export const fetchMonthSchedule = async (
  date: Date,
  tenantId?: string,
  token?: string,
  service?: string
): Promise<ScheduleDataResult> => {
  // Get the first and last day of the month
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return fetchScheduleData({
    startDate: firstDay,
    endDate: lastDay,
    tenantId,
    token,
    service,
  });
};

/**
 * Fetch schedule data for a specific date range
 * @param startDate - Start date
 * @param endDate - End date
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with schedule events and pool overflow warnings for the date range
 */
export const fetchDateRangeSchedule = async (
  startDate: Date,
  endDate: Date,
  tenantId?: string,
  token?: string,
  service?: string
): Promise<ScheduleDataResult> => {
  // Automatically add service header for staff users if not provided
  const finalService =
    service || (getUserFrontendRole() === "staff" ? "Schedule" : undefined);

  return fetchScheduleData({
    startDate,
    endDate,
    tenantId,
    token,
    service: finalService,
  });
};

/**
 * Get the start of week (Monday) for a given date
 * @param date - Any date within the week
 * @returns Date object representing the Monday of that week
 */
export const getWeekStart = (date: Date): Date => {
  // Work with UTC to avoid timezone issues
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Create a new date in UTC
  const result = new Date(Date.UTC(year, month, day));
  const dayOfWeek = result.getUTCDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.

  // Calculate days to subtract to get to Monday
  let daysToSubtract;
  if (dayOfWeek === 0) {
    // Sunday
    daysToSubtract = 6; // Go back 6 days to Monday
  } else {
    // Monday=1, Tuesday=2, etc.
    daysToSubtract = dayOfWeek - 1; // Go back (day-1) days to Monday
  }

  result.setUTCDate(result.getUTCDate() - daysToSubtract);
  return result;
};

/**
 * Get the end of week (Sunday) for a given date
 * @param date - Any date within the week
 * @returns Date object representing the Sunday of that week
 */
export const getWeekEnd = (date: Date): Date => {
  // Work with UTC to avoid timezone issues
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Create a new date in UTC
  const result = new Date(Date.UTC(year, month, day));
  const dayOfWeek = result.getUTCDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.

  // Calculate days to add to get to Sunday
  let daysToAdd;
  if (dayOfWeek === 0) {
    // Already Sunday
    daysToAdd = 0;
  } else {
    // Monday=1, Tuesday=2, etc.
    daysToAdd = 7 - dayOfWeek; // Add (7-day) days to get to Sunday
  }

  result.setUTCDate(result.getUTCDate() + daysToAdd);
  result.setUTCHours(23, 59, 59, 999);
  return result;
};

/**
 * Generate an array of weeks for a given month
 * @param date - Any date within the month
 * @returns Array of week objects with start and end dates
 */
export const getWeeksInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const weeks = [];
  let currentWeekStart = getWeekStart(firstDayOfMonth);

  while (currentWeekStart <= lastDayOfMonth) {
    const weekEnd = getWeekEnd(currentWeekStart);

    weeks.push({
      start: new Date(currentWeekStart),
      end: new Date(weekEnd),
      label: `${currentWeekStart.getDate()}/${
        currentWeekStart.getMonth() + 1
      } - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`,
      value: currentWeekStart.toISOString().split("T")[0], // Use start date as value
    });

    // Move to next week
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
};

/**
 * Generate an array of weeks for a given year
 * @param date - Any date within the year
 * @returns Array of week objects with start and end dates for the entire year
 */
export const getWeeksInYear = (date: Date) => {
  const year = date.getFullYear();
  // Start from the first Monday of the year
  let currentWeekStart = getWeekStart(new Date(year, 0, 1));

  // Ensure we're in the correct year
  if (currentWeekStart.getFullYear() < year) {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  const lastDayOfYear = new Date(year, 11, 31);

  const weeks = [];
  while (currentWeekStart.getFullYear() === year) {
    // Calculate the end of this week (Sunday)
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6); // Monday + 6 days = Sunday
    weekEnd.setHours(23, 59, 59, 999);

    const monthNames = [
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
      "T9",
      "T10",
      "T11",
      "T12",
    ];

    const startMonth = monthNames[currentWeekStart.getMonth()];
    const endMonth = monthNames[weekEnd.getMonth()];

    // Create a more descriptive label
    let label;
    if (currentWeekStart.getMonth() === weekEnd.getMonth()) {
      // Same month
      label = `${currentWeekStart.getDate()}-${weekEnd.getDate()} ${startMonth}`;
    } else {
      // Crosses months
      label = `${currentWeekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth}`;
    }

    weeks.push({
      start: new Date(currentWeekStart),
      end: new Date(weekEnd),
      label: label,
      value: currentWeekStart.toISOString().split("T")[0], // Use start date as value
    });

    // Move to next week (add 7 days)
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
};

/**
 * Fetch schedule data for a specific week
 * @param date - Any date within the week to fetch
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with schedule events and pool overflow warnings for the week
 */
export const fetchWeekSchedule = async (
  date: Date,
  tenantId?: string,
  token?: string,
  service?: string
): Promise<ScheduleDataResult> => {
  const weekStart = getWeekStart(date);
  const weekEnd = getWeekEnd(date);
  return fetchScheduleData({
    startDate: weekStart,
    endDate: weekEnd,
    tenantId,
    token,
    service,
  });
};

/**
 * Convert API day_of_week (Monday-based) to JavaScript Date.getDay() (Sunday-based)
 * @param apiDayOfWeek - API day_of_week value (0=Monday, 1=Tuesday, etc.)
 * @returns JavaScript day value (0=Sunday, 1=Monday, etc.)
 */
export const convertApiDayToJsDay = (apiDayOfWeek: number): number => {
  // API: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  // JS:  0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return apiDayOfWeek === 6 ? 0 : apiDayOfWeek + 1;
};

/**
 * Convert JavaScript Date.getDay() (Sunday-based) to API day_of_week (Monday-based)
 * @param jsDay - JavaScript day value (0=Sunday, 1=Monday, etc.)
 * @returns API day_of_week value (0=Monday, 1=Tuesday, etc.)
 */
export const convertJsDayToApiDay = (jsDay: number): number => {
  // JS:  0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // API: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
};

/**
 * Fetch detailed schedule information by schedule ID
 * @param scheduleId - The ID of the schedule to fetch details for
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with detailed schedule information
 */
export const fetchScheduleById = async (
  scheduleId: string,
  tenantId?: string,
  token?: string
): Promise<ScheduleDataResult> => {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users so staff frontend can call manager endpoints
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Schedule";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/schedule?id=${scheduleId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch schedule details: ${response.status}`);
  }

  const result: ScheduleApiResponse = await response.json();

  // The API returns nested arrays: data[0][0] = events, data[0][1] = pool overflow warnings
  const flattenedEvents: ScheduleEvent[] = [];
  const poolOverflowWarnings: PoolOverflowWarning[] = [];

  if (result.data && Array.isArray(result.data)) {
    result.data.forEach((outerArray: any) => {
      if (Array.isArray(outerArray)) {
        // First array [0] contains schedule events
        if (outerArray[0] && Array.isArray(outerArray[0])) {
          flattenedEvents.push(...outerArray[0]);
        }
        // Second array [1] contains pool overflow warnings (only if pools exceed capacity)
        if (outerArray[1] && Array.isArray(outerArray[1])) {
          poolOverflowWarnings.push(...outerArray[1]);
        }
      }
    });
  }

  return {
    events: flattenedEvents,
    poolOverflowWarnings,
  };
};

/**
 * Delete a schedule event by ID
 * @param scheduleId - The ID of the schedule event to delete
 * @returns Promise with the deletion result
 */
export const deleteScheduleEvent = async (
  scheduleId: string
): Promise<{ message: string; statusCode: number }> => {
  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId || !token) {
    throw new Error("Missing authentication or tenant information");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/schedule?id=${scheduleId}`,
    {
      method: "DELETE",
      headers: {
        "x-tenant-id": tenantId,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete schedule event: ${response.status}`);
  }

  const result = await response.json();
  return result;
};

// Interface for auto schedule preview request (single class)
export interface AutoScheduleRequest {
  min_time: number; // Minimum hour (e.g., 7)
  max_time: number; // Maximum hour (e.g., 14)
  session_in_week: number; // Number of sessions per week
  array_number_in_week: number[]; // Days of week: relative to today using modulo-7
  class_id: string; // Class ID
}

// Interface for schedule creation request
export interface AddScheduleRequest {
  date: string; // YYYY-MM-DD format
  slot: string; // Slot ID
  classroom: string; // Class ID
  pool: string; // Pool ID
  instructor: string; // Instructor ID
}

/**
 * Auto schedule classes PREVIEW (supports single or multiple classes)
 * This API generates preview schedules without saving to database
 * @param requestData - Single class or array of classes to auto schedule
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with preview schedule data: { data: [[class1_schedules], [class2_schedules]], message, statusCode }
 */
export const autoScheduleClassPreview = async (
  requestData: AutoScheduleRequest | AutoScheduleRequest[],
  tenantId?: string,
  token?: string
): Promise<{ message: string; statusCode: number; data?: any[][] }> => {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  // Normalize to array format
  const classesData = Array.isArray(requestData) ? requestData : [requestData];

  // Validate each class
  classesData.forEach((classData, index) => {
    // Validate that session_in_week equals array_number_in_week length
    if (classData.session_in_week !== classData.array_number_in_week.length) {
      throw new Error(
        `Lớp ${
          index + 1
        }: Số buổi học trong tuần phải bằng với số ngày được chọn`
      );
    }

    // Validate time range
    if (classData.min_time >= classData.max_time) {
      throw new Error(
        `Lớp ${index + 1}: Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc`
      );
    }

    // Validate days of week (0-7 range based on backend mapping)
    const invalidDays = classData.array_number_in_week.filter(
      (day) => day < 0 || day > 7
    );
    if (invalidDays.length > 0) {
      throw new Error(`Lớp ${index + 1}: Ngày trong tuần không hợp lệ`);
    }
  });

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/schedule/auto/preview`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
        // Add service header for staff users so staff frontend can call manager endpoints
        ...(getUserFrontendRole() === "staff" ? { service: "Schedule" } : {}),
      },
      body: JSON.stringify(classesData), // Always send as array
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Failed to generate schedule preview: ${response.status}`
    );
  }

  const result = await response.json();
  return result;
};

/**
 * Add schedule(s) to class(es)
 * @param scheduleData - Single schedule or array of schedules to create
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with created schedule data
 */
export const addClassToSchedule = async (
  scheduleData: AddScheduleRequest | AddScheduleRequest[],
  tenantId?: string,
  token?: string
): Promise<any> => {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Schedule";
  }

  // Always send as array for consistency
  const requestBody = Array.isArray(scheduleData)
    ? scheduleData
    : [scheduleData];

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/schedule`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to add schedule: ${response.status}`
    );
  }

  const result = await response.json();
  return result;
};

/**
 * Fetch schedule for a specific user (student or instructor)
 * @param userId - The ID of the user (student/instructor)
 * @param tenantId - Optional tenant ID (will use getSelectedTenant if not provided)
 * @param token - Optional auth token (will use getAuthToken if not provided)
 * @returns Schedule data for the user
 */
export const fetchUserSchedule = async (
  userId: string,
  tenantId?: string,
  token?: string
): Promise<any> => {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing tenant ID or auth token");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users so staff frontend can call manager endpoints
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Schedule";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/schedules?user=${userId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to fetch user schedule: ${response.status}`
    );
  }

  const result = await response.json();
  return result;
};
