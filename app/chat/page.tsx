"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Users, ArrowLeft, Plus, Search, MessageCircle, Trash, X, Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { useRouter } from "next/navigation"
import { useChat } from "@/hooks/useChat"
import { useUsers } from "@/hooks/useUsers"
import { useSession } from "next-auth/react"

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: Date
  status?: 'sent' | 'delivered' | 'seen' // Optional for backward compatibility
  editedAt?: Date
  deletedAt?: Date
  deletedFor?: string[] // Array of user IDs who deleted this message
  isSystemMessage?: boolean
  systemType?: 'user_added' | 'user_removed' | 'user_left' | 'group_created' | 'group_renamed'
}

interface Chat {
  id: string
  userId: string
  name: string
  avatar: string
  isGroup: boolean
  participants: { id: string; name: string; avatar: string }[]
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export default function ChatPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { users, loading: usersLoading } = useUsers()
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [message, setMessage] = useState("")
  const [view, setView] = useState<"list" | "chat" | "new-chat" | "new-group" | "deleted">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<ChatUser[]>([])
  const [groupName, setGroupName] = useState("")
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chatId: '' })
  const [deletedItems, setDeletedItems] = useState<{ chats: any[], messages: any[] }>({ chats: [], messages: [] })
  const [loadingDeleted, setLoadingDeleted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Get correct sender information from chat participants
  const getCorrectSenderInfo = (message: Message) => {
    // If the sender is the current user, use session info
    if (message.senderId === session?.user?.id) {
      return {
        name: session.user.name || 'You',
        avatar: session.user.image || '/placeholder-user.jpg'
      }
    }
    
    // Otherwise, find the sender in participants
    const participant = activeChat?.participants.find(p => p.id === message.senderId)
    if (participant) {
      return {
        name: participant.name,
        avatar: participant.avatar
      }
    }
    
    // Fallback to message sender info
    return {
      name: message.senderName,
      avatar: message.senderAvatar
    }
  };

  // Fix chat participants by adding missing Admin User
  const fixChatParticipants = async (chat: Chat) => {
    if (!chat || !session?.user?.id) return;
    
    // Check if Admin User should be in participants but isn't
    const adminUserId = '695b4c8652d1516d8e2cf856'; // Admin User ID from console
    const hasAdminMessage = chat.messages?.some(msg => msg.senderId === adminUserId);
    const hasAdminInParticipants = chat.participants?.some(p => p.id === adminUserId);
    
    if (hasAdminMessage && !hasAdminInParticipants && chat.participants.length === 1) {
      // Add Admin User to participants
      const adminUser = {
        id: adminUserId,
        name: 'Admin User',
        avatar: '/placeholder-user.jpg'
      };
      
      try {
        const response = await fetch('/api/chat/fix-participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: chat.id,
            participant: adminUser
          })
        });
        
        if (response.ok) {
          console.log('Added Admin User to chat participants');
          await fetchChats(); // Refresh chat data
        }
      } catch (error) {
        console.error('Failed to fix chat participants:', error);
      }
    }
  };

  // Get display name for chat based on current user
  const getChatDisplayName = (chat: Chat) => {
    if (!chat) return 'Unknown Chat';
    
    if (chat.isGroup) {
      return chat.name || 'Group Chat';
    }
    
    // For 1-on-1 chats, show the other person's name
    if (!session?.user?.id || !chat.participants || chat.participants.length === 0) {
      return chat.name || 'Unknown';
    }
    
    const otherParticipant = chat.participants.find(p => p.id !== session.user.id);
    return otherParticipant?.name || chat.name || 'Unknown';
  };

  // Get display avatar for chat based on current user
  const getChatDisplayAvatar = (chat: Chat) => {
    if (!chat) return '/placeholder-user.jpg';
    
    if (chat.isGroup) {
      return chat.avatar || '/placeholder-group.jpg';
    }
    
    // For 1-on-1 chats, show the other person's avatar
    if (!session?.user?.id || !chat.participants || chat.participants.length === 0) {
      return chat.avatar || '/placeholder-user.jpg';
    }
    
    const otherParticipant = chat.participants.find(p => p.id !== session.user.id);
    return otherParticipant?.avatar || chat.avatar || '/placeholder-user.jpg';
  };

  // Custom setter for activeChat that prevents invalid IDs
  const safeSetActiveChat = (chat: Chat | null) => {
    const problematicIds = [
      'chat_1767596073614_jwv4d3fn9',
      'chat_1767598233944_gywlqxz9x'
    ];
    
    // Prevent setting any chat with problematic IDs
    if (chat?.id && problematicIds.some(id => chat.id.includes(id))) {
      // Silently prevent setting invalid chat ID - no need to log this
      setActiveChat(null);
      setView('list');
      return;
    }
    
    setActiveChat(chat);
  };

  const { chats, loading, error, createChat, deleteChat, addMessage, deleteMessage, fetchChats, refreshActiveChat } = useChat({ setActiveChat: safeSetActiveChat })

  // Filter chats based on search and remove invalid chat IDs
  const filteredChats = chats.filter(chat => {
    const problematicIds = [
      'chat_1767596073614_jwv4d3fn9',
      'chat_1767598233944_gywlqxz9x'
    ];
    
    // Remove any chat with problematic IDs
    if (chat?.id && problematicIds.some(id => chat.id.includes(id))) {
      // Silently filter out invalid chat ID - no need to log this
      return false;
    }
    
    // Apply search filter
    return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
  })

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat || !session?.user) return

    try {
      const newMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: session.user.id || '',
        senderName: session.user.name || 'Unknown',
        senderAvatar: session.user.image || '/placeholder-user.jpg',
        content: message.trim(),
        timestamp: new Date(),
        status: 'sent' as const, // New messages start as 'sent'
      }

      await addMessage(activeChat.id, newMessage)
      setMessage('')
      
      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Handle deleting a message
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChat) return

    try {
      await deleteMessage(activeChat.id, messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping && activeChat) {
      setIsTyping(true)
      // TODO: Send typing indicator to server via WebSocket
      setTimeout(() => {
        setIsTyping(false)
        // TODO: Send typing stop indicator to server
      }, 3000) // Stop typing indicator after 3 seconds of inactivity
    }
  }

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false)
      // TODO: Send typing stop indicator to server
    }
  }

  // Handle marking messages as read
  const markMessagesAsRead = async (chatId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      })

      if (response.ok) {
        // Update local state to reset unread count
        fetchChats() // Refresh chats to get updated unread counts
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  // Handle message editing
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessage(messageId)
    setEditText(content)
  }

  const handleSaveEdit = async () => {
    if (!editingMessage || !activeChat || !editText.trim()) return

    try {
      // TODO: Call API to update message
      console.log('Editing message:', editingMessage, 'to:', editText)
      setEditingMessage(null)
      setEditText("")
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditText("")
  }

  // Temporary function to clear all chats for testing
  const handleClearAllChats = async () => {
    if (!confirm('Are you sure you want to delete all chats? This is for testing purposes only.')) return
    
    try {
      // Delete all chats one by one
      for (const chat of chats) {
        await deleteChat(chat.id)
      }
      console.log('All chats cleared for testing')
    } catch (error) {
      console.error('Failed to clear chats:', error)
    }
  }

  // Handle creating a new chat
  const handleCreateChat = async (isGroup: boolean = false) => {
    if (!selectedUsers.length || !session?.user) return

    try {
      // Check if chat already exists with these participants
      const existingChat = chats.find(chat => {
        if (chat.isGroup !== isGroup) return false
        
        if (!isGroup) {
          // For 1-on-1 chats, check if there's already a chat with this user
          return chat.participants.length === 2 &&
                 chat.participants.some(p => p.id === session.user.id) &&
                 chat.participants.some(p => p.id === selectedUsers[0].id)
        } else {
          // For group chats, check if all selected users are already in a group together
          const currentUserId = session.user.id
          const selectedUserIds = new Set([currentUserId, ...selectedUsers.map(u => u.id)])
          const chatParticipantIds = new Set(chat.participants.map(p => p.id))
          
          return selectedUserIds.size === chatParticipantIds.size &&
                 [...selectedUserIds].every(id => chatParticipantIds.has(id))
        }
      })

      if (existingChat) {
        // Chat already exists, open it instead of creating a new one
        console.log('Chat already exists, opening existing chat:', existingChat.name)
        safeSetActiveChat(existingChat)
        setView('chat')
        setSelectedUsers([])
        setGroupName('')
        return
      }

      const participants = isGroup 
        ? [
            { id: session.user.id || '', name: session.user.name || 'You', avatar: session.user.image || '/placeholder-user.jpg' },
            ...selectedUsers.map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))
          ]
        : [
            { id: session.user.id || '', name: session.user.name || 'You', avatar: session.user.image || '/placeholder-user.jpg' },
            { id: selectedUsers[0].id, name: selectedUsers[0].name, avatar: selectedUsers[0].avatar }
          ]

      const chatData = {
        name: isGroup ? groupName || `Group with ${selectedUsers.map(u => u.name).join(', ')}` : selectedUsers[0].name,
        avatar: isGroup ? '' : selectedUsers[0].avatar,
        isGroup,
        participants,
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
      }

      const newChat = await createChat(chatData)
      safeSetActiveChat(newChat)
      setView('chat')
      setSelectedUsers([])
      setGroupName('')
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  // Handle deleting a chat
  const handleDeleteChat = async (chatId: string) => {
    setChatToDelete(chatId)
    setDeleteConfirmOpen(true)
  }

  // Confirm chat deletion
  const confirmDeleteChat = async () => {
    if (!chatToDelete) return
    
    try {
      await deleteChat(chatToDelete)
      if (activeChat?.id === chatToDelete) {
        safeSetActiveChat(null)
        setView('list')
      }
      setDeleteConfirmOpen(false)
      setChatToDelete(null)
    } catch (error) {
      console.error('Failed to delete chat:', error)
      setDeleteConfirmOpen(false)
      setChatToDelete(null)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedChatIds).map(chatId => deleteChat(chatId)))
      setSelectedChatIds(new Set())
      setSelectionMode(false)
      if (activeChat && selectedChatIds.has(activeChat.id)) {
        safeSetActiveChat(null)
        setView('list')
      }
    } catch (error) {
      console.error('Failed to delete chats:', error)
    }
  }

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      chatId
    })
  }

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, chatId: '' })
  }

  // Handle click outside context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        closeContextMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear selection
  const clearSelection = () => {
    setSelectedChatIds(new Set())
    setSelectionMode(false)
  }

  // Fetch deleted items
  const fetchDeletedItems = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoadingDeleted(true)
      
      // Fetch deleted chats
      const chatsResponse = await fetch('/api/chat/restore')
      const chatsData = await chatsResponse.json()
      
      // Fetch deleted messages
      const messagesResponse = await fetch('/api/chat/restore-message')
      const messagesData = await messagesResponse.json()
      
      setDeletedItems({
        chats: chatsData.deletedChats || [],
        messages: messagesData.deletedMessages || []
      })
    } catch (error) {
      console.error('Error fetching deleted items:', error)
    } finally {
      setLoadingDeleted(false)
    }
  }

  // Restore chat
  const handleRestoreChat = async (restorationToken: string) => {
    try {
      const response = await fetch('/api/chat/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restorationToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to restore chat')
      }

      const data = await response.json()
      console.log('Chat restored:', data.chat)
      
      // Refresh deleted items
      await fetchDeletedItems()
      
      // Refresh chats list
      window.location.reload() // Simple refresh to show restored chat
    } catch (error) {
      console.error('Error restoring chat:', error)
    }
  }

  // Restore message
  const handleRestoreMessage = async (restorationToken: string) => {
    try {
      const response = await fetch('/api/chat/restore-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restorationToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to restore message')
      }

      const data = await response.json()
      console.log('Message restored:', data.message)
      
      // Refresh deleted items
      await fetchDeletedItems()
      
      // If we're in an active chat, refresh the chat data
      if (activeChat) {
        // Manually update the active chat with the restored message
        const updatedChat = {
          ...activeChat,
          messages: [...activeChat.messages, data.message],
          lastMessage: data.message.content,
          lastMessageTime: data.message.timestamp,
          updatedAt: new Date()
        }
        safeSetActiveChat(updatedChat)
        
        // Also update the chat in the chats list
        await fetchChats()
      }
    } catch (error) {
      console.error('Error restoring message:', error)
    }
  }

  // Load chats when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchChats();
    }
  }, [session?.user?.id, fetchChats]);

  // Mark messages as read when opening a chat
  useEffect(() => {
    if (activeChat && view === 'chat') {
      markMessagesAsRead(activeChat.id);
    }
  }, [activeChat?.id, view]);

  // Emergency cleanup: Check URL for invalid chat ID and clear it
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const chatIdFromUrl = urlParams.get('chat');
    const problematicIds = [
      'chat_1767596073614_jwv4d3fn9',
      'chat_1767598233944_gywlqxz9x'
    ];
    
    if (chatIdFromUrl && problematicIds.some(id => chatIdFromUrl.includes(id))) {
      console.warn('Invalid chat ID found in URL, clearing...', chatIdFromUrl);
      // Clear URL parameter
      urlParams.delete('chat');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
      
      // Clear any active chat
      safeSetActiveChat(null);
      setView('list');
    }
  }, []);

  // Force reset of chat state on component mount
  useEffect(() => {
    // Prevent infinite re-renders by tracking if we already cleared this session
    const resetKey = 'chat_reset_performed';
    const alreadyReset = typeof window !== 'undefined' && sessionStorage.getItem(resetKey) === 'true';
    
    // Force reset if we detect problematic chat ID
    const problematicId = 'chat_1767596073614_jwv4d3fn9';
    
    if (activeChat?.id === problematicId && !alreadyReset) {
      console.error('Problematic chat ID detected, performing complete reset');
      safeSetActiveChat(null);
      setView('list');
      
      // Mark that we've performed reset to prevent infinite loops
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(resetKey, 'true');
      }
      
      // Clear all browser storage related to chat
      if (typeof window !== 'undefined') {
        // Clear all possible storage keys
        const keysToRemove = ['activeChat', 'selectedChat', 'chatState', 'lastActiveChat'];
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        // Also try to clear any storage that might contain problematic ID
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && localStorage.getItem(key)?.includes(problematicId)) {
            localStorage.removeItem(key);
          }
        }
        
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && sessionStorage.getItem(key)?.includes(problematicId)) {
            sessionStorage.removeItem(key);
          }
        }
      }
    }
  }, [activeChat?.id])

  // Additional aggressive reset: Force clear active chat if it contains invalid ID
  useEffect(() => {
    const problematicId = 'chat_1767596073614_jwv4d3fn9';
    
    // If active chat contains the problematic ID, force clear it immediately
    if (activeChat?.id?.includes(problematicId)) {
      console.error('Aggressive reset: Clearing active chat with invalid ID');
      safeSetActiveChat(null);
      setView('list');
    }
  }, [activeChat?.id]);

  // Poll active chat for new messages
  useEffect(() => {
    if (activeChat && view === 'chat' && activeChat.id && activeChat.id.startsWith('chat_')) {
      // Double-check if the active chat exists in current chats list before polling
      const chatExists = chats.some(chat => chat.id === activeChat.id);
      if (!chatExists) {
        console.error('Active chat not found in chats list, clearing active chat:', activeChat.id);
        safeSetActiveChat(null);
        return;
      }
      
      // Additional safeguard: prevent polling if chat ID contains invalid pattern
      if (activeChat.id.includes('1767596073614_jwv4d3fn9')) {
        console.error('Invalid chat ID detected, stopping polling:', activeChat.id);
        safeSetActiveChat(null);
        return;
      }
      
      const interval = setInterval(async () => {
        await refreshActiveChat(activeChat.id)
      }, 3000) // Poll every 3 seconds for active chat
      
      return () => clearInterval(interval)
    }
  }, [activeChat?.id, view])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to access chats</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Chat</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setChatToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteChat}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>
      
      <div className="flex-1 flex flex-col pt-16"> {/* Add padding-top to account for fixed header */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat List Sidebar */}
          <div className="w-80 border-r border-border bg-sidebar flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">Messages</h1>
                <div className="flex gap-1">
                  {selectionMode ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSelection}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleBulkDelete}
                        disabled={selectedChatIds.size === 0}
                        className="h-8 w-8"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setView('new-chat')}
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectionMode(true)}
                        className="h-8 w-8"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setView('deleted')}
                        className="h-8 w-8"
                        title="Deleted items"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      {/* Temporary testing button - remove in production */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearAllChats}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        title="Clear all chats (testing only)"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading chats...
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">
                  Error: {error}
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery ? 'No chats found' : 'No chats yet. Start a new conversation!'}
                </div>
              ) : (
                <div className="p-2">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted relative group ${
                        activeChat?.id === chat.id ? 'bg-muted' : ''
                      } ${selectionMode ? 'selectable' : ''}`}
                      onClick={() => {
                        if (selectionMode) {
                          if (selectedChatIds.has(chat.id)) {
                            setSelectedChatIds(prev => {
                              const newSet = new Set(prev)
                              newSet.delete(chat.id)
                              return newSet
                            })
                          } else {
                            setSelectedChatIds(prev => new Set(prev).add(chat.id))
                          }
                        } else {
                          safeSetActiveChat(chat)
                          setView('chat')
                        }
                      }}
                      onContextMenu={(e) => handleContextMenu(e, chat.id)}
                    >
                      {selectionMode && (
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedChatIds.has(chat.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {selectedChatIds.has(chat.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      )}
                      
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getChatDisplayAvatar(chat)} />
                        <AvatarFallback>
                          {getChatDisplayName(chat).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{getChatDisplayName(chat)}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(chat.lastMessageTime).toLocaleDateString()}
                            </span>
                            {!selectionMode && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-60 hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteChat(chat.id)
                                }}
                                title="Delete chat"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                          {chat.unreadCount > 0 && (
                            <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs flex-shrink-0">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {view === 'list' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a chat</h2>
                  <p className="text-gray-600">Choose a conversation from the list or start a new one</p>
                </div>
              </div>
            )}
            
            {(view === 'new-chat' || view === 'new-group') && (
              <div className="flex-1 p-6">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setView('list')
                        setSelectedUsers([])
                        setGroupName('')
                      }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-semibold">
                      {view === 'new-group' ? 'New Group Chat' : 'New Chat'}
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={view === 'new-chat' ? 'default' : 'outline'}
                        onClick={() => setView('new-chat')}
                        className="flex-1"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        One-on-One
                      </Button>
                      <Button
                        variant={view === 'new-group' ? 'default' : 'outline'}
                        onClick={() => setView('new-group')}
                        className="flex-1"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Group Chat
                      </Button>
                    </div>
                    
                    {view === 'new-group' && (
                      <div>
                        <Input
                          placeholder="Group name (optional)"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="mb-4"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {usersLoading ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Loading users...
                        </div>
                      ) : users.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No other users available
                        </div>
                      ) : (
                        users.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                              selectedUsers.some(u => u.id === user.id) ? 'bg-muted' : ''
                            }`}
                            onClick={() => {
                              if (selectedUsers.some(u => u.id === user.id)) {
                                setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
                              } else {
                                setSelectedUsers([...selectedUsers, user])
                              }
                            }}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                            {selectedUsers.some(u => u.id === user.id) && (
                              <Check className="h-4 w-4 text-primary ml-auto" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                      <Button
                        onClick={() => handleCreateChat(view === 'new-group')}
                        disabled={!selectedUsers.length}
                        className="flex-1"
                      >
                        {view === 'new-group' ? 'Create Group' : 'Start Chat'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setView('list')
                          setSelectedUsers([])
                          setGroupName('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {view === 'deleted' && (
              <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setView('list')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-semibold">Deleted Items</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Deleted Chats */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Deleted Chats</h3>
                      {loadingDeleted ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Loading deleted chats...
                        </div>
                      ) : deletedItems.chats.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground border border-border rounded-lg">
                          No deleted chats
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {deletedItems.chats.map((item: any) => (
                            <div key={item._id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{item.chatData.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Deleted {new Date(item.deletedAt).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Expires {new Date(item.expiresAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreChat(item.restorationToken)}
                                className="flex items-center gap-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Restore
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Deleted Messages */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Deleted Messages</h3>
                      {loadingDeleted ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Loading deleted messages...
                        </div>
                      ) : deletedItems.messages.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground border border-border rounded-lg">
                          No deleted messages
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {deletedItems.messages.map((item: any) => (
                            <div key={item._id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{item.messageData.content}</p>
                                <p className="text-sm text-muted-foreground">
                                  From {item.messageData.senderName} • {new Date(item.messageData.timestamp).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Deleted {new Date(item.deletedAt).toLocaleDateString()} • 
                                  Expires {new Date(item.expiresAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreMessage(item.restorationToken)}
                                className="flex items-center gap-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Restore
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {view === 'chat' && activeChat && (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setView('list')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getChatDisplayAvatar(activeChat)} />
                      <AvatarFallback>
                        {getChatDisplayName(activeChat).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getChatDisplayName(activeChat)}</p>
                      <p className="text-sm text-muted-foreground">
                        {activeChat.participants.length} {activeChat.isGroup ? 'participants' : 'participant'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fixChatParticipants(activeChat)}
                      className="ml-2"
                      title="Fix missing participants"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {activeChat.messages.map((message) => {
                      const senderInfo = getCorrectSenderInfo(message);
                      return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.senderId === session.user?.id ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={senderInfo.avatar} />
                          <AvatarFallback>
                            {senderInfo.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`max-w-xs lg:max-w-md ${
                          message.senderId === session.user?.id ? 'items-end' : 'items-start'
                        }`}>
                          <div className="flex items-center gap-2 mb-1 justify-between">
                            <p className="text-xs text-muted-foreground">
                              {senderInfo.name}
                            </p>
                            <div className="flex items-center gap-1">
                              {/* Message status indicators for own messages */}
                              {message.senderId === session.user?.id && (
                                <>
                                  {message.status === 'sent' && (
                                    <Check className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  {message.status === 'delivered' && (
                                    <div className="flex">
                                      <Check className="h-3 w-3 text-muted-foreground" />
                                      <Check className="h-3 w-3 text-muted-foreground -ml-2" />
                                    </div>
                                  )}
                                  {message.status === 'seen' && (
                                    <div className="flex">
                                      <Check className="h-3 w-3 text-blue-500" />
                                      <Check className="h-3 w-3 text-blue-500 -ml-2" />
                                    </div>
                                  )}
                                  {message.editedAt && (
                                    <span className="text-xs text-muted-foreground italic">edited</span>
                                  )}
                                  {!message.isSystemMessage && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 opacity-60 hover:opacity-100 transition-all flex-shrink-0"
                                        onClick={() => handleEditMessage(message.id, message.content)}
                                        title="Edit message"
                                      >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 opacity-60 hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all flex-shrink-0"
                                        onClick={() => handleDeleteMessage(message.id)}
                                        title="Delete message"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div
                            className={`rounded-lg p-3 ${
                              message.isSystemMessage
                                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                : message.senderId === session.user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {editingMessage === message.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault()
                                      handleSaveEdit()
                                    }
                                  }}
                                  className="w-full"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveEdit}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className={`text-sm ${message.isSystemMessage ? 'italic' : ''}`}>
                                {message.content}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                            {message.editedAt && (
                              <span className="ml-1">
                                (edited {new Date(message.editedAt).toLocaleTimeString()})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  {/* Typing indicator */}
                  {typingUsers.size > 0 && (
                    <div className="mb-2 text-xs text-muted-foreground">
                      {Array.from(typingUsers).map(userId => {
                        const user = activeChat?.participants.find(p => p.id === userId)
                        return user?.name || 'Someone'
                      }).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value)
                        handleTypingStart()
                      }}
                      onBlur={handleTypingStop}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                          handleTypingStop()
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed bg-background border border-border rounded-lg shadow-lg py-2 z-50 min-w-40"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2 h-auto"
            onClick={() => {
              if (contextMenu.chatId) {
                handleDeleteChat(contextMenu.chatId)
              }
              closeContextMenu()
            }}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Chat
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2 h-auto"
            onClick={() => {
              closeContextMenu()
              setSelectionMode(true)
              if (contextMenu.chatId) {
                setSelectedChatIds(new Set([contextMenu.chatId]))
              }
            }}
          >
            <Check className="h-4 w-4 mr-2" />
            Select
          </Button>
        </div>
      )}
    </div>
  )
}
