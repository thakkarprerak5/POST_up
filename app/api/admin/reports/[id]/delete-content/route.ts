import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report, { updateReportAction } from '@/models/Report';
import Project from '@/models/Project';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { getToken } from 'next-auth/jwt';

async function checkSuperAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'super-admin' || user.role === 'super-admin';
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify super-admin role
        if (!await checkSuperAdmin(req)) {
            return NextResponse.json({
                error: 'Unauthorized. Only super-admins can delete content.'
            }, { status: 403 });
        }

        // Next.js 15+: params is now a Promise and must be awaited
        const { id: reportId } = await params;
        await connectDB();

        // Get the report
        const report = await Report.findById(reportId);
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const { targetType, targetId } = report;

        // Perform hard delete based on target type
        let deletedContent = null;
        let cascadeDeleted = { comments: 0, likes: 0, other: 0 };

        switch (targetType) {
            case 'project':
                // Delete the project
                deletedContent = await Project.findByIdAndDelete(targetId);

                if (deletedContent) {
                    // Cascade delete: comments on this project
                    const commentResult = await Comment.deleteMany({ projectId: targetId });
                    cascadeDeleted.comments = commentResult.deletedCount || 0;
                }
                break;

            case 'post':
                // Delete the post
                const PostModel = Post;
                deletedContent = await PostModel.findByIdAndDelete(targetId);

                if (deletedContent) {
                    // Cascade delete: comments on this post
                    const commentResult = await Comment.deleteMany({ postId: targetId });
                    cascadeDeleted.comments = commentResult.deletedCount || 0;
                }
                break;

            case 'comment':
                // Delete the comment
                deletedContent = await Comment.findByIdAndDelete(targetId);
                break;

            case 'user':
                return NextResponse.json({
                    error: 'User deletion should be done through ban enforcement system'
                }, { status: 400 });

            default:
                return NextResponse.json({
                    error: 'Invalid target type'
                }, { status: 400 });
        }

        if (!deletedContent) {
            return NextResponse.json({
                error: 'Content not found or already deleted'
            }, { status: 404 });
        }

        // Update report with action taken
        const token = await getToken({ req: req as any });
        const adminId = token?.sub || '';

        await updateReportAction(reportId, 'CONTENT_DELETED', adminId);

        return NextResponse.json({
            success: true,
            message: 'Content permanently deleted',
            deleted: {
                type: targetType,
                id: targetId,
                cascadeDeleted
            }
        });

    } catch (error) {
        console.error('Error deleting content:', error);
        return NextResponse.json({
            error: 'Failed to delete content'
        }, { status: 500 });
    }
}
