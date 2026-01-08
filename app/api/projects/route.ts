import { NextResponse } from 'next/server';
import { createProject, listProjects } from '@/models/Project';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IProject } from '@/models/Project';
import User from '@/models/User';

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const authorId = searchParams.get('author');
  const authenticatedOnly = searchParams.get('authenticated') === 'true';
  const sortBy = searchParams.get('sort'); // 'trending' or 'createdAt'

  const query: any = {};
  if (tag) query.tags = tag;
  if (authorId) query['author.id'] = authorId;
  
  // If we only want projects from authenticated users, filter by real users
  if (authenticatedOnly) {
    // Get all real user IDs (users with actual accounts)
    const realUsers = await User.find({}, { _id: 1 }).exec();
    const realUserIds = realUsers.map((user: any) => user._id.toString());
    
    // Only include projects from real users
    query['author.id'] = { $in: realUserIds };
  }

  // Set sort order based on parameter
  let sortOptions: any = { createdAt: -1 };
  if (sortBy === 'trending') {
    // For trending, fetch more projects first, then sort by calculated score
    sortOptions = { createdAt: -1 };
  }

  const projects = await listProjects(query, { limit: sortBy === 'trending' ? 100 : limit, sort: sortOptions });
  
  // Filter out sample projects if requested
  let filteredProjects = projects;
  if (authenticatedOnly) {
    filteredProjects = projects.filter((project: IProject & { _id: any }) => {
      // Based on the actual data analysis:
      // Real projects: empty GitHub/Live URLs but real uploaded images (/uploads/...)
      // Sample projects: generic GitHub/Live URLs + no real uploaded images
      
      // Check for real uploaded images (starts with /uploads/)
      const hasRealUploadedImages = project.images && project.images.length > 0 && 
        project.images.some((img: string) => img.startsWith('/uploads/'));
      
      // Check for generic URLs (sample project pattern)
      const hasGenericGithubUrl = project.githubUrl === "https://github.com" || project.githubUrl === "#";
      const hasGenericLiveUrl = project.liveUrl === "https://example.com" || project.liveUrl === "#";
      const hasGenericUrls = hasGenericGithubUrl && hasGenericLiveUrl;
      
      // Hide sample projects: has generic URLs AND no real uploaded images
      // Show projects if they DON'T have generic URLs OR they DO have real uploaded images
      return !hasGenericUrls || hasRealUploadedImages;
    });
  }
  
  // Calculate trending score and sort if needed
  let finalProjects = filteredProjects;
  if (sortBy === 'trending') {
    finalProjects = filteredProjects.sort((a: any, b: any) => {
      // Calculate trending scores
      const scoreA = (a.likeCount || 0) + (a.comments?.length || 0) + (a.shareCount || 0);
      const scoreB = (b.likeCount || 0) + (b.comments?.length || 0) + (b.shareCount || 0);
      
      // Sort by trending score first, then by creation date
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, limit); // Apply limit after sorting
  }
  
  // Get user session for like status
  const session = await getServerSession(authOptions);
  let currentUser = null;
  if (session?.user?.email) {
    currentUser = await User.findOne({ email: session.user.email }).exec();
  }
  
  // Serialize MongoDB documents to include _id as string and likedByUser status
  const serializedProjects = await Promise.all(finalProjects.map(async (project: IProject & { _id: any }) => {
    const projectObj = project.toObject();
    
    // FIX: Get actual user data for ALL users
    if (projectObj.author?.name) {
      try {
        // Fetch the user's actual data from database
        const user = await User.findOne({ fullName: projectObj.author.name }).exec();
        if (user && user.photo && user.photo !== '/placeholder-user.jpg') {
          projectObj.author.image = user.photo;
          projectObj.author.avatar = user.photo;
        } else {
          // Fallback to null (will show initial letter)
          projectObj.author.image = null;
          projectObj.author.avatar = null;
        }
      } catch (error) {
        // If user lookup fails, keep original values
        console.log('User lookup failed for:', projectObj.author.name);
      }
    }
    
    let likedByUser = false;
    
    if (currentUser) {
      // Check if user has liked this project using database user ID
      const userIdStr = currentUser._id.toString();
      const likesArray = Array.isArray(project.likes) ? project.likes : [];
      
      likedByUser = likesArray.some(likeId => {
        const likeIdStr = likeId.toString();
        return likeIdStr === userIdStr;
      });
    }
    
    return {
      ...projectObj,
      _id: projectObj._id.toString(),
      likedByUser,
      likeCount: Array.isArray(project.likes) ? project.likes.length : 0,
      commentsCount: project.comments?.length || 0,
      shareCount: project.shareCount || 0,
    };
  }));

  return NextResponse.json(serializedProjects);
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const githubUrl = formData.get('githubUrl') as string;
    const liveUrl = formData.get('liveUrl') as string;
    const tags = formData.get('tags') as string;
    const images = formData.getAll('images') as File[];
    const video = formData.get('video') as File;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Handle file uploads
    const uploadedImages: string[] = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });
        
        const filename = `${uuidv4()}-${image.name}`;
        const filepath = join(uploadsDir, filename);
        
        await writeFile(filepath, buffer);
        uploadedImages.push(`/uploads/${filename}`);
      }
    }

    let videoUrl = '';
    if (video) {
      const bytes = await video.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      
      const filename = `${uuidv4()}-${video.name}`;
      const filepath = join(uploadsDir, filename);
      
      await writeFile(filepath, buffer);
      videoUrl = `/uploads/${filename}`;
    }

    // Parse tags
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Create project data
    const projectData = {
      title,
      description,
      githubUrl: githubUrl || '#',
      liveUrl: liveUrl || '#',
      tags: tagsArray,
      images: uploadedImages,
      videoUrl,
      author: {
        id: user._id.toString(),
        name: user.fullName,
        username: user.email.split('@')[0],
        image: user.photo || '/placeholder-user.jpg',
        avatar: user.photo || '/placeholder-user.jpg',
      },
      likes: [],
      comments: [],
      shareCount: 0,
      likeCount: 0,
      shares: [],
      createdAt: new Date(),
      isDeleted: false,
    };

    const project = await createProject(projectData);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
