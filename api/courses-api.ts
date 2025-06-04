import config from "@/api/config.json";

export async function fetchCourses({
  tenantId,
  token,
}: {
  tenantId?: string;
  token?: string;
} = {}) {
  if (!tenantId || !token) return [];
  const res = await fetch(`${config.API}/v1/workflow-process/public/courses`, {
    headers: {
      "x-tenant-id": tenantId,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch courses");
  const data = await res.json();
  // Defensive: unwrap the nested structure to get the array of courses
  const obj = data.data?.[0]?.[0];
  return obj && typeof obj === "object" && "data" in obj ? obj.data : [];
}

export async function fetchCourseCategories({
  tenantId,
}: {
  tenantId: string;
}) {
  const res = await fetch(
    `${config.API}/v1/workflow-process/public/course-categories`,
    {
      headers: { "x-tenant-id": tenantId },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Không thể tải danh mục trình độ");
  const data = await res.json();
  return data?.data?.[0]?.[0]?.data || [];
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
  const res = await fetch(
    `${config.API}/v1/workflow-process/public/course?id=${courseId}`,
    {
      headers: {
        "x-tenant-id": tenantId,
        Authorization: `Bearer ${token}`,
      },
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
