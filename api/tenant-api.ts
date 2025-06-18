import config from "./config.json";
import { apiGet } from "./api-utils";

export interface Tenant {
  _id: string;
  tenant_id: {
    _id: string;
    title: string;
  };
}

export interface TenantResponse {
  data: Tenant[][][];
  message: string;
  statusCode: number;
}

// Cache for tenant information to avoid repeated API calls
const tenantCache: { [key: string]: { title: string; timestamp: number } } = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache TTL

export async function getAvailableTenants(): Promise<Tenant[]> {
  const response = await apiGet(
    `${config.API}/v1/workflow-process/tenants-available`,
    {
      requireAuth: true,
      includeTenant: false, // Don't include tenant header when fetching available tenants
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch available tenants");
  }
  const data: TenantResponse = await response.json();

  // Flatten the nested array structure from the API response
  const tenants = data.data?.[0]?.[0] || [];
  return tenants;
}

/**
 * Get tenant information by ID
 * Uses a local cache to avoid repeated API calls for the same tenant
 */
export async function getTenantInfo(
  tenantId: string
): Promise<{ title: string }> {
  // Check cache first
  const now = Date.now();
  if (
    tenantCache[tenantId] &&
    now - tenantCache[tenantId].timestamp < CACHE_TTL
  ) {
    return { title: tenantCache[tenantId].title };
  }

  try {
    // If not in cache or cache expired, fetch from API
    const tenants = await getAvailableTenants();
    const tenant = tenants.find((t) => t.tenant_id._id === tenantId);

    if (tenant) {
      // Update cache
      tenantCache[tenantId] = {
        title: tenant.tenant_id.title,
        timestamp: now,
      };
      return { title: tenant.tenant_id.title };
    }

    // If tenant not found, return a default value
    return { title: "Chi nhánh không xác định" };
  } catch (error) {
    console.error("Error fetching tenant info:", error);
    return { title: "Chi nhánh không xác định" };
  }
}

// Re-export tenant utility functions
export {
  setSelectedTenant,
  getSelectedTenant,
  clearSelectedTenant,
} from "../utils/tenant-utils";
