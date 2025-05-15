"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Send, PaperclipIcon, Clock } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState("support")
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock chat data
  const chats = {
    support: {
      name: "Support Team",
      avatar: "/placeholder.svg?height=40&width=40&text=ST",
      status: "online",
      messages: [
        {
          id: 1,
          sender: "support",
          text: "Hello! How can we help you today?",
          time: "10:00 AM",
          date: "Today",
        },
        {
          id: 2,
          sender: "user",
          text: "Hi, I have a question about the Beginner Swimming course.",
          time: "10:05 AM",
          date: "Today",
        },
        {
          id: 3,
          sender: "support",
          text: "Of course! What would you like to know about the Beginner Swimming course?",
          time: "10:07 AM",
          date: "Today",
        },
        {
          id: 4,
          sender: "user",
          text: "Is there any age restriction for this course?",
          time: "10:10 AM",
          date: "Today",
        },
        {
          id: 5,
          sender: "support",
          text: "The Beginner Swimming course is suitable for ages 5 and above. We also have a special Parent & Child course for younger children (6 months to 3 years) if you're interested in that.",
          time: "10:12 AM",
          date: "Today",
        },
      ],
    },
    instructor: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40&text=SJ",
      status: "away",
      messages: [
        {
          id: 1,
          sender: "instructor",
          text: "Hi Alex! I wanted to let you know that you've made great progress in your freestyle technique.",
          time: "Yesterday",
          date: "May 5, 2023",
        },
        {
          id: 2,
          sender: "user",
          text: "Thank you, Sarah! I've been practicing the breathing technique you showed me.",
          time: "Yesterday",
          date: "May 5, 2023",
        },
        {
          id: 3,
          sender: "instructor",
          text: "That's great to hear! For our next lesson, we'll focus on improving your arm stroke efficiency. Keep up the good work!",
          time: "Yesterday",
          date: "May 5, 2023",
        },
      ],
    },
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // In a real app, this would send the message to the server
    // For now, we'll just clear the input
    setMessage("")
  }

  // Auto-scroll to the bottom of the chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeChat, chats])

  return (
    <DashboardLayout userRole="student">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Chat with support or your instructor</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Chat List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2">
              <button
                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors ${
                  activeChat === "support" ? "bg-muted" : ""
                }`}
                onClick={() => setActiveChat("support")}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={chats.support.avatar || "/placeholder.svg"} alt={chats.support.name} />
                  <AvatarFallback>ST</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">{chats.support.name}</p>
                    <p className="text-xs text-muted-foreground">10:12 AM</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chats.support.messages[chats.support.messages.length - 1].text}
                  </p>
                </div>
              </button>
              <button
                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors ${
                  activeChat === "instructor" ? "bg-muted" : ""
                }`}
                onClick={() => setActiveChat("instructor")}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={chats.instructor.avatar || "/placeholder.svg"} alt={chats.instructor.name} />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">{chats.instructor.name}</p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chats.instructor.messages[chats.instructor.messages.length - 1].text}
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="md:col-span-3">
          <CardHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={activeChat === "support" ? chats.support.avatar : chats.instructor.avatar}
                  alt={activeChat === "support" ? chats.support.name : chats.instructor.name}
                />
                <AvatarFallback>{activeChat === "support" ? "ST" : "SJ"}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {activeChat === "support" ? chats.support.name : chats.instructor.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      (activeChat === "support" ? chats.support.status : chats.instructor.status) === "online"
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                  ></span>
                  <p className="text-xs text-muted-foreground">
                    {(activeChat === "support" ? chats.support.status : chats.instructor.status) === "online"
                      ? "Online"
                      : "Away"}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto p-4">
              {(activeChat === "support" ? chats.support.messages : chats.instructor.messages).map((msg) => (
                <div key={msg.id} className={`flex mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender !== "user" && (
                    <Avatar className="h-8 w-8 mr-2 mt-1">
                      <AvatarImage
                        src={activeChat === "support" ? chats.support.avatar : chats.instructor.avatar}
                        alt={activeChat === "support" ? chats.support.name : chats.instructor.name}
                      />
                      <AvatarFallback>{activeChat === "support" ? "ST" : "SJ"}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] ${
                      msg.sender === "user"
                        ? "bg-sky-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                        : "bg-muted rounded-tl-lg rounded-tr-lg rounded-br-lg"
                    } p-3`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {msg.time}
                    </p>
                  </div>
                  {msg.sender === "user" && (
                    <Avatar className="h-8 w-8 ml-2 mt-1">
                      <AvatarImage src="/placeholder.svg?height=40&width=40&text=AJ" alt="Alex Johnson" />
                      <AvatarFallback>AJ</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
                  <PaperclipIcon className="h-5 w-5" />
                  <span className="sr-only">Attach file</span>
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="flex-shrink-0">
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
