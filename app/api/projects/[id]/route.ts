import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project, { softDeleteProject } from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * GET /api/projects/[id]
 * Fetch a single project by ID - Ultra-reliable version
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure database connection
    await connectDB();

    // Await the params in Next.js 13+ app router
    const { id } = await params;

    console.log('🔍 [PROJECT API] Fetching project with ID:', id);
    console.log('🔍 [PROJECT API] MongoDB connection state:', mongoose.connection.readyState);

    // Validate ObjectId format
    if (!id || typeof id !== 'string') {
      console.log('❌ [PROJECT API] Invalid ID format:', id);
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ [PROJECT API] Invalid ObjectId:', id);
      return Response.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    let project = null;

    // Method 1: Try standard Project model first (with author population)
    try {
      project = await Project.findById(id).populate('author').exec();
      console.log('📊 [PROJECT API] Method 1 - Project.findById result:', project ? 'Found' : 'Not found');
      if (project) {
        console.log('📝 Populated author type:', typeof project.author);
        console.log('📝 Populated author constructor:', project.author?.constructor?.name);
        console.log('📝 Populated author is mongoose doc:', project.author instanceof mongoose.Document);
        console.log('📝 Populated author keys:', Object.keys(project.author || {}));
        console.log('📝 Populated author _id:', project.author?._id);
        console.log('📝 Populated author id:', project.author?.id);
        console.log('📝 Populated author email:', project.author?.email);
        console.log('📝 Populated author name:', project.author?.name);

        // If author population failed, try to fetch manually
        if (!project.author || !project.author._id) {
          console.log('⚠️ Author population failed, trying manual fetch...');
          try {
            const User = require('@/models/User').default;
            const author = await User.findById(project.author);
            if (author) {
              project.author = author;
              console.log('✅ Manual author fetch successful:', author.email);
            }
          } catch (fetchError) {
            console.log('❌ Manual author fetch failed:', fetchError.message);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ [PROJECT API] Method 1 failed:', error.message);
    }

    // Method 2: If not found, try direct collection access (bypass 3-step gate filtering)
    if (!project) {
      try {
        const db = mongoose.connection.db;
        if (db) {
          const projectsCollection = db.collection('projects');
          project = await projectsCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });
          console.log('📊 [PROJECT API] Method 2 - Direct collection result:', project ? 'Found' : 'Not found');
        }
      } catch (error) {
        console.log('⚠️ [PROJECT API] Method 2 failed:', error.message);
      }
    }

    // Method 3: Try with string ID (for compatibility)
    if (!project) {
      try {
        const db = mongoose.connection.db;
        if (db) {
          const projectsCollection = db.collection('projects');
          project = await projectsCollection.findOne({ _id: id });
          console.log('📊 [PROJECT API] Method 3 - String ID result:', project ? 'Found' : 'Not found');
        }
      } catch (error) {
        console.log('⚠️ [PROJECT API] Method 3 failed:', error.message);
      }
    }

    if (!project) {
      console.log('❌ [PROJECT API] Project not found with ID:', id);

      // List some available projects for debugging
      try {
        const db = mongoose.connection.db;
        if (db) {
          const projectsCollection = db.collection('projects');
          const sampleProjects = await projectsCollection.find({}).limit(3).toArray();
          console.log('🔍 [PROJECT API] Sample available projects:');
          sampleProjects.forEach((p, i) => {
            console.log(`  ${i + 1}. ID: ${p._id}, Title: ${p.title}`);
          });
        }
      } catch (error) {
        console.log('⚠️ [PROJECT API] Could not list sample projects:', error.message);
      }

      return Response.json({
        error: 'Project not found',
        requestedId: id,
        debug: 'Project not found in database'
      }, { status: 404 });
    }

    // Check if project is soft deleted
    if (project.isDeleted) {
      console.log('🗑️ [PROJECT API] Project is soft deleted, checking permissions...');

      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      const user = await User.findOne({ email: session.user.email }).exec();
      const authorId = project.author?.id || project.author?._id || project.author;

      const isAdmin = user?.role === 'admin' || user?.type === 'admin' || user?.role === 'super-admin' || user?.type === 'super-admin';

      if (!user || (authorId !== user._id.toString() && !isAdmin)) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      // Return deleted project for owner
      return Response.json({
        ...project,
        isDeleted: true,
        deletedAt: project.deletedAt,
        restoreAvailableUntil: project.restoreAvailableUntil
      });
    }

    // Fetch author data
    const authorId = project.author?.id || project.author?._id || project.author;
    if (authorId) {
      try {
        const authorData = await User.findById(authorId).exec();
        if (authorData) {
          // Update project with current author data
          project.author = {
            id: authorData._id.toString(),
            _id: authorData._id.toString(),
            name: authorData.name || authorData.fullName || 'Unknown Author',
            email: authorData.email || '',
            image: authorData.photo && authorData.photo !== '/placeholder-user.jpg' ? authorData.photo : null,
            avatar: authorData.photo && authorData.photo !== '/placeholder-user.jpg' ? authorData.photo : null
          };
        } else {
          console.log('⚠️ [PROJECT API] Author not found:', authorId);
          project.author = {
            id: authorId.toString(),
            _id: authorId.toString(),
            name: 'Unknown Author',
            email: '',
            image: null,
            avatar: null
          };
        }
      } catch (error) {
        console.log('⚠️ [PROJECT API] Error fetching author data:', error.message);
      }
    }

    // Check like status if user is authenticated
    let likedByUser = false;
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      try {
        const user = await User.findOne({ email: session.user.email }).exec();
        if (user) {
          const userIdStr = user._id.toString();
          const likesArray = Array.isArray(project.likes) ? project.likes : [];
          likedByUser = likesArray.some(likeId => likeId.toString() === userIdStr);
        }
      } catch (error) {
        console.log('⚠️ [PROJECT API] Error checking like status:', error.message);
      }
    }

    console.log('✅ [PROJECT API] Successfully returned project:', project.title);

    return Response.json({
      ...project,
      likedByUser
    });

  } catch (error: any) {
    console.error('❌ [PROJECT API] Critical error:', error);
    console.error('❌ [PROJECT API] Error stack:', error.stack);
    return Response.json({
      error: error.message || 'Failed to fetch project',
      details: error.stack,
      debug: 'Critical API error'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]
 * Update project (only author can update)
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const project = await Project.findById(id).exec();

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email }).exec();

    // Handle different author field structures (same as DELETE route)
    let authorId: string;
    if (project.author instanceof mongoose.Types.ObjectId) {
      authorId = project.author.toString();
    } else if (typeof project.author === 'object' && project.author !== null) {
      let rawAuthorId = project.author._id;
      if (!rawAuthorId && project.author.id && project.author.id !== 'no-id' && project.author.id !== 'id-missing') {
        rawAuthorId = project.author.id;
      }

      // FALLBACK: Query by email if _id is missing
      if (!rawAuthorId && project.author.email) {
        const authorUser = await User.findOne({ email: project.author.email }).exec();
        if (authorUser) {
          rawAuthorId = authorUser._id;
        }
      }

      // ADDITIONAL FALLBACK: Try by name
      if (!rawAuthorId && (project.author.name || project.author.fullName)) {
        const nameToMatch = project.author.name || project.author.fullName;
        const authorUser = await User.findOne({
          $or: [{ name: nameToMatch }, { fullName: nameToMatch }]
        }).exec();
        if (authorUser) {
          rawAuthorId = authorUser._id;
        }
      }

      authorId = rawAuthorId?.toString ? rawAuthorId.toString() : String(rawAuthorId || project.author);
    } else {
      authorId = String(project.author);
    }

    if (!user || authorId !== user._id.toString()) {
      return Response.json({ error: 'Not authorized to update this project' }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get('title')?.toString() || '';
    const description = formData.get('description')?.toString() || '';
    const githubUrl = formData.get('githubUrl')?.toString() || '';
    const liveUrl = formData.get('liveUrl')?.toString() || '';
    const tags = (formData.get('tags')?.toString() || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    // Handle image uploads
    const images: string[] = [...(project.images || [])];
    const files = formData.getAll('images') as File[];
    if (files && files.length) {
      const { mkdir, writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const { v4: uuidv4 } = await import('uuid');

      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'png';
        const filename = `${uuidv4()}.${ext}`;
        const filePath = join(uploadsDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);
        images.push(`/uploads/${filename}`);
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title,
        description,
        tags,
        images,
        githubUrl,
        liveUrl,
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();

    return Response.json(updatedProject);
  } catch (error: any) {
    console.error('PATCH /api/projects/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Soft delete project (only author can delete)
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('🗑️ Starting project deletion...');

    const session = await getServerSession(authOptions);
    console.log('🔑 Session in DELETE:', session?.user?.email ? 'Found' : 'Not found');
    console.log('🔑 Session email:', session?.user?.email);

    if (!session?.user?.email) {
      console.log('❌ No session found - returning 401');
      return Response.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    console.log('🔍 Looking for project with ID:', id);

    const project = await Project.findById(id).exec();

    if (!project) {
      console.log('❌ Project not found');
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('✅ Project found, checking authorization...');
    console.log('📝 Raw project.author:', project.author);
    console.log('📝 project.author type:', typeof project.author);
    console.log('📝 is ObjectId?:', project.author instanceof mongoose.Types.ObjectId);

    // Handle different author field structures
    let authorId: string;
    if (project.author instanceof mongoose.Types.ObjectId) {
      // Direct ObjectId reference (not populated)
      authorId = project.author.toString();
      console.log('📝 Author is direct ObjectId');
    } else if (typeof project.author === 'object' && project.author !== null) {
      // Populated object with _id or id field
      console.log('📝 Author object keys:', Object.keys(project.author));
      console.log('📝 Author._id exists?:', !!project.author._id);
      console.log('📝 Author.id value:', project.author.id);

      // Extract ID - check for real _id first, reject virtual fallbacks
      let rawAuthorId = project.author._id;
      if (!rawAuthorId && project.author.id && project.author.id !== 'no-id' && project.author.id !== 'id-missing') {
        rawAuthorId = project.author.id;
      }

      // FALLBACK: If still no ID but we have an email, query the User collection
      // This handles legacy projects where author was embedded incorrectly
      if (!rawAuthorId && project.author.email) {
        console.log('📝 No _id found, querying User by email:', project.author.email);
        try {
          const authorUser = await User.findOne({ email: project.author.email }).exec();
          if (authorUser) {
            rawAuthorId = authorUser._id;
            console.log('✅ Found author by email, ID:', rawAuthorId.toString());
          } else {
            console.error('❌ Could not find user with email:', project.author.email);
          }
        } catch (emailLookupError) {
          console.error('❌ Error looking up user by email:', emailLookupError);
        }
      }

      // ADDITIONAL FALLBACK: Try matching by name if email didn't work
      if (!rawAuthorId && (project.author.name || project.author.fullName)) {
        const nameToMatch = project.author.name || project.author.fullName;
        console.log('📝 Still no _id, trying by name:', nameToMatch);
        try {
          const authorUser = await User.findOne({
            $or: [{ name: nameToMatch }, { fullName: nameToMatch }]
          }).exec();
          if (authorUser) {
            rawAuthorId = authorUser._id;
            console.log('✅ Found author by name, ID:', rawAuthorId.toString());
          } else {
            console.error('❌ Could not find user with name:', nameToMatch);
          }
        } catch (nameLookupError) {
          console.error('❌ Error looking up user by name:', nameLookupError);
        }
      }

      if (rawAuthorId) {
        authorId = rawAuthorId?.toString ? rawAuthorId.toString() : String(rawAuthorId);
        console.log('📝 Author is object with id field');
      } else {
        console.error('❌ Could not extract valid ID from author object');
        console.error('❌ Author data:', { email: project.author.email, name: project.author.name });
        return Response.json({ error: 'Internal error: Invalid author data' }, { status: 500 });
      }
    } else {
      // Fallback
      authorId = String(project.author);
      console.log('📝 Author fallback to string');
    }
    console.log('📝 Project author ID (final):', authorId);

    const user = await User.findOne({ email: session.user.email }).exec();
    console.log('👤 User ID from database:', user?._id?.toString());
    console.log('👤 User email:', user?.email);

    if (!user) {
      console.log('❌ User not found in database');
      return Response.json({ error: 'User not found' }, { status: 403 });
    }

    const userId = user._id?.toString();
    if (!userId) {
      console.log('❌ User ID is undefined or null');
      return Response.json({ error: 'Invalid user ID' }, { status: 403 });
    }

    const isAuthorized = authorId === userId;
    console.log('🔐 Is user authorized?', isAuthorized);
    console.log('🔐 Comparison details:', {
      authorId,
      userId,
      authorIdType: typeof authorId,
      userIdType: typeof userId,
      strictMatch: authorId === userId
    });

    if (!isAuthorized) {
      console.log('❌ User not authorized to delete this project');
      console.log('❌ Details:', {
        projectAuthor: authorId,
        loggedInUser: userId,
        sessionEmail: session.user.email,
        mismatch: authorId !== userId
      });
      return Response.json({ error: 'Not authorized to delete this project' }, { status: 403 });
    }

    // Soft delete the project
    console.log('🗑️ Calling imported softDeleteProject...');
    console.log('🔍 Debug info:', {
      projectId: id,
      userId: userId,
      projectIdType: typeof id,
      userIdType: typeof user._id,
      userExists: !!user,
      projectExists: !!project
    });

    try {
      const deletedProject = await softDeleteProject(id, userId);
      console.log('✅ Project soft deleted successfully:', deletedProject?.title);
      return Response.json({
        message: 'Project deleted successfully. You can restore it within 24 hours.',
        project: deletedProject,
        restoreAvailableUntil: deletedProject?.restoreAvailableUntil
      });
    } catch (deleteError: any) {
      console.error('❌ Error in softDeleteProject:', deleteError);
      console.error('❌ Error details:', {
        message: deleteError?.message,
        stack: deleteError?.stack,
        name: deleteError?.name
      });
      return Response.json({
        error: deleteError?.message || 'Failed to delete project',
        details: {
          message: deleteError?.message || 'Unknown error',
          stack: deleteError?.stack || 'No stack trace',
          name: deleteError?.name || 'Unknown error',
          type: typeof deleteError,
          constructor: deleteError?.constructor?.name || 'Unknown constructor'
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('DELETE /api/projects/[id] error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error keys:', Object.keys(error || {}));
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error',
      toString: error?.toString?.() || 'No toString method'
    });
    return Response.json({
      error: error?.message || 'Failed to delete project',
      details: {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error',
        type: typeof error,
        constructor: error?.constructor?.name || 'Unknown constructor'
      }
    }, { status: 500 });
  }
}
