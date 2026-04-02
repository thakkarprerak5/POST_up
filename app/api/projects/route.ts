import { NextResponse } from 'next/server';
import Project, { createProject, listProjects } from '@/models/Project';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IProject } from '@/models/Project';
import User from '@/models/User';
import { findOrCreateMentorInvitation } from '@/models/MentorInvitation';
import { findOrCreateGroup } from '@/models/Group';
import mongoose from 'mongoose';
// Force reload: Schema updated for optional groupSnapshot


// Define the admin assignment request schema inline to avoid import issues
const adminAssignmentRequestSchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  projectTitle: { type: String, required: true },
  projectDescription: { type: String, required: true },
  proposalFile: { type: String, default: null },
  requestedBy: { type: String, ref: 'User', required: true },
  requestedToType: { type: String, enum: ['student', 'group'], required: true },
  studentId: { type: String, ref: 'User', default: null },
  groupId: { type: String, ref: 'Group', default: null },
  status: { type: String, enum: ['pending', 'assigned', 'cancelled'], default: 'pending' },
  assignedMentorId: { type: String, ref: 'User', default: null },
  assignedBy: { type: String, ref: 'User', default: null },
  assignedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const AdminAssignmentRequest = mongoose.models.AdminAssignmentRequest ||
  mongoose.model('AdminAssignmentRequest', adminAssignmentRequestSchema, 'adminassignmentrequests');

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const authorId = searchParams.get('author');
  const authenticatedOnly = searchParams.get('authenticated') === 'true';
  const sortBy = searchParams.get('sort'); // 'trending' or 'createdAt'
  const status = searchParams.get('status'); // NEW: Filter by project status

  const query: any = {};
  if (tag) query.tags = tag;
  if (authorId) {
    const { ObjectId } = require('mongodb');
    try {
      // Query both the ObjectId author field AND the string authorId field
      query.$or = [
        { author: new ObjectId(authorId) },
        { authorId: authorId },
      ];
    } catch {
      // If authorId is not a valid ObjectId string, fall back to string match only
      query.authorId = authorId;
    }
  }


  // NEW LIFECYCLE: Filter by project status - default to ACTIVE only
  if (status) {
    if (status === 'all') {
      // Show all statuses (no filter)
    } else {
      query.projectStatus = status;
    }
  } else {
    // Default: Show ALL projects (like admin dashboard)
    // This ensures we get the same count as admin panel
    // query.projectStatus = 'ACTIVE';
  }

  // REMOVED: Don't filter by authenticated users - show projects from ALL accounts
  // This includes projects from sample accounts, test accounts, and all users

  // Set sort order based on parameter
  let sortOptions: any = { createdAt: -1 };
  if (sortBy === 'trending') {
    // For trending, fetch more projects first, then sort by calculated score
    sortOptions = { createdAt: -1 };
  }

  // Use direct MongoDB connection like home projects API to avoid populate issues
  const { MongoClient } = require('mongodb');
  const client = new MongoClient('mongodb://localhost:27017/post-up');

  await client.connect();
  const db = client.db();
  const projectsCollection = db.collection('projects');

  // Debug: Check database connection and count
  console.log('🔍 Database name:', db.databaseName);
  const totalCount = await projectsCollection.countDocuments({});
  console.log('🔍 Total projects in database:', totalCount);

  const projects = await projectsCollection.find(query).limit(sortBy === 'trending' ? 100 : limit).sort(sortOptions).toArray();

  await client.close();

  // Debug: Log what we got from database
  console.log('🔍 Projects from DB:', projects.length, 'projects');
  if (projects.length > 0) {
    console.log('🔍 Sample project from DB:', {
      title: projects[0].title,
      tags: projects[0].tags,
      tagsType: typeof projects[0].tags,
      tagsLength: projects[0].tags?.length,
      authorId: projects[0].authorId,
      author: projects[0].author,
      fullProject: projects[0]
    });

    // Log all project titles
    console.log('🔍 All project titles:');
    projects.forEach((project, idx) => {
      console.log('  ' + (idx + 1) + '. ' + project.title);
    });
  }

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

  // SMART CATEGORY INFERENCE: Add tags to projects that don't have them based on title and description
  const projectsWithTags = finalProjects.map((project: any) => {
    if (!project.tags || project.tags.length === 0) {
      const titleToTags: Record<string, string[]> = {
        'stock': ['ai', 'ml', 'machine-learning', 'python', 'data', 'analytics', 'prediction'],
        'weather': ['web', 'api', 'javascript', 'react', 'frontend'],
        'ecommerce': ['web', 'react', 'nodejs', 'mongodb', 'fullstack'],
        'chat': ['web', 'react', 'nodejs', 'socket.io', 'javascript'],
        'task': ['web', 'react', 'javascript', 'productivity'],
        'portfolio': ['web', 'react', 'javascript', 'frontend'],
        'blog': ['web', 'react', 'nodejs', 'mongodb', 'fullstack'],
        'social': ['web', 'react', 'nodejs', 'mongodb', 'fullstack'],
        'video': ['web', 'javascript', 'html5', 'css'],
        'music': ['web', 'javascript', 'html5', 'css'],
        'calculator': ['web', 'javascript', 'html', 'css'],
        'todo': ['web', 'react', 'javascript', 'productivity'],
        'game': ['web', 'javascript', 'html5', 'css'],
        'api': ['web', 'nodejs', 'express', 'backend'],
        'database': ['data', 'sql', 'nosql', 'backend'],
        'security': ['security', 'cyber', 'web', 'backend'],
        'blockchain': ['blockchain', 'web3', 'crypto', 'solidity'],
        'mobile': ['mobile', 'android', 'ios', 'flutter'],
        'ai': ['ai', 'ml', 'machine-learning', 'python'],
        'data': ['data', 'analytics', 'python', 'visualization'],
        'prediction': ['ai', 'ml', 'machine-learning', 'python']
      };

      const lowerTitle = project.title.toLowerCase();
      const lowerDesc = project.description?.toLowerCase() || '';
      const suggestedTags: string[] = [];

      // Check title and description for keywords
      Object.entries(titleToTags).forEach(([keyword, keywordTags]) => {
        if (lowerTitle.includes(keyword) || lowerDesc.includes(keyword)) {
          suggestedTags.push(...keywordTags);
        }
      });

      // If no tags found, assign uncategorized
      const uniqueTags = suggestedTags.length > 0 ? [...new Set(suggestedTags)] : ['uncategorized'];

      console.log(`🏷️ Added tags to "${project.title}":`, uniqueTags);

      return {
        ...project,
        tags: uniqueTags,
        _id: project._id // Ensure _id is preserved
      };
    }
    return project;
  });


  // Collect all unique author IDs and mentor IDs to fetch details
  const authorIds = new Set();
  const mentorIds = new Set();

  projectsWithTags.forEach((p: any) => {
    if (p.authorId) authorIds.add(p.authorId);
    if (p.author && typeof p.author === 'string') authorIds.add(p.author);
    if (p.author?._id) authorIds.add(p.author._id.toString());

    // Collect mentor IDs
    if (p.mentorId) mentorIds.add(p.mentorId.toString());
    if (p.mentorInvitation?.mentorId) mentorIds.add(p.mentorInvitation.mentorId.toString());
  });

  // Fetch all mentors in one go
  let mentorMap = new Map();
  if (mentorIds.size > 0) {
    const mentors = await User.find({ _id: { $in: Array.from(mentorIds) } }).select('fullName email photo').lean();
    mentors.forEach((m: any) => {
      mentorMap.set(m._id.toString(), m);
    });
  }

  // Serialize MongoDB documents to include _id as string and likedByUser status
  const serializedProjects = await Promise.all(projectsWithTags.map(async (project: IProject & { _id: any }) => {
    // Check if project is a Mongoose document or plain object
    const projectObj = project.toObject ? project.toObject() : project;

    // Use populated author data - no need for complex fallback logic
    if (projectObj.author && typeof projectObj.author === 'object') {
      // Author is populated from User collection
      projectObj.author = {
        id: projectObj.author._id?.toString() || projectObj.author.id,
        name: projectObj.author.name || projectObj.author.fullName || 'Unknown Author',
        username: projectObj.author.username || 'unknown',
        image: projectObj.author.avatar || projectObj.author.photo,
        avatar: projectObj.author.avatar || projectObj.author.photo
      };
    } else {
      // No author data available
      projectObj.author = {
        id: '',
        name: 'Unknown Author',
        username: 'unknown',
        image: null,
        avatar: null
      };
    }

    // Populate Mentor Data
    let mentorData = null;
    const mId = projectObj.mentorId || projectObj.mentorInvitation?.mentorId;

    if (mId && mentorMap.has(mId.toString())) {
      const mentor = mentorMap.get(mId.toString());
      mentorData = {
        id: mentor._id.toString(),
        name: mentor.fullName,
        email: mentor.email,
        photo: mentor.photo
      };

      // Update mentorInvitation with fresh name if it exists
      if (projectObj.mentorInvitation) {
        projectObj.mentorInvitation.mentorName = mentor.fullName;
        projectObj.mentorInvitation.mentorPhoto = mentor.photo;
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
      authorId: projectObj.authorId || projectObj.author?.id, // Ensure authorId is always included
      likedByUser,
      likeCount: Array.isArray(project.likes) ? project.likes.length : 0,
      commentsCount: project.comments?.length || 0,
      shareCount: project.shareCount || 0,
      mentor: mentorData, // Add populated mentor data field
    };
  }));

  // Debug: Log final API response structure
  console.log('🔍 Final API response sample:', {
    totalProjects: serializedProjects.length,
    sampleProject: serializedProjects[0] ? {
      title: serializedProjects[0].title,
      author: serializedProjects[0].author,
      authorType: typeof serializedProjects[0].author,
      tags: serializedProjects[0].tags,
      hasAuthor: !!serializedProjects[0].author,
      authorName: serializedProjects[0].author?.name
    } : null
  });

  // Return the projects
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

    // CRITICAL FIX: Validate user is a student
    if (user.type !== 'student') {
      return NextResponse.json({
        error: 'Access denied. Only students can register projects.'
      }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const githubUrl = formData.get('githubUrl') as string;
    const liveUrl = formData.get('liveUrl') as string;
    const tags = formData.get('tags') as string;
    const images = formData.getAll('images') as File[];
    const video = formData.get('video') as File;
    const proposalFile = formData.get('proposalFile') as File;
    const type = formData.get('type') as string;
    const groupName = formData.get('groupName') as string;
    const groupLeadId = formData.get('groupLeadId') as string;
    const mentorId = formData.get('mentorId') as string;
    const mentorName = formData.get('mentorName') as string;
    const mentorEmail = formData.get('mentorEmail') as string;
    const assignmentMethod = formData.get('assignmentMethod') as string;
    const message = formData.get('message') as string;

    // NOTE: Group lead restriction removed - any student can register group projects
    // Keeping validation for future use if needed
    // if (type === 'group' && groupLeadId) {
    //   if (groupLeadId !== user._id.toString()) {
    //     return NextResponse.json({ 
    //       error: 'Access denied. Only the designated group lead can submit group projects.' 
    //     }, { status: 403 });
    //   }
    // }

    // Handle partners field for group registration
    console.log('🔍 Debug - All formData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // Extract partner emails from formData (they come as partners[0], partners[1], etc.)
    const partnerEmails: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('partners[') && value) {
        const email = value.toString().trim();
        if (email.length > 0) {
          partnerEmails.push(email);
        }
      }
    }

    console.log('🔍 Debug - Extracted partnerEmails:', partnerEmails);

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

    let proposalUrl = '';
    if (proposalFile) {
      const bytes = await proposalFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const filename = `${uuidv4()}-${proposalFile.name}`;
      const filepath = join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      proposalUrl = `/uploads/${filename}`;
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

    // Debug: Log tags processing
    console.log('🏷️ Tags processing:', {
      originalTags: tags,
      tagsArray: tagsArray,
      tagsArrayLength: tagsArray.length
    });

    // ENFORCE CATEGORY SLUG IN PROJECT TAGS (Backend Validation Rule)
    const CATEGORIES = [
      { name: "Web Developer", slug: "web-development" },
      { name: "AI / ML", slug: "ai-ml" },
      { name: "Data Analysis", slug: "data-analysis" },
      { name: "Mobile App", slug: "mobile-app" },
      { name: "Cyber Security", slug: "cyber-security" },
      { name: "Blockchain", slug: "blockchain" }
    ];

    // Tag to category mapping for intelligent categorization
    const TAG_TO_CATEGORY = {
      // Web Development
      'react': 'web-development', 'next': 'web-development', 'nextjs': 'web-development',
      'html': 'web-development', 'css': 'web-development', 'javascript': 'web-development',
      'typescript': 'web-development', 'node': 'web-development', 'nodejs': 'web-development',
      'express': 'web-development', 'mongodb': 'web-development', 'postgresql': 'web-development',
      'mysql': 'web-development', 'api': 'web-development', 'frontend': 'web-development',
      'backend': 'web-development', 'fullstack': 'web-development',

      // AI / ML
      'ai': 'ai-ml', 'ml': 'ai-ml', 'machine-learning': 'ai-ml', 'tensorflow': 'ai-ml',
      'pytorch': 'ai-ml', 'python': 'ai-ml', 'data-science': 'ai-ml', 'prediction': 'ai-ml',
      'model': 'ai-ml', 'neural': 'ai-ml', 'opencv': 'ai-ml', 'nlp': 'ai-ml',
      'chatbot': 'ai-ml', 'gpt': 'ai-ml', 'llm': 'ai-ml',

      // Data Analysis
      'data': 'data-analysis', 'analysis': 'data-analysis', 'analytics': 'data-analysis',
      'visualization': 'data-analysis', 'dashboard': 'data-analysis', 'statistics': 'data-analysis',
      'pandas': 'data-analysis', 'numpy': 'data-analysis', 'sql': 'data-analysis',
      'excel': 'data-analysis', 'tableau': 'data-analysis',

      // Mobile App
      'android': 'mobile-app', 'ios': 'mobile-app', 'mobile': 'mobile-app',
      'app': 'mobile-app', 'flutter': 'mobile-app', 'react-native': 'mobile-app',
      'swift': 'mobile-app', 'kotlin': 'mobile-app', 'java': 'mobile-app', 'dart': 'mobile-app',

      // Cyber Security
      'security': 'cyber-security', 'cyber': 'cyber-security', 'pentesting': 'cyber-security',
      'hacking': 'cyber-security', 'encryption': 'cyber-security', 'firewall': 'cyber-security',
      'malware': 'cyber-security', 'vulnerability': 'cyber-security',

      // Blockchain
      'blockchain': 'blockchain', 'web3': 'blockchain', 'crypto': 'blockchain',
      'bitcoin': 'blockchain', 'ethereum': 'blockchain', 'solidity': 'blockchain',
      'smart-contracts': 'blockchain', 'defi': 'blockchain', 'nft': 'blockchain'
    };

    // Determine category slug based on existing tags, title, and description
    let categorySlug = null;

    // Check existing tags for category indicators
    const tagToCategory = TAG_TO_CATEGORY as Record<string, string>;
    for (const tag of tagsArray) {
      const normalizedTag = tag.toLowerCase();
      if (tagToCategory[normalizedTag]) {
        categorySlug = tagToCategory[normalizedTag];
        break;
      }
    }

    // If not found in tags, check title and description
    if (!categorySlug) {
      const text = `${title} ${description}`.toLowerCase();
      for (const [keyword, slug] of Object.entries(TAG_TO_CATEGORY)) {
        if (text.includes(keyword)) {
          categorySlug = slug;
          break;
        }
      }
    }

    // Default to web-development if no category found
    if (!categorySlug) {
      categorySlug = 'web-development';
      console.log(`⚠️  No category found for project "${title}", defaulting to web-development`);
    }

    // Normalize and inject category slug into tags
    const normalizedTags = Array.from(
      new Set([
        categorySlug.toLowerCase(), // Ensure category slug is included
        ...tagsArray.map(t => t.toLowerCase()) // Normalize all tags to lowercase
      ])
    );

    console.log(`🏷️  Category enforcement for "${title}":`, {
      detectedCategory: categorySlug,
      originalTags: tagsArray,
      normalizedTags: normalizedTags
    });

    // Validate: Ensure project has category slug in tags
    if (!normalizedTags.includes(categorySlug)) {
      throw new Error(`Failed to inject category slug "${categorySlug}" into project tags`);
    }

    // Validate: Ensure project has tags before saving
    if (normalizedTags.length === 0) {
      console.warn('⚠️ Project being created with no tags:', { title, description: description.substring(0, 100) });
    }

    // Create project data
    // Get group lead user information if groupLeadId is provided
    let groupLeadUser = null;
    console.log('🔍 Debug: groupLeadId received:', groupLeadId);

    if (groupLeadId) {
      // groupLeadId contains an email string from the frontend
      groupLeadUser = await User.findOne({ email: groupLeadId }).exec();

      if (!groupLeadUser) {
        return NextResponse.json({ error: 'Group Lead user not found with that email.' }, { status: 400 });
      }

      console.log('🔍 Debug: groupLeadUser found:', {
        id: groupLeadUser._id.toString(),
        name: groupLeadUser.fullName,
        email: groupLeadUser.email
      });
    }

    const projectData = {
      title,
      description,
      githubUrl: githubUrl || '#',
      liveUrl: liveUrl || '#',
      tags: normalizedTags, // Use normalized tags with category slug
      images: uploadedImages,
      proposalFile: proposalUrl,
      registrationType: type || 'individual',
      group: (type === 'group' && groupLeadUser) ? {
        lead: {
          id: groupLeadUser._id.toString(),
          name: groupLeadUser.fullName,
          email: groupLeadUser.email
        }
      } : undefined,
      groupLead: (type === 'group' && groupLeadUser) ? {
        id: groupLeadUser._id.toString(),
        name: groupLeadUser.fullName,
        email: groupLeadUser.email
      } : undefined, // Keep for backward compatibility
      groupId: undefined, // Include groupId if group was created
      members: type === 'group' ? partnerEmails.map(email => ({
        fullName: email, // Will be updated later with actual user name if found
        email: email,
        role: 'member'
      })) : undefined,
      mentorStatus: 'not_assigned',
      // NEW LIFECYCLE RULES: All projects start as PENDING with no mentor
      mentorId: null,
      projectStatus: 'PENDING',
      proposalSource: 'direct_registration',
      mentorInvitation: undefined,
      author: user._id,           // ObjectId reference for Mongoose populate()
      authorId: user._id.toString(), // String copy for simple string‑based queries & serialisation
      likes: [],
      comments: [],
      shareCount: 0,
      likeCount: 0,
      shares: [],
      createdAt: new Date(),
      isDeleted: false,
      visibility: 'public', // All uploaded projects are public by default
    };

    console.log('🔍 Debug: projectData.group:', projectData.group);
    console.log('🔍 Debug: projectData.groupLead:', projectData.groupLead);
    console.log('🔍 Debug: projectData.type:', type);
    console.log('🔍 Debug: projectData.registrationType:', projectData.registrationType);

    // If group registration, create the group first with idempotent logic
    let groupId = undefined;
    let enhancedGroupData = null;

    if (type === 'group' && groupName) {
      console.log('🔍 Processing group project with name:', groupName);

      // Create enhanced group data structure
      enhancedGroupData = {
        groupName: groupName,
        groupLead: groupLeadUser ? {
          id: groupLeadUser._id.toString(),
          name: groupLeadUser.fullName,
          email: groupLeadUser.email
        } : null,
        groupMembers: [] as Array<{ email: string; name: string; id: string | null; isValidated: boolean; status: string }>
      };

      try {
        let studentIds: string[] = [];

        // Process additional members if provided
        if (partnerEmails.length > 0) {
          console.log('🔍 Validating group member emails...');

          // Validate ALL group member emails exist in database
          const partnerUsers = await User.find({
            email: { $in: partnerEmails }
          }).exec();

          // Block submission if ANY email is not found
          const foundEmails = partnerUsers.map(user => user.email);
          const missingEmails = partnerEmails.filter(email => !foundEmails.includes(email));

          if (missingEmails.length > 0) {
            return NextResponse.json({
              error: 'Invalid group member emails',
              details: `The following emails are not registered in the system: ${missingEmails.join(', ')}`
            }, { status: 400 });
          }

          studentIds = partnerUsers.map(user => user._id.toString());

          // Add additional members to the group data
          enhancedGroupData.groupMembers = partnerEmails.map((email, index) => {
            const user = partnerUsers.find(u => u.email === email);
            return {
              email: email,
              name: user ? user.fullName : `Member ${index + 1}`,
              id: user ? user._id.toString() : null,
              isValidated: !!user,
              status: user ? 'active' : 'pending'
            };
          });

          console.log('✅ Group member validation successful');
        }

        // Add group lead to studentIds
        const groupLeadId = groupLeadUser ? groupLeadUser._id.toString() : user._id.toString();
        if (!studentIds.includes(groupLeadId)) {
          studentIds.push(groupLeadId);
        }

        console.log('🔍 Creating/finding group with studentIds:', studentIds);

        // Use idempotent group creation
        const groupResult = await findOrCreateGroup({
          name: groupName,
          description: `${groupName} - Group project`,
          lead: groupLeadId,
          studentIds: studentIds
        });

        groupId = groupResult.group._id.toString();

        if (groupResult.created) {
          console.log('✅ New group created successfully:', groupId);
        } else {
          console.log('✅ Using existing group:', groupId);
        }

      } catch (error: any) {
        console.error('❌ Failed to process group data:', error);
        return NextResponse.json({
          error: 'Failed to create or find group',
          details: error.message
        }, { status: 400 });
      }
    }

    const project = await createProject(projectData as any);

    // If student selected a mentor, create an invitation with idempotent logic
    if (mentorId && assignmentMethod === 'invitation') {
      try {
        console.log('🔍 Creating idempotent mentor invitation with data:', {
          mentorId,
          studentId: user._id.toString(),
          projectId: project._id.toString(),
          projectTitle: title,
          mentorName: mentorName,
          mentorEmail: mentorEmail,
          isGroup: type === 'group',
          groupId: groupId
        });

        const invitationData: any = {
          mentorId,
          studentId: user._id.toString(),
          projectId: project._id.toString(),
          projectTitle: title,
          projectDescription: description,
          proposalFile: proposalUrl,
          message: message || ''
        };

        // Add groupSnapshot for group projects with complete group data
        if (type === 'group' && groupId && enhancedGroupData) {
          invitationData.groupId = groupId;
          invitationData.groupSnapshot = {
            groupName: enhancedGroupData.groupName,
            lead: {
              id: enhancedGroupData.groupLead?.id || user._id.toString(),
              name: enhancedGroupData.groupLead?.name || user.fullName,
              email: enhancedGroupData.groupLead?.email || user.email
            },
            members: enhancedGroupData.groupMembers.map(member => ({
              id: member.id,
              name: member.name,
              email: member.email,
              status: member.status || 'active'
            }))
          };
        }

        // Use idempotent mentor invitation creation
        const invitationResult = await findOrCreateMentorInvitation(invitationData);

        if (invitationResult.created) {
          console.log('✅ New mentor invitation created successfully:', invitationResult.invitation._id);
        } else {
          console.log('✅ Using existing mentor invitation:', invitationResult.invitation._id);
        }

        // Update project with invitation reference
        await Project.findByIdAndUpdate(project._id, {
          mentorInvitation: {
            mentorName: mentorName || 'Selected Mentor',
            mentorId: mentorId,
            status: 'pending',
            timestamp: new Date().toISOString()
          }
        });
        console.log('✅ Project updated with mentor invitation reference');

      } catch (error) {
        console.error('❌ Failed to create mentor invitation:', error);
        // Don't fail the project creation if invitation fails
      }
    }

    // If student selected admin assignment, create an admin assignment request with enhanced group data
    console.log('🔍 Checking assignment method:', { assignmentMethod, type, groupLeadId: !!groupLeadId });

    if (assignmentMethod === 'admin') {
      try {
        console.log('🔍 Creating admin assignment request with enhanced group data:', {
          type,
          groupLeadUser: groupLeadUser ? {
            id: groupLeadUser._id.toString(),
            name: groupLeadUser.fullName,
            email: groupLeadUser.email
          } : null,
          enhancedGroupData,
          groupId
        });

        // Add enhanced group snapshot for admin visibility
        const groupSnapshotData = type === 'group' && enhancedGroupData ? {
          lead: enhancedGroupData.groupLead,
          members: enhancedGroupData.groupMembers.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
            status: member.status || 'active'
          }))
        } : undefined;

        console.log('🔍 Group snapshot data being assigned:', {
          type,
          hasEnhancedGroupData: !!enhancedGroupData,
          groupSnapshotData: groupSnapshotData
        });

        const adminRequest = new AdminAssignmentRequest({
          projectId: project._id.toString(),
          projectTitle: title,
          projectDescription: description,
          proposalFile: proposalUrl,
          requestedBy: user._id.toString(),
          requestedToType: type === 'group' ? 'group' : 'student',
          requestType: type === 'group' ? 'GROUP' : 'INDIVIDUAL', // Add missing required field
          studentId: type === 'individual' ? user._id.toString() : undefined,
          groupId: type === 'group' ? groupId : null, // Use null instead of undefined for group requests
          groupSnapshot: groupSnapshotData
        });

        console.log('🔍 Admin request before save:', {
          requestedToType: adminRequest.requestedToType,
          groupSnapshot: adminRequest.groupSnapshot,
          groupId: adminRequest.groupId
        });

        await adminRequest.save();
        console.log('✅ Admin assignment request created successfully with enhanced group data:', {
          id: adminRequest._id,
          requestedToType: adminRequest.requestedToType,
          hasGroupSnapshot: !!adminRequest.groupSnapshot
        });
      } catch (error) {
        console.error('Failed to create admin assignment request:', error);
        // Don't fail the project creation if admin request fails
      }
    }

    return NextResponse.json({
      ...project,
      adminRequestCreated: assignmentMethod === 'admin',
      adminRequestMessage: assignmentMethod === 'admin'
        ? 'Your admin assignment request has been created and will be reviewed by the Super Admin.'
        : undefined
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
