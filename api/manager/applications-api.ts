import config from "../config.json";
import { apiGet, apiPut } from "../api-utils";

export interface ApplicationType {
  _id: string;
  title: string;
  type: string[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface Application {
  _id: string;
  title: string;
  content?: string;
  type: ApplicationType | string[] | string; // Can be object, array, or string depending on endpoint
  status?: string[];
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
        featured_image?: string | string[];
        address?: string;
        birthday?: string;
      };
  created_by: {
    _id: string;
    email: string;
    username: string;
    phone: string;
    role_front: string[];
    featured_image?: string | string[];
    address?: string;
    birthday?: string;
  };
  tenant_id: string;
  // Optional fields that might be added later
  reply?: string;
  reply_content?: string;
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
  limit: number = 10,
  searchKey?: string
): Promise<PaginatedApplicationsResponse> {
  // Build URL with searchKey
  let url = `${config.API}/v1/workflow-process/manager/applications?page=${page}&limit=${limit}`;
  if (searchKey?.trim()) {
    url += `&searchKey=${encodeURIComponent(searchKey.trim())}`;
  }

  const response = await apiGet(url, {
    requireAuth: true,
    includeTenant: false,
    headers: {
      "x-tenant-id": tenantId,
      Authorization: `Bearer ${token}`,
    },
  });

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
      // Keep the original type structure - don't force it to be an array
      type: app.type || [],
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

export interface ReplyApplicationRequest {
  reply: string;
  status: string[];
}

export async function replyToApplication(
  id: string,
  tenantId: string,
  token: string,
  replyData: ReplyApplicationRequest
): Promise<any> {
  const response = await apiPut(
    `${config.API}/v1/workflow-process/manager/application?id=${id}`,
    replyData,
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
    throw new Error(error.message || "Failed to reply to application");
  }

  return response.json();
}
