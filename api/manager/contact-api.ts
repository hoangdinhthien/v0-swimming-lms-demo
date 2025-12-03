import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import config from "../config.json";
import { getUserFrontendRole } from "../role-utils";

// Define types for contact
export interface Contact {
  _id: string;
  tenant_id: string;
  email: string;
  phone: string;
  location: [number, number]; // [longitude, latitude]
  message: string;
  name: string;
  created_at: string;
}

export interface ContactListResponse {
  limit: number;
  skip: number;
  count: number;
  documents: Contact[];
}

export interface ContactApiResponse {
  data: ContactListResponse[][][];
  message: string;
  statusCode: number;
}

/**
 * Fetch all contacts from the API
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with array of all contacts
 */
export const fetchContacts = async (
  tenantId?: string,
  token?: string
): Promise<Contact[]> => {
  const finalTenantId = tenantId || getSelectedTenant();
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/contact`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
        ...(getUserFrontendRole() === "staff" && { service: "ContactForm" }),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch contacts: ${response.status}`);
  }

  const result: ContactApiResponse = await response.json();

  // The API returns nested arrays, so we need to flatten them
  let contacts: Contact[] = [];
  if (result.data && Array.isArray(result.data)) {
    result.data.forEach((outerArray: any) => {
      if (Array.isArray(outerArray)) {
        outerArray.forEach((innerArray: any) => {
          if (innerArray && innerArray.documents) {
            // Filter out invalid contacts (with @ symbols in fields)
            const validContacts = innerArray.documents.filter(
              (contact: Contact) =>
                !contact.email.includes("@body:") &&
                !contact.phone.includes("@body:")
            );
            contacts = contacts.concat(validContacts);
          }
        });
      }
    });
  }

  // Sort contacts by created date (newest first)
  return contacts.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

/**
 * Format date to Vietnamese format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatContactDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get Google Maps URL from location coordinates
 * @param location - [longitude, latitude]
 * @returns Google Maps URL
 */
export const getGoogleMapsUrl = (location: [number, number]): string => {
  const [longitude, latitude] = location;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

/**
 * Get location display string
 * @param location - [longitude, latitude]
 * @returns Formatted location string
 */
export const formatLocation = (location: [number, number]): string => {
  const [longitude, latitude] = location;
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};
