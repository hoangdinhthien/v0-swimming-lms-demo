import config from "@/api/config.json";

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
  console.log("Creating student with data:", data);

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/user`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-tenant-id": tenantId,
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

export async function fetchStudents({
  tenantId,
  token,
  role = "member",
}: {
  tenantId?: string;
  token?: string;
  role?: string;
}) {
  if (!tenantId) return [];
  const res = await fetch(
    `${config.API}/v1/workflow-process/manager/users?role=${role}`,
    {
      headers: {
        "x-tenant-id": tenantId,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: "no-store",
    }
  );
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
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };
  console.log("[fetchStudentDetail] URL:", url);
  console.log("[fetchStudentDetail] Headers:", headers);
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
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  console.log("[fetchUsersWithoutParent] URL:", url);

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
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  console.log("[fetchStudentsByCourse] URL:", url);
  console.log("[fetchStudentsByCourse] Headers:", headers);

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

  console.log("[fetchStudentsByCourse] Full API response:", data);

  // Extract data from the nested structure: data.data[0][0]
  // Each item in the array represents a student with their information
  try {
    let studentsArray = [];

    // Try different possible structures
    if (data.data?.[0]?.[0]) {
      studentsArray = data.data[0][0];
      console.log(
        "[fetchStudentsByCourse] Using nested structure data.data[0][0]"
      );
    } else if (data.data?.[0]) {
      studentsArray = data.data[0];
      console.log("[fetchStudentsByCourse] Using structure data.data[0]");
    } else if (data.data) {
      studentsArray = data.data;
      console.log("[fetchStudentsByCourse] Using structure data.data");
    } else {
      console.log("[fetchStudentsByCourse] No valid data structure found");
      return [];
    }

    console.log("[fetchStudentsByCourse] Raw students array:", studentsArray);

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

    console.log(
      "[fetchStudentsByCourse] Transformed students:",
      transformedStudents
    );
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
