import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import config from "./config.json";

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
}

export interface Instructor {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
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

// Additional interfaces from classrooms-api
interface ClassroomsApiResponse {
  data: [
    [
      {
        data: Classroom[];
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

export interface ScheduleRequest {
  date: string;
  slot: string;
  classroom: string;
  pool: string;
}

// Interface for creating a new class
export interface CreateClassData {
  course: string; // course id
  name: string; // class name
  instructor: string; // instructor id
  member: string[]; // array of member ids
}

// Interface for updating a class
export interface UpdateClassData {
  course: string; // course id
  name: string; // class name
  instructor: string; // instructor id
  member: string[]; // array of member ids
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

/**
 * Create a new class
 * @param data - The class data to create
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with created class data
 */
export const createClass = async (
  data: CreateClassData,
  tenantId?: string,
  token?: string
): Promise<any> => {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
      },
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

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class?id=${classId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
      },
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
  token?: string
): Promise<Classroom[]> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/classes`,
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
    throw new Error(`Failed to fetch classrooms: ${response.status}`);
  }

  const result: ClassroomsApiResponse = await response.json();

  // Extract classrooms from the nested structure
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].data
  ) {
    return result.data[0][0].data;
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

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/classes?course=${courseId}`,
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
    throw new Error(`Failed to fetch classrooms by course: ${response.status}`);
  }

  const result: ClassroomsApiResponse = await response.json();

  // Extract classrooms from the nested structure
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].data
  ) {
    return result.data[0][0].data;
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

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/classes?${params.toString()}`,
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
    throw new Error(
      `Failed to fetch classrooms by course and schedule: ${response.status}`
    );
  }

  const result: ClassroomsApiResponse = await response.json();

  // Extract classrooms from the nested structure
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].data
  ) {
    return result.data[0][0].data;
  }

  return [];
}

/**
 * Add a class to schedule
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

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/schedule`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    let errorMessage = `Failed to add class to schedule: ${response.status}`;

    try {
      const errorData = await response.json();

      console.log("🚨 Backend error response:", errorData);

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
        console.log("🚨 Backend error text:", errorText);
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
    const classResponse = await fetch(
      `${config.API}/v1/workflow-process/manager/class?id=${classId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": finalTenantId,
          Authorization: `Bearer ${finalToken}`,
        },
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

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class?id=${classId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
      },
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
