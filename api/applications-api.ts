import config from "./config.json";
import { apiGet } from "./api-utils";

export interface Application {
  _id: string;
  title: string;
  content: string;
  reply_content: string;
  status: string[];
  created_at: string;
  created_by: {
    _id: string;
    email: string;
    username: string;
    phone: string;
    role_front: string[];
  };
}

export interface ApplicationsResponse {
  data: Application[][][];
  message: string;
  statusCode: number;
}

export async function getApplications(
  tenantId: string,
  token: string
): Promise<Application[]> {
  const response = await apiGet(
    `${config.API}/v1/workflow-process/manager/applications`,
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
  const obj = data.data?.[0]?.[0];
  const arr =
    obj && typeof obj === "object" && "data" in obj
      ? (obj.data as Application[])
      : [];
  return Array.isArray(arr) ? arr : [];
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
  return app || null;
}
