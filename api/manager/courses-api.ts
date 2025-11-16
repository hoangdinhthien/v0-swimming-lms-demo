import config from "../config.json";
import { apiRequest } from "../api-utils";
import { getUserFrontendRole } from "../role-utils";
import { apiCache } from "../../utils/api-cache";

export async function fetchCourses({
  tenantId,
  token,
  page = 1,
  limit = 20,
  searchKey, // Add searchKey parameter
}: {
  tenantId?: string;
  token?: string;
  page?: number;
  limit?: number;
  searchKey?: string;
} = {}) {
  if (!tenantId || !token) return { data: [], total: 0 };

  // Build URL with searchKey parameter
  let url = `${config.API}/v1/workflow-process/manager/courses?page=${page}&limit=${limit}`;
  if (searchKey && searchKey.trim()) {
    url += `&searchKey=${encodeURIComponent(searchKey.trim())}`;
  }

  // Use cached request for courses (5 minutes cache)
  const headers: Record<string, string> = {
    "x-tenant-id": tenantId,
    Authorization: `Bearer ${token}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Course";
  }

  const res = await apiRequest(url, {
    method: "GET",
    requireAuth: true,
    includeTenant: true,
    useCache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes cache
    headers,
  });

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
  detail: Array<{ title: string; description: string }>;
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

  const result = await res.json();
  // Clear API cache so lists (fetchCourses) will reflect the new course promptly
  try {
    apiCache.clear();
  } catch (e) {
    // swallow errors from cache clearing to avoid breaking create flow
    console.warn("Failed to clear API cache after createCourse:", e);
  }
  return result;
}

// Interface for course update
export interface UpdateCourseData {
  title: string;
  description: string;
  session_number: number;
  session_number_duration: string;
  detail: Array<{ title: string; description: string }>;
  category: string[];
  media?: string[];
  is_active: boolean;
  price: number;
}

// Function to update an existing course
export async function updateCourse({
  courseId,
  courseData,
  tenantId,
  token,
}: {
  courseId: string;
  courseData: UpdateCourseData;
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

  const res = await fetch(
    `${config.API}/v1/workflow-process/manager/course?id=${courseId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(courseData),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || `Failed to update course: ${res.status}`
    );
  }

  const result = await res.json();
  // Clear cache so course lists reflect the updated course
  try {
    apiCache.clear();
  } catch (e) {
    console.warn("Failed to clear API cache after updateCourse:", e);
  }
  return result;
}
