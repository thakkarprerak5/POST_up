// app/api/chat/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { findUserById } from '@/models/User';
import mongoose from 'mongoose';

// POST /api/chat/create - Create a new chat
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting chat creation...');
    
    // Get the current user session using NextAuth
    const session = await getServerSession(authOptions);
    console.log('🔑 Session found:', session?.user?.email ? 'Yes' : 'No');
    console.log('🔑 Session details:', {
      email: session?.user?.email,
      id: session?.user?.id,
      name: session?.user?.name
    });

    if (!session?.user?.email) {
      console.log('❌ Unauthorized - No session or email found');
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    // Connect to database first
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    console.log('✅ Database connected');

    // Find the current user from database
    console.log('👤 Looking for user with email:', session.user.email);
    const user = await findUserById(session.user.id);

    if (!user) {
      console.log('❌ User not found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    console.log('✅ User found:', { id: userId, name: user.fullName });

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: parseError.message
      }, { status: 400 });
    }

    const { participantIds, isGroup = false, groupName } = requestBody;
    console.log('📋 Chat creation request:', { participantIds, isGroup, groupName });

    // Validate input
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      console.log('❌ Invalid participants:', participantIds);
      return NextResponse.json({ error: 'Invalid participants' }, { status: 400 });
    }

    // Get database connection
    const db = mongoose.connection.db;
    if (!db) {
      console.log('❌ Database not connected');
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Check if chat already exists between these participants
    const allParticipants = [userId, ...participantIds];
    console.log('🔍 Checking for existing chat between participants:', allParticipants);
    
    const existingChat = await db.collection('chats').findOne({
      participants: { $all: allParticipants, $size: allParticipants.length },
      isGroup: isGroup
    });

    if (existingChat) {
      console.log('✅ Found existing chat:', existingChat._id.toString());
      return NextResponse.json({ 
        success: true, 
        chatId: existingChat._id.toString(),
        message: 'Chat already exists'
      });
    }

    console.log('📝 Creating new chat...');
    // Create chat with absolute minimal structure to avoid any field conflicts
    const chatData = {
      userId: userId,
      name: groupName || '',
      isGroup,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Creating chat with data:', chatData);
    try {
      const result = await db.collection('chats').insertOne(chatData);
      console.log('✅ Chat created successfully:', result.insertedId.toString());
      
      return NextResponse.json({ 
        success: true, 
        chatId: result.insertedId.toString(),
        message: 'Chat created successfully'
      });
    } catch (dbError) {
      console.error('❌ Database error creating chat:', dbError);
      return NextResponse.json({ 
        error: `Database error: ${dbError.message}`,
        details: dbError.stack
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error creating chat:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: error.message || 'Failed to create chat',
      details: error.stack
    }, { status: 500 });
  }
}
