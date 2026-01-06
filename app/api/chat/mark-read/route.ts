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
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    const chat = await db.collection('chats').findOne({ id: chatId });
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify user is a participant
    const isParticipant = chat.participants?.some((p: any) => p.id === session.user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 401 });
    }

    // Reset unread count to 0
    const result = await db.collection('chats').findOneAndUpdate(
      { id: chatId },
      { $set: { unreadCount: 0, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    return NextResponse.json({ 
      message: 'Messages marked as read',
      chat: result 
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
