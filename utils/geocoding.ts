/**
 * Reverse geocoding utility using OpenStreetMap Nominatim API
 * Respects usage policy: max 1 request per second, valid User-Agent
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/reverse";
// User-Agent is required by Nominatim usage policy
const USER_AGENT = "SCMP-Manager-App/1.0";

export interface AddressResult {
  display_name: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/**
 * Convert coordinates to address using OSM Nominatim
 * @param lat Latitude
 * @param lng Longitude
 * @returns Formatted address string or null if failed
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<string | null> => {
  try {
    const params = new URLSearchParams({
      format: "json",
      lat: lat.toString(),
      lon: lng.toString(),
      zoom: "18",
      addressdetails: "1",
      accept_language: "vi-VN", // Prefer Vietnamese results
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error(
        `Geocoding failed: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error(`Geocoding error: ${data.error}`);
      return null;
    }

    return data.display_name;
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return null;
  }
};
