import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

// Define types for the class API response
export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string[];
  session_number: number;
  session_number_duration: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  is_active: boolean;
  slug: string;
}

export interface Schedule {
  _id: string;
  date: string;
  day_of_week: number;
  slot: string[];
  classroom: string[];
  course: string[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface ClassDetails {
  _id: string;
  name: string;
  course: Course;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  schedules: Schedule[];
  total_schedules: number;
  schedule_passed: number;
  schedule_left: number;
  member: any[];
  instructor: any[];
  sessions_exceeded: number;
  sessions_remaining: number;
}

export interface ClassApiResponse {
  data: ClassDetails[][][];
  message: string;
  statusCode: number;
}

/**
 * Fetch class details by classroom ID
 * @param classroomId - The ID of the classroom
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with class details
 */
export const fetchClassDetails = async (
  classroomId: string,
  tenantId?: string,
  token?: string
): Promise<ClassDetails | null> => {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!classroomId) {
    throw new Error("Classroom ID is required");
  }

  const response = await fetch(
    `https://capstone.caucalamdev.io.vn/api/v1/workflow-process/manager/class?id=${classroomId}`,
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
    throw new Error(`Failed to fetch class details: ${response.status}`);
  }

  const result: ClassApiResponse = await response.json();

  // The API returns nested arrays, so we need to flatten them
  let classDetails: ClassDetails | null = null;
  if (result.data && Array.isArray(result.data)) {
    result.data.forEach((outerArray: any) => {
      if (Array.isArray(outerArray)) {
        outerArray.forEach((innerArray: any) => {
          if (Array.isArray(innerArray) && innerArray.length > 0) {
            classDetails = innerArray[0]; // Get the first class details
          }
        });
      }
    });
  }

  return classDetails;
};
