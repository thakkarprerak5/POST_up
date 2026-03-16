import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import AdminActivityLog from '@/models/AdminActivityLog';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        await connectDB();
        const { role } = await req.json();
        const { id: targetUserId } = await params;

        // Validation: Role must be valid
        const validRoles = ['student', 'mentor', 'admin', 'super-admin'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Validation: Cannot change own role
        if (targetUserId === auth.user.id) {
            return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const oldRole = targetUser.type;

        // Update role
        targetUser.type = role;
        // Also update 'role' field if it exists in schema to stay consistent, though 'type' is the source of truth
        if ((targetUser as any).role) {
            (targetUser as any).role = role;
        }
        await targetUser.save();

        // Log action
        await AdminActivityLog.create({
            adminId: auth.user.id,
            adminName: auth.user.name || auth.user.fullName || 'Admin',
            adminEmail: auth.user.email,
            action: 'UPDATE_USER_ROLE',
            actionType: 'role_change',
            targetType: 'user',
            targetId: targetUser._id,
            description: `Changed role from ${oldRole} to ${role}`
        });

        return NextResponse.json({
            message: 'Role updated successfully',
            user: { id: targetUser._id, email: targetUser.email, role: targetUser.type }
        });

    } catch (error) {
        console.error('Role update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
