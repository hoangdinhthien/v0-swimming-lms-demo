import config from "../config.json";

export interface CreateInstructorData {
  username: string;
  email: string;
  password: string;
  role: string[];
  phone?: string;
  birthday?: string;
  address?: string;
  is_active?: boolean;
}

export async function createInstructor({
  data,
  tenantId,
  token,
}: {
  data: CreateInstructorData;
  tenantId: string;
  token: string;
}) {
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
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create instructor");
  }

  return await response.json();
}

export async function fetchInstructors({
  tenantId,
  token,
  role = "instructor",
}: {
  tenantId?: string;
  token?: string;
  role?: string;
}) {
  console.log("🔍 fetchInstructors called with:", {
    tenantId,
    token: token ? "Present" : "Missing",
    role,
  });

  if (!tenantId) {
    console.log("🚨 No tenantId provided, returning empty array");
    return [];
  }

  try {
    const url = role
      ? `${config.API}/v1/workflow-process/manager/users?role=${role}`
      : `${config.API}/v1/workflow-process/manager/users`;

    console.log("🔍 Fetching from URL:", url);

    const res = await fetch(url, {
      headers: {
        "x-tenant-id": tenantId,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: "no-store",
    });

    console.log("🔍 API Response status:", res.status);

    if (!res.ok) {
      console.error("🚨 API request failed:", res.status, res.statusText);
      throw new Error("Failed to fetch instructors");
    }

    const data = await res.json();
    console.log("🔍 Raw API response:", data);

    // Try multiple possible data structures
    let instructorsData = null;

    // Option 1: data.data[0][0].data (current expected structure)
    if (data.data?.[0]?.[0]?.data) {
      instructorsData = data.data[0][0].data;
      console.log("🔍 Using structure: data.data[0][0].data");
      console.log("🔍 Raw instructors data:", instructorsData);

      // Extract user objects from the instructor data
      instructorsData = instructorsData.map((item: any) => {
        if (item.user) {
          return {
            _id: item.user._id,
            username: item.user.username,
            email: item.user.email,
            phone: item.user.phone,
            is_active: item.user.is_active,
            role_front: item.user.role_front,
            featured_image: item.user.featured_image,
            birthday: item.user.birthday,
            address: item.user.address,
            created_at: item.user.created_at,
            updated_at: item.user.updated_at,
          };
        }
        return item;
      });
      console.log("🔍 Processed instructors data:", instructorsData);
    }
    // Option 2: data.data (direct array)
    else if (Array.isArray(data.data)) {
      instructorsData = data.data;
      console.log("🔍 Using structure: data.data");
    }
    // Option 3: data (direct response)
    else if (Array.isArray(data)) {
      instructorsData = data;
      console.log("🔍 Using structure: data (direct array)");
    }
    // Option 4: data.data[0] (single nested level)
    else if (data.data?.[0] && Array.isArray(data.data[0])) {
      instructorsData = data.data[0];
      console.log("🔍 Using structure: data.data[0]");
    }

    console.log("🔍 Extracted instructors data:", instructorsData);

    const result = Array.isArray(instructorsData) ? instructorsData : [];
    console.log("🔍 Final instructors array:", result);

    return result;
  } catch (error) {
    console.error("🚨 Error in fetchInstructors:", error);
    return [];
  }
}

export async function fetchInstructorDetail({
  instructorId,
  tenantId,
  token,
}: {
  instructorId: string;
  tenantId: string;
  token?: string;
}) {
  if (!instructorId || !tenantId || !token) {
    console.error("Missing instructorId, tenantId, or token", {
      instructorId,
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực hoặc ID giáo viên");
  }
  const url = `${config.API}/v1/workflow-process/manager/user?id=${instructorId}`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };
  console.log("[fetchInstructorDetail] URL:", url);
  console.log("[fetchInstructorDetail] Headers:", headers);
  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy thông tin giáo viên");
  }
  const data = await res.json();
  // Unwrap the nested structure: data.data[0][0][0]
  const instructor = data.data?.[0]?.[0]?.[0];
  return instructor || null;
}

export interface UpdateInstructorData {
  username?: string;
  email?: string;
  password?: string;
  role?: string[];
  phone?: string;
  birthday?: string;
  address?: string;
  is_active?: boolean;
  featured_image?: string[]; // Fixed: should be 'featured_image', not 'feature_image'
}

export async function updateInstructor({
  instructorId,
  data,
  tenantId,
  token,
}: {
  instructorId: string;
  data: UpdateInstructorData;
  tenantId: string;
  token: string;
}) {
  if (!instructorId || !tenantId || !token) {
    console.error("Missing instructorId, tenantId, or token", {
      instructorId,
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực hoặc ID giáo viên");
  }

  const url = `${config.API}/v1/workflow-process/manager/user?id=${instructorId}`;
  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  console.log("[updateInstructor] URL:", url);
  console.log("[updateInstructor] Headers:", headers);

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể cập nhật thông tin giáo viên");
  }

  const responseData = await res.json();
  return responseData;
}
