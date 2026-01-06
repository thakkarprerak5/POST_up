import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import Project from '../../../../../models/Project';

// GET route with full project lookup
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== FULL PROJECT LOOKUP HIT ===');
  
  try {
    const { id } = await params;
    console.log('=== COMMENTS API DEBUG ===');
    console.log('Full lookup - ID:', id);
    console.log('ID type:', typeof id);
    
    await connectDB();
    console.log('Database connected successfully');
    
    console.log('Starting project lookup...');
    
    // Find project by _id or custom id
    let project;
    try {
      project = await Project.findById(id);
      console.log('Project found by _id:', !!project);
    } catch (error) {
      console.log('Project.findById failed with invalid ObjectId format:', error instanceof Error ? error.message : 'Unknown error');
      project = null;
    }

    if (!project) {
      console.log('Trying custom id field lookup...');
      // If not found by _id, try to find by custom id field
      try {
        project = await Project.findOne({ id: id });
        console.log('Project found by custom id:', !!project);
      } catch (error) {
        console.log('Project.findOne with string id failed:', error instanceof Error ? error.message : 'Unknown error');
        project = null;
      }
    }

    if (!project) {
      console.log('Trying numeric id lookup...');
      // If still not found, try to convert to number and search
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        console.log('Converted to numeric ID:', numericId);
        try {
          project = await Project.findOne({ id: numericId });
          console.log('Project found by numeric id:', !!project);
        } catch (error) {
          console.log('Project.findOne with numeric id failed:', error instanceof Error ? error.message : 'Unknown error');
          project = null;
        }
      }
    }
    
    if (!project) {
      console.log('Project not found with either _id or custom id');
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    console.log('Project found:', project._id);
    console.log('Project comments count:', project.comments?.length || 0);

    // Return comments array (empty if none exist)
    const commentsToReturn = project.comments || [];
    console.log('Comments to return count:', commentsToReturn.length);
    
    return NextResponse.json({
      success: true,
      comments: commentsToReturn
    });
  } catch (error) {
    console.error('Full lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Full lookup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  
  const { id } = await params;
  console.log('=== POST Comment Request ===');
  console.log('Project ID:', id);
  
  try {
    const body = await request.json();
    console.log('Comment body:', body);
    
    const { text, userId, userName, userAvatar } = body;
    
    if (!text || !userId || !userName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find project by _id or custom id
    let project;
    try {
      project = await Project.findById(id);
    } catch (error) {
      project = null;
    }

    if (!project) {
      try {
        project = await Project.findOne({ id: id });
      } catch (error) {
        project = null;
      }
    }

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create new comment
    const newComment = {
      id: new Date().getTime().toString(),
      userId,
      userName,
      userAvatar: userAvatar || '',
      text,
      createdAt: new Date()
    };

    // Add comment to project
    if (!project.comments) {
      project.comments = [];
    }
    project.comments.push(newComment);
    
    await project.save();

    return NextResponse.json({
      success: true,
      comment: newComment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
