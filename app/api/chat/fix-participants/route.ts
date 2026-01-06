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

    const { chatId, participant } = await request.json();
    
    const db = mongoose.connection.db;
    const chat = await db.collection('chats').findOne({ id: chatId });
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is authorized to modify this chat
    const isParticipant = chat.participants?.some((p: any) => p.id === session.user.id);
    const isOwner = chat.userId === session.user.id;
    
    if (!isParticipant && !isOwner) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    // Add the missing participant to the chat
    const updatedParticipants = [...(chat.participants || []), participant];
    
    const result = await db.collection('chats').findOneAndUpdate(
      { id: chatId },
      { 
        $set: { 
          participants: updatedParticipants,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    return NextResponse.json({ 
      message: 'Participant added successfully',
      chat: result 
    });

  } catch (error) {
    console.error('Error fixing participants:', error);
    return NextResponse.json({ error: 'Failed to fix participants' }, { status: 500 });
  }
}
