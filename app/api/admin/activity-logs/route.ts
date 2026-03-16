import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getActivityLogs, getActivityLogsCount } from '@/models/AdminActivityLog';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

async function checkAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'admin' || user.type === 'super-admin' ||
        user.role === 'admin' || user.role === 'super-admin';
}

export async function GET(req: NextRequest) {
    try {
        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const actionType = searchParams.get('actionType') || undefined;
        const targetType = searchParams.get('targetType') || undefined;
        const adminId = searchParams.get('adminId') || undefined;

        // Fetch logs with filters
        const logs = await getActivityLogs({
            page,
            limit,
            actionType,
            targetType,
            adminId
        });

        const total = await getActivityLogsCount({
            actionType,
            targetType,
            adminId
        });

        // Return consistent JSON object with 'logs' key
        return NextResponse.json({
            logs: logs, // Explicit naming
            total: total,
            page: page,
            limit: limit,
            hasMore: total > page * limit
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
}
