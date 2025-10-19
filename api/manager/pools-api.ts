import config from "../config.json";
import { getAuthToken } from "../auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";

export interface Pool {
  _id: string;
  title: string;
  type?: string;
  dimensions?: string;
  depth?: string;
  capacity?: number;
  maintance_status?: string;
  usageCount?: number;
}

interface PoolsApiResponse {
  data: [
    [
      {
        data: Pool[];
        meta_data: {
          count: number;
          page: number;
          limit: number;
        };
      }
    ]
  ];
  message: string;
  statusCode: number;
}

/**
 * Fetch all pools
 */
export async function fetchPools(
  tenantId?: string,
  token?: string
): Promise<Pool[]> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/pools`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch pools: ${response.status}`);
  }

  const result: PoolsApiResponse = await response.json();

  // Extract pools from the nested structure
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].data
  ) {
    return result.data[0][0].data;
  }

  return [];
}
