import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report, { updateReportStatus } from '@/models/Report';
import User, { undoBan } from '@/models/User';
import { createNotificationRecord } from '@/models/Notification';
import { getToken } from 'next-auth/jwt';

async function checkAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'admin' || user.type === 'super-admin' ||
        user.role === 'admin' || user.role === 'super-admin';
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, resolutionNotes } = await req.json();

        // Next.js 15+: params is now a Promise and must be awaited
        const { id: reportId } = await params;

        if (!reportId || !action) {
            return NextResponse.json({ error: 'Report ID and action are required' }, { status: 400 });
        }

        await connectDB();

        // Get the report
        const report = await Report.findById(reportId);
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Get current user info
        const token = await getToken({ req: req as any });
        const currentUserId = token?.sub || '';

        let newStatus: 'PENDING' | 'RESOLVED' | 'REJECTED';
        let message = '';

        switch (action) {
            case 'resolve':
                newStatus = 'RESOLVED';
                message = 'Report resolved successfully';

                // CRITICAL: Always attempt to unban the reported user when resolving
                if (!report.reportedUserId) {
                    return NextResponse.json({
                        error: 'Cannot resolve: No reported user ID found in report'
                    }, { status: 400 });
                }

                // Fetch the reported user
                const reportedUser = await User.findById(report.reportedUserId);

                if (!reportedUser) {
                    return NextResponse.json({
                        error: 'Cannot resolve: Reported user not found in database'
                    }, { status: 404 });
                }

                // FORCE UNBAN: Update user status to ACTIVE and clear all ban fields
                const userUpdate = await User.findByIdAndUpdate(
                    report.reportedUserId,
                    {
                        account_status: 'ACTIVE',
                        $unset: {
                            banReason: "",
                            banExpiresAt: "",
                            ban_timestamp: "",
                            banDate: ""
                        }
                    },
                    { new: true }
                );

                if (!userUpdate) {
                    return NextResponse.json({
                        error: 'Failed to unban user. Report not resolved.'
                    }, { status: 500 });
                }

                message += ` User ${reportedUser.fullName || reportedUser.email} has been unbanned.`;

                // Notify the restored user
                await createNotificationRecord({
                    recipientId: report.reportedUserId,
                    senderId: currentUserId,
                    type: 'ACCOUNT_RESTORED',
                    priority: 'HIGH',
                    isRead: false,
                    metadata: {
                        message: 'Your report has been resolved and your account access is restored.',
                        reportId: reportId
                    }
                } as any);

                // Notify the reporter
                await createNotificationRecord({
                    recipientId: report.reporterId,
                    senderId: currentUserId,
                    type: 'REPORT_RESOLVED',
                    priority: 'MEDIUM',
                    isRead: false,
                    metadata: {
                        message: 'The content you reported has been reviewed and the issue is now resolved.',
                        reportId: reportId,
                        targetType: report.targetType,
                        targetId: report.targetId
                    }
                } as any);
                break;

            case 'reject':
                newStatus = 'REJECTED';
                message = 'Report rejected successfully';

                // No action taken against accused user
                // Optionally notify reporter
                await createNotificationRecord({
                    recipientId: report.reporterId,
                    senderId: currentUserId,
                    type: 'REPORT_RESOLVED',
                    priority: 'LOW',
                    isRead: false,
                    metadata: {
                        message: 'Your report has been reviewed. No action was taken.',
                        reportId: reportId,
                        targetType: report.targetType,
                        targetId: report.targetId
                    }
                } as any);
                break;

            default:
                return NextResponse.json({ error: 'Invalid action. Use "resolve" or "reject"' }, { status: 400 });
        }

        // Update the report
        const updatedReport = await updateReportStatus(
            reportId,
            newStatus,
            currentUserId,
            resolutionNotes
        );

        return NextResponse.json({
            success: true,
            message,
            report: updatedReport
        });

    } catch (error) {
        console.error('Error updating report:', error);
        return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: reportId } = await params;

        if (!reportId) {
            return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
        }

        await connectDB();

        const deletedReport = await Report.findByIdAndDelete(reportId);

        if (!deletedReport) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }
}
