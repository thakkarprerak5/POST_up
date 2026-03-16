// app/api/chat/check-existing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';

// POST /api/chat/check-existing - Check if a chat already exists between participants
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checking for existing chat...');
    
    // Get the current user session using NextAuth
    const session = await getServerSession(authOptions);
    console.log('🔑 Session found:', session?.user?.email ? 'Yes' : 'No');

    if (!session?.user?.email) {
      console.log('❌ Unauthorized - No session or email found');
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    // Find the current user from database
    const user = await mongoose.connection.db.collection('users').findOne({
      email: session.user.email
    });

    if (!user) {
      console.log('❌ User not found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    console.log('👤 User ID:', userId, 'Name:', user.fullName);

    const { participantIds, isGroup = false } = await request.json();
    console.log('📋 Check existing chat request:', { participantIds, isGroup });

    // Validate input
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      console.log('❌ Invalid participants:', participantIds);
      return NextResponse.json({ error: 'Invalid participants' }, { status: 400 });
    }

    // Check if chat already exists between these participants
    const allParticipants = [userId, ...participantIds];
    console.log('🔍 Looking for chat between participants:', allParticipants);
    
    const existingChat = await mongoose.connection.db.collection('chats').findOne({
      participants: { $all: allParticipants, $size: allParticipants.length },
      isGroup: isGroup
    });

    if (existingChat) {
      console.log('✅ Found existing chat:', existingChat._id.toString());
      return NextResponse.json({ 
        exists: true, 
        chatId: existingChat._id.toString(),
        message: 'Chat already exists'
      });
    } else {
      console.log('❌ No existing chat found');
      return NextResponse.json({ 
        exists: false, 
        message: 'No existing chat found'
      });
    }

  } catch (error) {
    console.error('❌ Error checking existing chat:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: error.message || 'Failed to check existing chat',
      details: error.stack
    }, { status: 500 });
  }
}
