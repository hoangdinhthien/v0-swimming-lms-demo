// Basic WebSocket Server for Swimming LMS
// This should be run as a separate Node.js application

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://your-netlify-site.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket/notification",
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected users
const connectedUsers = new Map();

// Authentication middleware for socket connections
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify JWT token (you'll need to use your actual JWT secret)
    // For demo purposes, we'll skip verification
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // socket.userId = decoded.id;

    // For now, just extract user info from token (without verification)
    socket.userId = "user-" + Date.now();
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Store user connection
  connectedUsers.set(socket.userId, socket.id);

  // Send connection acknowledgment
  socket.emit("connected", {
    message: "Successfully connected to WebSocket server",
    socketId: socket.id,
    timestamp: new Date().toISOString(),
  });

  // Handle joining conversation rooms
  socket.on("join_conversation", (data) => {
    const { conversationId } = data;
    socket.join(conversationId);
    console.log(`User ${socket.userId} joined conversation: ${conversationId}`);
  });

  // Handle sending messages
  socket.on("send_message", (messageData) => {
    console.log("Message received:", messageData);

    // Add server-side data to message
    const message = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };

    // Broadcast message to conversation room
    if (messageData.conversationId) {
      socket.to(messageData.conversationId).emit("message", message);
    }

    // Send confirmation back to sender
    socket.emit("message_sent", { success: true, messageId: message.id });
  });

  // Handle marking messages as read
  socket.on("mark_read", (data) => {
    const { messageIds } = data;
    console.log(`Marking messages as read: ${messageIds}`);
    // Here you would typically update your database
    socket.emit("messages_marked_read", { messageIds });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.userId);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Basic HTTP endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Swimming LMS WebSocket Server",
    status: "running",
    connectedUsers: connectedUsers.size,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    connectedUsers: connectedUsers.size,
  });
});

// Start server
const PORT = process.env.PORT || 6001;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📡 Socket.IO path: /socket/notification`);
  console.log(`🌐 Access server at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});
