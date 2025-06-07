# WebSocket Integration Guide

This guide explains how to use the WebSocket integration in the AquaLearn application for real-time messaging and notifications.

## Overview

The application uses Socket.io for real-time communication with the server. The WebSocket functionality has been abstracted into a custom hook (`useSocket`) in `utils/socket-utils.ts` which provides an easy interface for components to connect to the server and send/receive messages.

## How to Use WebSockets in Components

### 1. Import the hook

```tsx
import { useSocket, ChatMessage } from "@/utils/socket-utils";
```

### 2. Initialize the connection

```tsx
const {
  isConnected, // Boolean indicating if socket is connected
  lastMessage, // The most recently received message
  lastNotification, // The most recently received notification
  connectionError, // Any error that occurred during connection
  initializeSocket, // Function to initialize the socket connection
  sendMessage, // Function to send a message
  joinConversation, // Function to join a conversation room
  markAsRead, // Function to mark messages as read
} = useSocket();

// Initialize the socket when component mounts
useEffect(() => {
  initializeSocket();

  // Socket cleanup is handled in the hook
}, [initializeSocket]);
```

### 3. Handle incoming messages

```tsx
// Handle incoming messages
useEffect(() => {
  if (lastMessage) {
    // Update your UI with the new message
    setMessages((prev) => [...prev, lastMessage]);

    // If appropriate, mark as read
    if (lastMessage.conversationId === activeConversation) {
      markAsRead([lastMessage.id]);
    }
  }
}, [lastMessage, activeConversation, markAsRead]);
```

### 4. Joining a conversation

When a user selects a conversation, join the corresponding room:

```tsx
useEffect(() => {
  if (activeConversation && isConnected) {
    joinConversation(activeConversation);
  }
}, [activeConversation, isConnected, joinConversation]);
```

### 5. Sending messages

```tsx
const handleSendMessage = () => {
  if (!newMessage.trim() || !activeConversation) return;

  const messageToSend = {
    content: newMessage,
    sender: {
      id: "current-user-id", // From auth
      name: "Current User", // From auth
      avatar: "/placeholder.svg",
    },
    receiver: {
      id: receiverId,
      name: receiverName,
    },
    read: false,
    conversationId: activeConversation,
  };

  const sent = sendMessage(messageToSend);

  if (sent) {
    // Optimistic update for UI
    const sentMessage = {
      ...messageToSend,
      id: `temp-${Date.now()}`,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, sentMessage]);
    setNewMessage("");
  }
};
```

## Example UI for Connection Status

You can display the connection status using the following UI pattern:

```tsx
import { Wifi, WifiOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

// In your component
{
  /* Connection status indicator */
}
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <div className='cursor-help'>
        {isConnected ? (
          <Wifi className='h-4 w-4 text-green-500' />
        ) : (
          <WifiOff className='h-4 w-4 text-amber-500' />
        )}
      </div>
    </TooltipTrigger>
    <TooltipContent>
      {isConnected ? "Đã kết nối" : "Mất kết nối"}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

## Error Handling

Display connection errors to the user:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// In your component
{
  connectionError && (
    <Alert
      variant='destructive'
      className='mb-4'
    >
      <AlertCircle className='h-4 w-4' />
      <AlertTitle>Lỗi kết nối</AlertTitle>
      <AlertDescription>
        {connectionError}. Hệ thống sẽ tự động kết nối lại.
      </AlertDescription>
    </Alert>
  );
}
```

## WebSocket Server Configuration

The WebSocket server is currently configured to connect to:

```
http://localhost:6001/socket/notification
```

Authentication is handled via a JWT token sent in the request headers:

```js
socket = io("http://localhost:6001/socket/notification", {
  extraHeaders: {
    Authorization: "Bearer " + token,
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

## Available Events

### Client to Server Events

- `join_conversation`: Join a specific conversation room
- `send_message`: Send a message to the server
- `mark_read`: Mark messages as read

### Server to Client Events

- `connect`: Socket successfully connected
- `disconnect`: Socket disconnected
- `connected`: Server acknowledges connection
- `notification`: Receive a notification
- `message`: Receive a chat message

## Types

The following types are used for messages and notifications:

```typescript
interface ChatMessage {
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

interface NotificationData {
  type: string;
  message: string;
  data?: any;
  timestamp: number;
}
```
