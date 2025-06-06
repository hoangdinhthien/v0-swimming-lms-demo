import config from "@/api/config.json";

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
    `${config.API}/v1/workflow-process/public/users?role=${role}`,
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
