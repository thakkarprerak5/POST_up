import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { getUnreadCount } from '@/models/Notification';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const userId = (session.user as any).id || (session.user as any)._id;
        const count = await getUnreadCount(userId);

        return NextResponse.json({ count });
    } catch (error: any) {
        console.error('Error fetching unread count:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch unread count' },
            { status: 500 }
        );
    }
}
