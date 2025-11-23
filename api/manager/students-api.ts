import config from "../config.json";
import { getUserFrontendRole } from "../role-utils";

export interface CreateStudentData {
  username: string;
  email: string;
  password: string;
  role: string[];
  phone?: string;
  birthday?: string; // Changed from date_of_birth to birthday to match backend
  address?: string;
  parent_id?: string; // Changed from parent_name/parent_phone to parent_id
  is_active?: boolean; // Added field for active status
}

export async function createStudent({
  data,
  tenantId,
  token,
}: {
  data: CreateStudentData;
  tenantId: string;
  token: string;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-tenant-id": tenantId,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/user`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  );

  // If HTTP status is not OK, parse body (if possible) and throw with a helpful message
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage =
        errorData.message ||
        errorData.error ||
        `Error (${response.status}): ${response.statusText}`;
    } catch (e) {
      errorMessage = `Error (${response.status}): ${
        errorText || response.statusText
      }`;
    }
    console.error("API error response:", errorText);
    throw new Error(errorMessage);
  }

  // If HTTP status is OK, the backend may still return an error inside the JSON body
  const json = await response.json();

  // Helper: recursively search for error-like indicators in the JSON response
  const findErrorMessage = (obj: any, depth = 0): string | null => {
    if (!obj || depth > 4) return null;
    if (typeof obj === "string") {
      const lower = obj.toLowerCase();
      // Common error keywords
      if (
        lower.includes("error") ||
        lower.includes("duplicate") ||
        lower.includes("exists") ||
        lower.includes("failed") ||
        lower.includes("invalid")
      ) {
        return obj;
      }
      return null;
    }
    if (typeof obj === "number" || typeof obj === "boolean") return null;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const m = findErrorMessage(item, depth + 1);
        if (m) return m;
      }
      return null;
    }
    // obj is plain object
    // direct fields
    if (obj.success === false) {
      if (obj.message) return obj.message;
      if (obj.error)
        return typeof obj.error === "string"
          ? obj.error
          : JSON.stringify(obj.error);
      return "Unknown error from API";
    }
    if (obj.status && String(obj.status).toLowerCase() === "error") {
      return obj.message || obj.error || "Unknown error from API";
    }
    if (
      obj.error &&
      (typeof obj.error === "string" || typeof obj.error === "object")
    ) {
      return typeof obj.error === "string"
        ? obj.error
        : obj.error.message || JSON.stringify(obj.error);
    }
    if (obj.message && typeof obj.message === "string") {
      // Some APIs return a message field for errors
      const lower = obj.message.toLowerCase();
      if (
        lower.includes("error") ||
        lower.includes("duplicate") ||
        lower.includes("exists") ||
        lower.includes("failed") ||
        lower.includes("invalid") ||
        lower.includes("already")
      ) {
        return obj.message;
      }
    }

    // check nested
    for (const key of Object.keys(obj)) {
      try {
        const m = findErrorMessage(obj[key], depth + 1);
        if (m) return m;
      } catch (e) {
        // ignore
      }
    }
    return null;
  };

  const detected = findErrorMessage(json);
  if (detected) {
    console.error("API returned error inside 200 response:", detected, json);
    throw new Error(detected);
  }

  return json;
}

export async function fetchStudents({
  tenantId,
  token,
  role = "member",
  searchKey, // Add searchKey parameter
}: {
  tenantId?: string;
  token?: string;
  role?: string;
  searchKey?: string;
}) {
  if (!tenantId) return [];

  const headers: Record<string, string> = {
    "x-tenant-id": tenantId,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  // Build URL with searchKey parameter
  let url = `${config.API}/v1/workflow-process/manager/users?role=${role}`;
  if (searchKey && searchKey.trim()) {
    url += `&searchKey=${encodeURIComponent(searchKey.trim())}`;
  }

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không thể lấy danh sách học viên");
  const data = await res.json();
  // Defensive: unwrap the nested structure to get the array of students
  const obj = data.data?.[0]?.[0];
  return obj && typeof obj === "object" && "data" in obj ? obj.data : [];
}

export async function fetchStudentDetail({
  studentId,
  tenantId,
  token,
}: {
  studentId: string;
  tenantId: string;
  token?: string;
}) {
  if (!studentId || !tenantId || !token) {
    console.error("Missing studentId, tenantId, or token", {
      studentId,
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực hoặc ID học viên");
  }
  const url = `${config.API}/v1/workflow-process/manager/user?id=${studentId}`;
  const headers: Record<string, string> = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy thông tin học viên");
  }
  const data = await res.json();
  // Unwrap the nested structure: data.data[0][0][0]
  const student = data.data?.[0]?.[0]?.[0];
  return student || null;
}

/**
 * Fetches users that don't have a parent assigned
 * This is used for the parent selection dropdown when creating a new student
 */
export async function fetchUsersWithoutParent({
  tenantId,
  token,
  role = "member",
}: {
  tenantId: string;
  token: string;
  role?: string;
}) {
  if (!tenantId || !token) {
    console.error("Missing tenantId or token", { tenantId, token });
    throw new Error("Thiếu thông tin xác thực");
  }

  const url = `${config.API}/v1/workflow-process/manager/users?have_parent=false&role=${role}`;
  const headers: Record<string, string> = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy danh sách người dùng không có phụ huynh");
  }

  const data = await res.json();

  // Extract data from the specific nested structure:
  // data.data[0][0].data is the array of users without parents
  try {
    const usersArray = data.data?.[0]?.[0]?.data || [];
    return usersArray;
  } catch (err) {
    console.error("Error parsing users without parents:", err);
    return [];
  }
}

export interface UpdateStudentData {
  username?: string;
  email?: string;
  password?: string;
  role_front?: string[]; // Changed from role to role_front to match API
  phone?: string;
  birthday?: string;
  address?: string;
  parent_id?: string; // Changed back to string (not array) for updates
  is_active?: boolean;
  featured_image?: string[]; // Added featured_image field
}

/**
 * Fetches students who have paid for a specific course (by order)
 * This is used when creating a class to show only students who have paid for the selected course
 */
export async function fetchStudentsByCourseOrder({
  courseId,
  tenantId,
  token,
}: {
  courseId: string;
  tenantId: string;
  token: string;
}) {
  if (!courseId || !tenantId || !token) {
    console.error("Missing courseId, tenantId, or token", {
      courseId,
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực hoặc ID khóa học");
  }

  const url = `${config.API}/v1/workflow-process/manager/users/get-by-order?course=${courseId}`;
  const headers: Record<string, string> = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy danh sách học viên đã thanh toán khóa học");
  }

  const data = await res.json();

  // Extract data from the nested structure: data.data[0][0]
  // Each item in the array represents a student with their information
  try {
    let studentsArray = [];

    // Try different possible structures
    if (data.data?.[0]?.[0]) {
      studentsArray = data.data[0][0];
    } else if (data.data?.[0]) {
      studentsArray = data.data[0];
    } else if (data.data) {
      studentsArray = data.data;
    } else {
      return [];
    }

    // Handle case where each student might be a single object instead of array
    const transformedStudents = studentsArray
      .filter((studentData: any) => {
        // Filter out any null/undefined/invalid entries
        return studentData != null;
      })
      .map((studentData: any) => {
        let student,
          additionalInfo: any = {};

        // Check if studentData is an array [userInfo, additionalInfo] or a single object
        if (Array.isArray(studentData)) {
          student = studentData[0]; // Main user data
          additionalInfo = studentData[1] || {}; // Additional info (like featured_image)
        } else {
          // studentData is a single object
          student = studentData;
        }

        // Safety check for student data
        if (!student || !student._id) {
          console.warn(
            "[fetchStudentsByCourse] Invalid student data:",
            studentData
          );
          return null;
        }

        // Get featured_image from the main student data or additional info
        let featured_image = student.featured_image;
        if (!featured_image && additionalInfo.featured_image) {
          featured_image = additionalInfo.featured_image;
        }

        return {
          _id: student._id,
          user: {
            _id: student._id,
            username: student.username,
            email: student.email,
            phone: student.phone,
            featured_image: featured_image,
          },
        };
      })
      .filter((student: any) => student !== null); // Remove any null entries

    return transformedStudents;
  } catch (err) {
    console.error("Error parsing students by course:", err);
    return [];
  }
}

/**
 * Updates an existing student's information
 */
export async function updateStudent({
  studentId,
  data,
  tenantId,
  token,
}: {
  studentId: string;
  data: UpdateStudentData;
  tenantId: string;
  token: string;
}) {
  if (!studentId || !tenantId || !token) {
    console.error("Missing studentId, tenantId, or token", {
      studentId,
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực hoặc ID học viên");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/user?id=${studentId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-tenant-id": tenantId,
        // Add service header for staff users
        ...(getUserFrontendRole() === "staff" && { service: "User" }),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage =
        errorData.message ||
        `Error (${response.status}): ${response.statusText}`;
    } catch (e) {
      errorMessage = `Error (${response.status}): ${
        errorText || response.statusText
      }`;
    }
    console.error("API error response:", errorText);
    throw new Error(errorMessage);
  }

  return await response.json();
}
