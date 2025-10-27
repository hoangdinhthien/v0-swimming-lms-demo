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
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  tenant_id?: string;
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

/**
 * Create a new pool
 */
export async function createPool(
  poolData: {
    title: string;
    type?: string;
    dimensions: string;
    depth: string;
    capacity: number;
    is_active: boolean;
  },
  tenantId?: string,
  token?: string
): Promise<Pool> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users so they can call manager endpoints when allowed
  if (getUserFrontendRole() === "staff") {
    headers.service = "Pool";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/pool`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(poolData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to create pool: ${response.status}`
    );
  }

  const result = await response.json();

  // Extract the created pool from the response
  // Assuming the API returns the created pool in a similar nested structure
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0].data &&
    result.data[0][0].data[0]
  ) {
    return result.data[0][0].data[0];
  }

  // If the response structure is different, return a basic pool object
  return {
    _id: "temp-id", // The API should return the actual ID
    ...poolData,
  };
}

/**
 * Get pool details by ID
 */
export async function getPoolDetail(
  poolId: string,
  tenantId?: string,
  token?: string
): Promise<Pool> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users so they can call manager endpoints when allowed
  if (getUserFrontendRole() === "staff") {
    headers.service = "Pool";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/pool?id=${poolId}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get pool details: ${response.status}`);
  }

  const result = await response.json();

  // Extract pool from the nested structure
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0][0]
  ) {
    return result.data[0][0][0];
  }

  throw new Error("Pool not found");
}

/**
 * Update pool information
 */
export async function updatePool(
  poolId: string,
  poolData: {
    title: string;
    type?: string;
    dimensions: string;
    depth: string;
    capacity: number;
    is_active: boolean;
  },
  tenantId?: string,
  token?: string
): Promise<Pool> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": finalTenantId,
    Authorization: `Bearer ${finalToken}`,
  };

  // Add service header for staff users so they can call manager endpoints when allowed
  if (getUserFrontendRole() === "staff") {
    headers.service = "Pool";
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/pool?id=${poolId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(poolData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to update pool: ${response.status}`
    );
  }

  const result = await response.json();

  // Extract the updated pool from the response
  if (
    result.data &&
    result.data[0] &&
    result.data[0][0] &&
    result.data[0][0][0]
  ) {
    return result.data[0][0][0];
  }

  // If the response structure is different, return a basic pool object
  return {
    _id: poolId,
    ...poolData,
  };
}
