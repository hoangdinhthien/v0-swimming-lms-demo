import config from "../config.json";
import { getAuthToken } from "../auth-utils";

export interface OrderGuest {
  username: string;
  phone: string;
  email: string;
}

export interface OrderUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  role_front: string[];
  parent_id: string[];
  phone: string;
  is_active: boolean;
  birthday: string;
  address: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  featured_image?: string;
}

export interface OrderPayment {
  url: string;
  app_trans_id: string;
  zp_trans_id?: string;
}

export interface OrderCourse {
  _id: string;
  title: string;
  description?: string;
  price: number;
  category?: string[];
  session_number?: number;
  session_number_duration?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  is_active?: boolean;
  slug?: string;
  detail?: Array<{ title: string }>;
  media?: string | string[];
}

export interface OrderClass {
  _id: string;
  name: string;
  course: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface Order {
  _id: string;
  type: string[]; // Changed from string to string[] to match API response
  course: OrderCourse | string; // Can be either an object or string ID
  price: number;
  guest?: OrderGuest; // Made optional since not all orders have guest data
  user?: OrderUser;
  created_at: string;
  created_by: string | null;
  tenant_id: string;
  status: string[];
  payment?: OrderPayment; // Made optional since not all orders have payment data
  updated_at?: string; // Added optional updated_at field
  updated_by?: string; // Added optional updated_by field
  class?: OrderClass; // Added optional class field from API response
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    last_page: number;
    current_page: number;
  };
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

  const url = `${config.API}/v1/order?page=${page}&limit=${limit}`;
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

    // Parse the new flat structure where data is directly an array of orders
    const orders = data.data || [];
    console.log("[fetchOrders] Parsed orders count:", orders.length);

    const meta = data.meta;
    const total = meta?.total || orders.length;
    const currentPage = meta?.current_page || page;

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
 * Get the course ID from an order (handles both object and string formats)
 */
export function getOrderCourseId(order: Order): string {
  if (typeof order.course === "string") {
    return order.course;
  }
  return order.course._id;
}

/**
 * Get the course title from an order (returns the title if course is an object, or the ID if string)
 */
export function getOrderCourseTitle(order: Order): string {
  if (typeof order.course === "string") {
    return order.course; // Return the ID as fallback
  }
  return order.course.title || order.course._id;
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
  const orderType = getOrderType(order);

  if (orderType === "guest" && order.guest?.username) {
    return order.guest.username;
  } else if (orderType === "member" && order.user?.username) {
    return order.user.username;
  }
  return "Không xác định";
}

/**
 * Get user ID or contact info from an order
 */
export function getOrderUserContact(order: Order): string {
  const orderType = getOrderType(order);

  if (orderType === "guest" && order.guest) {
    return order.guest.phone || order.guest.email || "N/A";
  } else if (orderType === "member" && order.user) {
    return order.user.phone || order.user.email || order.user._id || "N/A";
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
  return data.data || {};
}

/**
 * Update an order with a user ID (convert guest order to member order)
 */
export async function updateOrderWithUser({
  orderId,
  userId,
  tenantId,
  token,
}: {
  orderId: string;
  userId: string;
  tenantId: string;
  token: string;
}): Promise<Order> {
  if (!tenantId || !token) {
    throw new Error("Thiếu thông tin xác thực");
  }

  const url = `${config.API}/v1/order/${orderId}`;
  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ user: [userId] }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể cập nhật đơn hàng với thông tin người dùng");
  }

  const data = await res.json();
  return data.data || {};
}

/**
 * Get the order type (guest or member) from an order
 */
export function getOrderType(order: Order): string {
  return order.type && order.type.length > 0 ? order.type[0] : "unknown";
}

/**
 * Get a user-friendly display name for the order type
 */
export function getOrderTypeDisplayName(order: Order): string {
  const orderType = getOrderType(order);
  switch (orderType) {
    case "guest":
      return "Khách";
    case "member":
      return "Thành viên";
    default:
      return orderType || "Không xác định";
  }
}

/**
 * Fetch orders by course and class with filters for student selection
 */
export async function fetchOrdersForCourse({
  tenantId,
  token,
  courseId,
  classId,
  status = "paid",
  type = "member",
}: {
  tenantId: string;
  token: string;
  courseId: string;
  classId: string;
  status?: string;
  type?: string;
}): Promise<Order[]> {
  console.log("[fetchOrdersForCourse] called with", {
    tenantId,
    token,
    courseId,
    classId,
    status,
    type,
  });
  if (!tenantId || !token) {
    console.error("[fetchOrdersForCourse] Missing tenantId or token", {
      tenantId,
      token,
    });
    throw new Error(
      "Thiếu thông tin xác thực (token hoặc tenantId). Vui lòng đăng nhập lại hoặc chọn chi nhánh."
    );
  }

  // Build the new search-based URL with unencoded square brackets and colons
  const queryParams = [
    `search[course._id%3Ain]=${courseId}`,
    `search[class._id%3Ain]=${classId}`,
    `search[type:contains]=${type}`,
    `search[status:contains]=${status}`,
  ].join("&");

  const url = `${config.API}/v1/order?${queryParams}`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  console.log("[fetchOrdersForCourse] URL:", url);
  console.log("[fetchOrdersForCourse] Headers:", headers);

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[fetchOrdersForCourse] API error:", res.status, errorText);
      throw new Error("Không thể lấy danh sách đơn hàng: " + errorText);
    }

    const data: OrdersResponse = await res.json();
    console.log("[fetchOrdersForCourse] API Response:", data);

    // Parse the new flat structure where data is directly an array of orders
    const orders = data.data || [];
    console.log("[fetchOrdersForCourse] Parsed orders count:", orders.length);

    return orders;
  } catch (error) {
    console.error("[fetchOrdersForCourse] Exception:", error);
    throw error;
  }
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrderById({
  orderId,
  tenantId,
  token,
}: {
  orderId: string;
  tenantId: string;
  token: string;
}): Promise<Order> {
  console.log("[fetchOrderById] called with", { orderId, tenantId, token });
  if (!tenantId || !token) {
    console.error("[fetchOrderById] Missing tenantId or token", {
      tenantId,
      token,
    });
    throw new Error(
      "Thiếu thông tin xác thực (token hoặc tenantId). Vui lòng đăng nhập lại hoặc chọn chi nhánh."
    );
  }

  const url = `${config.API}/v1/workflow-process/manager/order?id=${orderId}`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  console.log("[fetchOrderById] URL:", url);
  console.log("[fetchOrderById] Headers:", headers);

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[fetchOrderById] API error:", res.status, errorText);
      if (res.status === 404) {
        throw new Error("404");
      }
      throw new Error("Không thể lấy thông tin đơn hàng: " + errorText);
    }

    const data = await res.json();
    console.log("[fetchOrderById] API Response:", data);

    // Handle the nested structure for single order: data[0][0][0]
    const order = data.data?.[0]?.[0]?.[0];
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return order;
  } catch (error) {
    console.error("[fetchOrderById] Exception:", error);
    throw error;
  }
}

/**
 * Add a member to a class using the new backend API
 * @param classId - The ID of the class
 * @param memberId - The ID of the member to add
 * @param tenantId - Optional tenant ID
 * @param token - Optional auth token
 * @returns Promise with the API response
 */
export async function addMemberToClass(
  classId: string,
  memberId: string,
  tenantId?: string,
  token?: string
): Promise<any> {
  // Use provided tenant and token, or get from utils
  const finalTenantId =
    tenantId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("selectedTenant")
      : null);
  const finalToken = token || getAuthToken();

  if (!finalTenantId || !finalToken) {
    throw new Error("Missing authentication or tenant information");
  }

  if (!classId || !memberId) {
    throw new Error("Class ID and Member ID are required");
  }

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/class/add-member?id=${classId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": finalTenantId,
        Authorization: `Bearer ${finalToken}`,
      },
      body: JSON.stringify({
        member: memberId,
      }),
    }
  );

  if (!response.ok) {
    let errorMessage = `Failed to add member to class: ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (parseError) {
      try {
        const errorText = await response.text();
        errorMessage = `Failed to add member to class: ${response.status}, ${errorText}`;
      } catch (textError) {
        errorMessage = `Failed to add member to class: ${response.status}`;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
