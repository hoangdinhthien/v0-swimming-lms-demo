import config from "../config.json";
import { getAuthToken } from "../auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getUserFrontendRole } from "../role-utils";

export interface Pool {
  _id: string;
  title: string;
  type?: string;
  dimensions?: string;
  depth?: string;
  capacity?: number;
  usageCount?: number;
  is_active: boolean;
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
 * Fetch pools with pagination
 */
export async function fetchPools(
  params?: { page?: number; limit?: number; search?: string },
  tenantId?: string,
  token?: string
): Promise<{
  pools: Pool[];
  meta: { count: number; page: number; limit: number };
}> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  let url = `${config.API}/v1/workflow-process/manager/pools`;
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (queryParams.toString()) url += `?${queryParams.toString()}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users so they can call manager endpoints when allowed
  if (getUserFrontendRole() === "staff") {
    headers.service = "Pool";
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch pools: ${response.status}`);
  }

  const result: PoolsApiResponse = await response.json();

  // Extract pools and meta from the nested structure
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].data &&
    result.data[0][0].meta_data
  ) {
    return {
      pools: result.data[0][0].data,
      meta: result.data[0][0].meta_data,
    };
  }

  return { pools: [], meta: { count: 0, page: 1, limit: 10 } };
}
