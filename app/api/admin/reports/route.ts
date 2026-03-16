import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report from '@/models/Report';
import User from '@/models/User';
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
        const reports = await Report.find({}).sort({ createdAt: -1 });

        console.log('📊 Admin Reports API - Total reports:', reports.length);

        // Populate targetDetails with actual data
        const Project = require('@/models/Project').default;

        for (const report of reports) {
            try {
                if (report.targetType === 'project') {
                    const project = await Project.findById(report.targetId);
                    if (project) {
                        // Get author information
                        const author = await User.findById(project.author);

                        report.targetDetails = {
                            ...report.targetDetails,
                            title: project.title || 'Untitled Project',
                            description: project.description || '',
                            content: project.description || '',
                            authorName: author?.fullName || author?.name || 'Unknown Author',
                            projectType: project.projectType || 'Unknown',
                            projectStatus: project.status || 'Unknown'
                        };
                    }
                } else if (report.targetType === 'comment') {
                    // Find project containing the comment
                    const project = await Project.findOne({
                        "comments.id": report.targetId
                    });

                    if (project) {
                        const comment = project.comments.find((c: any) => c.id === report.targetId);
                        report.targetDetails = {
                            ...report.targetDetails,
                            title: `Comment on "${project.title}"`,
                            content: comment?.text || report.targetDetails?.content || 'Comment content',
                            authorName: comment?.userName || 'Unknown Author',
                            parentId: project._id,
                            parentTitle: project.title,
                            projectType: project.projectType || 'Unknown'
                        };
                    } else {
                        report.targetDetails = {
                            ...report.targetDetails,
                            content: report.targetDetails?.content || 'Comment not found',
                            authorName: 'Unknown'
                        };
                    }
                } else if (report.targetType === 'user') {
                    const targetUser = await User.findById(report.targetId);
                    report.targetDetails = {
                        ...report.targetDetails,
                        authorName: targetUser?.fullName || 'Unknown User',
                        content: `User profile: ${targetUser?.email || 'N/A'}`
                    };
                }
            } catch (populateError) {
                console.warn(`Failed to populate details for report ${report._id}:`, populateError);
                // Continue with existing targetDetails if population fails
            }
        }

        console.log('✅ Reports populated with target details');

        return NextResponse.json(reports);
    } catch (error) {
        console.error('❌ Error fetching reports:', error);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
