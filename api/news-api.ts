import config from "./config.json";
import { apiGet } from "./api-utils";

export interface NewsItem {
  _id: string;
  title: string;
  content: string;
  type: string[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  cover?: string;
}

export interface NewsResponse {
  data: [
    [
      {
        data: NewsItem[];
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

export interface NewsDetailResponse {
  data: [[[NewsItem]]];
  message: string;
  statusCode: number;
}

export async function getNews() {
  try {
    const response = await apiGet(
      `${config.API}/v1/workflow-process/public/news`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }

    const data: NewsResponse = await response.json();
    // Sort news items by creation date, most recent first
    const sortedNews = [...data.data[0][0].data].sort(
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
    // Use apiGet which should handle tenant headers automatically
    const response = await apiGet(
      `${config.API}/v1/workflow-process/public/new?id=${id}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch news details: ${response.status}`);
    }

    const data: NewsDetailResponse = await response.json();
    return data.data[0][0][0] || null;
  } catch (error) {
    console.error("Error fetching news details:", error);
    return null;
  }
}

// Alias for getNewsById to maintain API consistency
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

// Interface for media details response
export interface MediaResponse {
  data: {
    _id: string;
    filename: string;
    disk: string;
    mime: string;
    size: number;
    title: string;
    alt: string;
    tenant_id: string;
    created_by: {
      _id: string;
      username: string;
    };
    created_at: string;
    updated_at: string;
    is_draft: boolean;
    __v: number;
    path: string;
  };
  message: string;
  statusCode: number;
}

// Function to fetch media details by ID
export async function getMediaDetails(mediaId: string): Promise<string | null> {
  try {
    // Use apiGet with requireAuth and includeTenant to ensure proper headers
    const response = await apiGet(`${config.API}/v1/media/${mediaId}`, {
      requireAuth: true,
      includeTenant: true,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch media details: ${response.status}`);
    }

    const data: MediaResponse = await response.json();
    return data.data.path || null;
  } catch (error) {
    console.error("Error fetching media details:", error);
    return null;
  }
}
