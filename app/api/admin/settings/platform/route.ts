import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import SystemSettings from '@/models/SystemSettings';
import AdminActivityLog from '@/models/AdminActivityLog';

import { requireSuperAdmin } from '@/lib/admin-auth';

// Refactored to use centralized auth helper

export async function GET(req: NextRequest) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    await connectDB();
    const settings = await (SystemSettings as any).getInstance();
    return NextResponse.json(settings.platform);
}

export async function PUT(req: NextRequest) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        await connectDB();
        const updates = await req.json();
        const settings = await (SystemSettings as any).getInstance();

        // Careful update to only affect platform settings
        settings.platform = { ...settings.platform, ...updates };
        settings.updatedBy = auth.user.id;
        await settings.save();

        // Audit Log
        await AdminActivityLog.create({
            adminId: auth.user.id,
            adminName: auth.user.name || auth.user.fullName || 'Admin',
            adminEmail: auth.user.email,
            action: 'UPDATE_PLATFORM_SETTINGS',
            actionType: 'system_setting',
            targetType: 'system',
            targetId: settings._id,
            description: `Updated platform settings: ${JSON.stringify(updates)}`
        });

        return NextResponse.json(settings.platform);
    } catch (error) {
        console.error('Platform settings error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
