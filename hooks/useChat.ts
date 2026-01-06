import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'seen'; // Optional for backward compatibility
  editedAt?: Date;
  deletedAt?: Date;
  deletedFor?: string[]; // Array of user IDs who deleted this message
  isSystemMessage?: boolean;
  systemType?: 'user_added' | 'user_removed' | 'user_left' | 'group_created' | 'group_renamed';
}

interface Chat {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  participants: { id: string; name: string; avatar: string }[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface UseChatOptions {
  setActiveChat?: (chat: Chat | null) => void;
}

export const useChat = (options?: UseChatOptions) => {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chats from API
  const fetchChats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/chat');
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      
      const data = await response.json();
      setChats(data.chats || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Create a new chat
  const createChat = useCallback(async (chatData: Omit<Chat, 'id' | 'userId' | 'messages' | 'createdAt' | 'updatedAt'>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatData),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const data = await response.json();
      setChats(prev => [data.chat, ...prev]);
      return data.chat;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create chat');
    }
  }, [session?.user?.id]);

  // Update a chat
  const updateChat = useCallback(async (chatId: string, updateData: Partial<Chat>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update chat');
      }

      const data = await response.json();
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? data.chat : chat
      ));
      return data.chat;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update chat');
    }
  }, [session?.user?.id]);

  // Delete a chat
  const deleteChat = useCallback(async (chatId: string) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      console.log('Attempting to delete chat:', chatId);
      console.log('Full URL being called:', `/api/chat/${chatId}`);
      
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response ok:', response.ok);
      console.log('Delete response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        throw new Error(`Failed to delete chat: ${response.status} ${errorText}`);
      }

      // Update local state immediately
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      console.log('Chat deleted successfully from local state');
    } catch (err) {
      console.error('Delete chat error:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete chat');
    }
  }, [session?.user?.id]);

  // Add a message to a chat
  const addMessage = useCallback(async (chatId: string, message: Omit<Message, 'id'>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const messageWithId = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          messageData: messageWithId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add message');
      }

      const data = await response.json();
      
      // Update the chat in real-time with proper unread count handling
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = data.chat;
          // If current user sent the message, don't increase unread count
          // If someone else sent the message and this isn't the active chat, increase unread count
          const isCurrentUserSender = message.senderId === session.user.id;
          const isActiveChat = options?.setActiveChat && 
            // Check if this chat is currently active (we'd need to track this)
            false; // For now, we'll update unread count on server side
          
          return updatedChat;
        }
        return chat;
      }));
      
      // Also update the active chat if it's the current one
      if (options?.setActiveChat) {
        options.setActiveChat(data.chat);
      }
      
      return data.chat;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add message');
    }
  }, [session?.user?.id, options?.setActiveChat]);

  // Delete a message from a chat
  const deleteMessage = useCallback(async (chatId: string, messageId: string) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const response = await fetch('/api/chat/delete-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          messageId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      const data = await response.json();
      
      // Update the chat in real-time
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? data.chat : chat
      ));
      
      // Also update the active chat if it's the current one
      if (options?.setActiveChat) {
        options.setActiveChat(data.chat);
      }
      
      return data.chat;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, [session?.user?.id, options?.setActiveChat]);

  // Refresh active chat
  const refreshActiveChat = useCallback(async (chatId: string) => {
    if (!session?.user?.id) return;

    // Additional safeguard: prevent polling if chat ID contains invalid patterns
    const problematicIds = [
      '1767596073614_jwv4d3fn9',
      '1767598233944_gywlqxz9x'
    ];
    
    if (problematicIds.some(id => chatId.includes(id))) {
      console.error('Invalid chat ID detected in refreshActiveChat, stopping:', chatId);
      if (options?.setActiveChat) {
        options.setActiveChat(null);
      }
      return;
    }

    // Validate chat ID format
    if (!chatId || !chatId.startsWith('chat_')) {
      console.error('Invalid chat ID format:', chatId);
      console.error('Active chat ID:', chatId);
      console.error('All chats:', chats.map(c => c.id));
      return;
    }

    // Check if chat exists in current chats list
    const chatExists = chats.some(chat => chat.id === chatId);
    if (!chatExists) {
      console.error('Chat not found in current chats list:', chatId);
      console.error('Active chat ID:', chatId);
      console.error('All chats:', chats.map(c => c.id));
      
      // Clear the invalid active chat state to prevent further errors
      if (options?.setActiveChat) {
        options.setActiveChat(null);
      }
      
      return;
    }

    try {
      const response = await fetch(`/api/chat/${chatId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error('Chat not found:', chatId);
        } else if (response.status === 401) {
          console.error('Access denied to chat:', chatId);
        } else {
          console.error('Failed to fetch chat:', response.status, response.statusText);
        }
        return;
      }
      
      const data = await response.json();
      
      // Update the chat in the list
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? data.chat : chat
      ));
      
      // Update the active chat if it's the current one
      if (options?.setActiveChat) {
        options.setActiveChat(data.chat);
      }
    } catch (err) {
      console.error('Error refreshing chat:', err);
    }
  }, [session?.user?.id, options?.setActiveChat, chats]);

  // Poll for new chats
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats()
    }, 5000) // Poll every 5 seconds for new chats

    return () => clearInterval(interval)
  }, [])

  // Filter out invalid chat IDs from the chats array
  useEffect(() => {
    const problematicIds = [
      'chat_1767596073614_jwv4d3fn9',
      'chat_1767598233944_gywlqxz9x'
    ];
    
    if (chats.some(chat => chat?.id && problematicIds.some(id => chat.id.includes(id)))) {
      // Silently filter out invalid chat IDs - no need to log this
      setChats(prev => prev.filter(chat => 
        !chat?.id || !problematicIds.some(id => chat.id.includes(id))
      ));
    }
  }, [chats])

  // Load chats when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchChats();
    } else {
      setChats([]);
      setLoading(false);
    }
  }, [session?.user?.id, fetchChats]);

  return {
    chats,
    loading,
    error,
    fetchChats,
    createChat,
    updateChat,
    deleteChat,
    addMessage,
    deleteMessage,
    refreshActiveChat,
  };
};
