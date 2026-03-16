import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MentorInvitation from '@/models/MentorInvitation';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

/**
 * Diagnostic endpoint to check invitation data
 * Visit: http://localhost:3000/api/admin/check-invitations
 */
export async function GET() {
    try {
        await connectDB();

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email }).exec();

        // Get all invitations for this mentor
        const invitations = await MentorInvitation.find({
            mentorId: user._id.toString()
        })
            .populate('studentId', 'fullName email photo')
            .populate('projectId', 'title registrationType')
            .populate('groupId', 'name')
            .exec();

        const diagnostics = invitations.map(inv => ({
            invitationId: inv._id.toString(),
            projectTitle: inv.projectTitle,
            status: inv.status,

            // Student info
            hasStudentId: !!inv.studentId,
            studentIdType: typeof inv.studentId,
            studentName: inv.studentId?.fullName || 'N/A',
            studentEmail: inv.studentId?.email || 'N/A',

            // Group info
            hasGroupId: !!inv.groupId,
            hasGroupSnapshot: !!inv.groupSnapshot,
            groupName: inv.groupId?.name || inv.groupSnapshot?.lead?.name || 'N/A',

            // Project info
            hasProjectId: !!inv.projectId,
            projectRegistrationType: inv.projectId?.registrationType || inv.registrationType || 'unknown',

            // Proposal info
            hasMessage: !!inv.message,
            messageLength: inv.message?.length || 0,
            hasProposalFile: !!inv.proposalFile,
            proposalFile: inv.proposalFile || 'N/A',

            // Type detection
            wouldBeDetectedAsGroup: Boolean(
                inv.registrationType === 'group' ||
                inv.groupSnapshot ||
                inv.projectId?.registrationType === 'group' ||
                inv.groupId
            ),

            // Timestamps
            sentAt: inv.sentAt,
            respondedAt: inv.respondedAt || 'N/A',

            // Raw data for debugging
            rawData: {
                registrationType: inv.registrationType,
                studentIdValue: inv.studentId,
                groupIdValue: inv.groupId,
                projectIdValue: inv.projectId
            }
        }));

        const summary = {
            totalInvitations: invitations.length,
            byStatus: {
                pending: invitations.filter(i => i.status === 'pending').length,
                accepted: invitations.filter(i => i.status === 'accepted').length,
                rejected: invitations.filter(i => i.status === 'rejected').length,
                removed: invitations.filter(i => i.status === 'removed').length
            },
            byType: {
                individual: diagnostics.filter(d => !d.wouldBeDetectedAsGroup).length,
                group: diagnostics.filter(d => d.wouldBeDetectedAsGroup).length
            },
            withProposalFile: diagnostics.filter(d => d.hasProposalFile).length,
            withMessage: diagnostics.filter(d => d.hasMessage).length
        };

        return NextResponse.json({
            success: true,
            summary,
            diagnostics,
            mentorInfo: {
                mentorId: user._id.toString(),
                mentorName: user.fullName,
                mentorEmail: user.email
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error: any) {
        console.error('Check invitations error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
