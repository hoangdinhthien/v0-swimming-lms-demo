import config from "@/api/config.json";

export interface DataReviewRecord {
  _id: string;
  type: string[];
  data_id?: string;
  data?: any;
  method?: string[];
  status?: string[];
  created_at?: string;
  created_by?: any;
  updated_at?: string;
  updated_by?: any;
  tenant_id?: string;
}

export interface DataReviewListResponse {
  data: [
    {
      limit: number;
      skip: number;
      count: number;
      documents: DataReviewRecord[];
    }
  ];
  message: string;
  statusCode: number;
}

export async function fetchDataReviewList({
  tenantId,
  token,
  page = 1,
  limit = 20,
}: {
  tenantId: string;
  token: string;
  page?: number;
  limit?: number;
}): Promise<{ documents: DataReviewRecord[]; count: number }> {
  if (!tenantId || !token) throw new Error("Missing tenantId or token");

  const url = `${config.API}/v1/workflow-process/manager/data-review?page=${page}&limit=${limit}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-tenant-id": String(tenantId),
      Authorization: `Bearer ${String(token)}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("fetchDataReviewList error", res.status, text);
    throw new Error("Không thể lấy danh sách data-review");
  }

  const body = (await res.json()) as DataReviewListResponse;
  console.log("[fetchDataReviewList] raw response:", body);

  // Unwrap nested structure. API returns data as [[{ limit, skip, count, documents }]]
  let documents: DataReviewRecord[] = [];
  let count = 0;

  if (Array.isArray(body?.data) && body.data.length > 0) {
    const level1 = body.data[0];
    if (Array.isArray(level1) && level1.length > 0) {
      const obj = level1[0] as any;
      documents = obj?.documents ?? [];
      count = obj?.count ?? documents.length;
    } else if (typeof level1 === "object" && level1 !== null) {
      // Some responses may be one-level deep
      const obj = level1 as any;
      documents = obj?.documents ?? [];
      count = obj?.count ?? documents.length;
    }
  }

  return { documents, count };
}
