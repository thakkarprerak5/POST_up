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
      return NextResponse.json({ error: 'Can only delete group chats using this endpoint' }, { status: 400 });
    }

    const userId = session.user.id;

    // Only the group creator (first participant) or an admin can delete the group
    const isCreator = chat.participants?.[0]?.id === userId;
    const isAdmin = (session.user as any)?.role === 'admin' || (session.user as any)?.type === 'admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the group creator can delete this group' },
        { status: 403 }
      );
    }

    // Hard delete the chat and its messages
    await chatsCollection.deleteOne({ id: chatId });

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Delete group error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
