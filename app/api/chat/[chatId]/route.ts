import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { findChatById, updateChat, deleteChat, addMessageToChat } from '@/models/Chat';
import { softDeleteChat } from '@/models/DeletedChat';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params; // Await the params Promise
    const chat = await findChatById(chatId);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the user owns this chat OR is a participant
    const isOwner = chat.userId === session.user.id;
    const isParticipant = chat.participants?.some((p: any) => p.id === session.user.id);
    
    if (!isOwner && !isParticipant) {
      console.log('User not authorized for GET - not owner or participant');
      console.log('Chat owner:', chat.userId);
      console.log('Current user:', session.user.id);
      console.log('Participants:', chat.participants);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params; // Await the params Promise
    const updateData = await request.json();
    const chat = await updateChat(chatId, updateData);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the user owns this chat OR is a participant
    const isOwner = chat.userId === session.user.id;
    const isParticipant = chat.participants?.some((p: any) => p.id === session.user.id);
    
    if (!isOwner && !isParticipant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params; // Await the params Promise
    console.log('DELETE request received for chatId:', chatId);
    
    const chat = await findChatById(chatId);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the user owns this chat OR is a participant (privacy-first: participants can delete chats they're part of)
    const isOwner = chat.userId === session.user.id;
    const isParticipant = chat.participants?.some((p: any) => p.id === session.user.id);
    
    if (!isOwner && !isParticipant) {
      console.log('User not authorized for DELETE - not owner or participant');
      console.log('Chat owner:', chat.userId);
      console.log('Current user:', session.user.id);
      console.log('Participants:', chat.participants);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete - store chat data for restoration
    await softDeleteChat(chatId, session.user.id, chat);
    
    // Actually delete from main collection
    await deleteChat(chatId);
    
    return NextResponse.json({ 
      message: 'Chat deleted successfully. Can be restored within 14 days.',
      restorationAvailable: true
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params; // Await the params Promise
    console.log('POST request received');
    console.log('ChatId from params:', chatId);
    
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageData = await request.json();
    console.log('Adding message to chat:', chatId, 'Message data:', messageData);
    console.log('Database connected:', !!mongoose.connection.db);
    
    // Test direct database connection
    const db = mongoose.connection.db;
    if (!db) {
      console.log('Database not connected');
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    // Check if chat exists first
    const existingChat = await db.collection('chats').findOne({ id: chatId });
    console.log('Chat exists:', !!existingChat);
    
    if (!existingChat) {
      console.log('Chat not found:', chatId);
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    const chat = await addMessageToChat(chatId, messageData);
    console.log('Chat after adding message:', chat);
    
    if (!chat) {
      console.log('Chat not found after adding message');
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify the user owns this chat OR is a participant
    const isOwner = chat.userId === session.user.id;
    const isParticipant = chat.participants?.some((p: any) => p.id === session.user.id);
    
    if (!isOwner && !isParticipant) {
      console.log('User not authorized for POST - not owner or participant');
      console.log('Chat owner:', chat.userId);
      console.log('Current user:', session.user.id);
      console.log('Participants:', chat.participants);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}
