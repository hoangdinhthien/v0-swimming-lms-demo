import config from "../config.json";
import { apiGet } from "../api-utils";
// Import media functions from the new file
import { getMediaDetails } from "../media-api";

// Media object interface for cover field
export interface MediaObject {
  _id: string;
  filename: string;
  disk: string;
  mime: string;
  size: number;
  title: string;
  alt: string;
  tenant_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_draft: boolean;
  __v: number;
  path: string;
}

// User object interface for created_by and updated_by fields
export interface UserObject {
  _id: string;
  username: string;
  email: string;
  phone: string;
}

export interface NewsItem {
  _id: string;
  title: string;
  content: string;
  type: string[]; // "public" | "manager" | "instructor" | "member"
  created_at: string;
  created_by: string | UserObject;
  updated_at: string;
  updated_by: string | UserObject;
  tenant_id: string;
  cover?: string | string[] | MediaObject[]; // Can be media IDs or full media objects
}

// Response format from workflow-process API
export interface NewsResponse {
  data: [
    [
      {
        limit: number;
        skip: number;
        count: number;
        documents: NewsItem[];
      }
    ]
  ];
  message: string;
  statusCode: number;
}

export interface CreateNewsData {
  title: string;
  content: string;
  type: string[]; // "public" | "manager" | "instructor" | "member"
  cover?: string[];
}

export interface CreateNewsResponse {
  data: NewsItem;
  message: string;
  statusCode: number;
}

export async function getNews(searchParams?: Record<string, string>) {
  try {
    // Build query string with search parameters
    let url = `${config.API}/v1/workflow-process/manager/news`;
    
    if (searchParams) {
      const queryParams = new URLSearchParams(searchParams);
      url += `?${queryParams.toString()}`;
    }

    const response = await apiGet(url, {
      requireAuth: true,
      includeTenant: true,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }

    const data: NewsResponse = await response.json();

    // Extract documents from the new response structure
    const newsDocuments = data.data[0][0]?.documents || [];

    // Sort news items by updated date, most recent first
    const sortedNews = [...newsDocuments].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return sortedNews;
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

export async function getNewsById(id: string): Promise<NewsItem | null> {
  try {
    // Use workflow-process endpoint with search parameter
    const response = await apiGet(
      `${config.API}/v1/workflow-process/manager/news?search[_id:equal]=${id}`,
      {
        requireAuth: true,
        includeTenant: true,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch news details: ${response.status}`);
    }

    const data: NewsResponse = await response.json();

    // Extract the first document from the documents array
    const newsItem = data.data[0]?.[0]?.documents?.[0] || null;
    return newsItem;
  } catch (error) {
    console.error("Error fetching news details:", error);
    return null;
  }
} // Alias for getNewsById to maintain API consistency
export const getNewsDetail = getNewsById;

// Helper function to format relative time in Vietnamese (e.g., "2 ngày trước")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Define time intervals in seconds
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;

  if (diffInSeconds < minute) {
    return "vừa xong";
  } else if (diffInSeconds < hour) {
    const minutes = Math.floor(diffInSeconds / minute);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < day) {
    const hours = Math.floor(diffInSeconds / hour);
    return `${hours} giờ trước`;
  } else if (diffInSeconds < week) {
    const days = Math.floor(diffInSeconds / day);
    return `${days} ngày trước`;
  } else if (diffInSeconds < month) {
    const weeks = Math.floor(diffInSeconds / week);
    return `${weeks} tuần trước`;
  } else {
    // Format the date in Vietnamese style: DD/MM/YYYY
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
}

// Helper function to extract image URLs from news cover field
export function extractNewsImageUrls(
  cover: string | string[] | MediaObject[] | undefined
): string[] {
  if (!cover) return [];

  // If cover is an array of media objects with path property
  if (Array.isArray(cover)) {
    return cover
      .filter((item: any) => item && (item.path || typeof item === "string"))
      .map((item: any) => (typeof item === "string" ? item : item.path));
  }

  // If cover is a single media object with path
  if (typeof cover === "object" && (cover as MediaObject).path) {
    return [(cover as MediaObject).path];
  }

  // If cover is a string (media ID or path)
  if (typeof cover === "string") {
    return [cover];
  }

  return [];
}

// Re-export the getMediaDetails function to maintain backwards compatibility
export { getMediaDetails };

// Create a new news article
export async function createNews(
  data: CreateNewsData,
  token: string,
  tenantId: string
): Promise<CreateNewsResponse> {
  try {
    const response = await fetch(
      `${config.API}/v1/workflow-process/manager/news`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          Authorization: `Bearer ${token}`,
          service: "News", // Required for staff users
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Tạo thông báo thất bại: ${response.status} ${errorText}`
      );
    }

    const result: CreateNewsResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating news:", error);
    throw error;
  }
}

// Update an existing news article
export async function updateNews(
  newsId: string,
  data: CreateNewsData,
  token: string,
  tenantId: string
): Promise<CreateNewsResponse> {
  try {
    const response = await fetch(
      `${config.API}/v1/workflow-process/manager/news?id=${newsId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          Authorization: `Bearer ${token}`,
          service: "News", // Required for staff users
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Cập nhật thông báo thất bại: ${response.status} ${errorText}`
      );
    }

    const result: CreateNewsResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating news:", error);
    throw error;
  }
}

// Delete a news article
export async function deleteNews(
  newsId: string,
  token: string,
  tenantId: string
): Promise<{ message: string; statusCode: number }> {
  try {
    const response = await fetch(
      `${config.API}/v1/workflow-process/manager/news?id=${newsId}`,
      {
        method: "DELETE",
        headers: {
          "x-tenant-id": tenantId,
          Authorization: `Bearer ${token}`,
          service: "News", // Required for staff users
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Xóa thông báo thất bại: ${response.status} ${errorText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error deleting news:", error);
    throw error;
  }
}
