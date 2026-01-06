import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { restoreChat, getDeletedChats } from '@/models/DeletedChat';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedChats = await getDeletedChats(session.user.id);
    
    return NextResponse.json({ deletedChats });
  } catch (error) {
    console.error('Error fetching deleted chats:', error);
    return NextResponse.json({ error: 'Failed to fetch deleted chats' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restorationToken } = await request.json();
    
    if (!restorationToken) {
      return NextResponse.json({ error: 'Restoration token is required' }, { status: 400 });
    }

    const restoredChat = await restoreChat(restorationToken, session.user.id);
    
    return NextResponse.json({ 
      message: 'Chat restored successfully',
      chat: restoredChat
    });
  } catch (error) {
    console.error('Error restoring chat:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to restore chat' 
    }, { status: 500 });
  }
}
