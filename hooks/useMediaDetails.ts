import { useState, useEffect } from "react";
import { getMediaDetails } from "@/api/media-api";

interface UseMediaDetailsReturn {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching media details and returning image URL
 */
export function useMediaDetails(mediaId: string | null): UseMediaDetailsReturn {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaId) {
      setImageUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchImageUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = await getMediaDetails(mediaId);
        setImageUrl(url);
      } catch (err) {
        console.error("Error fetching media details:", err);
        setError("Failed to load image");
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchImageUrl();
  }, [mediaId]);

  return { imageUrl, loading, error };
}
