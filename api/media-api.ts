import config from "./config.json";
import { apiGet } from "./api-utils";

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
