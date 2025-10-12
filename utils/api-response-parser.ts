/**
 * Utility function to parse different API response structures
 * Handles various data formats from different endpoints
 */

export interface ParsedApiResponse<T = any> {
  data: T[];
  total: number;
  currentPage?: number;
  lastPage?: number;
}

/**
 * Parse API response with flexible structure handling
 * @param response - The API response object
 * @returns Parsed data with consistent structure
 */
export function parseApiResponse<T = any>(response: any): ParsedApiResponse<T> {
  // Handle null/undefined response
  if (!response) {
    console.warn("[parseApiResponse] No response provided");
    return { data: [], total: 0 };
  }

  console.log("[parseApiResponse] Parsing response:", response);

  // Type 1: News structure - data[0][0].documents
  if (
    response.data &&
    Array.isArray(response.data) &&
    response.data.length > 0
  ) {
    const firstLevel = response.data[0];
    if (Array.isArray(firstLevel) && firstLevel.length > 0) {
      const secondLevel = firstLevel[0];
      if (
        secondLevel &&
        secondLevel.documents &&
        Array.isArray(secondLevel.documents)
      ) {
        return {
          data: secondLevel.documents,
          total: secondLevel.count || secondLevel.documents.length,
          currentPage: 1,
          lastPage: 1,
        };
      }
    }
  }

  // Type 2: Nested data structure - data.data array with data.meta_data
  if (
    response.data &&
    response.data.data &&
    Array.isArray(response.data.data) &&
    response.data.meta_data
  ) {
    console.log("[parseApiResponse] Using Type 2: Nested data structure");
    return {
      data: response.data.data,
      total: response.data.meta_data.count || response.data.data.length,
      currentPage: response.data.meta_data.page || 1,
      lastPage: Math.ceil(
        (response.data.meta_data.count || response.data.data.length) /
          (response.data.meta_data.limit || 10)
      ),
    };
  }

  // Type 3: Courses/Orders structure - data array with meta
  if (response.data && Array.isArray(response.data) && response.meta) {
    return {
      data: response.data,
      total: response.meta.total || response.data.length,
      currentPage: response.meta.current_page || 1,
      lastPage: response.meta.last_page || 1,
    };
  }

  // Type 4: Direct data array (fallback)
  if (response.data && Array.isArray(response.data)) {
    return {
      data: response.data,
      total: response.data.length,
      currentPage: 1,
      lastPage: 1,
    };
  }

  // Type 5: Direct array (fallback)
  if (Array.isArray(response)) {
    return {
      data: response,
      total: response.length,
      currentPage: 1,
      lastPage: 1,
    };
  }

  // Default fallback
  console.warn("Unknown API response structure:", response);
  return { data: [], total: 0 };
}

/**
 * Parse response specifically for paginated endpoints
 * @param response - API response
 * @param defaultLimit - Default items per page
 * @returns Parsed response with pagination info
 */
export function parsePaginatedResponse<T = any>(
  response: any,
  defaultLimit: number = 10
): ParsedApiResponse<T> & { hasNextPage: boolean; hasPrevPage: boolean } {
  const parsed = parseApiResponse<T>(response);

  const currentPage = parsed.currentPage || 1;
  const lastPage = parsed.lastPage || 1;

  return {
    ...parsed,
    hasNextPage: currentPage < lastPage,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * Parse response for "fetch all" endpoints that don't use pagination
 * @param response - API response
 * @returns Parsed response optimized for non-paginated data
 */
export function parseAllItemsResponse<T = any>(response: any): T[] {
  const parsed = parseApiResponse<T>(response);
  return parsed.data;
}

/**
 * Type-safe response parser with error handling
 * @param response - API response
 * @param onError - Error callback
 * @returns Parsed response or error result
 */
export function safeParseApiResponse<T = any>(
  response: any,
  onError?: (error: Error) => void
): ParsedApiResponse<T> | null {
  try {
    return parseApiResponse<T>(response);
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error("Unknown parsing error");
    console.error("API Response parsing error:", err);
    if (onError) {
      onError(err);
    }
    return null;
  }
}
