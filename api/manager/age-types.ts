import config from "../config.json";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "../auth-utils";
import { getUserFrontendRole } from "../role-utils";

export interface AgeRule {
  _id: string;
  title: string;
  min_age?: number;
  max_age?: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
}

interface AgeRulesApiResponse {
  data: AgeRule[];
  message: string;
  statusCode: number;
}

/**
 * Fetch all age rules
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with age rules data
 */
export async function fetchAgeRules(
  tenantId?: string,
  token?: string
): Promise<AgeRule[]> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing tenant ID or authentication token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users so they can call manager endpoints when allowed
  if (getUserFrontendRole() === "staff") {
    headers["service"] = "User";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/age-rules`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch age rules: ${response.statusText}`);
  }

  const result: AgeRulesApiResponse = await response.json();

  return result.data || [];
}
