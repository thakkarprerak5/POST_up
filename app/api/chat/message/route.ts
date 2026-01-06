import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received to /api/chat/message');
    
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, messageData } = await request.json();
    console.log('Adding message to chat:', chatId, 'Message data:', messageData);
    console.log('Database connected:', !!mongoose.connection.db);
    
    // Override sender information with current session user data to ensure accuracy
    const correctedMessageData = {
      ...messageData,
      senderId: session.user.id,
      senderName: session.user.name || 'Unknown',
      senderAvatar: session.user.image || '/placeholder-user.jpg'
    };
    
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
    
    // Add message directly with unread count handling
    const isCurrentUserSender = correctedMessageData.senderId === session.user.id;
    
    const result = await db.collection('chats').findOneAndUpdate(
      { id: chatId },
      { 
        $push: { messages: correctedMessageData },
        $set: { 
          lastMessage: correctedMessageData.content,
          lastMessageTime: correctedMessageData.timestamp,
          updatedAt: new Date()
        },
        // Only increment unread count if message is from someone else
        ...(isCurrentUserSender ? {} : { $inc: { unreadCount: 1 } })
      },
      { returnDocument: 'after' }
    );
    
    console.log('Chat after adding message:', result);
    
    if (!result) {
      console.log('Chat not found after adding message');
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the user owns this chat OR is a participant
    const isOwner = result.userId === session.user.id;
    const isParticipant = result.participants?.some((p: any) => p.id === session.user.id);
    
    if (!isOwner && !isParticipant) {
      console.log('User not authorized - not owner or participant');
      console.log('Chat owner:', result.userId);
      console.log('Current user:', session.user.id);
      console.log('Participants:', result.participants);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ chat: result });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}
