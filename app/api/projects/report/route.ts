import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';
import Report from '@/models/Report';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // 1. AUTHENTICATION CHECK
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to report content.'
      }, { status: 401 });
    }

    // 2. GET CURRENT USER
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'User account not found'
      }, { status: 404 });
    }

    // 3. PARSE AND VALIDATE REQUEST BODY
    const body = await request.json();
    const { targetId, targetType, reportedUserId, reason, details } = body;

    // Validate required fields
    if (!targetId) {
      return NextResponse.json({
        success: false,
        error: 'Target ID is required'
      }, { status: 400 });
    }

    if (!targetType) {
      return NextResponse.json({
        success: false,
        error: 'Target type is required (PROJECT, POST, COMMENT, USER, CHAT)'
      }, { status: 400 });
    }

    if (!reportedUserId) {
      return NextResponse.json({
        success: false,
        error: 'Reported user ID is required'
      }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({
        success: false,
        error: 'Report reason is required'
      }, { status: 400 });
    }

    // Validate targetType enum
    const validTargetTypes = ['user', 'project', 'comment', 'chat'];
    if (!validTargetTypes.includes(targetType.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: `Invalid target type. Must be one of: ${validTargetTypes.join(', ')}`
      }, { status: 400 });
    }

    // Validate reason enum
    const validReasons = ['spam', 'inappropriate_content', 'harassment', 'copyright_violation', 'fake_account', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({
        success: false,
        error: `Invalid reason. Must be one of: ${validReasons.join(', ')}`
      }, { status: 400 });
    }

    // 4. CHECK FOR DUPLICATE REPORTS
    const existingReport = await Report.findOne({
      reporterId: currentUser._id.toString(),
      targetId: targetId,
      targetType: targetType.toLowerCase()
    });

    if (existingReport) {
      return NextResponse.json({
        success: false,
        error: 'You have already reported this content'
      }, { status: 400 });
    }

    // 5. FETCH TARGET DETAILS (for context)
    let targetDetails: any = {};

    try {
      if (targetType.toLowerCase() === 'project') {
        const Project = require('@/models/Project').default;
        const project = await Project.findById(targetId);
        if (project) {
          targetDetails = {
            title: project.title,
            description: project.description?.substring(0, 200), // Limit description length
            authorName: project.authorName || 'Unknown Author'
          };
        }
      }
      // Add similar logic for other target types if needed
    } catch (fetchError) {
      console.warn('Failed to fetch target details:', fetchError);
      // Continue without target details - not critical
    }

    // 6. CREATE REPORT
    const report = await Report.create({
      reporterId: currentUser._id.toString(),
      reporterName: currentUser.fullName || currentUser.name || 'Unknown User',
      reporterEmail: currentUser.email,
      reportedUserId: reportedUserId,
      targetType: targetType.toLowerCase(),
      targetId: targetId,
      targetDetails: targetDetails,
      reason: reason,
      description: details?.trim() || `Report for ${reason.replace(/_/g, ' ')}`,
      status: 'PENDING', // UPPERCASE as per schema
      action_taken: 'NONE',
      priority: 'medium',
      metadata: {
        submittedAt: new Date().toISOString(),
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    console.log('✅ Report created successfully:', {
      reportId: report._id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      report: {
        _id: report._id,
        status: report.status,
        createdAt: report.createdAt
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ REPORT_SUBMISSION_ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Return detailed error for debugging
    return NextResponse.json({
      success: false,
      error: 'Failed to submit report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
