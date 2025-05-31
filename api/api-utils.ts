import { getSelectedTenant } from "../utils/tenant-utils";
import { getAuthToken } from "./auth-utils";

export interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
  includeTenant?: boolean;
}

export async function apiRequest(
  url: string,
  options: ApiOptions = {}
): Promise<Response> {
  const {
    requireAuth = false,
    includeTenant = true,
    ...fetchOptions
  } = options;

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

  return fetch(url, {
    ...fetchOptions,
    headers,
  });
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
