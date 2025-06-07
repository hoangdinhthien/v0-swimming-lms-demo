# WebSocket Integration for Real-time Messaging

This document explains how to use the WebSocket functionality that has been integrated into the AquaLearn platform for real-time messaging.

## Implementation Overview

The WebSocket integration consists of:

1. A WebSocket client utility (`utils/socket-utils.ts`) that connects to the socket server
2. Integration with the messages UI (`app/dashboard/manager/messages/page.tsx`)
3. Real-time updates for message delivery and notifications

## Getting Started

### Prerequisites

- The WebSocket server is running at `http://localhost:6001/socket/notification`
- Authentication is handled via Bearer token

### How it Works

The WebSocket integration uses Socket.io client to establish a connection with the WebSocket server. The `useSocket` hook in `utils/socket-utils.ts` provides all the necessary functionality for connecting, sending messages, and receiving updates.

```typescript
// Example usage
const { isConnected, lastMessage, sendMessage, joinConversation } = useSocket();
```

### Features

- **Real-time messaging**: Messages are delivered instantly
- **Connection status indicators**: Shows when the connection is active or disconnected
- **Automatic reconnection**: The client will attempt to reconnect if the connection is lost
- **Message typing indicators**: (Coming soon)
- **Read receipts**: (Coming soon)

## Implementation Details

### Socket Connection

The connection is established with authentication headers:

```typescript
const socket = io("http://localhost:6001/socket/notification", {
  extraHeaders: {
    Authorization: "Bearer " + token,
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

### Event Handling

The WebSocket client listens for these events:

- `connect` - Connection established
- `disconnect` - Connection closed
- `connected` - Server acknowledgment
- `notification` - System notifications
- `message` - New message received

### Sending Messages

Messages can be sent using the `sendMessage` function:

```typescript
const messageData = {
  content: "Hello, world!",
  sender: { id: "user-id", name: "User Name" },
  receiver: { id: "receiver-id", name: "Receiver Name" },
  conversationId: "conversation-id",
};

sendMessage(messageData);
```

### Joining Conversations

To join a specific conversation for real-time updates:

```typescript
joinConversation("conversation-id");
```

## UI Integration

The messages page has been updated to:

1. Show real-time connection status
2. Display incoming and outgoing messages
3. Provide visual feedback for message delivery
4. Handle connection errors with user-friendly alerts

## Configuration for Production

Before deploying to production:

1. Update the WebSocket server URL in `utils/socket-utils.ts`
2. Ensure proper authentication token handling
3. Implement any additional security measures required

## Original Code from Team Lead

The original code provided by your team lead was:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="X-UA-Compatible"
      content="IE=edge"
    />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>Document</title>
  </head>
  <body>
    <h1>Hello Socket</h1>
    <script src="https://cdn.socket.io/4.4.1/socket.io.min.js"></script>
    <script>
      var socket = io("http://localhost:6001/socket/notification", {
        extraHeaders: {
          Authorization:
            "Bearer " +
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MTFlOGE0N2I0NWIyOTc0YmQ2MTMzYyIsImVtYWlsIjoiYWRtaW4yMDI0QGdtYWlsLmNvbSIsInVzZXJuYW1lIjoidGllbm50IiwicGhvbmUiOiIrODQ1NTkzMzAwNzIiLCJyb2xlX3N5c3RlbSI6ImFkbWluIiwiaWF0IjoxNzQ4MDY3NjAwLCJleHAiOjE3NDgxNTQwMDB9.Mg0JRTiu4KLPE1gG9QzLphmDBTB76Ar7ysrsdeK8oZw",
        },
      });
      // Listen for 'connect' event
      socket.on("connected", function (data) {
        console.log(data);
      });
      // Listen for 'notification' event
      socket.on("notification", function (data) {
        console.log(data);
      });
    </script>
  </body>
</html>
```

This has been expanded into a fully featured React implementation in the AquaLearn platform.
