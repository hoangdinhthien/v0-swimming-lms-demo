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
  type_of_age?: Array<{
    _id: string;
    title: string;
    age_range?: [number, number];
  }>;
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
        limit: number;
        skip: number;
        count: number;
        documents: Pool[];
      }
    ]
  ];
  message: string;
  statusCode: number;
}

interface PoolDetailResponse {
  data: [[Pool[]]];
  message: string;
  statusCode: number;
}

/**
 * Fetch pools with pagination and Find-common search
 */
export async function fetchPools(
  params?: {
    page?: number;
    limit?: number;
    searchParams?: Record<string, string>; // Find-common search parameters
  },
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

  // Add Find-common search parameters
  if (params?.searchParams) {
    Object.entries(params.searchParams).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
  }

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
    result.data[0][0].documents
  ) {
    return {
      pools: result.data[0][0].documents,
      meta: {
        count: result.data[0][0].count,
        page: params?.page || 1,
        limit: result.data[0][0].limit,
      },
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

  // Return the created pool from response
  return result.data;
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

  const result: PoolDetailResponse = await response.json();

  // Extract pool from the nested structure: data[0][0][0]
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

  // Return the updated pool
  return result.data;
}

/**
 * Delete a pool
 */
export async function deletePool(
  poolId: string,
  tenantId?: string,
  token?: string
): Promise<void> {
  // Use provided tenant and token, or get from utils
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const headers: Record<string, string> = {
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
      method: "DELETE",
      headers,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to delete pool: ${response.status}`
    );
  }
}
