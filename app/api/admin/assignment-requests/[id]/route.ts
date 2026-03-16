import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import AdminAssignmentRequest from '@/models/AdminAssignmentRequest';
import MentorAssignment from '@/models/MentorAssignment';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';
import { notifyProjectApproved, notifyProjectRejected } from '@/lib/notifications';

// PATCH /api/admin/assignment-requests/[id] - Update request and assign mentor
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await User.findOne({ email: session.user.email }).exec();

        if (!currentUser || (currentUser.type !== 'admin' && currentUser.type !== 'super-admin')) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { id } = await params; // FIX: Await params for Next.js 15+
        const body = await request.json();
        const { mentorId, status, notes } = body;

        // Validate request ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
        }

        // Find the assignment request
        const assignmentRequest = await AdminAssignmentRequest.findById(id);

        if (!assignmentRequest) {
            return NextResponse.json({ error: 'Assignment request not found' }, { status: 404 });
        }

        // If assigning a mentor
        if (mentorId) {
            // Validate mentor exists and is actually a mentor
            const mentor = await User.findById(mentorId);

            if (!mentor || mentor.type !== 'mentor') {
                return NextResponse.json({ error: 'Invalid mentor ID' }, { status: 400 });
            }

            // NEW LIFECYCLE: Use assignMentorToRequest which activates the project
            const result = await AdminAssignmentRequest.assignMentorToRequest(
                id,
                mentorId,
                currentUser._id.toString()
            );

            console.log(`✅ Mentor ${mentor.fullName} assigned to request ${id} - Project ACTIVATED`);

            // Notify student about project approval
            try {
                // Fetch request again to get populated student details if not available in result
                const updatedRequest = await AdminAssignmentRequest.findById(id).populate('studentId');

                await notifyProjectApproved({
                    recipientId: updatedRequest.studentId._id
                        ? updatedRequest.studentId._id.toString()
                        : updatedRequest.studentId.toString(),
                    projectId: updatedRequest.projectId.toString(),
                    projectTitle: updatedRequest.projectTitle || 'Project',
                });
            } catch (notifyError) {
                console.error('❌ Failed to send approval notification:', notifyError);
            }

            return NextResponse.json({
                success: true,
                message: 'Mentor assigned successfully - Project activated',
                request: result
            });
        }

        // If just updating status
        if (status) {
            if (!['pending', 'assigned', 'cancelled'].includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }

            // Use findByIdAndUpdate to avoid validation issues with required fields
            const updateData: any = {
                status: status,
                updatedAt: new Date()
            };

            if (status === 'cancelled') {
                updateData.cancelledAt = new Date();
                updateData.cancelledBy = currentUser._id;
            }

            if (notes) {
                updateData.notes = notes;
            }

            // Update without triggering full validation on required fields
            const updatedRequest = await AdminAssignmentRequest.findByIdAndUpdate(
                id,
                updateData,
                {
                    new: true,
                    runValidators: false // Skip validation for this partial update
                }
            ).populate('requestedBy', 'fullName email photo')
                .populate('studentId', 'fullName email photo')
                .populate('groupId', 'name description studentIds')
                .populate('assignedMentorId', 'fullName email photo expertise')
                .exec();

            console.log(`✅ Request ${id} status updated to ${status}`);

            // Notify about rejection if cancelled
            if (status === 'cancelled') {
                try {
                    await notifyProjectRejected({
                        recipientId: updatedRequest.studentId._id
                            ? updatedRequest.studentId._id.toString()
                            : updatedRequest.studentId.toString(),
                        projectId: updatedRequest.projectId._id
                            ? updatedRequest.projectId._id.toString()
                            : updatedRequest.projectId.toString(),
                        projectTitle: updatedRequest.projectTitle || 'Project',
                        reason: notes || 'Assignment request cancelled',
                    });
                } catch (notifyError) {
                    console.error('❌ Failed to send rejection notification:', notifyError);
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Request status updated successfully',
                request: updatedRequest
            });
        }

        return NextResponse.json({ error: 'No valid update provided' }, { status: 400 });

    } catch (error: any) {
        console.error('❌ Error updating assignment request:', error);
        return NextResponse.json(
            { error: 'Failed to update assignment request', details: error.message },
            { status: 500 }
        );
    }
}

// GET /api/admin/assignment-requests/[id] - Get single request details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await User.findOne({ email: session.user.email }).exec();

        if (!currentUser || (currentUser.type !== 'admin' && currentUser.type !== 'super-admin')) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { id } = await params; // FIX: Await params for Next.js 15+

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
        }

        const assignmentRequest = await AdminAssignmentRequest.findById(id)
            .populate('requestedBy', 'fullName email photo')
            .populate('studentId', 'fullName email photo')
            .populate('groupId', 'name description studentIds')
            .populate('projectId', 'title description proposalFile createdAt')
            .populate('assignedMentorId', 'fullName email photo expertise')
            .lean()
            .exec();

        if (!assignmentRequest) {
            return NextResponse.json({ error: 'Assignment request not found' }, { status: 404 });
        }

        return NextResponse.json({ request: assignmentRequest });

    } catch (error: any) {
        console.error('❌ Error fetching assignment request:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assignment request', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/assignment-requests/[id] - Remove canceled request
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('🔍 DELETE endpoint called for canceled request');

        // Test database connection first
        try {
            await connectDB();
            console.log('✅ Database connection successful');
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError);
            return NextResponse.json({
                error: 'Database connection failed',
                details: dbError instanceof Error ? dbError.message : 'Unknown error'
            }, { status: 500 });
        }

        // Test model loading
        try {
            const AdminAssignmentRequest = require('@/models/AdminAssignmentRequest').default;
            console.log('✅ Model loaded successfully');
        } catch (modelError) {
            console.error('❌ Model loading failed:', modelError);
            return NextResponse.json({
                error: 'Model loading failed',
                details: modelError instanceof Error ? modelError.message : 'Unknown error'
            }, { status: 500 });
        }

        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await User.findOne({ email: session.user.email }).exec();

        if (!currentUser || (currentUser.type !== 'admin' && currentUser.type !== 'super-admin')) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { id } = await params; // FIX: Await params for Next.js 15+
        const body = await request.json();
        const { removalReason } = body;

        console.log('🔍 Processing delete request:', { id, removalReason });

        // Validate request ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
        }

        // Find the assignment request first
        const assignmentRequest = await AdminAssignmentRequest.findById(id);
        if (!assignmentRequest) {
            console.log('❌ Assignment request not found:', id);
            return NextResponse.json({ error: 'Assignment request not found' }, { status: 404 });
        }

        console.log('📊 Found assignment request:', {
            id: assignmentRequest._id,
            status: assignmentRequest.status,
            title: assignmentRequest.projectTitle
        });

        // Only allow removal of canceled requests
        if (assignmentRequest.status !== 'cancelled') {
            console.log('❌ Assignment request not in cancelled status:', assignmentRequest.status);
            return NextResponse.json({
                error: 'Assignment request must be in cancelled status to be removed',
                currentStatus: assignmentRequest.status
            }, { status: 400 });
        }

        // Update directly using findByIdAndUpdate
        console.log('🔄 Updating request to removed status...');

        let result;
        try {
            result = await AdminAssignmentRequest.findByIdAndUpdate(
                id,
                {
                    status: 'removed',
                    removedBy: currentUser._id.toString(),
                    removedAt: new Date(),
                    removalReason: removalReason || 'Removed by admin',
                    updatedAt: new Date()
                },
                { new: true }
            );
            console.log('✅ findByIdAndUpdate completed');
        } catch (updateError) {
            console.error('❌ findByIdAndUpdate error:', updateError);
            console.error('❌ Error details:', {
                message: updateError.message,
                stack: updateError.stack,
                name: updateError.name
            });
            return NextResponse.json({
                error: 'Database update failed',
                details: updateError.message,
                stack: updateError.stack
            }, { status: 500 });
        }

        if (!result) {
            console.log('❌ Failed to update request');
            return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
        }

        console.log('✅ Request successfully removed:', {
            id: result._id,
            newStatus: result.status,
            removedAt: result.removedAt
        });

        return NextResponse.json({
            success: true,
            message: 'Canceled request removed successfully',
            request: {
                id: result._id,
                status: result.status,
                removedAt: result.removedAt
            }
        });

    } catch (error: any) {
        console.error('❌ Error in DELETE endpoint:', error);
        return NextResponse.json({
            error: 'Failed to remove canceled request',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
