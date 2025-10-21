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

// Interface for uploaded media response
export interface UploadMediaResponse {
  data: {
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
    _id: string;
    __v: number;
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

    // Just return null for 404 responses instead of throwing an error
    if (response.status === 404) {
      console.warn(`Media not found (404): ${mediaId}`);
      return null;
    }

    // Return null for 403 (forbidden) responses - user doesn't have permission
    if (response.status === 403) {
      console.warn(`Media access forbidden (403): ${mediaId}`);
      return null;
    }

    if (!response.ok) {
      console.error(`Failed to fetch media details: ${response.status}`);
      return null;
    }

    const data: MediaResponse = await response.json();
    return data.data.path || null;
  } catch (error) {
    console.error("Error fetching media details:", error);
    return null;
  }
}

// Function to upload media file(s)
export async function uploadMedia({
  file,
  title,
  alt,
  tenantId,
  token,
}: {
  file: File;
  title?: string;
  alt?: string;
  tenantId: string;
  token: string;
}): Promise<UploadMediaResponse> {
  try {
    const formData = new FormData();
    formData.append("media[0][title]", title || file.name);
    formData.append("media[0][alt]", alt || file.name);
    formData.append("media[0][file]", file);

    const response = await fetch(`${config.API}/v1/media`, {
      method: "POST",
      headers: {
        "x-tenant-id": tenantId,
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
}

// Function to delete media file(s) by IDs
export async function deleteMedia({
  mediaIds,
  tenantId,
  token,
}: {
  mediaIds: string[];
  tenantId: string;
  token: string;
}): Promise<void> {
  try {
    if (mediaIds.length === 0) {
      return;
    }

    // Join multiple IDs with comma for the query parameter
    const idsParam = mediaIds.join(",");

    const response = await fetch(
      `${config.API}/v1/media?ids=${encodeURIComponent(idsParam)}`,
      {
        method: "DELETE",
        headers: {
          "x-tenant-id": tenantId,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed: ${response.status} ${errorText}`);
    }

    // Response might be empty for successful deletion
    console.log(`Successfully deleted ${mediaIds.length} media file(s)`);
  } catch (error) {
    console.error("Error deleting media:", error);
    throw error;
  }
}
