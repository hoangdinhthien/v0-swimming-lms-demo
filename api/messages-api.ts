import config from "@/api/config.json";
import { getMediaDetails } from "@/api/media-api";

export interface Conversation {
  _id: string;
  type: string[];
  users: string[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

// New interface for chat message
export interface ChatMessage {
  _id: string;
  content: string;
  conversation: string;
  media: string[];
  created_at: string;
  created_by: {
    _id: string;
    email: string;
    username: string;
    role_system: string;
    role: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
    role_front: string[];
    parent_id: string[];
    featured_image?: string[];
    // Other possible fields
    phone?: string;
    password?: string;
    birthday?: string;
    cover?: string[];
  };
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  avatarUrl?: string; // Added field to store the resolved avatar URL
}

// New interface for chat messages response
export interface ChatMessagesResponse {
  data: [
    [
      {
        data: ChatMessage[];
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

export interface UserDetail {
  _id: string;
  user: {
    _id: string;
    email: string;
    username: string;
    role_system: string;
    role: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
    role_front: string[];
    parent_id: string[];
    featured_image?: string[];
  };
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  avatarUrl?: string; // Added field to store the resolved avatar URL
}

export interface ConversationWithUserDetails extends Conversation {
  userDetails: UserDetail[]; // Will store user details fetched from fetchUserDetail
}

export interface ConversationResponse {
  data: [
    [
      {
        data: Conversation[];
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

export async function fetchConversations({
  tenantId,
  token,
}: {
  tenantId: string;
  token: string;
}): Promise<Conversation[]> {
  if (!tenantId || !token) {
    console.error("Missing tenantId or token for fetchConversations", {
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực");
  }

  const url = `${config.API}/v1/workflow-process/messages`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  console.log("[fetchConversations] URL:", url);
  console.log("[fetchConversations] Headers:", headers);

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy danh sách cuộc trò chuyện");
  }

  const data: ConversationResponse = await res.json();

  // Unwrap the nested structure to get the array of conversations
  const conversations = data.data?.[0]?.[0]?.data || [];
  return conversations;
}

// Duplicated from instructors-api.ts as requested
export async function fetchUserDetail({
  userId,
  tenantId,
  token,
}: {
  userId: string;
  tenantId: string;
  token: string;
}): Promise<UserDetail | null> {
  if (!userId || !tenantId || !token) {
    console.error("Missing userId, tenantId, or token", {
      userId,
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực hoặc ID người dùng");
  }

  const url = `${config.API}/v1/workflow-process/manager/user?id=${userId}`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  console.log("[fetchUserDetail] URL:", url);
  console.log("[fetchUserDetail] Headers:", headers);

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy thông tin người dùng");
  }
  const data = await res.json();
  // Unwrap the nested structure: data.data[0][0][0]
  const user = data.data?.[0]?.[0]?.[0];
  return user || null;
}

export async function fetchConversationsWithUserDetails({
  tenantId,
  token,
}: {
  tenantId: string;
  token: string;
}): Promise<ConversationWithUserDetails[]> {
  // First, get all conversations
  const conversations = await fetchConversations({ tenantId, token });

  // Then, fetch user details for each user in the conversations
  const conversationsWithDetails = await Promise.all(
    conversations.map(async (conversation) => {
      const userDetails = await Promise.all(
        conversation.users.map(async (userId) => {
          try {
            return await fetchUserDetail({ userId, tenantId, token });
          } catch (error) {
            console.error(
              `Failed to fetch user details for ID ${userId}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out null values and cast to UserDetail[] to satisfy TypeScript
      const validUserDetails = userDetails.filter(
        (detail): detail is UserDetail => detail !== null
      );

      // Process user details with avatars
      const processedUserDetails = await Promise.all(
        validUserDetails.map(async (detail) => {
          const avatarUrl = await fetchUserAvatar(detail.user?.featured_image);
          return {
            ...detail,
            avatarUrl,
          };
        })
      );

      return {
        ...conversation,
        userDetails: processedUserDetails,
      };
    })
  );

  return conversationsWithDetails;
}

// Helper function to fetch and process user avatar from featured_image
export async function fetchUserAvatar(
  featured_image?: string[]
): Promise<string> {
  let avatarUrl = "/placeholder.svg"; // Default avatar

  if (featured_image && featured_image.length > 0) {
    try {
      const mediaPath = await getMediaDetails(featured_image[0]);
      if (mediaPath) {
        avatarUrl = mediaPath;
      }
    } catch (error) {
      console.error("Error fetching avatar image:", error);
    }
  }

  return avatarUrl;
}

// New function to fetch messages for a specific conversation
export async function fetchConversationMessages({
  conversationId,
  tenantId,
  token,
}: {
  conversationId: string;
  tenantId: string;
  token: string;
}): Promise<ChatMessage[]> {
  if (!conversationId || !tenantId || !token) {
    console.error("Missing conversationId, tenantId, or token", {
      conversationId,
      tenantId,
      token,
    });
    throw new Error("Thiếu thông tin xác thực hoặc ID cuộc trò chuyện");
  }

  const url = `${config.API}/v1/workflow-process/message?conversation=${conversationId}&limit=1000`;
  const headers = {
    "x-tenant-id": String(tenantId),
    Authorization: `Bearer ${String(token)}`,
  };

  console.log("[fetchConversationMessages] URL:", url);
  console.log("[fetchConversationMessages] Headers:", headers);

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API error:", res.status, errorText);
    throw new Error("Không thể lấy tin nhắn trong cuộc trò chuyện");
  }

  const data: ChatMessagesResponse = await res.json();

  // Unwrap the nested structure to get the array of messages
  const messages = data.data?.[0]?.[0]?.data || [];

  // Process avatars for all messages
  const messagesWithAvatars = await Promise.all(
    messages.map(async (message) => {
      // Fetch and process the avatar URL
      const avatarUrl = await fetchUserAvatar(
        message.created_by.featured_image
      );

      // Return the message with the avatar URL
      return {
        ...message,
        avatarUrl,
      };
    })
  );

  return messagesWithAvatars;
}
