import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { createActivityLog } from '@/models/AdminActivityLog';

async function checkAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return null;
    const user = token as any;
    const isAdmin = user.type === 'admin' || user.type === 'super-admin' ||
        user.role === 'admin' || user.role === 'super-admin';
    return isAdmin ? user : null;
}

// PUT - Update user (role, status, etc.)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const { type, account_status, fullName, email } = body;

        // Build update object
        const updateData: any = {};
        if (type) updateData.type = type;
        if (account_status) updateData.account_status = account_status;
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email;

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Log the action
        await createActivityLog({
            adminId: admin.id || admin._id,
            adminName: admin.fullName || admin.name,
            adminEmail: admin.email,
            action: `Updated user: ${user.fullName}`,
            actionType: type ? 'role_change' : 'update',
            targetType: 'user',
            targetId: id,
            targetName: user.fullName,
            description: `Updated user ${user.email}. Changes: ${JSON.stringify(updateData)}`,
            metadata: { changes: updateData }
        });

        return NextResponse.json({
            message: 'User updated successfully',
            user
        });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({
            error: 'Failed to update user',
            details: error.message
        }, { status: 500 });
    }
}

// DELETE - Ban or soft-delete user
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action') || 'ban'; // 'ban' or 'delete'

        const user = await User.findById(id).select('-password');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (action === 'delete') {
            // Hard delete (use with caution)
            await User.findByIdAndDelete(id);

            await createActivityLog({
                adminId: admin.id || admin._id,
                adminName: admin.fullName || admin.name,
                adminEmail: admin.email,
                action: `Deleted user: ${user.fullName}`,
                actionType: 'delete',
                targetType: 'user',
                targetId: id,
                targetName: user.fullName,
                description: `Permanently deleted user ${user.email}`,
                metadata: { action: 'hard_delete' }
            });

            return NextResponse.json({
                message: 'User deleted successfully'
            });
        } else {
            // Soft ban
            user.account_status = 'PROPER_BANNED';
            await user.save();

            await createActivityLog({
                adminId: admin.id || admin._id,
                adminName: admin.fullName || admin.name,
                adminEmail: admin.email,
                action: `Banned user: ${user.fullName}`,
                actionType: 'block',
                targetType: 'user',
                targetId: id,
                targetName: user.fullName,
                description: `Banned user ${user.email}`,
                metadata: { action: 'ban', status: 'PROPER_BANNED' }
            });

            return NextResponse.json({
                message: 'User banned successfully',
                user
            });
        }
    } catch (error: any) {
        console.error('Error deleting/banning user:', error);
        return NextResponse.json({
            error: 'Failed to process request',
            details: error.message
        }, { status: 500 });
    }
}
