import config from "@/api/config.json";

export async function fetchCourses() {
  const res = await fetch(
    `${config.API}/v1/workflow-process/public/courses?created_at=1`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}
