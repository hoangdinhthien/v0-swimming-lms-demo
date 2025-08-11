import { getSelectedTenant } from "../utils/tenant-utils";
import { getAuthToken } from "./auth-utils";
import { apiCache } from "../utils/api-cache";

export interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
  includeTenant?: boolean;
  useCache?: boolean;
  cacheTTL?: number; // in milliseconds
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
