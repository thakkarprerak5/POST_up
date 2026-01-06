import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { restoreMessage, getDeletedMessages } from '@/models/DeletedChat';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedMessages = await getDeletedMessages(session.user.id);
    
    return NextResponse.json({ deletedMessages });
  } catch (error) {
    console.error('Error fetching deleted messages:', error);
    return NextResponse.json({ error: 'Failed to fetch deleted messages' }, { status: 500 });
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

    const restoredMessage = await restoreMessage(restorationToken, session.user.id);
    
    return NextResponse.json({ 
      message: 'Message restored successfully',
      message: restoredMessage
    });
  } catch (error) {
    console.error('Error restoring message:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to restore message' 
    }, { status: 500 });
  }
}
