"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getAuthToken } from "@/api/auth-utils";
import { io, Socket as ClientSocket } from "socket.io-client";
import { socketConfig } from "@/configs/socket-config";

// Define types for messages and notifications
export interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    name: string;
  };
  timestamp: number;
  read: boolean;
  conversationId?: string;
}

export interface NotificationData {
  type: string;
  message: string;
  data?: any;
  timestamp: number;
}

// Properly define socket variable with correct type
let socket: ClientSocket | null = null;

// Use configuration from the config file
const USE_MOCK_SOCKET = socketConfig.USE_MOCK_SOCKET;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
  const [lastNotification, setLastNotification] =
    useState<NotificationData | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [offlineMessages, setOfflineMessages] = useState<
    Omit<ChatMessage, "id" | "timestamp" | "read">[]
  >([]);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    // Close existing connection if any
    if (socket) {
      socket.disconnect();
    }

    const token = getAuthToken();
    if (!token) {
      setConnectionError("No authentication token available");
      return;
    }

    try {
      // Use mock socket to avoid connection errors in development
      if (USE_MOCK_SOCKET) {
        console.log("Using mock WebSocket connection");
        setTimeout(() => {
          setIsConnected(true);
          setConnectionError(null);
        }, 500);
        return;
      } // Only try real connection if mock is disabled

      // Use server URL from config
      const socketURL = `${socketConfig.SERVER_URL}${socketConfig.PATH}`;
      console.log(`Connecting to socket server at: ${socketURL}`);

      socket = io(socketURL, {
        auth: {
          token: token,
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Setup event listeners
      socket.on("connect", () => {
        console.log("Socket connected:", socket?.id);
        setIsConnected(true);
        setConnectionError(null);

        // Send any pending offline messages when we reconnect
        if (offlineMessages.length > 0) {
          console.log(`Sending ${offlineMessages.length} pending messages`);
          offlineMessages.forEach((msg) => {
            socket?.emit("send_message", msg);
          });
          // Clear offline messages queue after sending
          setOfflineMessages([]);
        }
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      socket.on("connected", (data: any) => {
        console.log("Connected event:", data);
      });

      socket.on("notification", (data: NotificationData) => {
        console.log("Notification received:", data);
        setLastNotification(data);
      });

      socket.on("message", (message: ChatMessage) => {
        console.log("Message received:", message);
        setLastMessage(message);
      });

      socket.on("connect_error", (err: Error) => {
        console.error("Connection error:", err.message);
        setConnectionError(`Connection error: ${err.message}`);

        // Check if the error is due to authentication
        if (
          err.message.includes("auth") ||
          err.message.includes("token") ||
          err.message.includes("unauthorized")
        ) {
          // Auth token might be invalid, let the component handle this
          setConnectionError(
            "Authentication token expired or invalid. Please log in again."
          );
        }
      });

      return () => {
        socket?.disconnect();
        socket = null;
      };
    } catch (error) {
      console.error("Socket initialization error:", error);
      setConnectionError(`Failed to initialize socket: ${error}`);
    }
  }, [offlineMessages]);

  // Send a message through the socket
  const sendMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp" | "read">) => {
      if (USE_MOCK_SOCKET) {
        // For mock socket, simulate sending and receiving
        const mockMessage: ChatMessage = {
          ...message,
          id: `sent-${Date.now()}`,
          timestamp: Date.now(),
          read: false,
        };

        setTimeout(() => {
          simulateReceiveMessage({
            ...message,
            sender: message.receiver,
            receiver: message.sender,
            content: `Reply to: ${message.content}`,
          });
        }, 1000);

        return true;
      }

      if (socket && isConnected) {
        // Send message directly if connected
        socket.emit("send_message", message);
        return true;
      } else {
        // Store messages for when we reconnect
        setOfflineMessages((prev) => [...prev, message]);
        return true; // Optimistically return true for better UX
      }
    },
    [isConnected]
  );

  // Join a specific chat room or conversation
  const joinConversation = useCallback(
    (conversationId: string) => {
      if (socket && isConnected) {
        socket.emit("join_conversation", { conversationId });
        return true;
      }
      return false;
    },
    [isConnected]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (messageIds: string[]) => {
      if (socket && isConnected) {
        socket.emit("mark_read", { messageIds });
        return true;
      }
      return false;
    },
    [isConnected]
  );

  // Simulate receiving a message (for demo/testing purposes)
  const simulateReceiveMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp" | "read">) => {
      const mockMessage: ChatMessage = {
        ...message,
        id: `mock-${Date.now()}`,
        timestamp: Date.now(),
        read: false,
      };
      setLastMessage(mockMessage);
      return true;
    },
    []
  );
  return {
    isConnected,
    lastMessage,
    lastNotification,
    connectionError,
    initializeSocket,
    sendMessage,
    joinConversation,
    markAsRead,
    simulateReceiveMessage, // Added for development/demo
    useMockSocket: USE_MOCK_SOCKET, // Expose the mock socket flag
    offlineMessages, // Expose offline messages array
  };
};

// Export a function to get the socket instance (useful for components that need direct access)
export const getSocketInstance = () => socket;
