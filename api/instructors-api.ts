import config from "@/api/config.json";

export async function fetchInstructors({
  tenantId,
  token,
}: {
  tenantId?: string;
  token?: string;
}) {
  if (!tenantId) return [];
  const res = await fetch(
    `${config.API}/v1/workflow-process/public/instructors`,
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
