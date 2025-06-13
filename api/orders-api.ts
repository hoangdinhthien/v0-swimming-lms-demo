import config from "@/api/config.json";
import { getAuthToken } from "@/api/auth-utils";

export interface OrderGuest {
  username: string;
  phone: string;
  email: string;
}

export interface OrderUser {
  _id: string;
  email: string;
  username: string;
  password: string;
  role_system: string;
  role: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role_front: string[];
  parent_id: string[];
  featured_image?: string[];
}

export interface OrderPayment {
  url: string;
  app_trans_id: string;
  zp_trans_id?: number;
}

export interface Order {
  _id: string;
  type: "guest" | "member";
  course: string;
  price: number;
  guest: OrderGuest | null;
  user?: OrderUser;
  created_at: string;
  created_by: string | null;
  tenant_id: string;
  status: string[];
  payment: OrderPayment;
}

export interface OrdersResponse {
  data: [
    [
      {
        data: Order[];
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

/**
 * Fetch orders for the current tenant with pagination
 */
export async function fetchOrders({
  tenantId,
  token,
  page = 1,
  limit = 10,
}: {
  tenantId: string;
  token: string;
  page?: number;
  limit?: number;
}): Promise<{ orders: Order[]; total: number; currentPage: number }> {
  // Debug: log input params
  console.log("[fetchOrders] called with", { tenantId, token, page, limit });
  if (!tenantId || !token) {
    console.error("[fetchOrders] Missing tenantId or token", {
      tenantId,
      token,
    });
    throw new Error(
      "Thiếu thông tin xác thực (token hoặc tenantId). Vui lòng đăng nhập lại hoặc chọn chi nhánh."
    );
  }

  const url = `${config.API}/v1/workflow-process/manager/orders?page=${page}&limit=${limit}`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  console.log("[fetchOrders] URL:", url);
  console.log("[fetchOrders] Headers:", headers);

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[fetchOrders] API error:", res.status, errorText);
      throw new Error("Không thể lấy danh sách đơn hàng: " + errorText);
    }

    const data: OrdersResponse = await res.json();
    console.log("[fetchOrders] API Response:", data);

    // Unwrap the nested structure to get the array of orders
    const orders = data.data?.[0]?.[0]?.data || [];
    console.log("[fetchOrders] Parsed orders count:", orders.length);

    const meta = data.data?.[0]?.[0]?.meta_data;
    const total = meta?.count || orders.length;
    const currentPage = meta?.page || page;

    return {
      orders,
      total,
      currentPage,
    };
  } catch (error) {
    console.error("[fetchOrders] Exception:", error);
    throw error;
  }
}

/**
 * Format price to VND currency format
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Gets a user-friendly status name from status code
 */
export function getStatusName(status: string[]): string {
  if (!status || status.length === 0) return "Không xác định";

  const statusCode = status[0].toLowerCase();
  switch (statusCode) {
    case "paid":
      return "Đã thanh toán";
    case "pending":
      return "Đang chờ";
    case "expired":
      return "Đã hết hạn";
    case "cancelled":
      return "Đã hủy";
    case "refunded":
      return "Đã hoàn tiền";
    default:
      return statusCode.charAt(0).toUpperCase() + statusCode.slice(1);
  }
}

/**
 * Gets the CSS class for a status badge
 */
export function getStatusClass(status: string[]): string {
  if (!status || status.length === 0)
    return "bg-gray-50 text-gray-700 border-gray-200";

  const statusCode = status[0].toLowerCase();
  switch (statusCode) {
    case "paid":
      return "bg-green-50 text-green-700 border-green-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "expired":
      return "bg-red-50 text-red-700 border-red-200";
    case "cancelled":
      return "bg-gray-50 text-gray-700 border-gray-200";
    case "refunded":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

/**
 * Get user display name from an order
 */
export function getOrderUserName(order: Order): string {
  if (order.type === "guest" && order.guest) {
    return order.guest.username;
  } else if (order.type === "member" && order.user) {
    return order.user.username;
  }
  return "Không xác định";
}

/**
 * Get user ID or contact info from an order
 */
export function getOrderUserContact(order: Order): string {
  if (order.type === "guest" && order.guest) {
    return order.guest.phone || order.guest.email;
  } else if (order.type === "member" && order.user) {
    return order.user._id;
  }
  return "N/A";
}

/**
 * Update the status of an order
 */
export async function updateOrderStatus({
  orderId,
  status,
  tenantId,
  token,
}: {
  orderId: string;
  status: string;
  tenantId: string;
  token: string;
}): Promise<Order> {
  if (!tenantId || !token) {
    throw new Error("Thiếu thông tin xác thực");
  }

  const url = `${config.API}/v1/workflow-process/manager/order/${orderId}/status`;
  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ status: [status] }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể cập nhật trạng thái giao dịch");
  }

  const data = await res.json();
  return data.data?.[0]?.[0]?.data || {};
}
