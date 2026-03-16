import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SavedPost } from '@/models/SavedPost';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';
import Project from '@/models/Project';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    console.log('🔍 Saved posts API called');

    // Get user session
    const session = await getServerSession(authOptions);
    console.log('📊 Session:', session?.user?.email ? 'Found' : 'Not found');
    
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    console.log('👤 Current user:', currentUser ? 'Found' : 'Not found');
    
    if (!currentUser) {
      console.log('❌ User not found');
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('📊 Fetching saved posts for user:', currentUser._id);

    // Get saved posts with pagination
    const savedPosts = await SavedPost.find({ userId: currentUser._id })
      .sort({ savedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('projectId')
      .lean();

    console.log('📊 Found saved posts:', savedPosts.length);

    // Get total count
    const total = await SavedPost.countDocuments({ userId: currentUser._id });
    console.log('📊 Total saved posts:', total);

    // Transform the data to match the expected project format
    const projects = await Promise.all(
      savedPosts
        .filter(savedPost => savedPost.projectId) // Filter out null projects
        .map(async (savedPost) => {
          const project = savedPost.projectId as any;
          
          // Fetch author data separately
          let authorData = {
            id: '',
            name: 'Unknown Author',
            username: 'unknown',
            photo: null,
            image: null,
            avatar: null,
            profileImage: null
          };
          
          if (project.authorId) {
            try {
              const author = await User.findById(project.authorId).select('name fullName username photo').lean();
              if (author) {
                const userName = author.fullName || author.name || 'Unknown Author';
                const originalPhoto = author.photo;
                const generatedAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff`;
                const finalPhoto = originalPhoto && originalPhoto !== '/placeholder-user.jpg' 
                  ? originalPhoto 
                  : generatedAvatar;
                
                authorData = {
                  id: author._id.toString(),
                  name: userName,
                  username: author.username || 'unknown',
                  photo: finalPhoto,
                  image: finalPhoto,
                  avatar: finalPhoto,
                  profileImage: finalPhoto
                };
              }
            } catch (error) {
              console.log('⚠️ Could not fetch author for project:', project.authorId);
            }
          }
          
          return {
            _id: project._id,
            id: project._id.toString(),
            title: project.title,
            description: project.description,
            tags: project.tags || [],
            categories: project.categories || [],
            images: project.images || [],
            githubUrl: project.githubUrl || '#',
            liveUrl: project.liveUrl || '#',
            author: authorData,
            authorId: project.authorId?.toString() || '',
            likes: project.likes || [],
            likeCount: project.likeCount || 0,
            comments: project.comments || [],
            commentsCount: project.comments?.length || 0,
            shares: project.shares || [],
            shareCount: project.shareCount || 0,
            views: project.views || 0,
            invitations: project.invitations || 0,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            savedAt: savedPost.savedAt, // Include when it was saved
            type: 'project'
          };
        })
    );

    return NextResponse.json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get saved posts error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch saved posts'
    }, { status: 500 });
  }
}
