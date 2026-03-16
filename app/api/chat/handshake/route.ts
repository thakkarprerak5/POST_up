// app/api/chat/handshake/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import { findUserById } from '@/models/User';
import { findChatByParticipants, hasProjectInitMessage, addMessageToChat, createChat } from '@/models/Chat';
import mongoose from 'mongoose';

/**
 * Smart Handshake API for Mentor-Student Chat
 * 
 * This endpoint implements the 3-step check:
 * 1. Unique Room Discovery - Find or create conversation between student and mentor
 * 2. Duplicate Message Prevention - Check if PROJECT_INIT already sent for this project
 * 3. Automatic Project Introduction - Send project details if needed
 */
export async function POST(request: NextRequest) {
    try {
        console.log('🤝 Smart Handshake: Starting...');

        // Authenticate user
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            console.log('❌ Handshake: Unauthorized - No session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const studentId = session.user.id;
        console.log('👤 Handshake: Student ID:', studentId);

        // Connect to database
        await connectDB();

        // Wait for connection
        let retries = 0;
        while (mongoose.connection.readyState !== 1 && retries < 5) {
            console.log('🔍 Handshake: Waiting for DB connection...');
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (mongoose.connection.readyState !== 1) {
            console.log('❌ Handshake: Database not connected');
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Parse request body
        const body = await request.json();
        const { mentorId, projectId, projectData } = body;

        console.log('📋 Handshake: Request data:', { mentorId, projectId, hasProjectData: !!projectData });

        // Validate input
        if (!mentorId) {
            console.log('❌ Handshake: Missing mentorId');
            return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
        }

        // Fetch user details for both participants
        const student = await findUserById(studentId);
        const mentor = await findUserById(mentorId);

        if (!student || !mentor) {
            console.log('❌ Handshake: User not found', { student: !!student, mentor: !!mentor });
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log('✅ Handshake: Users found', {
            student: student.fullName,
            mentor: mentor.fullName
        });

        // STEP 1: Unique Room Discovery
        console.log('🔍 Step 1: Searching for existing chat...');
        let chat = await findChatByParticipants([studentId, mentorId]);

        let isNewRoom = false;
        let chatId: string;

        if (chat) {
            chatId = chat.id;
            console.log('✅ Step 1: Found existing chat:', chatId);
        } else {
            // Create new chat
            console.log('📝 Step 1: Creating new chat...');
            isNewRoom = true;

            const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const chatData = {
                id: newChatId,
                userId: studentId,
                name: mentor.fullName,
                avatar: mentor.photo || '/placeholder-user.jpg',
                isGroup: false,
                participants: [
                    {
                        id: studentId,
                        name: student.fullName,
                        avatar: student.photo || '/placeholder-user.jpg'
                    },
                    {
                        id: mentorId,
                        name: mentor.fullName,
                        avatar: mentor.photo || '/placeholder-user.jpg'
                    }
                ],
                lastMessage: '',
                lastMessageTime: new Date(),
                unreadCount: 0,
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const newChat = await createChat(chatData);
            chatId = newChatId;
            console.log('✅ Step 1: Created new chat:', chatId);
        }

        // STEP 2 & 3: Duplicate Prevention + Auto Introduction
        let projectIntroSent = false;

        if (projectId && projectData) {
            console.log('🔍 Step 2: Checking for existing PROJECT_INIT message...');

            const alreadySent = await hasProjectInitMessage(chatId, projectId);

            if (alreadySent) {
                console.log('⏭️ Step 2: PROJECT_INIT already exists, skipping');
            } else {
                console.log('📤 Step 3: Sending PROJECT_INIT message...');

                // Create project introduction message
                const projectIntroMessage = {
                    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    senderId: studentId,
                    senderName: student.fullName,
                    senderAvatar: student.photo || '/placeholder-user.jpg',
                    content: `📋 New Project Introduction: ${projectData.title}`,
                    timestamp: new Date(),
                    metadata: {
                        type: 'PROJECT_INIT' as const,
                        projectId: projectId,
                        projectTitle: projectData.title,
                        projectDescription: projectData.description,
                        techStack: projectData.techStack || [],
                        proposalUrl: projectData.proposalUrl
                    }
                };

                await addMessageToChat(chatId, projectIntroMessage);
                projectIntroSent = true;
                console.log('✅ Step 3: PROJECT_INIT message sent');
            }
        } else {
            console.log('⏭️ Steps 2-3: No project data provided, skipping PROJECT_INIT');
        }

        // Return success response
        console.log('🎉 Handshake complete:', {
            chatId,
            isNewRoom,
            projectIntroSent
        });

        return NextResponse.json({
            success: true,
            chatId,
            isNewRoom,
            projectIntroSent
        });

    } catch (error: any) {
        console.error('❌ Handshake error:', error);
        return NextResponse.json({
            error: 'Failed to complete handshake',
            details: error.message
        }, { status: 500 });
    }
}
