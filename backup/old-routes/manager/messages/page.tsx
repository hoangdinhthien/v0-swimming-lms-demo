"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Search,
  Filter,
  Send,
  Paperclip,
  User,
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  useSocket,
  ChatMessage as SocketChatMessage,
} from "@/utils/socket-utils";
import { getAuthToken } from "@/api/auth-utils";
import { useAuthStatus } from "@/utils/auth-reconnection";
import {
  formatMessageTime,
  standardizeTimestamp,
  formatUtcDate,
} from "@/utils/date-utils";
import {
  fetchConversationsWithUserDetails,
  ConversationWithUserDetails,
  fetchConversationMessages,
  ChatMessage as ApiChatMessage,
} from "@/api/messages-api";
import { getMediaDetails } from "@/api/media-api";

const MessagesPageContent = () => {
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<SocketChatMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<ApiChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(
    null
  );
  // Add loading state for sending messages
  const [sendingMessage, setSendingMessage] = useState(false);

  // Use auth status hook
  const { isAuthenticated, isCheckingAuth } = useAuthStatus();

  // Get WebSocket functionality from our custom hook
  const {
    isConnected,
    lastMessage,
    lastNotification,
    connectionError,
    initializeSocket,
    sendMessage,
    joinConversation,
    simulateReceiveMessage,
    useMockSocket,
    offlineMessages,
  } = useSocket();

  // Initialize socket connection when component mounts
  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      initializeSocket();
    }

    // Setup reconnection logic
    const reconnectInterval = setInterval(() => {
      if (!isConnected && !useMockSocket && isAuthenticated) {
        console.log("Attempting to reconnect to WebSocket server...");
        setReconnecting(true);
        initializeSocket();
      } else {
        setReconnecting(false);
      }
    }, 10000); // Try to reconnect every 10 seconds

    // Cleanup on component unmount
    return () => {
      clearInterval(reconnectInterval);
    };
  }, [
    initializeSocket,
    isConnected,
    useMockSocket,
    isAuthenticated,
    isCheckingAuth,
  ]);

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      // Check for duplicates before adding
      const isDuplicate = messages.some((msg) => msg.id === lastMessage.id);

      if (!isDuplicate) {
        setMessages((prev) => [...prev, lastMessage]);

        // If the message belongs to the active conversation, mark it as read
        if (lastMessage.conversationId === activeConversation) {
          // In a real implementation, you'd call markAsRead here
        }
      }
    }
  }, [lastMessage, activeConversation, messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join conversation room when active conversation changes
  useEffect(() => {
    if (activeConversation && isConnected) {
      joinConversation(activeConversation);
    }
  }, [activeConversation, isConnected, joinConversation]);
  // Fetch conversations with user details
  useEffect(() => {
    const fetchConversationsData = async () => {
      setLoadingConversations(true);
      setConversationError(null);

      try {
        const token = getAuthToken();
        const tenantId = localStorage.getItem("selectedTenantId");

        if (!token || !tenantId) {
          setConversationError("Thiếu thông tin xác thực");
          return;
        }
        const conversationsData = await fetchConversationsWithUserDetails({
          tenantId,
          token,
        });

        // Transform API data to match UI format
        const transformedConversations = conversationsData.map((conv) => {
          const userDetails = conv.userDetails[0] || {};
          // The username is nested inside the user object based on the API response structure
          const userName = userDetails.user?.username || "Người dùng";

          // Use the avatarUrl field that was added in the API function
          const avatarUrl = userDetails.avatarUrl || "/placeholder.svg";

          return {
            id: conv._id,
            name: userName,
            avatar: avatarUrl,
            lastMessage: "Bắt đầu cuộc trò chuyện",
            unread: 0, // Format using UTC time instead of relative time
            time: formatUtcDate(conv.updated_at),
            updatedAt: new Date(conv.updated_at),
            isStudent:
              userDetails.user?.role_front?.includes("student") || false,
            userDetails: conv.userDetails,
          };
        });

        // Sort by updated time, newest first
        transformedConversations.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );

        setConversations(transformedConversations);
        console.log("Fetched conversations:", transformedConversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setConversationError("Không thể tải cuộc trò chuyện");
      } finally {
        setLoadingConversations(false);
      }
    };

    if (isAuthenticated) {
      fetchConversationsData();
    }
  }, [isAuthenticated]);
  // Fetch messages for the active conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return;

      setLoadingMessages(true);
      setMessagesError(null);

      try {
        const token = getAuthToken();
        const tenantId = localStorage.getItem("selectedTenantId");
        // Get current user ID to determine message positioning
        const currentUser = localStorage.getItem("userId");
        setCurrentUserId(currentUser || null);

        if (!token || !tenantId) {
          setMessagesError("Thiếu thông tin xác thực");
          return;
        }

        // Fetch messages from API - avatars are now processed in the API function
        const messagesData = await fetchConversationMessages({
          conversationId: activeConversation,
          tenantId,
          token,
        });

        // Sort messages by creation date, oldest first
        const sortedMessages = [...messagesData].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        setApiMessages(sortedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessagesError("Không thể tải tin nhắn");
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversation, isAuthenticated]); // Enhanced message sending with loading feedback
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    const currentConversation = conversations.find(
      (c) => c.id === activeConversation
    );
    if (!currentConversation) return;

    setSendingMessage(true);

    try {
      // Get current user info from localStorage and conversation data
      const currentUserInfo = {
        id:
          currentUserId || localStorage.getItem("userId") || "current-user-id",
        name:
          localStorage.getItem("username") ||
          localStorage.getItem("userFullName") ||
          "Current User",
        avatar: localStorage.getItem("userAvatar") || "/placeholder.svg",
      };

      const messageToSend = {
        content: newMessage.trim(),
        sender: currentUserInfo,
        receiver: {
          id: currentConversation.id,
          name: currentConversation.name,
        },
        conversationId: activeConversation,
      };

      // Send message through WebSocket
      const sent = sendMessage(messageToSend);

      if (sent) {
        // Add message to local state (for optimistic updates)
        const sentMessage = {
          ...messageToSend,
          id: `temp-${Date.now()}`, // Temporary ID for optimistic update
          timestamp: Date.now(),
          read: false,
        };

        setMessages((prev) => [...prev, sentMessage]);
        setNewMessage(""); // Clear input

        // Scroll to bottom after sending
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Could add a toast notification here in the future
    } finally {
      setSendingMessage(false);
    }
  };
  // Handle Enter key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conversation) => {
    if (!conversation) return false;

    const nameMatch = conversation.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const messageMatch = conversation.lastMessage
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    return nameMatch || messageMatch;
  });

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về trang quản lý
        </Link>
      </div>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold'>Tin nhắn</h1>
        <p className='text-muted-foreground'>
          Quản lý tin nhắn và liên lạc với học viên, phụ huynh và giáo viên
        </p>
      </div>
      {!isCheckingAuth && !isAuthenticated && (
        <Alert
          variant='destructive'
          className='mb-4'
        >
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Cần đăng nhập lại</AlertTitle>
          <AlertDescription>
            Phiên đăng nhập của bạn đã hết hạn. Bạn sẽ được chuyển hướng đến
            trang đăng nhập.
          </AlertDescription>
        </Alert>
      )}
      {connectionError && isAuthenticated && (
        <Alert
          variant={
            connectionError.includes("token") ||
            connectionError.includes("auth")
              ? "destructive"
              : "default"
          }
          className='mb-4'
        >
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Lỗi kết nối</AlertTitle>
          <AlertDescription>
            {connectionError}
            {!connectionError.includes("token") &&
              !connectionError.includes("auth") &&
              ". Hệ thống sẽ tự động kết nối lại."}
          </AlertDescription>
        </Alert>
      )}
      <div className='mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-1'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {" "}
                <CardTitle>Cuộc trò chuyện</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='cursor-help'>
                        {!isAuthenticated ? (
                          <AlertCircle className='h-4 w-4 text-red-500' />
                        ) : isConnected ? (
                          <Wifi className='h-4 w-4 text-green-500' />
                        ) : reconnecting ? (
                          <Loader2 className='h-4 w-4 text-amber-500 animate-spin' />
                        ) : (
                          <WifiOff className='h-4 w-4 text-amber-500' />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!isAuthenticated
                        ? "Chưa xác thực"
                        : isConnected
                        ? "Đã kết nối"
                        : reconnecting
                        ? "Đang kết nối lại..."
                        : "Mất kết nối"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge>{conversations.filter((c) => c.unread > 0).length}</Badge>
            </div>
            <div className='relative mt-2'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm tin nhắn...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='all'>
              <TabsList className='mb-4 w-full'>
                <TabsTrigger
                  value='all'
                  className='flex-1'
                >
                  Tất cả
                </TabsTrigger>
                <TabsTrigger
                  value='students'
                  className='flex-1'
                >
                  Học viên
                </TabsTrigger>
                <TabsTrigger
                  value='instructors'
                  className='flex-1'
                >
                  Giáo viên
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value='all'
                className='m-0'
              >
                <ScrollArea className='h-[500px]'>
                  <div className='space-y-2'>
                    {loadingConversations && (
                      <div className='py-12 text-center'>
                        <Loader2 className='mx-auto h-8 w-8 mb-2 animate-spin opacity-50' />
                        <p className='text-muted-foreground'>
                          Đang tải tin nhắn...
                        </p>
                      </div>
                    )}

                    {conversationError && (
                      <div className='py-12 text-center text-red-500'>
                        <AlertCircle className='mx-auto h-8 w-8 mb-2 opacity-50' />
                        <p>{conversationError}</p>
                      </div>
                    )}

                    {!loadingConversations &&
                      !conversationError &&
                      filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors duration-200 ${
                            activeConversation === conversation.id
                              ? "bg-muted border-l-4 border-primary pl-2"
                              : ""
                          }`}
                          onClick={() => setActiveConversation(conversation.id)}
                        >
                          <div className='relative'>
                            <Avatar className='h-10 w-10 border border-border'>
                              <AvatarImage
                                src={conversation.avatar}
                                alt={conversation.name}
                              />
                              <AvatarFallback className='bg-primary/10 text-primary font-medium'>
                                {conversation.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.isStudent ? (
                              <div className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background'></div>
                            ) : (
                              <div className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-blue-500 border-2 border-background'></div>
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between'>
                              <p className='font-medium truncate'>
                                {conversation.name}
                              </p>
                              <span className='text-xs text-muted-foreground whitespace-nowrap ml-2'>
                                {conversation.time}
                              </span>
                            </div>
                            <p className='text-sm text-muted-foreground truncate'>
                              {conversation.lastMessage}
                            </p>
                          </div>
                          {conversation.unread > 0 && (
                            <Badge className='ml-auto bg-primary hover:bg-primary rounded-full px-1.5'>
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      ))}

                    {!loadingConversations &&
                      !conversationError &&
                      filteredConversations.length === 0 && (
                        <div className='py-12 text-center text-muted-foreground'>
                          <MessageSquare className='mx-auto h-8 w-8 mb-2 opacity-50' />
                          <p>Không tìm thấy tin nhắn nào</p>
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value='students'
                className='m-0'
              >
                <ScrollArea className='h-[500px]'>
                  <div className='space-y-2'>
                    {loadingConversations && (
                      <div className='py-12 text-center'>
                        <Loader2 className='mx-auto h-8 w-8 mb-2 animate-spin opacity-50' />
                        <p className='text-muted-foreground'>
                          Đang tải tin nhắn...
                        </p>
                      </div>
                    )}

                    {conversationError && (
                      <div className='py-12 text-center text-red-500'>
                        <AlertCircle className='mx-auto h-8 w-8 mb-2 opacity-50' />
                        <p>{conversationError}</p>
                      </div>
                    )}

                    {!loadingConversations &&
                      !conversationError &&
                      filteredConversations
                        .filter((c) => c.isStudent)
                        .map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors duration-200 ${
                              activeConversation === conversation.id
                                ? "bg-muted border-l-4 border-primary pl-2"
                                : ""
                            }`}
                            onClick={() =>
                              setActiveConversation(conversation.id)
                            }
                          >
                            <div className='relative'>
                              <Avatar className='h-10 w-10 border border-border'>
                                <AvatarImage
                                  src={conversation.avatar}
                                  alt={conversation.name}
                                />
                                <AvatarFallback className='bg-primary/10 text-primary font-medium'>
                                  {conversation.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background'></div>
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center justify-between'>
                                <p className='font-medium truncate'>
                                  {conversation.name}
                                </p>
                                <span className='text-xs text-muted-foreground whitespace-nowrap ml-2'>
                                  {conversation.time}
                                </span>
                              </div>
                              <p className='text-sm text-muted-foreground truncate'>
                                {conversation.lastMessage}
                              </p>
                            </div>
                            {conversation.unread > 0 && (
                              <Badge className='ml-auto bg-primary hover:bg-primary rounded-full px-1.5'>
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                        ))}

                    {!loadingConversations &&
                      !conversationError &&
                      filteredConversations.filter((c) => c.isStudent)
                        .length === 0 && (
                        <div className='py-12 text-center text-muted-foreground'>
                          <MessageSquare className='mx-auto h-8 w-8 mb-2 opacity-50' />
                          <p>Không tìm thấy cuộc trò chuyện nào với học viên</p>
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value='instructors'
                className='m-0'
              >
                <ScrollArea className='h-[500px]'>
                  <div className='space-y-2'>
                    {loadingConversations && (
                      <div className='py-12 text-center'>
                        <Loader2 className='mx-auto h-8 w-8 mb-2 animate-spin opacity-50' />
                        <p className='text-muted-foreground'>
                          Đang tải tin nhắn...
                        </p>
                      </div>
                    )}

                    {conversationError && (
                      <div className='py-12 text-center text-red-500'>
                        <AlertCircle className='mx-auto h-8 w-8 mb-2 opacity-50' />
                        <p>{conversationError}</p>
                      </div>
                    )}

                    {!loadingConversations &&
                      !conversationError &&
                      filteredConversations
                        .filter((c) => !c.isStudent)
                        .map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors duration-200 ${
                              activeConversation === conversation.id
                                ? "bg-muted border-l-4 border-primary pl-2"
                                : ""
                            }`}
                            onClick={() =>
                              setActiveConversation(conversation.id)
                            }
                          >
                            <div className='relative'>
                              <Avatar className='h-10 w-10 border border-border'>
                                <AvatarImage
                                  src={conversation.avatar}
                                  alt={conversation.name}
                                />
                                <AvatarFallback className='bg-primary/10 text-primary font-medium'>
                                  {conversation.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-blue-500 border-2 border-background'></div>
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center justify-between'>
                                <p className='font-medium truncate'>
                                  {conversation.name}
                                </p>
                                <span className='text-xs text-muted-foreground whitespace-nowrap ml-2'>
                                  {conversation.time}
                                </span>
                              </div>
                              <p className='text-sm text-muted-foreground truncate'>
                                {conversation.lastMessage}
                              </p>
                            </div>
                            {conversation.unread > 0 && (
                              <Badge className='ml-auto bg-primary hover:bg-primary rounded-full px-1.5'>
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                        ))}

                    {!loadingConversations &&
                      !conversationError &&
                      filteredConversations.filter((c) => !c.isStudent)
                        .length === 0 && (
                        <div className='py-12 text-center text-muted-foreground'>
                          <MessageSquare className='mx-auto h-8 w-8 mb-2 opacity-50' />
                          <p>
                            Không tìm thấy cuộc trò chuyện nào với giáo viên
                          </p>
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className='lg:col-span-2'>
          {activeConversation ? (
            <>
              <CardHeader className='border-b'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='relative'>
                      <Avatar>
                        <AvatarImage
                          src={
                            conversations.find(
                              (c) => c.id === activeConversation
                            )?.avatar || "/placeholder.svg"
                          }
                          alt={
                            conversations.find(
                              (c) => c.id === activeConversation
                            )?.name || "User"
                          }
                        />
                        <AvatarFallback>
                          <User className='h-4 w-4' />
                        </AvatarFallback>
                      </Avatar>
                      {conversations.find((c) => c.id === activeConversation)
                        ?.isStudent ? (
                        <div className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background'></div>
                      ) : (
                        <div className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-blue-500 border-2 border-background'></div>
                      )}
                    </div>
                    <div>
                      <CardTitle className='text-lg'>
                        {
                          conversations.find((c) => c.id === activeConversation)
                            ?.name
                        }
                      </CardTitle>
                      <p className='text-xs text-muted-foreground'>
                        {conversations.find((c) => c.id === activeConversation)
                          ?.isStudent
                          ? "Học viên • Đang hoạt động"
                          : "Giáo viên • Đang hoạt động"}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='rounded-full hover:bg-muted'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      >
                        <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'></path>
                      </svg>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='rounded-full hover:bg-muted'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      >
                        <path d='M15 10l5 5-5 5'></path>
                        <path d='M4 4v7a4 4 0 0 0 4 4h12'></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-0 flex flex-col h-[500px]'>
                <ScrollArea className='flex-1 p-4'>
                  <div className='space-y-4'>
                    {loadingMessages && (
                      <div className='py-12 text-center'>
                        <Loader2 className='mx-auto h-8 w-8 mb-2 animate-spin opacity-50' />
                        <p className='text-muted-foreground'>
                          Đang tải tin nhắn...
                        </p>
                      </div>
                    )}
                    {messagesError && (
                      <div className='py-4 text-center text-red-500'>
                        <AlertCircle className='mx-auto h-6 w-6 mb-1 opacity-70' />
                        <p className='text-sm'>{messagesError}</p>
                      </div>
                    )}
                    {!loadingMessages &&
                      !messagesError &&
                      apiMessages.length === 0 && (
                        <div className='py-8 text-center text-muted-foreground'>
                          <MessageSquare className='mx-auto h-6 w-6 mb-2 opacity-50' />
                          <p>
                            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                          </p>
                        </div>
                      )}{" "}
                    {/* API messages */}
                    {!loadingMessages &&
                      !messagesError &&
                      apiMessages.length > 0 &&
                      apiMessages.map((message, index) => {
                        const isCurrentUser =
                          message.created_by._id === currentUserId;
                        const utcDate = new Date(message.created_at);
                        const formattedUtcDate = formatUtcDate(utcDate);
                        const time = formattedUtcDate.substring(0, 5); // "HH:MM"
                        const date = formattedUtcDate.substring(6); // "DD/MM/YYYY"
                        const previousMessage =
                          index > 0 ? apiMessages[index - 1] : null;
                        let prevDate = "";
                        if (previousMessage) {
                          const prevUtcDate = new Date(
                            previousMessage.created_at
                          );
                          const prevFormattedDate = formatUtcDate(prevUtcDate);
                          prevDate = prevFormattedDate.substring(6);
                        }
                        const showDateSeparator =
                          !previousMessage || prevDate !== date;
                        const isConsecutiveMessage =
                          previousMessage &&
                          previousMessage.created_by._id ===
                            message.created_by._id &&
                          !showDateSeparator;
                        const avatarUrl =
                          message.avatarUrl || "/placeholder.svg";
                        return (
                          <React.Fragment key={message._id}>
                            {showDateSeparator && (
                              <div className='flex items-center justify-center my-4'>
                                <div className='bg-muted/30 text-xs rounded-full px-3 py-1 text-muted-foreground'>
                                  {date}{" "}
                                  {/* Show only date part in DD/MM/YYYY format */}
                                </div>
                              </div>
                            )}
                            <div
                              className={`flex items-end ${
                                isConsecutiveMessage ? "mt-1" : "mt-3"
                              } ${
                                isCurrentUser ? "justify-end" : "justify-start"
                              }`}
                            >
                              {!isCurrentUser && !isConsecutiveMessage && (
                                <Avatar className='h-8 w-8 mr-2 mb-1'>
                                  <AvatarImage
                                    src={avatarUrl}
                                    alt={message.created_by.username}
                                  />
                                  <AvatarFallback className='bg-primary/10 text-primary uppercase font-medium'>
                                    {message.created_by.username.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {!isCurrentUser && isConsecutiveMessage && (
                                <div className='w-8 mr-2'></div>
                              )}
                              <div
                                className={`max-w-[80%] ${
                                  isCurrentUser
                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                    : "bg-muted rounded-2xl rounded-tl-sm"
                                } px-4 py-2`}
                              >
                                <p className='break-words'>{message.content}</p>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span
                                        className={`text-xs mt-1 inline-block ${
                                          isCurrentUser
                                            ? "text-primary-foreground/80"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {time}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {formatUtcDate(utcDate)} (UTC)
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              {isCurrentUser && !isConsecutiveMessage && (
                                <Avatar className='h-8 w-8 ml-2 mb-1'>
                                  <AvatarImage
                                    src={avatarUrl}
                                    alt={message.created_by.username}
                                  />
                                  <AvatarFallback className='bg-primary/10 text-primary uppercase font-medium'>
                                    {message.created_by.username.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {isCurrentUser && isConsecutiveMessage && (
                                <div className='w-8 ml-2'></div>
                              )}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    {/* Socket messages (for newly sent messages) */}
                    {messages.map((message) => {
                      // Only show socket messages that aren't duplicates of API messages
                      const isDuplicate = apiMessages.some(
                        (apiMsg) => apiMsg._id === message.id
                      );

                      if (isDuplicate) return null;
                      const isCurrentUser = message.sender.id === currentUserId;
                      // Format using our UTC formatter without timezone conversion
                      const formattedUtcDate = formatUtcDate(message.timestamp);

                      // Extract time and date components from the formatted string
                      const time = formattedUtcDate.substring(0, 5); // "HH:MM"
                      const date = formattedUtcDate.substring(6); // "DD/MM/YYYY"

                      return (
                        <React.Fragment key={message.id}>
                          <div
                            className={`flex items-end mt-3 ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isCurrentUser && (
                              <Avatar className='h-8 w-8 mr-2 mb-1'>
                                <AvatarImage
                                  src={
                                    message.sender.avatar || "/placeholder.svg"
                                  }
                                  alt={message.sender.name}
                                />
                                <AvatarFallback>
                                  {message.sender.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}{" "}
                            <div
                              className={`max-w-[80%] ${
                                isCurrentUser
                                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                  : "bg-muted rounded-2xl rounded-tl-sm"
                              } px-4 py-2`}
                            >
                              <p className='break-words'>{message.content}</p>
                              <div className='flex items-center gap-2 mt-1'>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span
                                        className={`text-xs ${
                                          isCurrentUser
                                            ? "text-primary-foreground/80"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {time}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {formatUtcDate(message.timestamp)} (UTC)
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {isCurrentUser && (
                                  <span
                                    className={`text-xs ${
                                      isCurrentUser
                                        ? "text-primary-foreground/70"
                                        : "text-muted-foreground/70"
                                    }`}
                                  >
                                    {message.read ? "Đã đọc" : "Đã gửi"}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isCurrentUser && (
                              <Avatar className='h-8 w-8 ml-2 mb-1'>
                                <AvatarImage
                                  src={
                                    message.sender.avatar || "/placeholder.svg"
                                  }
                                  alt={message.sender.name}
                                />
                                <AvatarFallback>
                                  {message.sender.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                    {/* Reference element for auto-scrolling */}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className='border-t p-4 mt-0'>
                  {!isConnected && !useMockSocket && (
                    <div className='flex items-center justify-center gap-2 mb-2 text-xs text-amber-500'>
                      {reconnecting ? (
                        <>
                          <Loader2 className='h-3 w-3 animate-spin' />
                          <span>Đang kết nối lại...</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className='h-3 w-3' />
                          <span>
                            Mất kết nối - tin nhắn của bạn sẽ được gửi khi kết
                            nối lại
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <form
                    className='flex items-center gap-2'
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='shrink-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    >
                      <Paperclip className='h-5 w-5' />
                      <span className='sr-only'>Đính kèm file</span>
                    </Button>
                    <div className='relative flex-1'>
                      <Input
                        placeholder={
                          !isAuthenticated
                            ? "Vui lòng đăng nhập lại..."
                            : !isConnected && !useMockSocket
                            ? "Đang kết nối lại..."
                            : "Nhập tin nhắn..."
                        }
                        className='flex-1 py-6 pl-4 pr-12 rounded-full bg-muted/30 hover:bg-muted/50 focus-visible:bg-background border border-input'
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={
                          !isConnected ||
                          !activeConversation ||
                          !isAuthenticated
                        }
                      />
                      <Button
                        type='submit'
                        size='icon'
                        className='shrink-0 absolute right-1 top-1 bottom-1 rounded-full bg-primary hover:bg-primary/90'
                        disabled={
                          !isConnected ||
                          !activeConversation ||
                          !newMessage.trim()
                        }
                      >
                        <Send className='h-4 w-4' />
                        <span className='sr-only'>Gửi</span>
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </>
          ) : (
            <div className='h-full flex items-center justify-center flex-col p-8 text-center'>
              <div className='bg-primary/10 rounded-full p-5 mb-5'>
                <MessageSquare className='h-12 w-12 text-primary/70' />
              </div>
              <h3 className='text-xl font-medium mb-2'>
                Chào mừng đến với tin nhắn
              </h3>
              <p className='text-muted-foreground max-w-[300px]'>
                Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin hoặc
                tạo cuộc trò chuyện mới
              </p>
              <Button
                variant='outline'
                className='mt-4 rounded-full'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='mr-2'
                >
                  <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
                </svg>
                Tạo cuộc trò chuyện mới
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default function MessagesPage() {
  return (
    <TooltipProvider>
      <MessagesPageContent />
    </TooltipProvider>
  );
}
