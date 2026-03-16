import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import AdminActivityLog from '@/models/AdminActivityLog';

import { requireSuperAdmin } from '@/lib/admin-auth';

// Refactored to use centralized auth helper

export async function GET(req: NextRequest) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        await connectDB();

        // Parse pagination and filters
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const adminEmail = searchParams.get('adminEmail');
        const action = searchParams.get('action');

        const query: any = {};
        if (adminEmail) query.adminEmail = { $regex: adminEmail, $options: 'i' };
        if (action && action !== 'all') query.action = action;

        const logs = await AdminActivityLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AdminActivityLog.countDocuments(query);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Audit logs error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
