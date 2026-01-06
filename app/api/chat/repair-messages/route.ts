import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await request.json();
    
    const db = mongoose.connection.db;
    const chat = await db.collection('chats').findOne({ id: chatId });
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant = chat.participants?.some((p: any) => p.id === session.user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 401 });
    }

    // Fix messages with incorrect sender information
    const updatedMessages = chat.messages.map((message: any) => {
      // Find the correct participant info
      const participant = chat.participants?.find((p: any) => p.id === message.senderId);
      
      if (participant && (message.senderName !== participant.name || message.senderAvatar !== participant.avatar)) {
        console.log(`Fixing message ${message.id}: ${message.senderName} -> ${participant.name}`);
        return {
          ...message,
          senderName: participant.name,
          senderAvatar: participant.avatar
        };
      }
      
      return message;
    });

    // Update the chat with corrected messages
    const result = await db.collection('chats').findOneAndUpdate(
      { id: chatId },
      { $set: { messages: updatedMessages, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    return NextResponse.json({ 
      message: 'Messages repaired successfully',
      fixedMessages: updatedMessages.filter((msg, index) => msg !== chat.messages[index]).length
    });

  } catch (error) {
    console.error('Error repairing messages:', error);
    return NextResponse.json({ error: 'Failed to repair messages' }, { status: 500 });
  }
}
