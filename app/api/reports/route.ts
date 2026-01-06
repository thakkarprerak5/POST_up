import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createReport, getReports, getReportsCount } from '@/models/Report';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is allowed to report (not admin or super admin)
    if (user.type === 'admin' || user.type === 'super_admin') {
      return NextResponse.json({ error: 'Admins and Super Admins cannot report content' }, { status: 403 });
    }

    const body = await request.json();
    const { targetType, targetId, reason, description, reportedUserId } = body;

    if (!targetType || !targetId || !reason || !description || !reportedUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate target type
    const validTypes = ['user', 'project', 'comment', 'chat'];
    if (!validTypes.includes(targetType)) {
      return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
    }

    // Validate reason
    const validReasons = ['spam', 'inappropriate_content', 'harassment', 'copyright_violation', 'fake_account', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    // Check for duplicate report
    const existingReports = await getReports({
      reporterId: session.user.id,
      targetType,
      targetId
    });

    if (existingReports.length > 0) {
      return NextResponse.json({ error: 'You have already reported this content' }, { status: 409 });
    }

    // Get target details based on type
    let targetDetails = {};
    try {
      switch (targetType) {
        case 'project':
          const Project = require('@/models/Project').default;
          const project = await Project.findById(targetId);
          if (project) {
            targetDetails = {
              title: project.title,
              description: project.description,
              authorName: project.authorName
            };
          }
          break;
        case 'comment':
          // Get comment details - implementation depends on your comment structure
          targetDetails = {
            content: description // Use description as content for now
          };
          break;
        case 'user':
          const reportedUser = await User.findById(reportedUserId);
          if (reportedUser) {
            targetDetails = {
              authorName: reportedUser.fullName,
              title: reportedUser.fullName
            };
          }
          break;
        case 'chat':
          // Get chat message details - implementation depends on your chat structure
          targetDetails = {
            content: description
          };
          break;
      }
    } catch (error) {
      console.error('Error fetching target details:', error);
    }

    const reportData = {
      reporterId: session.user.id,
      reporterName: user.fullName,
      reporterEmail: user.email,
      reportedUserId,
      targetType,
      targetId,
      targetDetails,
      reason,
      description,
      status: 'pending' as const,
      priority: 'medium' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const report = await createReport(reportData);

    return NextResponse.json({ 
      success: true, 
      report: {
        id: report._id,
        status: report.status,
        createdAt: report.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/reports - Get reports for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is allowed to report (not admin or super admin)
    if (user.type === 'admin' || user.type === 'super_admin') {
      return NextResponse.json({ error: 'Admins and Super Admins cannot access reports' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined;

    const reports = await getReports({
      reporterId: session.user.id,
      status,
      page,
      limit
    });

    const totalCount = await getReportsCount({
      reporterId: session.user.id,
      status
    });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
