import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Group from '@/models/Group';
import Project from '@/models/Project';
import MentorAssignment from '@/models/MentorAssignment';
import mongoose from 'mongoose';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        // Public access allowed - no session check required

        const { id } = await params;
        const groupId = id;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json({ error: "Invalid Group ID format" }, { status: 400 });
        }

        // Removed strict auth checks to allow public viewing of group portfolios

        // Fetch Group Details
        const group = await Group.findById(groupId)
            .populate('lead', 'fullName email photo')
            .populate('studentIds', 'fullName email photo')
            .exec();

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Fetch Associated Project
        // We try to find project linked via MentorAssignment first
        let project = null;

        // Find assignment to get projectId if available
        const assignment = await MentorAssignment.findOne({
            groupId: groupId,
            status: 'active'
        });

        if (assignment?.projectId) {
            project = await Project.findById(assignment.projectId)
                .populate('author', 'fullName photo')
                .exec();
        }

        // If no project linked in assignment, try to find by group lead
        if (!project && group.lead) {
            project = await Project.findOne({
                'group.lead.email': group.lead.email,
                registrationType: 'group'
            }).populate('author', 'fullName photo').exec();
        }

        // Construct response
        const groupData = {
            id: group._id,
            name: group.name,
            description: group.description,
            lead: group.lead,
            members: group.studentIds || [], // Using studentIds as primary members list
            createdAt: group.createdAt,
        };

        return NextResponse.json({
            group: groupData,
            project: project ? {
                id: project._id,
                title: project.title,
                description: project.description,
                status: project.projectStatus,
                repoUrl: project.githubUrl,
                liveUrl: project.liveUrl,
                tags: project.tags,
                images: project.images, // Add images
                proposalFile: project.proposalFile, // Add proposal file
                createdAt: project.createdAt,
                comments: project.comments, // Include comments for discussion view
                group: project.group // Include group structure from project if available
            } : null
        });

    } catch (error) {
        console.error('Group API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
