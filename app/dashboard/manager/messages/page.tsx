"use client";

import { useState, useEffect, useRef } from "react";
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
import { useSocket, ChatMessage } from "@/utils/socket-utils";
import { getAuthToken } from "@/api/auth-utils";
import { useAuthStatus } from "@/utils/auth-reconnection";

const MessagesPageContent = () => {
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [reconnecting, setReconnecting] = useState(false);

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

  // Mock conversations data - in a real app, this would come from an API and be updated by WebSocket
  const conversations = [
    {
      id: "1",
      name: "Nguyễn Văn A",
      avatar: "/placeholder.svg",
      lastMessage: "Xin chào, tôi muốn hỏi về lịch học",
      unread: 2,
      time: "14:30",
      isStudent: true,
    },
    {
      id: "2",
      name: "Trần Thị B",
      avatar: "/placeholder.svg",
      lastMessage: "Cảm ơn thầy cô đã giúp đỡ",
      unread: 0,
      time: "Hôm qua",
      isStudent: true,
    },
    {
      id: "3",
      name: "Huấn luyện viên Hồ Văn C",
      avatar: "/placeholder.svg",
      lastMessage: "Lịch dạy tuần sau đã được cập nhật",
      unread: 1,
      time: "10:15",
      isStudent: false,
    },
  ];

  // Handle sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const currentConversation = conversations.find(
      (c) => c.id === activeConversation
    );
    if (!currentConversation) return;

    const messageToSend = {
      content: newMessage,
      sender: {
        id: "current-user-id", // In a real app, get this from auth
        name: "Current User Name", // In a real app, get this from auth
        avatar: "/placeholder.svg",
      },
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
        id: `temp-${Date.now()}`, // In a real app, the server would assign a real ID
        timestamp: Date.now(),
        read: false,
      };

      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage(""); // Clear input
    }
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-muted ${
                          activeConversation === conversation.id
                            ? "bg-muted"
                            : ""
                        }`}
                        onClick={() => setActiveConversation(conversation.id)}
                      >
                        <Avatar>
                          <AvatarImage
                            src={conversation.avatar}
                            alt={conversation.name}
                          />
                          <AvatarFallback>
                            {conversation.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between'>
                            <p className='font-medium truncate'>
                              {conversation.name}
                            </p>
                            <span className='text-xs text-muted-foreground'>
                              {conversation.time}
                            </span>
                          </div>
                          <p className='text-sm text-muted-foreground truncate'>
                            {conversation.lastMessage}
                          </p>
                        </div>
                        {conversation.unread > 0 && (
                          <Badge className='ml-auto'>
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    ))}

                    {filteredConversations.length === 0 && (
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
                    {filteredConversations
                      .filter((c) => c.isStudent)
                      .map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-muted ${
                            activeConversation === conversation.id
                              ? "bg-muted"
                              : ""
                          }`}
                          onClick={() => setActiveConversation(conversation.id)}
                        >
                          <Avatar>
                            <AvatarImage
                              src={conversation.avatar}
                              alt={conversation.name}
                            />
                            <AvatarFallback>
                              {conversation.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between'>
                              <p className='font-medium truncate'>
                                {conversation.name}
                              </p>
                              <span className='text-xs text-muted-foreground'>
                                {conversation.time}
                              </span>
                            </div>
                            <p className='text-sm text-muted-foreground truncate'>
                              {conversation.lastMessage}
                            </p>
                          </div>
                          {conversation.unread > 0 && (
                            <Badge className='ml-auto'>
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value='instructors'
                className='m-0'
              >
                <ScrollArea className='h-[500px]'>
                  <div className='space-y-2'>
                    {filteredConversations
                      .filter((c) => !c.isStudent)
                      .map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-muted ${
                            activeConversation === conversation.id
                              ? "bg-muted"
                              : ""
                          }`}
                          onClick={() => setActiveConversation(conversation.id)}
                        >
                          <Avatar>
                            <AvatarImage
                              src={conversation.avatar}
                              alt={conversation.name}
                            />
                            <AvatarFallback>
                              {conversation.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between'>
                              <p className='font-medium truncate'>
                                {conversation.name}
                              </p>
                              <span className='text-xs text-muted-foreground'>
                                {conversation.time}
                              </span>
                            </div>
                            <p className='text-sm text-muted-foreground truncate'>
                              {conversation.lastMessage}
                            </p>
                          </div>
                          {conversation.unread > 0 && (
                            <Badge className='ml-auto'>
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      ))}
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
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage
                      src={
                        conversations.find((c) => c.id === activeConversation)
                          ?.avatar || "/placeholder.svg"
                      }
                      alt={
                        conversations.find((c) => c.id === activeConversation)
                          ?.name || "User"
                      }
                    />
                    <AvatarFallback>
                      <User className='h-4 w-4' />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className='text-lg'>
                      {
                        conversations.find((c) => c.id === activeConversation)
                          ?.name
                      }
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>
                      {conversations.find((c) => c.id === activeConversation)
                        ?.isStudent
                        ? "Học viên"
                        : "Giáo viên"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='h-[500px] flex flex-col'>
                  <ScrollArea className='flex-1 p-4'>
                    <div className='space-y-4'>
                      {/* Initial conversation messages */}
                      <div className='flex items-start gap-2'>
                        <Avatar className='h-8 w-8'>
                          <AvatarImage
                            src={
                              conversations.find(
                                (c) => c.id === activeConversation
                              )?.avatar
                            }
                            alt={
                              conversations.find(
                                (c) => c.id === activeConversation
                              )?.name
                            }
                          />
                          <AvatarFallback>
                            {conversations
                              .find((c) => c.id === activeConversation)
                              ?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='rounded-lg bg-muted p-3'>
                          <p>
                            {
                              conversations.find(
                                (c) => c.id === activeConversation
                              )?.lastMessage
                            }
                          </p>
                          <span className='text-xs text-muted-foreground mt-1 block'>
                            14:30
                          </span>
                        </div>
                      </div>

                      <div className='flex items-start gap-2 justify-end'>
                        <div className='rounded-lg bg-primary p-3 text-primary-foreground'>
                          <p>Xin chào, tôi có thể giúp gì cho bạn?</p>
                          <span className='text-xs text-primary-foreground/80 mt-1 block'>
                            14:31
                          </span>
                        </div>
                        <Avatar className='h-8 w-8'>
                          <AvatarImage src='/placeholder.svg' />
                          <AvatarFallback>Q</AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Dynamic messages from state */}
                      {messages.map((message) => {
                        const isCurrentUser =
                          message.sender.id === "current-user-id";
                        const time = new Date(
                          message.timestamp
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={message.id}
                            className={`flex items-start gap-2 ${
                              isCurrentUser ? "justify-end" : ""
                            }`}
                          >
                            {!isCurrentUser && (
                              <Avatar className='h-8 w-8'>
                                <AvatarImage
                                  src={
                                    message.sender.avatar || "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback>
                                  {message.sender.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )}

                            <div
                              className={`rounded-lg p-3 ${
                                isCurrentUser
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p>{message.content}</p>
                              <div className='flex items-center justify-between gap-2 mt-1'>
                                <span
                                  className={`text-xs ${
                                    isCurrentUser
                                      ? "text-primary-foreground/80"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {time}
                                </span>
                                {isCurrentUser && (
                                  <span className='text-xs text-primary-foreground/80'>
                                    {message.read ? "Đã đọc" : "Đã gửi"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isCurrentUser && (
                              <Avatar className='h-8 w-8'>
                                <AvatarImage src='/placeholder.svg' />
                                <AvatarFallback>Q</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })}

                      {/* Reference element for auto-scrolling */}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className='border-t p-4'>
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
                        variant='outline'
                        size='icon'
                        className='shrink-0'
                      >
                        <Paperclip className='h-4 w-4' />
                        <span className='sr-only'>Đính kèm file</span>
                      </Button>
                      <Input
                        placeholder={
                          !isAuthenticated
                            ? "Vui lòng đăng nhập lại..."
                            : !isConnected && !useMockSocket
                            ? "Đang kết nối lại..."
                            : "Nhập tin nhắn..."
                        }
                        className='flex-1'
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={
                          !isConnected ||
                          !activeConversation ||
                          !isAuthenticated
                        }
                      />
                      <Button
                        type='submit'
                        size='icon'
                        className='shrink-0'
                        disabled={
                          !isConnected ||
                          !activeConversation ||
                          !newMessage.trim()
                        }
                      >
                        <Send className='h-4 w-4' />
                        <span className='sr-only'>Gửi</span>
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className='h-full flex items-center justify-center flex-col p-8 text-center'>
              <MessageSquare className='h-12 w-12 text-muted-foreground/50 mb-4' />
              <h3 className='text-xl font-medium mb-2'>
                Chưa có cuộc trò chuyện nào được chọn
              </h3>
              <p className='text-muted-foreground'>
                Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin
              </p>
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
