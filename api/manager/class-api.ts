import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getUserFrontendRole } from "../role-utils";
import config from "../config.json";

// Define types for the class API response
export interface Course {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  session_number?: number;
  session_number_duration?: string;
  media?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  tenant_id?: string;
  is_active?: boolean;
  category?: string[];
  detail?: { title: string }[];
  capacity?: number;
  max_member?: number;
  type_of_age?:
    | string[]
    | Array<{ _id: string; title: string; age_range?: number[] }>;
}

export interface Instructor {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  role_system?: string;
  role?: string[];
  role_front?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  featured_image?: string[];
  birthday?: string;
  cover?: string[];
  parent_id?: any;
  address?: string;
  updated_by?: string;
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
  show_on_regist_course?: boolean; // Add show_on_regist_course field
}

// New interfaces for classes list
export interface ClassItem {
  _id: string;
  name: string;
  course: Course;
  member?: any[];
  instructor?: string | string[] | Instructor;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  schedules?: Schedule[]; // Add schedules array
  show_on_regist_course?: boolean; // Add show_on_regist_course field
}

// Interface for classrooms (from classrooms-api)
export interface Classroom {
  _id: string;
  name: string;
  course: Course;
  member?: string[];
  instructor?: string | Instructor;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  tenant_id?: string;
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
        limit: number;
        skip: number;
        count: number;
        documents: ClassItem[];
      }
    ]
  ];
  message: string;
  statusCode: number;
}

// Additional interfaces from classrooms-api
interface ClassroomsApiResponse {
  data: [
    [
      {
        limit: number;
        skip: number;
        count: number;
        documents: Classroom[];
      }
    ]
  ];
  message: string;
  statusCode: number;
}

export interface ScheduleRequest {
  date: string;
  slot: string;
  classroom: string;
  pool: string;
  instructor: string;
}

// Interface for creating a new class
export interface CreateClassData {
  course: string; // course id
  name: string; // class name
  instructor: string; // instructor id
  member?: string[]; // array of member ids (optional)
  show_on_regist_course?: boolean; // show on registration course (optional)
}

// Interface for updating a class
export interface UpdateClassData {
  course: string; // course id
  name: string; // class name
  instructor: string; // instructor id
  member?: string[]; // array of member ids (optional - use add-member/remove-member endpoints instead)
  show_on_regist_course?: boolean; // show on registration course (optional)
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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class?id=${classroomId}`,
    {
      method: "GET",
      headers,
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
 * @param searchKey - Search key for searching by class name, course title, or instructor name
 * @returns Promise with classes data
 */
export const fetchClasses = async (
  tenantId?: string,
  token?: string,
  page: number = 1,
  limit: number = 10,
  searchKey?: string
): Promise<ClassesResponse> => {
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

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  // Build URL with searchKey param
  let url = `${config.API}/v1/workflow-process/manager/classes?page=${page}&limit=${limit}`;
  if (searchKey && searchKey.trim()) {
    url += `&searchKey=${encodeURIComponent(searchKey.trim())}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch classes: ${response.status}`);
  }

  const result = await response.json();

  // Parse new response structure: data[0][0].data with meta_data
  let classes: ClassItem[] = [];
  let count = 0;
  let limit_val = limit;

  if (
    result.data &&
    Array.isArray(result.data) &&
    result.data[0] &&
    Array.isArray(result.data[0]) &&
    result.data[0][0] &&
    result.data[0][0].data
  ) {
    classes = result.data[0][0].data;
    const metaData = result.data[0][0].meta_data;
    if (metaData) {
      count = metaData.count || 0;
      limit_val = metaData.limit || limit;
    }
  }

  return {
    data: classes,
    meta_data: {
      count: count,
      page: page,
      limit: limit_val,
    },
  };
};

/**
 * Fetch classes by their IDs using search[_id:in] parameter
 * @param classIds - Array of class IDs to fetch
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with classes data
 */
export const fetchClassesByIds = async (
  classIds: string[],
  tenantId?: string,
  token?: string
): Promise<ClassItem[]> => {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing tenant ID or authentication token");
  }

  if (!classIds || classIds.length === 0) {
    return [];
  }

  // Build URL with search[_id:in] parameter
  const idsParam = classIds.join(",");
  const url = `${config.API}/v1/workflow-process/manager/classes/find-common?search[_id:in]=${idsParam}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch classes: ${response.statusText}`);
  }

  const result = await response.json();

  // Extract classes from nested structure: data[0][0].documents
  if (
    result.data &&
    Array.isArray(result.data) &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].documents
  ) {
    return result.data[0][0].documents;
  }

  return [];
};

/**
 * Create a new class
 * @param data - The class data to create (single object or array for batch creation)
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with created class data
 */
export const createClass = async (
  data: CreateClassData | CreateClassData[],
  tenantId?: string,
  token?: string
): Promise<any> => {
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

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to create class: ${response.status}`;

    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (parseError) {
      errorMessage = `Failed to create class: ${response.status} ${errorText}`;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
};

/**
 * Update class details by class ID
 * @param classId - The ID of the class to update
 * @param data - The update data
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with updated class data
 */
export const updateClass = async (
  classId: string,
  data: UpdateClassData,
  tenantId?: string,
  token?: string
): Promise<any> => {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!classId) {
    throw new Error("Class ID is required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class?id=${classId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update class: ${response.status} ${errorText}`);
  }

  return await response.json();
};

// ============================================================================
// Functions migrated from classrooms-api.ts
// ============================================================================

/**
 * Fetch all classrooms
 */
export async function fetchClassrooms(
  tenantId?: string,
  token?: string,
  searchParams?: Record<string, string> // Find-common search
): Promise<Classroom[]> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  // Build URL with search parameters
  let url = `${config.API}/v1/workflow-process/manager/classes`;
  if (searchParams) {
    const queryParams = new URLSearchParams(searchParams);
    url += `?${queryParams.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch classrooms: ${response.status}`);
  }

  const result: ClassroomsApiResponse = await response.json();

  // Extract classrooms from the nested structure: data[0][0].documents
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].documents
  ) {
    return result.data[0][0].documents;
  }

  return [];
}

/**
 * Fetch classrooms by course ID
 */
export async function fetchClassroomsByCourse(
  courseId: string,
  tenantId?: string,
  token?: string
): Promise<Classroom[]> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!courseId) {
    throw new Error("Course ID is required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/classes?course=${courseId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch classrooms by course: ${response.status}`);
  }

  const result: ClassroomsApiResponse = await response.json();

  // Extract classrooms from the nested structure: data[0][0].documents
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].documents
  ) {
    return result.data[0][0].documents;
  }

  return [];
}

/**
 * Fetch classrooms by course ID with schedule filter and search
 */
export async function fetchClassroomsByCourseAndSchedule(
  courseId: string,
  haveSchedule?: boolean,
  searchKey?: string,
  tenantId?: string,
  token?: string
): Promise<Classroom[]> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!courseId) {
    throw new Error("Course ID is required");
  }

  // Build query parameters
  const params = new URLSearchParams({
    course: courseId,
  });

  if (haveSchedule !== undefined) {
    params.append("haveSchedule", haveSchedule.toString());
  }

  if (searchKey && searchKey.trim()) {
    params.append("searchKey", searchKey.trim());
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  const response = await fetch(
    `${
      config.API
    }/v1/workflow-process/manager/classes?${params.toString()}&limit=100`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch classrooms by course and schedule: ${response.status}`
    );
  }

  const result: ClassroomsApiResponse = await response.json();

  // Extract classrooms from the nested structure: data[0][0].documents
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].documents
  ) {
    return result.data[0][0].documents;
  }

  return [];
}

/**
 * @deprecated This function has been moved to schedule-api.ts as addClassToSchedule
 * Please import from schedule-api.ts instead
 */
export async function addClassToSchedule(
  request: ScheduleRequest,
  tenantId?: string,
  token?: string
): Promise<any> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  // Client-side date validation: check if the date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  const requestDate = new Date(request.date);
  requestDate.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  if (requestDate < today) {
    throw new Error(
      "Không thể thêm lớp học vào ngày trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi."
    );
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

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/schedule`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    let errorMessage = `Failed to add class to schedule: ${response.status}`;

    try {
      const errorData = await response.json();

      // Handle specific backend validation errors
      if (response.status === 400 && errorData.message) {
        if (
          errorData.message.includes("Create date validate") ||
          errorData.message.includes("Validates failed: [Create date validate]")
        ) {
          errorMessage =
            "Không thể thêm lớp học vào ngày trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.";
        } else if (
          errorData.message.includes("slot") ||
          errorData.message.includes("time")
        ) {
          errorMessage =
            "Khung giờ đã được sử dụng hoặc không hợp lệ. Vui lòng chọn khung giờ khác.";
        } else if (
          errorData.message.includes("classroom") ||
          errorData.message.includes("class")
        ) {
          errorMessage =
            "Lớp học không hợp lệ hoặc đã được lên lịch. Vui lòng chọn lớp học khác.";
        } else if (errorData.message.includes("pool")) {
          errorMessage =
            "Hồ bơi không hợp lệ hoặc không khả dụng. Vui lòng chọn hồ bơi khác.";
        } else {
          errorMessage = `Lỗi xác thực: ${errorData.message}`;
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (parseError) {
      // If JSON parsing fails, fall back to text
      try {
        const errorText = await response.text();
        errorMessage = `Failed to add class to schedule: ${response.status}, ${errorText}`;
      } catch (textError) {
        errorMessage = `Failed to add class to schedule: ${response.status}`;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Add a user to a class by updating the member array
 */
export async function addUserToClass(
  classId: string,
  userId: string,
  tenantId?: string,
  token?: string
): Promise<any> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!classId || !userId) {
    throw new Error("Class ID and User ID are required");
  }

  // First, fetch the current class details to get all data needed for update
  let classData: any = null;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": finalTenantId,
      Authorization: `Bearer ${finalToken}`,
    };

    // Add service header for staff users
    if (getUserFrontendRole() === "staff") {
      headers["service"] = "Class";
    }

    const classResponse = await fetch(
      `${config.API}/v1/workflow-process/manager/class?id=${classId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (classResponse.ok) {
      const responseData = await classResponse.json();
      // Extract class data from the nested structure
      if (responseData.data && Array.isArray(responseData.data)) {
        responseData.data.forEach((outerArray: any) => {
          if (Array.isArray(outerArray)) {
            outerArray.forEach((innerArray: any) => {
              if (Array.isArray(innerArray) && innerArray.length > 0) {
                classData = innerArray[0];
              }
            });
          }
        });
      }
    }
  } catch (error) {
    console.error("Error fetching class details:", error);
    throw new Error("Không thể tải thông tin lớp học");
  }

  if (!classData) {
    throw new Error("Không tìm thấy thông tin lớp học");
  }

  // Extract existing members and other required fields
  const existingMembers = classData.member
    ? classData.member.map((member: any) =>
        typeof member === "string" ? member : member._id
      )
    : [];

  // Check if user is already in the class
  if (existingMembers.includes(userId)) {
    throw new Error("Học viên đã có trong lớp học này");
  }

  // Prepare update data with all required fields
  const updateData = {
    course:
      typeof classData.course === "string"
        ? classData.course
        : classData.course._id,
    name: classData.name,
    instructor:
      typeof classData.instructor === "string"
        ? classData.instructor
        : classData.instructor?._id || "",
    member: [...existingMembers, userId],
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class?id=${classId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    let errorMessage = `Failed to add user to class: ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (parseError) {
      try {
        const errorText = await response.text();
        errorMessage = `Failed to add user to class: ${response.status}, ${errorText}`;
      } catch (textError) {
        errorMessage = `Failed to add user to class: ${response.status}`;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Add member(s) to a class using the add-member endpoint
 * @param classId - The ID of the class
 * @param members - Single member ID string or array of member IDs
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with response data
 */
export async function addMemberToClass(
  classId: string,
  members: string | string[],
  tenantId?: string,
  token?: string
): Promise<any> {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!classId) {
    throw new Error("Class ID is required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  // Prepare request body - can be single object or array
  const requestBody = Array.isArray(members)
    ? members.map((memberId) => ({ member: memberId }))
    : { member: members };

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class/add-member?id=${classId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Failed to add member(s) to class: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Remove member(s) from a class using the remove-member endpoint
 * @param classId - The ID of the class
 * @param members - Single member ID string or array of member IDs
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @param order - Optional order ID for refund scenarios
 * @returns Promise with response data
 */
export async function removeMemberFromClass(
  classId: string,
  members: string | string[],
  tenantId?: string,
  token?: string,
  order?: string
): Promise<any> {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!classId) {
    throw new Error("Class ID is required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  // Prepare request body - can be single object or array
  const requestBody = Array.isArray(members)
    ? members.map((memberId) => ({ member: memberId }))
    : { member: members };

  // Build URL with optional order parameter
  let url = `${config.API}/v1/workflow-process/manager/class/remove-member?id=${classId}`;
  if (order) {
    url += `&order=${order}`;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Failed to remove member(s) from class: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================================
// DEPRECATED: Create class and auto-schedule in one API call
// This functionality has been replaced by separate create + schedule preview workflow
// ============================================================================

/**
 * @deprecated This interface is no longer used. Use CreateClassData + AutoScheduleRequest instead
 */
export interface CreateAndAutoScheduleRequest {
  course: string; // course id
  name: string; // class name
  instructor: string; // instructor id
  show_on_regist_course?: boolean; // optional, defaults to false
  min_time: number; // minimum hour (0-23)
  max_time: number; // maximum hour (0-23)
  session_in_week: number; // number of sessions per week
  array_number_in_week: number[]; // array of backend day numbers
}

/**
 * @deprecated This API has been removed from backend. Use createClass + autoScheduleClassPreview instead
 * @see createClass for creating classes
 * @see autoScheduleClassPreview in schedule-api.ts for preview schedules
 */
export const createAndAutoScheduleClasses = async (
  requestData: CreateAndAutoScheduleRequest | CreateAndAutoScheduleRequest[],
  tenantId?: string,
  token?: string
): Promise<{ message: string; statusCode: number; data?: any }> => {
  throw new Error(
    "createAndAutoScheduleClasses has been deprecated. Please use createClass() followed by autoScheduleClassPreview() from schedule-api.ts instead."
  );
};

// ============================================================================
// Class Notes API
// ============================================================================

export interface ClassNote {
  _id: string;
  member: {
    _id: string;
    username: string;
    email?: string;
    role_front?: string[];
    parent_id?: string[];
    is_active?: boolean;
    birthday?: string;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    featured_image?: string[];
    role?: string[];
  };
  class: {
    _id: string;
    name: string;
    course: string;
    instructor: string;
    show_on_regist_course?: boolean;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    tenant_id?: string;
    member?: string[];
    member_passed?: string[];
  };
  schedule?: {
    _id: string;
    slot: string;
    date: string;
    classroom: string;
    pool: string;
    instructor: string;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    tenant_id?: string;
  };
  note: string; // JSON string that needs to be parsed
  created_at: string;
  created_by: {
    _id: string;
    username: string;
    email?: string;
    role_front?: string[];
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    featured_image?: string[];
    role?: string[];
  };
  updated_at: string;
  updated_by: {
    _id: string;
    username: string;
    email?: string;
    role_front?: string[];
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    featured_image?: string[];
    role?: string[];
  };
  tenant_id: string;
}

export interface ClassNotesResponse {
  data: [
    [
      {
        limit: number;
        skip: number;
        count: number;
        documents: ClassNote[];
      }
    ]
  ];
  message: string;
  statusCode: number;
}

/**
 * Fetch class notes for a specific class
 * @param classId - The ID of the class to fetch notes for
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with class notes data
 */
export const fetchClassNotes = async (
  scheduleId: string,
  tenantId?: string,
  token?: string
): Promise<ClassNote[]> => {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!scheduleId) {
    throw new Error("Schedule ID is required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "Class";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class/note?search[schedule._id:equal]=${scheduleId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch class notes: ${response.status}`);
  }

  const result: ClassNotesResponse = await response.json();

  // Extract documents from nested response
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].documents
  ) {
    return result.data[0][0].documents;
  }

  return [];
};
