import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';

/**
 * Diagnostic endpoint to check project ownership
 * GET /api/projects/[id]/check-owner
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const session = await getServerSession(authOptions);

        const project = await Project.findById(id).exec();

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const user = session?.user?.email
            ? await User.findOne({ email: session.user.email }).exec()
            : null;

        // Detailed diagnostic info
        const diagnostic = {
            project: {
                id: project._id.toString(),
                title: project.title,
                rawAuthor: project.author,
                authorType: typeof project.author,
                isObjectId: project.author instanceof mongoose.Types.ObjectId,
                authorString: project.author?.toString ? project.author.toString() : String(project.author),
            },
            session: {
                exists: !!session,
                email: session?.user?.email || null,
            },
            user: {
                exists: !!user,
                id: user?._id?.toString() || null,
                email: user?.email || null,
            },
            authorization: {
                projectAuthor: project.author instanceof mongoose.Types.ObjectId
                    ? project.author.toString()
                    : (project.author?._id?.toString() || project.author?.id || String(project.author)),
                currentUserId: user?._id?.toString() || null,
                isOwner: user && project.author ?
                    (project.author instanceof mongoose.Types.ObjectId
                        ? project.author.toString() === user._id.toString()
                        : (project.author._id?.toString() || project.author.id) === user._id.toString())
                    : false,
            }
        };

        return NextResponse.json(diagnostic);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
