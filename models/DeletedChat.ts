import mongoose, { Schema } from 'mongoose';

interface IDeletedChat {
  originalChatId: string;
  userId: string;
  chatData: any; // Store the complete chat data
  deletedAt: Date;
  expiresAt: Date; // 14 days from deletion
  restorationToken: string;
}

interface IDeletedMessage {
  originalMessageId: string;
  chatId: string;
  userId: string;
  messageData: any; // Store the complete message data
  deletedAt: Date;
  expiresAt: Date; // 14 days from deletion
  restorationToken: string;
}

const DeletedChatSchema = new Schema<IDeletedChat>({
  originalChatId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  chatData: { type: Schema.Types.Mixed, required: true },
  deletedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
  restorationToken: { type: String, required: true, unique: true }
}, { 
  timestamps: true,
  collection: 'deleted_chats'
});

const DeletedMessageSchema = new Schema<IDeletedMessage>({
  originalMessageId: { type: String, required: true, index: true },
  chatId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  messageData: { type: Schema.Types.Mixed, required: true },
  deletedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
  restorationToken: { type: String, required: true, unique: true }
}, { 
  timestamps: true,
  collection: 'deleted_messages'
});

// Create models if they don't exist
const DeletedChat = (global as any).DeletedChat || mongoose.model<IDeletedChat>('DeletedChat', DeletedChatSchema);
const DeletedMessage = (global as any).DeletedMessage || mongoose.model<IDeletedMessage>('DeletedMessage', DeletedMessageSchema);

// For development
if (process.env.NODE_ENV === 'development') {
  (global as any).DeletedChat = DeletedChat;
  (global as any).DeletedMessage = DeletedMessage;
}

// Helper functions
const generateRestorationToken = () => `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const calculateExpiryDate = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 14); // 14 days from now
  return expiry;
};

// Soft delete chat
export const softDeleteChat = async (chatId: string, userId: string, chatData: any) => {
  const restorationToken = generateRestorationToken();
  const expiresAt = calculateExpiryDate();
  
  const deletedChat = new DeletedChat({
    originalChatId: chatId,
    userId,
    chatData,
    deletedAt: new Date(),
    expiresAt,
    restorationToken
  });
  
  return deletedChat.save();
};

// Soft delete message
export const softDeleteMessage = async (messageId: string, chatId: string, userId: string, messageData: any) => {
  const restorationToken = generateRestorationToken();
  const expiresAt = calculateExpiryDate();
  
  const deletedMessage = new DeletedMessage({
    originalMessageId: messageId,
    chatId,
    userId,
    messageData,
    deletedAt: new Date(),
    expiresAt,
    restorationToken
  });
  
  return deletedMessage.save();
};

// Restore chat
export const restoreChat = async (restorationToken: string, userId: string) => {
  const deletedChat = await DeletedChat.findOne({ 
    restorationToken, 
    userId,
    expiresAt: { $gt: new Date() } // Not expired
  });
  
  if (!deletedChat) {
    throw new Error('Invalid or expired restoration token');
  }
  
  // Restore the chat to the main collection
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }
  
  await db.collection('chats').insertOne(deletedChat.chatData);
  
  // Remove from deleted collection
  await DeletedChat.deleteOne({ _id: deletedChat._id });
  
  return deletedChat.chatData;
};

// Restore message
export const restoreMessage = async (restorationToken: string, userId: string) => {
  const deletedMessage = await DeletedMessage.findOne({ 
    restorationToken, 
    userId,
    expiresAt: { $gt: new Date() } // Not expired
  });
  
  if (!deletedMessage) {
    throw new Error('Invalid or expired restoration token');
  }
  
  // Restore the message to the chat
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }
  
  await db.collection('chats').updateOne(
    { id: deletedMessage.chatId },
    { 
      $push: { messages: deletedMessage.messageData },
      $set: { 
        updatedAt: new Date(),
        // Update lastMessage to the restored message if it's newer
        lastMessage: deletedMessage.messageData.content,
        lastMessageTime: deletedMessage.messageData.timestamp
      }
    }
  );
  
  // Remove from deleted collection
  await DeletedMessage.deleteOne({ _id: deletedMessage._id });
  
  return deletedMessage.messageData;
};

// Get deleted items for user
export const getDeletedChats = async (userId: string) => {
  return DeletedChat.find({ 
    userId, 
    expiresAt: { $gt: new Date() } 
  }).sort({ deletedAt: -1 });
};

export const getDeletedMessages = async (userId: string) => {
  return DeletedMessage.find({ 
    userId, 
    expiresAt: { $gt: new Date() } 
  }).sort({ deletedAt: -1 });
};

// Clean up expired items (should be run periodically)
export const cleanupExpiredItems = async () => {
  const now = new Date();
  
  await DeletedChat.deleteMany({ expiresAt: { $lt: now } });
  await DeletedMessage.deleteMany({ expiresAt: { $lt: now } });
};

export { DeletedChat, DeletedMessage };
export default { DeletedChat, DeletedMessage };
