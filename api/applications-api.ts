import config from "./config.json";
import { apiGet } from "./api-utils";

export interface Application {
  _id: string;
  title: string;
  type: string[] | string; // Can be array (from list) or string (from detail)
  created_at: string;
  updated_at: string;
  updated_by:
    | string
    | {
        _id: string;
        email: string;
        username: string;
        phone: string;
        role_front: string[];
      };
  created_by: {
    _id: string;
    email: string;
    username: string;
    phone: string;
    role_front: string[];
  };
  tenant_id: string;
  // Optional fields that might be added later
  content?: string;
  reply_content?: string;
  status?: string[]; // Available in detail response
}

export interface ApplicationsResponse {
  data: Application[][][];
  message: string;
  statusCode: number;
}

export interface PaginatedApplicationsData {
  data: Application[];
  meta_data: {
    count: number;
    page: number;
    limit: number;
  };
}

export interface PaginatedApplicationsResponse {
  applications: Application[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export async function getApplications(
  tenantId: string,
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedApplicationsResponse> {
  const response = await apiGet(
    `${config.API}/v1/workflow-process/manager/applications?page=${page}&limit=${limit}`,
    {
      requireAuth: true,
      includeTenant: false,
      headers: {
        "x-tenant-id": tenantId,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch applications");
  }

  const data: ApplicationsResponse = await response.json();
  const obj = data.data?.[0]?.[0] as unknown as PaginatedApplicationsData;

  // Ensure applications is always an array and validate each application's type field
  let applications: Application[] = [];
  if (Array.isArray(obj?.data)) {
    applications = obj.data.map((app: any) => ({
      ...app,
      type: Array.isArray(app.type) ? app.type : [], // Ensure type is always an array
    }));
  }

  const metaData = obj?.meta_data || { count: 0, page: 1, limit: 10 };

  return {
    applications,
    totalCount: metaData.count,
    currentPage: metaData.page,
    totalPages: Math.ceil(metaData.count / metaData.limit),
    limit: metaData.limit,
  };
}

export async function getApplicationDetail(
  id: string,
  tenantId: string,
  token: string
): Promise<Application | null> {
  const response = await apiGet(
    `${config.API}/v1/workflow-process/manager/application?id=${id}`,
    {
      requireAuth: true,
      includeTenant: false,
      headers: {
        "x-tenant-id": tenantId,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  // Defensive: unwrap the nested structure to get the application object
  const arr = data.data?.[0]?.[0];
  const app = Array.isArray(arr) ? arr[0] : arr;

  // Ensure type field exists and handle different formats
  if (app && app.type === undefined) {
    app.type = []; // Default to empty array if no type
  }

  return app || null;
}
