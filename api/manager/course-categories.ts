import config from "../config.json";

export interface CourseCategory {
  _id: string;
  title: string;
  created_at: string;
  created_by: {
    _id: string;
    username: string;
    email: string;
  };
  updated_at: string;
  updated_by: {
    _id: string;
    username: string;
    email: string;
  };
  tenant_id: string;
  is_active?: boolean;
}

export interface CourseCategoriesResponse {
  data: [
    [
      {
        limit: number;
        skip: number;
        count: number;
        documents: CourseCategory[];
      }
    ]
  ];
  message: string;
  statusCode: number;
}

/**
 * Fetch all course categories
 */
export async function fetchAllCourseCategories({
  tenantId,
  token,
}: {
  tenantId: string;
  token?: string;
}): Promise<CourseCategory[]> {
  if (!tenantId) {
    throw new Error("Missing tenantId");
  }

  const headers: Record<string, string> = {
    "x-tenant-id": tenantId,
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    `${config.API}/v1/workflow-process/manager/course-category`,
    {
      headers,
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy danh sách danh mục khóa học");
  }

  const data: CourseCategoriesResponse = await res.json();

  // Extract categories from nested structure
  const categories = data.data?.[0]?.[0]?.documents || [];
  return categories;
}

/**
 * Create a new course category
 */
export async function createCourseCategory({
  title,
  is_active = true,
  tenantId,
  token,
}: {
  title: string;
  is_active?: boolean;
  tenantId: string;
  token: string;
}): Promise<CourseCategory> {
  if (!title || !tenantId || !token) {
    throw new Error("Missing required fields: title, tenantId, or token");
  }

  const res = await fetch(
    `${config.API}/v1/workflow-process/manager/course-category`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, is_active }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể tạo danh mục khóa học mới");
  }

  return await res.json();
}

/**
 * Update a course category
 */
export async function updateCourseCategory({
  categoryId,
  title,
  is_active,
  tenantId,
  token,
}: {
  categoryId: string;
  title: string;
  is_active?: boolean;
  tenantId: string;
  token: string;
}): Promise<CourseCategory> {
  if (!categoryId || !title || !tenantId || !token) {
    throw new Error("Missing required fields");
  }

  const requestBody: any = { title };
  if (is_active !== undefined) {
    requestBody.is_active = is_active;
  }

  const res = await fetch(
    `${config.API}/v1/workflow-process/manager/course-category?id=${categoryId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể cập nhật danh mục khóa học");
  }

  return await res.json();
}

/**
 * Delete a course category
 */
export async function deleteCourseCategory({
  categoryId,
  tenantId,
  token,
}: {
  categoryId: string;
  tenantId: string;
  token: string;
}): Promise<void> {
  if (!categoryId || !tenantId || !token) {
    throw new Error("Missing required fields");
  }

  const res = await fetch(
    `${config.API}/v1/workflow-process/manager/course-category?id=${categoryId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể xóa danh mục khóa học");
  }
}
