import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import Notification, {
    getNotificationsByRecipient,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotificationById,
    getUnreadCount,
    hasHighPriorityUnread,
} from '@/models/Notification';

// GET: Fetch notifications for the current user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const isReadParam = searchParams.get('isRead');
        const priority = searchParams.get('priority') as any;
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = parseInt(searchParams.get('skip') || '0');

        const userId = (session.user as any).id || (session.user as any)._id;

        const options: any = { limit, skip };
        if (isReadParam === 'true') {
            options.isRead = true;
        } else if (isReadParam === 'false') {
            options.isRead = false;
        }

        if (priority && priority !== 'undefined' && priority !== 'null') {
            options.priority = priority;
        }

        const notifications = await getNotificationsByRecipient(userId, options);
        const unreadCount = await getUnreadCount(userId);
        const hasHighPriority = await hasHighPriorityUnread(userId);

        // File logging for debug
        try {
            const { logDebug } = require('@/lib/debug-logger');
            logDebug('FETCH_NOTIFICATIONS', {
                userId,
                sessionUser: session.user,
                count: notifications.length,
                unreadCount
            });
        } catch (e) { console.error('Log error', e); }

        return NextResponse.json({
            notifications,
            unreadCount,
            hasHighPriority,
        });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// PATCH: Mark notification(s) as read
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const userId = (session.user as any).id || (session.user as any)._id;
        const body = await request.json();
        const { notificationId, markAllRead } = body;

        if (markAllRead) {
            await markAllAsRead(userId);
            return NextResponse.json({ success: true, message: 'All notifications marked as read' });
        }

        if (!notificationId) {
            return NextResponse.json(
                { error: 'notificationId is required' },
                { status: 400 }
            );
        }

        const notification = await markNotificationAsRead(notificationId, userId);
        return NextResponse.json({ success: true, notification });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to mark notification as read' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a notification
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const userId = (session.user as any).id || (session.user as any)._id;
        const { searchParams } = new URL(request.url);
        const notificationId = searchParams.get('id');

        if (!notificationId) {
            return NextResponse.json(
                { error: 'Notification ID is required' },
                { status: 400 }
            );
        }

        await deleteNotificationById(notificationId, userId);
        return NextResponse.json({ success: true, message: 'Notification deleted' });
    } catch (error: any) {
        console.error('Error deleting notification:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete notification' },
            { status: 500 }
        );
    }
}
