import config from "@/api/config.json";

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
    `${config.API}/v1/workflow-process/public/users?role=${role}`,
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
  // Defensive: unwrap the nested structure to get the array of instructors
  const obj = data.data?.[0]?.[0];
  return obj && typeof obj === "object" && "data" in obj ? obj.data : [];
}

export async function fetchInstructorDetail({
  instructorId,
  tenantId,
}: {
  instructorId: string;
  tenantId: string;
}) {
  const res = await fetch(
    `${config.API}/v1/workflow-process/manager/user?id=${instructorId}`,
    {
      headers: {
        "x-tenant-id": tenantId,
      },
    }
  );
  if (!res.ok) throw new Error("Không thể lấy thông tin giáo viên");
  const data = await res.json();
  return data.data?.[0]?.[0]?.[0] || null;
}
