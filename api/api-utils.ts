import { getSelectedTenant } from "../utils/tenant-utils";
import { getAuthToken } from "./auth-utils";
import { getUserFrontendRole } from "./role-utils";
import { apiCache } from "../utils/api-cache";

export interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
  includeTenant?: boolean;
  useCache?: boolean;
  cacheTTL?: number; // in milliseconds
}

// Helper function to get service name from URL
function getServiceFromUrl(url: string): string | null {
  if (url.includes("/manager/user")) return "User";
  if (url.includes("/manager/users")) return "User";
  if (url.includes("/manager/course")) return "Course";
  if (url.includes("/manager/courses")) return "Course";
  if (url.includes("/manager/course-category")) return "Course";
  if (url.includes("/manager/class")) return "Class";
  if (url.includes("/manager/classes")) return "Class";
  if (url.includes("/manager/pools")) return "Pool";
  if (url.includes("/manager/schedule")) return "Schedule";
  if (url.includes("/manager/slot")) return "Slot";
  if (url.includes("/manager/news")) return "News";
  if (url.includes("/manager/orders")) return "Order";
  if (url.includes("/manager/applications")) return "Application";
  return null;
}

export async function apiRequest(
  url: string,
  options: ApiOptions = {}
): Promise<Response> {
  const {
    requireAuth = false,
    includeTenant = true,
    useCache = false,
    cacheTTL = 60000, // Default 1 minute
    ...fetchOptions
  } = options;

  // Check cache for GET requests (default method is GET)
  if (useCache && (!fetchOptions.method || fetchOptions.method === "GET")) {
    const cacheKey = apiCache.generateKey(url, {
      headers: fetchOptions.headers,
    });
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      console.log("🚀 API Cache hit for:", url);
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // Add authentication header if required
  if (requireAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Add tenant header if available and requested
  if (includeTenant) {
    const tenantId = getSelectedTenant();
    if (tenantId) {
      headers["x-tenant-id"] = tenantId;
    }
  }

  // Add service header for staff users
  if (getUserFrontendRole() === "staff") {
    const service = getServiceFromUrl(url);
    if (service) {
      headers["service"] = service;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Cache successful GET responses
  if (
    useCache &&
    (!fetchOptions.method || fetchOptions.method === "GET") &&
    response.ok
  ) {
    const responseData = await response.clone().json();
    const cacheKey = apiCache.generateKey(url, {
      headers: fetchOptions.headers,
    });
    apiCache.set(cacheKey, responseData, cacheTTL);
    console.log("💾 API response cached for:", url);
  }

  return response;
}

// Helper function for GET requests
export async function apiGet(
  url: string,
  options: ApiOptions = {}
): Promise<Response> {
  return apiRequest(url, { ...options, method: "GET" });
}

// Helper function for POST requests
export async function apiPost(
  url: string,
  data?: any,
  options: ApiOptions = {}
): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Helper function for PUT requests
export async function apiPut(
  url: string,
  data?: any,
  options: ApiOptions = {}
): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Helper function for DELETE requests
export async function apiDelete(
  url: string,
  options: ApiOptions = {}
): Promise<Response> {
  return apiRequest(url, { ...options, method: "DELETE" });
}

// Helper function to build headers with service for direct fetch calls
export function buildApiHeaders(
  token?: string,
  tenantId?: string,
  url?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (tenantId) {
    headers["x-tenant-id"] = tenantId;
  }

  // Add service header for staff users
  if (getUserFrontendRole() === "staff" && url) {
    const service = getServiceFromUrl(url);
    if (service) {
      headers["service"] = service;
    }
  }

  return headers;
}
