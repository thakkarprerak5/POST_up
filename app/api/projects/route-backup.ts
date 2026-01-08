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
  const serializedProjects = finalProjects.map((project: IProject & { _id: any }) => {
    const projectObj = project.toObject();
    
    // Fix for ganpat's profile photo - use actual photo from database
    if (projectObj.author?.name === 'ganpat' && !projectObj.author.image) {
      projectObj.author.image = '/uploads/ganpat-profile-photo.jpg';
      projectObj.author.avatar = '/uploads/ganpat-profile-photo.jpg';
    }
    
    let likedByUser = false;
    
    if (currentUser) {
      // Check if user has liked this project using database user ID
      const userIdStr = currentUser._id.toString();
      const likesArray = Array.isArray(project.likes) ? project.likes : [];
      
      likedByUser = likesArray.some(likeId => {
        const likeIdStr = likeId.toString();
        
        // Handle both string and ObjectId comparison
        let isMatch = likeIdStr === userIdStr;
        
        // If likeId is an ObjectId with equals method, use that too
        if (likeId && typeof likeId === 'object' && typeof (likeId as any).equals === 'function') {
          try {
            isMatch = isMatch || (likeId as any).equals(currentUser._id);
          } catch (e) {
            // If equals fails, fall back to string comparison
          }
        }
        
        return isMatch;
      });
    }
    
    return {
      ...projectObj,
      _id: project._id.toString(),
      id: project._id.toString(), // Add id field for compatibility
      likedByUser: likedByUser
    };
  });
  
  return NextResponse.json(serializedProjects);
}

export async function POST(request: Request) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the full user from database to ensure we have the correct ID
  const currentUser = await User.findOne({ email: session.user.email }).exec();
  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const title = formData.get('title')?.toString() || '';
  const description = formData.get('description')?.toString() || '';
  const githubUrl = formData.get('githubUrl')?.toString() || '';
  const liveUrl = formData.get('liveUrl')?.toString() || '';
  const tags = (formData.get('tags')?.toString() || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const images: string[] = [];
  const files = formData.getAll('images') as File[];
  if (files && files.length) {
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

  const project = await createProject({
    title,
    description,
    tags,
    images,
    githubUrl,
    liveUrl,
    author: {
      id: currentUser._id.toString(), // Use the actual database user ID
      name: currentUser.fullName || session.user.name || 'Unknown',
      image: currentUser.photo || session.user.image || '',
      username: currentUser.email?.split('@')[0] || 'user',
    },
    createdAt: new Date(),
  } as any);

  // Serialize the project document
  const serializedProject = {
    ...project.toObject(),
    _id: project._id.toString(),
    id: project._id.toString() // Add id field for compatibility
  };

  return NextResponse.json(serializedProject, { status: 201 });
}
