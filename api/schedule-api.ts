import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import config from "./config.json";

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

export interface Classroom {
  _id: string;
  name: string;
  course: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface ScheduleEvent {
  _id: string;
  date: string;
  day_of_week: number; // Monday-based: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
  slot: Slot[];
  classroom: Classroom[];
  course: string[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface ScheduleApiResponse {
  data: ScheduleEvent[][][];
  message: string;
  statusCode: number;
}

// Parameters for fetching schedule data
export interface FetchScheduleParams {
  startDate: Date;
  endDate: Date;
  tenantId?: string;
  token?: string;
}

/**
 * Fetch schedule data from the API
 * @param params - The parameters for fetching schedule data
 * @returns Promise with the flattened schedule events
 */
export const fetchScheduleData = async (
  params: FetchScheduleParams
): Promise<ScheduleEvent[]> => {
  const { startDate, endDate, tenantId, token } = params;

  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  // Format dates as YYYY-MM-DD for the API
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  const response = await fetch(
    `${config.API}/v1/workflow-process/schedules?startDate=${startDateStr}&endDate=${endDateStr}`,
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
    throw new Error(`Failed to fetch schedule: ${response.status}`);
  }

  const result: ScheduleApiResponse = await response.json();

  // The API returns nested arrays, so we need to flatten them
  const flattenedEvents: ScheduleEvent[] = [];
  if (result.data && Array.isArray(result.data)) {
    result.data.forEach((outerArray: any) => {
      if (Array.isArray(outerArray)) {
        outerArray.forEach((innerArray: any) => {
          if (Array.isArray(innerArray)) {
            flattenedEvents.push(...innerArray);
          }
        });
      }
    });
  }

  return flattenedEvents;
};

/**
 * Fetch schedule data for a specific month
 * @param date - Any date within the month to fetch
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with schedule events for the month
 */
export const fetchMonthSchedule = async (
  date: Date,
  tenantId?: string,
  token?: string
): Promise<ScheduleEvent[]> => {
  // Get the first and last day of the month
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return fetchScheduleData({
    startDate: firstDay,
    endDate: lastDay,
    tenantId,
    token,
  });
};

/**
 * Fetch schedule data for a specific date range
 * @param startDate - Start date
 * @param endDate - End date
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with schedule events for the date range
 */
export const fetchDateRangeSchedule = async (
  startDate: Date,
  endDate: Date,
  tenantId?: string,
  token?: string
): Promise<ScheduleEvent[]> => {
  return fetchScheduleData({
    startDate,
    endDate,
    tenantId,
    token,
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
 * @returns Promise with schedule events for the week
 */
export const fetchWeekSchedule = async (
  date: Date,
  tenantId?: string,
  token?: string
): Promise<ScheduleEvent[]> => {
  const weekStart = getWeekStart(date);
  const weekEnd = getWeekEnd(date);
  return fetchScheduleData({
    startDate: weekStart,
    endDate: weekEnd,
    tenantId,
    token,
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
