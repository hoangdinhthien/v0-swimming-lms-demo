import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import config from "./config.json";

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

// New interfaces for classes list
export interface ClassItem {
  _id: string;
  name: string;
  course: Course;
  member?: string[];
  instructor?: string | string[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface ClassesResponse {
  data: ClassItem[];
  meta_data: {
    count: number;
    page: number;
    limit: number;
  };
}

export interface ClassApiResponse {
  data: ClassDetails[][][];
  message: string;
  statusCode: number;
}

export interface ClassesApiResponse {
  data: [
    [
      {
        data: ClassItem[];
        meta_data: {
          count: number;
          page: number;
          limit: number;
        };
      }
    ]
  ];
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
    `${config.API}/v1/workflow-process/manager/class?id=${classroomId}`,
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

/**
 * Fetch all classes
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @param page - Page number for pagination
 * @param limit - Number of items per page
 * @returns Promise with classes data
 */
export const fetchClasses = async (
  tenantId?: string,
  token?: string,
  page: number = 1,
  limit: number = 10
): Promise<ClassesResponse> => {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/classes?page=${page}&limit=${limit}`,
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
    throw new Error(`Failed to fetch classes: ${response.status}`);
  }

  const result: ClassesApiResponse = await response.json();

  // The API returns nested arrays, so we need to flatten them
  let classes: ClassItem[] = [];
  let meta_data = { count: 0, page: 1, limit: 10 };

  if (result.data && Array.isArray(result.data)) {
    result.data.forEach((outerArray: any) => {
      if (Array.isArray(outerArray)) {
        outerArray.forEach((innerArray: any) => {
          if (innerArray && innerArray.data && Array.isArray(innerArray.data)) {
            classes = innerArray.data;
            meta_data = innerArray.meta_data || meta_data;
          }
        });
      }
    });
  }

  return {
    data: classes,
    meta_data: meta_data,
  };
};
