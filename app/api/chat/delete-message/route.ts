import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';
import { softDeleteMessage } from '@/models/DeletedChat';

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received to /api/chat/delete-message');
    
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, messageId } = await request.json();
    console.log('Deleting message:', messageId, 'from chat:', chatId);
    console.log('Database connected:', !!mongoose.connection.db);
    
    // Test direct database connection
    const db = mongoose.connection.db;
    if (!db) {
      console.log('Database not connected');
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    // Check if chat exists first
    const existingChat = await db.collection('chats').findOne({ id: chatId });
    console.log('Chat exists:', !!existingChat);
    
    if (!existingChat) {
      console.log('Chat not found:', chatId);
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    // Find the message to be deleted
    const messageToDelete = existingChat.messages.find((msg: any) => msg.id === messageId);
    if (!messageToDelete) {
      console.log('Message not found:', messageId);
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Soft delete - store message data for restoration
    await softDeleteMessage(messageId, chatId, session.user.id, messageToDelete);
    
    // Remove message directly
    const result = await db.collection('chats').findOneAndUpdate(
      { id: chatId },
      { 
        $pull: { messages: { id: messageId } },
        $set: { 
          updatedAt: new Date(),
          // Update lastMessage to the most recent message or empty string
          lastMessage: existingChat.messages && existingChat.messages.length > 1 
            ? existingChat.messages[existingChat.messages.length - 2].content 
            : '',
          lastMessageTime: existingChat.messages && existingChat.messages.length > 1
            ? existingChat.messages[existingChat.messages.length - 2].timestamp
            : new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    console.log('Chat after deleting message:', result);
    
    if (!result) {
      console.log('Chat not found after deleting message');
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the user owns this chat
    if (result.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ chat: result });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
