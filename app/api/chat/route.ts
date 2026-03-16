import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { findAllUserChats, createChat } from '@/models/Chat';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Wait for connection to be fully established
    let retries = 0;
    while (require('mongoose').connection.readyState !== 1 && retries < 5) {
      console.log('🔍 Chat API: Waiting for connection... state:', require('mongoose').connection.readyState);
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const chats = await findAllUserChats(userId);

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Wait for connection to be fully established
    let retries = 0;
    while (require('mongoose').connection.readyState !== 1 && retries < 5) {
      console.log('🔍 Chat API POST: Waiting for connection... state:', require('mongoose').connection.readyState);
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const chatData = await request.json();

    // Generate a unique chat ID
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add userId and chatId to the chat data
    const newChat = await createChat({
      ...chatData,
      id: chatId,
      userId,
    });

    return NextResponse.json({ chat: newChat }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
