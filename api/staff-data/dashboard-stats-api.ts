import config from "@/api/config.json";

/**
 * Fetch stats from manager endpoints for staff dashboard
 * Uses the 'service' header to respect permissions
 */
export async function fetchDashboardStat({
  endpoint,
  module,
  tenantId,
  token,
  queryParams = {},
}: {
  endpoint: string;
  module: string;
  tenantId: string;
  token: string;
  queryParams?: Record<string, string | number>;
}): Promise<number> {
  if (!tenantId || !token) return 0;

  // Build query string
  const params = new URLSearchParams();
  // Always limit to 1 since we only need the total count
  params.append("limit", "1");
  params.append("page", "1");

  Object.entries(queryParams).forEach(([key, value]) => {
    params.append(key, String(value));
  });

  const url = `${
    config.API
  }/v1/workflow-process/manager/${endpoint}?${params.toString()}`;

  const headers = {
    "x-tenant-id": tenantId,
    Authorization: `Bearer ${token}`,
    service: module, // Critical for staff permissions
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(
        `[fetchDashboardStat] Failed to fetch ${module}: ${res.status}`
      );
      return 0;
    }

    const data = await res.json();

    // Attempt to extract total count from various response structures
    // 1. pagination.total
    if (data.pagination && typeof data.pagination.total === "number") {
      return data.pagination.total;
    }

    // 2. meta_data.count (used in some endpoints like courses)
    // Structure might be nested: data.data[0][0].meta_data.count
    // or direct: data.meta_data.count

    // Check deep nested structure first (common in this codebase)
    const deepObj = data.data?.[0]?.[0];
    if (
      deepObj &&
      deepObj.meta_data &&
      typeof deepObj.meta_data.count === "number"
    ) {
      return deepObj.meta_data.count; // This was observed in fetchCourses
    }

    if (
      deepObj &&
      deepObj.pagination &&
      typeof deepObj.pagination.total === "number"
    ) {
      return deepObj.pagination.total;
    }

    // Check direct meta_data (rare but possible)
    if (data.meta_data && typeof data.meta_data.count === "number") {
      return data.meta_data.count;
    }

    return 0;
  } catch (err) {
    console.error(`[fetchDashboardStat] Error fetching ${module}:`, err);
    return 0;
  }
}

/**
 * Fetch recent items (courses, news) for dashboard preview
 */
export async function fetchRecentItems({
  endpoint,
  module,
  tenantId,
  token,
  limit = 5,
  queryParams = {},
}: {
  endpoint: string;
  module: string;
  tenantId: string;
  token: string;
  limit?: number;
  queryParams?: Record<string, string | number>;
}): Promise<any[]> {
  if (!tenantId || !token) return [];

  const params = new URLSearchParams();
  params.append("limit", String(limit));
  params.append("page", "1");

  Object.entries(queryParams).forEach(([key, value]) => {
    params.append(key, String(value));
  });

  const url = `${
    config.API
  }/v1/workflow-process/manager/${endpoint}?${params.toString()}`;

  const headers = {
    "x-tenant-id": tenantId,
    Authorization: `Bearer ${token}`,
    service: module,
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(
        `[fetchRecentItems] Failed to fetch ${module}: ${res.status}`
      );
      return [];
    }

    const data = await res.json();

    // Attempt to extract data array
    // 1. data.data[0][0].data (common in this codebase)
    const deepObj = data.data?.[0]?.[0];
    if (deepObj && Array.isArray(deepObj.data)) {
      return deepObj.data;
    }

    // 2. data.data (direct)
    if (Array.isArray(data.data)) {
      return data.data;
    }

    // 3. Fallback: try finding first array in response
    if (Array.isArray(data)) return data;

    return [];
  } catch (err) {
    console.error(`[fetchRecentItems] Error fetching ${module}:`, err);
    return [];
  }
}
