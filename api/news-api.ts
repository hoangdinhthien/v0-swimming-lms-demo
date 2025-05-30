import config from "./config.json";

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
    const response = await fetch(
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
    const response = await fetch(
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

// Helper function to format relative time (e.g., "2 days ago")
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
    return "just now";
  } else if (diffInSeconds < hour) {
    const minutes = Math.floor(diffInSeconds / minute);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < day) {
    const hours = Math.floor(diffInSeconds / hour);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInSeconds < week) {
    const days = Math.floor(diffInSeconds / day);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else if (diffInSeconds < month) {
    const weeks = Math.floor(diffInSeconds / week);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
