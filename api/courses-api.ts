import config from "@/api/config.json";

export async function fetchCourses({
  tenantId,
  token,
}: {
  tenantId: string;
  token: string;
}) {
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
