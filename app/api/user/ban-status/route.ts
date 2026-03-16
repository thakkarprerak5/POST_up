import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req: req as any });
        if (!token?.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById(token.sub);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            account_status: user.account_status,
            ban_timestamp: user.ban_timestamp,
            banReason: user.banReason,
            bannedBy: user.bannedBy
        });
    } catch (error) {
        console.error('Error fetching ban status:', error);
        return NextResponse.json({ error: 'Failed to fetch ban status' }, { status: 500 });
    }
}
