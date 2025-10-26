import config from "../config.json";
import { apiRequest } from "../api-utils";
import { getUserFrontendRole } from "../role-utils";

export async function fetchCourses({
  tenantId,
  token,
  page = 1,
  limit = 20,
}: {
  tenantId?: string;
  token?: string;
  page?: number;
  limit?: number;
} = {}) {
  if (!tenantId || !token) return { data: [], total: 0 };

  // Use cached request for courses (5 minutes cache)
  const headers: Record<string, string> = {
    "x-tenant-id": tenantId,
    Authorization: `Bearer ${token}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Course";
  }

  const res = await apiRequest(
    `${config.API}/v1/workflow-process/manager/courses?page=${page}&limit=${limit}`,
    {
      method: "GET",
      requireAuth: true,
      includeTenant: true,
      useCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache
      headers,
    }
  );

  if (!res.ok) throw new Error("Failed to fetch courses");
  const data = await res.json();
  // Defensive: unwrap the nested structure to get the array of courses and total
  const obj = data.data?.[0]?.[0];
  const courseData =
    obj && typeof obj === "object" && "data" in obj ? obj.data : [];
  // meta_data.count is the total number of courses
  const total =
    obj && obj.meta_data && typeof obj.meta_data.count === "number"
      ? obj.meta_data.count
      : courseData.length;
  return {
    data: courseData,
    total,
  };
}

export async function fetchCourseById({
  courseId,
  tenantId,
  token,
}: {
  courseId: string;
  tenantId?: string;
  token?: string;
}) {
  if (!tenantId || !token) throw new Error("Thiếu thông tin tenant hoặc token");

  const headers: Record<string, string> = {
    "x-tenant-id": tenantId,
    Authorization: `Bearer ${token}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Course";
  }

  const res = await fetch(
    `${config.API}/v1/workflow-process/manager/course?id=${courseId}`,
    {
      headers,
      cache: "no-store",
    }
  );
  if (res.status === 404) throw new Error("Không tìm thấy khoá học");
  if (!res.ok) throw new Error("Không thể tải chi tiết khoá học");
  const data = await res.json();
  // Correctly extract the course object from the nested array structure
  const arr = data.data?.[0]?.[0];
  const course = Array.isArray(arr) ? arr[0] : arr;
  return course;
}

// Interface for course creation
export interface CreateCourseData {
  title: string;
  description: string;
  session_number: number;
  session_number_duration: string;
  detail: Array<{ title: string }>;
  category: string[];
  media?: string[];
  is_active: boolean;
  price: number;
}

// Function to create a new course
export async function createCourse({
  courseData,
  tenantId,
  token,
}: {
  courseData: CreateCourseData;
  tenantId: string;
  token: string;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": tenantId,
    Authorization: `Bearer ${token}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Course";
  }

  const res = await fetch(`${config.API}/v1/workflow-process/manager/course`, {
    method: "POST",
    headers,
    body: JSON.stringify(courseData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || `Failed to create course: ${res.status}`
    );
  }

  return await res.json();
}
