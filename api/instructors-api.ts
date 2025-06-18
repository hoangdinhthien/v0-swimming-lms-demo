import config from "@/api/config.json";

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
  if (!res.ok) throw new Error("Failed to fetch instructors");
  const data = await res.json();
  // Updated: unwrap the nested structure to get the array of instructors
  // The new structure is: data.data[0][0].data
  const instructorsData = data.data?.[0]?.[0]?.data;
  return Array.isArray(instructorsData) ? instructorsData : [];
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
