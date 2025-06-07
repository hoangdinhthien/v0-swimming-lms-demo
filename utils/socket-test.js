// Socket Connection Test Script
// Run this in the browser console to test WebSocket connection

(function testSocketConnection() {
  console.log("Testing WebSocket connection...");

  // Check if Socket.IO client is available
  if (typeof io === "undefined") {
    console.error(
      "Socket.IO client not found. Include the Socket.IO library first."
    );
    return;
  }

  // Get auth token (assumes you're running this in the application context)
  const token =
    localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

  if (!token) {
    console.error("No authentication token found. Please log in first.");
    return;
  }

  // Try to connect to server
  console.log("Attempting to connect...");

  const socketURL =
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:6001";
  const socketPath = "/socket/notification";

  const socket = io(`${socketURL}${socketPath}`, {
    auth: {
      token: token,
    },
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
  });

  // Set up event listeners
  socket.on("connect", () => {
    console.log("✅ Connection successful!");
    console.log("Socket ID:", socket.id);
  });

  socket.on("connected", (data) => {
    console.log("✅ Server acknowledged connection:", data);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Connection error:", err.message);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
  });

  // Cleanup function
  window.closeSocketTest = () => {
    socket.disconnect();
    console.log("Test connection closed.");
  };

  console.log("Test running. Call window.closeSocketTest() to disconnect.");
})();
