# WebSocket Integration Guide

This document explains how WebSocket functionality is implemented in the application for real-time messaging.

## Overview

The application uses Socket.IO for WebSocket communication between clients and the server. This enables real-time features like instant messaging, notifications, and status updates.

## Implementation Details

### Client-Side Integration

1. **Socket Utility (`utils/socket-utils.ts`)**

   This custom hook provides WebSocket functionality:

   ```typescript
   const {
     isConnected, // boolean - WebSocket connection status
     lastMessage, // ChatMessage | null - Last received message
     lastNotification, // NotificationData | null - Last received notification
     connectionError, // string | null - Any connection errors
     initializeSocket, // function - Initialize socket connection
     sendMessage, // function - Send a message
     joinConversation, // function - Join a specific conversation room
     markAsRead, // function - Mark messages as read
     simulateReceiveMessage, // function - For testing/development
     useMockSocket, // boolean - Is using mock socket
     offlineMessages, // array - Messages queued while offline
   } = useSocket();
   ```

2. **Environment Configuration**

   - Socket configuration is managed in `configs/socket-config.ts`
   - Environment variables control socket behavior:
     - `NEXT_PUBLIC_SOCKET_SERVER_URL`: WebSocket server URL
     - `NEXT_PUBLIC_USE_MOCK_SOCKET`: Enable mock mode in development

3. **Development Mode**

   - In development, the application can use a mock WebSocket implementation to avoid connection errors
   - The mock implementation allows testing without a running WebSocket server

4. **Message Handling**

   - Messages are sent using the `sendMessage` function
   - Incoming messages are processed via the `lastMessage` state
   - Conversations are joined using `joinConversation` with a conversation ID
   - Offline messages are queued and sent when connection is restored

5. **Authentication Handling**

   - Token-based authentication is required
   - Connection will fail if the token is invalid or expired
   - The `useAuthStatus` hook monitors authentication status and redirects to login if needed
   - Reconnection attempts are handled automatically

### Server-Side Integration

The server expects the following Socket.IO connection details:

- **Connection URL**: Configured via environment variables (`process.env.NEXT_PUBLIC_SOCKET_SERVER_URL`)
- **Default Path**: `/socket/notification` (configurable in `configs/socket-config.ts`)
- **Authentication**: Bearer token in auth object
- **Events**:
  - `connect`: When connection is established
  - `disconnect`: When connection is lost
  - `connected`: Server acknowledgment of connection

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```
# WebSocket Configuration
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:6001
NEXT_PUBLIC_USE_MOCK_SOCKET=true
```

### Production Configuration

For production, update your environment configuration:

```
NEXT_PUBLIC_SOCKET_SERVER_URL=https://api.your-production-server.com
NEXT_PUBLIC_USE_MOCK_SOCKET=false
```
