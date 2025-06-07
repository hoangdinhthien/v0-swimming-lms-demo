// Socket server configuration
interface SocketConfig {
  SERVER_URL: string;
  PATH: string;
  USE_MOCK_SOCKET: boolean;
}

// Get configuration based on environment
const getSocketConfig = (): SocketConfig => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined";

  // Default to development config
  const isProduction = isBrowser && window.location.hostname !== "localhost";

  // Get mock socket flag from environment variable
  const useMockSocket = process.env.NEXT_PUBLIC_USE_MOCK_SOCKET === "true";

  if (isProduction) {
    // Production configuration
    return {
      SERVER_URL:
        process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
        "https://api.swimming-lms.com",
      PATH: "/socket/notification",
      USE_MOCK_SOCKET: false, // Never use mock in production
    };
  } else {
    // Development configuration
    return {
      SERVER_URL:
        process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:6001",
      PATH: "/socket/notification",
      USE_MOCK_SOCKET: useMockSocket,
    };
  }
};

export const socketConfig = getSocketConfig();
