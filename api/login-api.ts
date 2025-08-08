import config from "./config.json";

export async function login(email: string, password: string) {
  const response = await fetch(`${config.API}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Đăng nhập thất bại");
  }

  return response.json();
}

// Interface for user profile response
export interface UserProfileResponse {
  data: {
    _id: string;
    email: string;
    username: string;
    role_system: string;
    role: Array<{
      title: string;
      permission: Array<any>;
      tenant_id: {
        _id: string;
        title: string;
        is_active: boolean;
        created_by: string;
        updated_by: string;
        created_at: string;
        updated_at: string;
        __v: number;
      };
    }>;
    role_front: string[];
    parent_id: any[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
    featured_image?: {
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
    };
    tenant_id: string | null;
    updated_by: string;
    address?: string;
    phone?: string;
  };
  message: string;
  statusCode: number;
}

// Function to get current user's profile
export async function getUserProfile(
  token: string
): Promise<UserProfileResponse> {
  const response = await fetch(`${config.API}/v1/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể lấy thông tin người dùng");
  }

  return response.json();
}
