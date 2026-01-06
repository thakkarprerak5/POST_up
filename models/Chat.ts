import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMessage extends Document {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  id: string;
  userId: string; // The owner of this chat
  name: string;
  avatar: string;
  isGroup: boolean;
  participants: { id: string; name: string; avatar: string }[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  id: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, required: true },
}, { _id: false });

const ChatSchema = new Schema<IChat>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true }, // Index for faster queries
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  isGroup: { type: Boolean, default: false },
  participants: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, required: true }
  }],
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
  messages: [MessageSchema]
}, { 
  timestamps: true,
  collection: 'chats'
});

// Create model if it doesn't exist
const Chat = (global as any).Chat || mongoose.model<IChat>('Chat', ChatSchema);

// For development
if (process.env.NODE_ENV === 'development') {
  (global as any).Chat = Chat;
}

export const createChat = async (chatData: Omit<IChat, keyof Document>) => {
  const chat = new Chat(chatData);
  return chat.save();
};

export const findChatsByUserId = async (userId: string) => {
  return Chat.find({ userId }).sort({ lastMessageTime: -1 }).exec();
};

export const findChatsByParticipant = async (userId: string) => {
  return Chat.find({ 
    'participants.id': userId 
  }).sort({ lastMessageTime: -1 }).exec();
};

export const findAllUserChats = async (userId: string) => {
  // Find chats where user is either owner or participant
  const ownerChats = await findChatsByUserId(userId);
  const participantChats = await findChatsByParticipant(userId);
  
  // Merge and remove duplicates (in case user is both owner and participant)
  const allChats = [...ownerChats, ...participantChats];
  const uniqueChats = allChats.filter((chat, index, self) => 
    index === self.findIndex((c) => c.id === chat.id)
  );
  
  // Sort by lastMessageTime
  return uniqueChats.sort((a, b) => 
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );
};

export const findChatById = async (chatId: string) => {
  return Chat.findOne({ id: chatId }).exec();
};

export const updateChat = async (chatId: string, updateData: Partial<IChat>) => {
  return Chat.findOneAndUpdate({ id: chatId }, updateData, { new: true }).exec();
};

export const deleteChat = async (chatId: string) => {
  return Chat.findOneAndDelete({ id: chatId }).exec();
};

export const addMessageToChat = async (chatId: string, message: IMessage) => {
  try {
    // Use direct database query to avoid model issues
    const db = mongoose.connection.db;
    if (!db) {
      console.error('Database not connected in addMessageToChat');
      return null;
    }
    
    const result = await db.collection('chats').findOneAndUpdate(
      { id: chatId },
      { 
        $push: { messages: message },
        $set: { 
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    return result;
  } catch (error) {
    console.error('Error in addMessageToChat:', error);
    return null;
  }
};

export default Chat;
