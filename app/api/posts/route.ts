import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Post } from '@/models/Post';
import User from '@/models/User';
import { filterProjectsByVisibility, getVisibilityStats } from '@/lib/project-visibility-filter';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Fetch ALL posts with author details populated
    const posts = await Post.find({})
      .populate('author', 'fullName email photo avatar type')
      .populate('likes', 'fullName email photo avatar')
      .populate('comments.author', 'fullName email photo avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .lean();

    // COMPREHENSIVE APPROACH: Fetch all projects from all user profiles
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;

    // Get all users first
    const users = await db.collection('users').find({}).toArray();

    // Get ALL projects first
    const allProjects = await db.collection('projects').find({}).toArray();

    // Transform projects to include proper author info with better fallback logic
    const transformedProjects = allProjects.map(project => {
      let authorInfo = {
        id: project._id.toString(),
        name: 'Unknown User',
        photo: '/placeholder-user.jpg',
        role: 'student'
      };

      // Try multiple strategies to find the author
      if (project.authorId) {
        const user = users.find(u => u._id.toString() === project.authorId);
        if (user) {
          authorInfo = {
            id: user._id.toString(),
            name: user.fullName || 'Unknown User',
            photo: user.photo || user.avatar || '/placeholder-user.jpg',
            role: user.type || 'student'
          };
        }
      } else if (project.groupLead?.id) {
        const user = users.find(u => u._id.toString() === project.groupLead.id);
        if (user) {
          authorInfo = {
            id: user._id.toString(),
            name: user.fullName || project.groupLead.name || 'Unknown User',
            photo: user.photo || user.avatar || '/placeholder-user.jpg',
            role: user.type || 'student'
          };
        }
      } else if (project.groupLead?.name) {
        // Fallback to groupLead name if available
        authorInfo = {
          id: project.groupLead.id || project._id.toString(),
          name: project.groupLead.name,
          photo: '/placeholder-user.jpg',
          role: 'student'
        };
      } else {
        // Last resort: try to match by name patterns or use first available user
        if (users.length > 0) {
          const firstUser = users[0];
          authorInfo = {
            id: firstUser._id.toString(),
            name: firstUser.fullName || 'Unknown User',
            photo: firstUser.photo || firstUser.avatar || '/placeholder-user.jpg',
            role: firstUser.type || 'student'
          };
        }
      }

      return {
        ...project,
        _id: project._id.toString(),
        id: project._id.toString(),
        author: authorInfo,
        likeCount: project.likeCount || project.likes?.length || 0,
        commentCount: project.comments?.length || 0,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        type: 'project',
        image: project.images?.[0] || null,
        title: project.title,
        likes: project.likes || [],
        content: project.description
      };
    });

    // Apply 3-Step Gate filtering for project registration projects
    console.log('🚪 Posts API - Applying 3-Step Gate filtering to projects...');
    const visibilityFilteredProjects = filterProjectsByVisibility(transformedProjects);
    console.log('🚪 Posts API - 3-Step Gate filtered projects:', visibilityFilteredProjects.length);

    // Log visibility statistics for debugging
    const visibilityStats = getVisibilityStats(transformedProjects);
    console.log('🚪 Posts API - Visibility Stats:', visibilityStats);

    // Sort projects by creation date (newest first)
    const sortedProjects = visibilityFilteredProjects.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit * 2);


    // Transform posts to include proper counts and user interaction data
    // Use JSON.parse(JSON.stringify()) to ensure clean objects without Mongoose wrappers
    const transformedPosts = posts.map(post => {
      // Serialize to remove any Mongoose document properties (_doc, $__, etc.)
      const cleanPost = JSON.parse(JSON.stringify(post));

      return {
        _id: typeof cleanPost._id === 'string' ? cleanPost._id : String(cleanPost._id || ''),
        id: typeof cleanPost._id === 'string' ? cleanPost._id : String(cleanPost._id || ''),
        content: cleanPost.content,
        image: cleanPost.image,
        author: {
          _id: cleanPost.author?._id || cleanPost.author?.id,
          id: cleanPost.author?._id || cleanPost.author?.id,
          name: cleanPost.author?.fullName || 'Unknown User',
          email: cleanPost.author?.email,
          photo: cleanPost.author?.photo || cleanPost.author?.avatar,
          avatar: cleanPost.author?.avatar || cleanPost.author?.photo,
          role: cleanPost.author?.type || 'student'
        },
        likeCount: cleanPost.likes?.length || 0,
        commentCount: cleanPost.comments?.length || 0,
        createdAt: cleanPost.createdAt,
        updatedAt: cleanPost.updatedAt,
        type: 'post',
        likes: cleanPost.likes || []
      };
    });

    // Combine and sort all items by creation date (using filtered projects)
    const allItems = [...transformedPosts, ...sortedProjects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      posts: allItems,
      pagination: {
        page,
        limit,
        total: allItems.length
      },
      debug: {
        postsCount: transformedPosts.length,
        originalProjectsCount: transformedProjects.length,
        filteredProjectsCount: sortedProjects.length,
        usersProcessed: users.length,
        totalProjectsFound: allProjects.length,
        visibilityStats: visibilityStats
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { content, image, authorId } = await request.json();

    if (!content || !authorId) {
      return NextResponse.json(
        { success: false, error: 'Content and author ID are required' },
        { status: 400 }
      );
    }

    // Verify author exists
    const author = await User.findById(authorId);
    if (!author) {
      return NextResponse.json(
        { success: false, error: 'Author not found' },
        { status: 404 }
      );
    }

    // Create new post
    const post = new Post({
      content,
      image: image || null,
      author: authorId
    });

    await post.save();

    // Populate author details for response
    await post.populate('author', 'fullName email photo avatar type');

    const transformedPost = {
      ...post.toObject(),
      id: post._id.toString(),
      author: {
        ...post.author,
        id: post.author._id.toString(),
        name: post.author.fullName || 'Unknown User',
        role: post.author.type || 'student'
      },
      likeCount: 0,
      commentCount: 0
    };

    return NextResponse.json({
      success: true,
      post: transformedPost
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
