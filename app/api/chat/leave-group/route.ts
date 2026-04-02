import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await request.json();
    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
    }

    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const chatsCollection = db.collection('chats');

    // Find the chat
    const chat = await chatsCollection.findOne({ id: chatId });
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify it's a group chat
    if (!chat.isGroup) {
      return NextResponse.json({ error: 'Can only leave group chats' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check the user is a participant
    const isParticipant = chat.participants?.some((p: any) => p.id === userId);
    if (!isParticipant) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Remove the user from participants
    const updatedParticipants = chat.participants.filter((p: any) => p.id !== userId);

    await chatsCollection.updateOne(
      { id: chatId },
      {
        $set: {
          participants: updatedParticipants,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true, message: 'Left group successfully' });
  } catch (error: any) {
    console.error('Leave group error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
