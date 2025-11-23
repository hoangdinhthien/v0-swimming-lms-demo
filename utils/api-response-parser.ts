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

/**
 * Parse API error response and extract field-specific validation errors
 * @param error - The error object from API call
 * @returns Object with field errors and general error message
 */
export function parseApiFieldErrors(error: any): {
  fieldErrors: Record<string, string>;
  generalError: string;
} {
  const fieldErrors: Record<string, string> = {};
  let generalError = "Đã xảy ra lỗi khi xử lý yêu cầu";

  // Normalizes various value types into a concise, user-friendly message for a given field
  const normalizeFieldMessage = (value: any, field?: string): string => {
    // If it's already a meaningful string, trim and use it
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) return "Vui lòng kiểm tra trường này";
      // Avoid returning a raw JSON blob or a lone numeric string like "1"
      if (/^\d+$/.test(trimmed)) {
        // numeric-only -> convert to friendly per-field message
        value = Number(trimmed);
      } else if (/^[{}\[\]\n].*/.test(trimmed)) {
        // JSON-like string: prefer short generic
        return field && /email/i.test(field)
          ? "Email không hợp lệ hoặc đã tồn tại"
          : "Giá trị không hợp lệ";
      } else {
        return trimmed;
      }
    }

    // If boolean or number, map to a friendly message based on field
    if (typeof value === "boolean") {
      return field && /email/i.test(field)
        ? "Email không hợp lệ hoặc đã tồn tại"
        : "Giá trị không hợp lệ";
    }
    if (typeof value === "number") {
      // If server returns 1 as indicator, map to per-field friendly messages
      if (value === 1) {
        if (field) {
          if (/email/i.test(field)) return "Email này đã được sử dụng";
          if (/username/i.test(field))
            return "Tên đăng nhập này đã được sử dụng";
          if (/phone/i.test(field)) return "Số điện thoại này đã được sử dụng";
        }
        return "Giá trị không hợp lệ";
      }
      // Other numbers -> generic
      return "Giá trị không hợp lệ";
    }

    // For objects/arrays, try to extract a first-stringy message
    try {
      if (Array.isArray(value) && value.length > 0) {
        return normalizeFieldMessage(value[0], field);
      }
      if (value && typeof value === "object") {
        if (typeof value.message === "string")
          return normalizeFieldMessage(value.message, field);
        // pick first string property
        for (const k of Object.keys(value)) {
          const v = (value as any)[k];
          if (typeof v === "string") return normalizeFieldMessage(v, field);
          if (Array.isArray(v) && v.length > 0)
            return normalizeFieldMessage(v[0], field);
        }
      }
    } catch (e) {
      // noop
    }

    return "Giá trị không hợp lệ";
  };

  if (!error) {
    return { fieldErrors, generalError };
  }

  // If the error is already a structured object with `errors` (common shape), extract it
  if (error.errors && typeof error.errors === "object") {
    for (const [k, v] of Object.entries(error.errors)) {
      if (Array.isArray(v)) {
        fieldErrors[k] = normalizeFieldMessage(v[0], k);
      } else {
        fieldErrors[k] = normalizeFieldMessage(v, k);
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return {
        fieldErrors,
        generalError: "Vui lòng kiểm tra lại thông tin đã nhập",
      };
    }
  }

  // Extract error message (string) for regex-based matching and for attempts to parse embedded JSON
  let errorMessage =
    error.message ||
    error.error ||
    (typeof error === "string" ? error : error.toString());

  // Try to detect and parse JSON embedded in the error message (some APIs return JSON as text)
  let parsedJson: any = null;
  try {
    if (typeof errorMessage === "string") {
      parsedJson = JSON.parse(errorMessage);
    }
  } catch (e) {
    parsedJson = null;
  }

  // If direct JSON.parse failed, try extracting a JSON substring from within the message
  if (!parsedJson && typeof errorMessage === "string") {
    const jsonMatch = errorMessage.match(/\{[\s\S]*\}/m);
    if (jsonMatch) {
      try {
        parsedJson = JSON.parse(jsonMatch[0]);
        // If parsed JSON contains a nested message, prefer that for clearer matching
        if (parsedJson && typeof parsedJson.message === "string") {
          errorMessage = parsedJson.message;
        }
      } catch (e) {
        parsedJson = null;
      }
    }
  }

  // If parsed JSON contains an errors object, extract that first
  if (
    parsedJson &&
    parsedJson.errors &&
    typeof parsedJson.errors === "object"
  ) {
    for (const [k, v] of Object.entries(parsedJson.errors)) {
      if (Array.isArray(v)) {
        fieldErrors[k] = normalizeFieldMessage(v[0], k);
      } else {
        fieldErrors[k] = normalizeFieldMessage(v, k);
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return {
        fieldErrors,
        generalError: "Vui lòng kiểm tra lại thông tin đã nhập",
      };
    }
  }

  // Some libraries (axios) attach response payloads under error.response.data
  const candidatePayload =
    parsedJson || error.response?.data || error.data || null;
  if (candidatePayload && typeof candidatePayload === "object") {
    // If there's an `errors` object inside candidate payload
    if (
      candidatePayload.errors &&
      typeof candidatePayload.errors === "object"
    ) {
      for (const [k, v] of Object.entries(candidatePayload.errors)) {
        if (Array.isArray(v)) {
          fieldErrors[k] = normalizeFieldMessage(v[0], k);
        } else {
          fieldErrors[k] = normalizeFieldMessage(v, k);
        }
      }
      if (Object.keys(fieldErrors).length > 0) {
        return {
          fieldErrors,
          generalError: "Vui lòng kiểm tra lại thông tin đã nhập",
        };
      }
    }

    // If payload contains direct field keys (e.g., { email: 'exists' }) map them
    for (const key of Object.keys(candidatePayload)) {
      if (/(username|email|phone|password|birthday|address|role)/i.test(key)) {
        const v = (candidatePayload as any)[key];
        fieldErrors[key] = normalizeFieldMessage(v, key);
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return {
        fieldErrors,
        generalError: "Vui lòng kiểm tra lại thông tin đã nhập",
      };
    }
  }

  // If no specific field error found yet, check for common validation patterns
  if (Object.keys(fieldErrors).length === 0) {
    // Check for duplicate key errors
    if (/duplicate|exists|already.*exists|đã.*tồn.*tại/i.test(errorMessage)) {
      // Try to identify which field is duplicated
      if (/email/i.test(errorMessage)) {
        fieldErrors.email = "Email này đã được sử dụng";
      } else if (/username|user.*name/i.test(errorMessage)) {
        fieldErrors.username = "Tên đăng nhập này đã được sử dụng";
      } else if (/phone/i.test(errorMessage)) {
        fieldErrors.phone = "Số điện thoại này đã được sử dụng";
      } else {
        fieldErrors.email = errorMessage; // Default to email field
      }
    }
    // Check for validation errors
    else if (/invalid|không.*hợp.*lệ|validation/i.test(errorMessage)) {
      if (/email/i.test(errorMessage)) {
        fieldErrors.email = "Email không hợp lệ";
      } else if (/phone/i.test(errorMessage)) {
        fieldErrors.phone = "Số điện thoại không hợp lệ";
      } else if (/password/i.test(errorMessage)) {
        fieldErrors.password = "Mật khẩu không hợp lệ";
      } else if (/birthday|date/i.test(errorMessage)) {
        fieldErrors.birthday = "Ngày sinh không hợp lệ";
      }
    }
    // Check for required field errors
    else if (/required|bắt.*buộc|cần.*thiết/i.test(errorMessage)) {
      if (/email/i.test(errorMessage)) {
        fieldErrors.email = "Email là bắt buộc";
      } else if (/username/i.test(errorMessage)) {
        fieldErrors.username = "Tên đăng nhập là bắt buộc";
      } else if (/password/i.test(errorMessage)) {
        fieldErrors.password = "Mật khẩu là bắt buộc";
      } else if (/phone/i.test(errorMessage)) {
        fieldErrors.phone = "Số điện thoại là bắt buộc";
      }
    }
  }

  // As a last resort: try to infer a field from the message and set a concise message
  if (Object.keys(fieldErrors).length === 0) {
    const fieldMappings = {
      username: /username|user.*name|tên.*đăng.*nhập|tên.*người.*dùng/i,
      email: /email/i,
      phone: /phone|số.*điện.*thoại|phone.*number/i,
      password: /password|mật.*khẩu/i,
      birthday: /birthday|ngày.*sinh|date.*birth/i,
      address: /address|địa.*chỉ/i,
      role: /role|vai.*trò/i,
    } as Record<string, RegExp>;

    for (const [field, regex] of Object.entries(fieldMappings)) {
      if (regex.test(errorMessage)) {
        // Set a short, user-friendly message per field
        switch (field) {
          case "email":
            fieldErrors.email = "Email không hợp lệ hoặc đã tồn tại";
            break;
          case "username":
            fieldErrors.username = "Tên đăng nhập không hợp lệ";
            break;
          case "phone":
            fieldErrors.phone = "Số điện thoại không hợp lệ";
            break;
          case "password":
            fieldErrors.password = "Mật khẩu không hợp lệ";
            break;
          case "birthday":
            fieldErrors.birthday = "Ngày sinh không hợp lệ";
            break;
          case "address":
            fieldErrors.address = "Địa chỉ không hợp lệ";
            break;
          default:
            fieldErrors[field] = "Vui lòng kiểm tra trường này";
        }
        break;
      }
    }
  }

  // Sanitize long or JSON-like field messages to keep UI concise
  for (const [k, v] of Object.entries(fieldErrors)) {
    try {
      if (typeof v === "string") {
        // If the message looks like a JSON blob, try extracting inner message
        const jsonMatch = v.match(/\{[\s\S]*\}/m);
        if (jsonMatch) {
          try {
            const inner = JSON.parse(jsonMatch[0]);
            if (inner && typeof inner.message === "string") {
              fieldErrors[k] = inner.message;
              continue;
            }
          } catch (e) {
            // ignore JSON parse errors
          }
        }

        // If still very long, shorten to the first sentence or a friendly default
        if (v.length > 180) {
          const firstLine = v.split(/\.|\n/)[0];
          if (firstLine && firstLine.length > 0) {
            fieldErrors[k] = firstLine.trim();
          } else {
            fieldErrors[k] = "Vui lòng kiểm tra trường này";
          }
        }
      }
    } catch (e) {
      // noop
    }
  }

  // Set general error message
  if (Object.keys(fieldErrors).length > 0) {
    // If we have field errors, use a generic message for toast
    generalError = "Vui lòng kiểm tra lại thông tin đã nhập";
  } else {
    // Use the original error message
    generalError = errorMessage;
  }

  return { fieldErrors, generalError };
}
