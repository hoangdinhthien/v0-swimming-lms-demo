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

// Re-export tenant utility functions
export {
  setSelectedTenant,
  getSelectedTenant,
  clearSelectedTenant,
} from "../utils/tenant-utils";
