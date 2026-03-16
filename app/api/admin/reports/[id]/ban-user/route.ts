
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report from '@/models/Report';
import User from '@/models/User';
import { createNotificationRecord } from '@/models/Notification';
import { getToken } from 'next-auth/jwt';

async function checkSuperAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'super-admin' || user.role === 'super-admin';
}

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        // Verify super-admin role
        if (!await checkSuperAdmin(req)) {
            return NextResponse.json({
                error: 'Unauthorized. Only super-admins can ban users.'
            }, { status: 403 });
        }

        // 1. Params Fix: Next.js 15+ async params
        const params = await props.params;
        const { id: reportId } = params;

        // 2. Strict Validation
        const body = await req.json();
        const { banType, reason } = body;

        if (!banType || !['SOFT_BAN', 'PROPER_BAN'].includes(banType)) {
            return NextResponse.json({
                error: 'Invalid ban type. Must be SOFT_BAN or PROPER_BAN'
            }, { status: 400 });
        }

        if (!reason || typeof reason !== 'string' || reason.trim() === '') {
            return NextResponse.json({
                error: 'Ban reason is required'
            }, { status: 400 });
        }

        // Step 1: Find the Report by id
        const report = await Report.findById(reportId);
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Step 2: Extract reportedUserId
        const { reportedUserId } = report;

        // Fix: Check if reportedUserId is a valid ObjectId
        // This prevents "Cast to ObjectId failed" crashes when reportedUserId is "unknown" or invalid
        const mongoose = require('mongoose');
        if (!reportedUserId || !mongoose.Types.ObjectId.isValid(reportedUserId)) {
            return NextResponse.json({
                error: 'Cannot ban user. The reported user ID is missing or invalid (likely an anonymous or deleted user).'
            }, { status: 400 });
        }

        // Get current admin info for audit trail
        const token = await getToken({ req: req as any });
        const adminId = token?.sub || 'system';

        // Step 3: Update the User document
        // We do this manually to ensure atomic update of all fields as requested
        const userUpdateIds = {
            account_status: banType,
            isBlocked: true,
            banReason: reason,
            bannedBy: adminId,
            // Only set ban_timestamp for PROPER_BAN if needed, or always update it to now
            ban_timestamp: new Date()
        };

        const updatedUser = await User.findByIdAndUpdate(
            reportedUserId,
            userUpdateIds,
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Step 4: Update the Report document
        // status = RESOLVED, action_taken = banType
        await Report.findByIdAndUpdate(
            reportId,
            {
                status: 'RESOLVED',
                action_taken: banType,
                handledBy: adminId,
                resolvedBy: adminId,
                resolvedAt: new Date(),
                resolutionNotes: `User banned: ${banType}. Reason: ${reason}`
            }
        );

        // Safe Notifications
        try {
            const notificationType = banType === 'SOFT_BAN' ? 'ADMIN_WARNING' : 'BAN_WARNING';
            const notificationMessage = banType === 'SOFT_BAN'
                ? 'Your account has been suspended indefinitely. Please contact administration.'
                : 'CRITICAL WARNING: Your account has been permanently banned due to severe violations.';

            const priority = banType === 'SOFT_BAN' ? 'MEDIUM' : 'HIGH';

            await createNotificationRecord({
                recipientId: reportedUserId,
                senderId: adminId,
                type: notificationType,
                priority: priority,
                isRead: false,
                metadata: {
                    reason: reason,
                    reportId: reportId,
                    banType: banType,
                    message: notificationMessage
                }
            } as any);

        } catch (notificationError) {
            // Log but do not crash
            console.error('NOTIFICATION_ERROR: Failed to send ban notification', notificationError);
        }

        return NextResponse.json({
            success: true,
            message: `User ${banType === 'SOFT_BAN' ? 'soft banned' : 'proper banned'} successfully`,
            user: {
                id: updatedUser._id,
                account_status: updatedUser.account_status
            }
        });

    } catch (error) {
        // Detailed Error Logging
        console.error("BAN_USER_ERROR Details:", error);

        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
