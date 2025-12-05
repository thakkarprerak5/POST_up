"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Users, ArrowLeft, Plus, Search, Check, X, LogOut, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: Date
}

interface Chat {
  id: string
  name: string
  avatar: string
  isGroup: boolean
  participants: { id: string; name: string; avatar: string }[]
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  messages: Message[]
}

// Mock data for users
const allUsers = [
  { id: "u1", name: "Alex Johnson", avatar: "/young-male-student-developer.jpg" },
  { id: "u2", name: "Dr. Sarah Chen", avatar: "/professional-woman-professor.png" },
  { id: "u3", name: "Prof. James Miller", avatar: "/professional-asian-professor.png" },
  { id: "u4", name: "Emily Rodriguez", avatar: "/professional-latina-woman.png" },
  { id: "u5", name: "David Kim", avatar: "/professional-korean-man-developer.jpg" },
  { id: "u6", name: "Dr. Michelle Okonkwo", avatar: "/black-woman-scientist.png" },
]

// Mock chat data
const mockChats: Chat[] = [
  {
    id: "c1",
    name: "Web Dev Study Group",
    avatar: "",
    isGroup: true,
    participants: [allUsers[0], allUsers[1], allUsers[3]],
    lastMessage: "Has anyone tried the new React 19 features?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 3,
    messages: [
      {
        id: "m1",
        senderId: "u1",
        senderName: "Alex Johnson",
        senderAvatar: "/young-male-student-developer.jpg",
        content: "Hey everyone! Working on a new project.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "m2",
        senderId: "u2",
        senderName: "Dr. Sarah Chen",
        senderAvatar: "/professional-woman-professor.png",
        content: "That sounds great! What stack are you using?",
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
      },
      {
        id: "m3",
        senderId: "u1",
        senderName: "Alex Johnson",
        senderAvatar: "/young-male-student-developer.jpg",
        content: "Has anyone tried the new React 19 features?",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
    ],
  },
  {
    id: "c2",
    name: "Dr. Sarah Chen",
    avatar: "/professional-woman-professor.png",
    isGroup: false,
    participants: [allUsers[1]],
    lastMessage: "Sure, let's discuss your project tomorrow.",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
    unreadCount: 1,
    messages: [
      {
        id: "m4",
        senderId: "current",
        senderName: "You",
        senderAvatar: "/young-male-student-developer.jpg",
        content: "Hi Dr. Chen, could you review my ML project?",
        timestamp: new Date(Date.now() - 1000 * 60 * 90),
      },
      {
        id: "m5",
        senderId: "u2",
        senderName: "Dr. Sarah Chen",
        senderAvatar: "/professional-woman-professor.png",
        content: "Sure, let's discuss your project tomorrow.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
      },
    ],
  },
  {
    id: "c3",
    name: "AI/ML Research Team",
    avatar: "",
    isGroup: true,
    participants: [allUsers[1], allUsers[5], allUsers[2]],
    lastMessage: "The model accuracy improved to 94%!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 120),
    unreadCount: 0,
    messages: [
      {
        id: "m6",
        senderId: "u6",
        senderName: "Dr. Michelle Okonkwo",
        senderAvatar: "/black-woman-scientist.png",
        content: "The model accuracy improved to 94%!",
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
      },
    ],
  },
  {
    id: "c4",
    name: "Mobile App Developers",
    avatar: "",
    isGroup: true,
    participants: [allUsers[4], allUsers[3], allUsers[0]],
    lastMessage: "Flutter or React Native for the new project?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 180),
    unreadCount: 5,
    messages: [
      {
        id: "m7",
        senderId: "u5",
        senderName: "David Kim",
        senderAvatar: "/professional-korean-man-developer.jpg",
        content: "Flutter or React Native for the new project?",
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
      },
    ],
  },
]

export default function ChatPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chats, setChats] = useState<Chat[]>(mockChats)
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [message, setMessage] = useState("")
  const [view, setView] = useState<"list" | "chat" | "new-chat" | "new-group">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<typeof allUsers>([])
  const [groupName, setGroupName] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeChat?.messages])

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleSendMessage = () => {
    if (!message.trim() || !activeChat) return

    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: "current",
      senderName: "You",
      senderAvatar: "/young-male-student-developer.jpg",
      content: message,
      timestamp: new Date(),
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat.id
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: message,
              lastMessageTime: new Date(),
            }
          : chat,
      ),
    )

    setActiveChat((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, newMessage], lastMessage: message, lastMessageTime: new Date() }
        : null,
    )

    setMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startNewChat = (user: (typeof allUsers)[0]) => {
    const existingChat = chats.find((c) => !c.isGroup && c.participants[0].id === user.id)

    if (existingChat) {
      setActiveChat(existingChat)
    } else {
      const newChat: Chat = {
        id: `c${Date.now()}`,
        name: user.name,
        avatar: user.avatar,
        isGroup: false,
        participants: [user],
        lastMessage: "",
        lastMessageTime: new Date(),
        unreadCount: 0,
        messages: [],
      }
      setChats((prev) => [newChat, ...prev])
      setActiveChat(newChat)
    }
    setView("chat")
    setSearchQuery("")
  }

  const createGroupChat = () => {
    if (selectedUsers.length < 2 || !groupName.trim()) return

    const newGroup: Chat = {
      id: `c${Date.now()}`,
      name: groupName,
      avatar: "",
      isGroup: true,
      participants: selectedUsers,
      lastMessage: "Group created",
      lastMessageTime: new Date(),
      unreadCount: 0,
      messages: [
        {
          id: `m${Date.now()}`,
          senderId: "system",
          senderName: "System",
          senderAvatar: "",
          content: `Group "${groupName}" created with ${selectedUsers.length} members`,
          timestamp: new Date(),
        },
      ],
    }

    setChats((prev) => [newGroup, ...prev])
    setActiveChat(newGroup)
    setView("chat")
    setSelectedUsers([])
    setGroupName("")
  }

  const toggleUserSelection = (user: (typeof allUsers)[0]) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    )
  }

  const filteredUsers = allUsers.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const openChat = (chat: Chat) => {
    setActiveChat({ ...chat, unreadCount: 0 })
    setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c)))
    setView("chat")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 h-screen">
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
          <div
            className={`${view === "chat" ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border bg-sidebar flex-col h-full`}
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Messages</h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.back()}
                    title="Exit Chat"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setView("new-group")}
                    title="New Group"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setView("new-chat")}
                    title="New Chat"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search conversations..." className="pl-9 bg-muted border-border" />
              </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${
                    activeChat?.id === chat.id ? "bg-muted" : ""
                  }`}
                  onClick={() => openChat(chat)}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={chat.avatar || undefined} />
                    <AvatarFallback className={chat.isGroup ? "bg-primary/20" : ""}>
                      {chat.isGroup ? <Users className="h-5 w-5" /> : chat.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{chat.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 p-0 flex items-center justify-center text-xs flex-shrink-0">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div
            className={`${view === "list" ? "hidden md:flex" : "flex"} flex-1 flex-col bg-background h-full overflow-hidden`}
          >
            {/* New Chat View */}
            {view === "new-chat" && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border flex items-center gap-3 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setView("list")}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h3 className="font-semibold text-lg">New Chat</h3>
                </div>
                <div className="p-4 flex-1 overflow-hidden flex flex-col">
                  <div className="relative mb-4 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="grid gap-2 pr-4">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          onClick={() => startNewChat(user)}
                        >
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate">{user.name}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* New Group View */}
            {view === "new-group" && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border flex items-center gap-3 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setView("list")}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h3 className="font-semibold text-lg">Create New Group</h3>
                </div>
                <div className="p-4 flex-1 overflow-hidden flex flex-col">
                  <Input
                    placeholder="Group name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mb-4 flex-shrink-0"
                  />
                  <div className="relative mb-4 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users to add..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted rounded-lg flex-shrink-0">
                      {selectedUsers.map((user) => (
                        <Badge
                          key={user.id}
                          variant="secondary"
                          className="text-sm cursor-pointer hover:bg-destructive/20"
                          onClick={() => toggleUserSelection(user)}
                        >
                          {user.name}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  <ScrollArea className="flex-1">
                    <div className="grid gap-2 pr-4">
                      {filteredUsers.map((user) => {
                        const isSelected = selectedUsers.some((u) => u.id === user.id)
                        return (
                          <button
                            key={user.id}
                            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left ${
                              isSelected ? "bg-muted" : ""
                            }`}
                            onClick={() => toggleUserSelection(user)}
                          >
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium flex-1 truncate">{user.name}</span>
                            {isSelected && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>

                  <Button
                    className="w-full mt-4 flex-shrink-0"
                    disabled={selectedUsers.length < 2 || !groupName.trim()}
                    onClick={createGroupChat}
                  >
                    Create Group ({selectedUsers.length} members selected)
                  </Button>
                </div>
              </div>
            )}

            {/* Chat View */}
            {view === "chat" && activeChat && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setView("list")}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={activeChat.avatar || undefined} />
                    <AvatarFallback className={activeChat.isGroup ? "bg-primary/20" : ""}>
                      {activeChat.isGroup ? <Users className="h-5 w-5" /> : activeChat.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{activeChat.name}</h3>
                    {activeChat.isGroup && (
                      <p className="text-xs text-muted-foreground truncate">
                        {activeChat.participants.map((p) => p.name.split(" ")[0]).join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                    {activeChat.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.senderId === "current" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.senderId !== "current" && msg.senderId !== "system" && (
                          <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                            <AvatarImage src={msg.senderAvatar || "/placeholder.svg"} />
                            <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.senderId === "current"
                              ? "bg-primary text-primary-foreground"
                              : msg.senderId === "system"
                                ? "bg-muted text-muted-foreground text-center mx-auto text-sm"
                                : "bg-muted"
                          }`}
                        >
                          {msg.senderId !== "current" && msg.senderId !== "system" && activeChat.isGroup && (
                            <p className="text-xs font-medium text-primary mb-1">{msg.senderName}</p>
                          )}
                          <p className="break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.senderId === "current" ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {formatMessageTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border flex-shrink-0">
                  <div className="flex items-center gap-2 max-w-3xl mx-auto">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button size="icon" onClick={handleSendMessage} disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State - Desktop only */}
            {view === "list" && (
              <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a chat from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
