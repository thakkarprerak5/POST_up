import { NextRequest, NextResponse } from 'next/server';
import { listProjects } from '@/models/Project';
import Project from '@/models/Project';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { 
  CATEGORY_DEFINITIONS, 
  getCategoryBySlug, 
  projectBelongsToCategory,
  getProjectCategories 
} from '@/lib/category-tags';
import { filterProjectsByVisibility, getVisibilityStats } from '@/lib/project-visibility-filter';

// Unified Feed API - Slug-based category system, single source of truth
export async function GET(request: NextRequest) {
  try {
    // Ensure database connection first
    await connectDB();
    
    // Wait for connection to be fully established
    let retries = 0;
    while (require('mongoose').connection.readyState !== 1 && retries < 5) {
      console.log('🔍 Feed API: Waiting for connection... state:', require('mongoose').connection.readyState);
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'latest';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('🏷️ FEED API - Slug-based system:', { category, sort, limit });
    
    // Base query for all non-deleted projects (fetch everything)
    const baseQuery = {
      isDeleted: { $ne: true }
      // Remove visibility filter to fetch all projects
      // Remove projectStatus filter to fetch all projects
    };
    
    // Use Project model like admin API to fetch all projects
    // First fetch without populate to avoid ObjectId errors
    const allProjects = await Project.find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean(); // Use lean for better performance
    
    console.log('🏷️ FEED API - Raw projects from DB:', allProjects.length);
    
    // Debug: Check project statuses
    if (allProjects.length > 0) {
      console.log('🔍 DEBUG - Sample project status:', allProjects[0].projectStatus);
      console.log('🔍 DEBUG - Sample project visibility:', allProjects[0].visibility);
      console.log('🔍 DEBUG - Sample project tags:', allProjects[0].tags);
      console.log('🔍 DEBUG - All project statuses:', [...new Set(allProjects.map((p: any) => p.projectStatus))]);
    }
    
    // Serialize projects with proper author handling (fetch real user data)
    const serializedProjects = await Promise.all(allProjects.map(async (project: any) => {
      // Handle author data properly (fetch real user data)
      let authorData = {
        id: '',
        name: 'Unknown Author',
        username: 'unknown',
        image: null,
        avatar: null
      };
      
      if (project.author) {
        let authorId = '';
        
        if (typeof project.author === 'object' && project.author._id) {
          // Populated author object
          authorId = project.author._id.toString();
          authorData = {
            id: authorId,
            name: project.author.name || project.author.fullName || 'Unknown Author',
            username: project.author.username || 'unknown',
            image: project.author.image || project.author.avatar || null,
            avatar: project.author.image || project.author.avatar || null
          };
        } else if (typeof project.author === 'string') {
          // Author is an ObjectId string
          authorId = project.author;
        } else if (typeof project.author === 'object' && project.author.id) {
          // Author object with id field
          authorId = project.author.id;
        }
        
        // If we have an authorId but no populated data, fetch the user
        if (authorId && (!authorData.name || authorData.name === 'Unknown Author')) {
          try {
            const user = await User.findById(authorId).lean();
            if (user) {
              // Prioritize original profile photo over generated avatar
              const userName = user.fullName || user.name || 'Unknown Author';
              const originalPhoto = user.photo; // Original uploaded profile photo
              
              // Generate avatar only if no original photo exists
              const generatedAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff`;
              const finalPhoto = originalPhoto && originalPhoto !== '/placeholder-user.jpg' 
                ? originalPhoto 
                : generatedAvatar;
              
              authorData = {
                id: user._id.toString(),
                name: userName,
                username: user.username || 'unknown',
                image: finalPhoto,
                avatar: finalPhoto,
                photo: finalPhoto // Include photo field for compatibility
              };
              
              console.log('👤 Fetched user data for:', userName, 'original photo:', !!originalPhoto && originalPhoto !== '/placeholder-user.jpg', 'final photo:', finalPhoto);
            }
          } catch (error) {
            console.log('⚠️ Could not fetch user for authorId:', authorId);
          }
        }
      }
      
      const projectTags = project.tags || [];
      const projectCategories = getProjectCategories(projectTags);
      
      return {
        _id: project._id.toString(),
        title: project.title,
        description: project.description,
        tags: projectTags,
        categories: projectCategories, // Auto-derived categories
        images: project.images || [],
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        author: authorData,
        authorId: authorData.id,
        likes: project.likes || [],
        likeCount: project.likes?.length || 0,
        comments: project.comments || [],
        commentsCount: project.comments?.length || 0,
        shares: project.shares || [],
        shareCount: project.shareCount || 0,
        visibility: project.visibility,
        projectStatus: project.projectStatus,
        proposalSource: project.proposalSource, // Keep for our logic
        origin: project.proposalSource === 'direct_registration' ? 'project_registration' : 'other', // Map for filter
        mentorId: project.mentorId, // Pass through for filtering
        mentorStatus: project.mentorStatus, // Pass through for filtering
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };
    }));
    
    console.log('🏷️ FEED API - Serialized projects:', serializedProjects.length);
    
    // Separate projects from registration vs other sources
    const registrationProjects = serializedProjects.filter(project => 
      project.proposalSource === 'direct_registration'
    );
    const otherProjects = serializedProjects.filter(project => 
      project.proposalSource !== 'direct_registration'
    );
    
    console.log('🏷️ FEED API - Registration projects:', registrationProjects.length);
    console.log('🏷️ FEED API - Other projects:', otherProjects.length);
    
    // Apply 3-Step Gate filtering ONLY to registration projects
    let filteredRegistrationProjects = registrationProjects;
    if (registrationProjects.length > 0) {
      console.log('🚪 Applying 3-Step Gate filtering to registration projects only...');
      console.log('🚪 Registration projects before filtering:', registrationProjects.length);
      
      filteredRegistrationProjects = filterProjectsByVisibility(registrationProjects);
      console.log('🚪 Registration projects that passed filtering:', filteredRegistrationProjects.length);
      console.log('🚪 Registration projects filtered out (not shown):', registrationProjects.length - filteredRegistrationProjects.length);
      
      // Log visibility statistics for debugging
      const visibilityStats = getVisibilityStats(registrationProjects);
      console.log('🚪 Visibility Stats for registration projects:', visibilityStats);
    }
    
    // Combine ONLY eligible registration projects with other projects
    // Ineligible registration projects are NOT shown in the feed
    const visibilityFilteredProjects = [...filteredRegistrationProjects, ...otherProjects];
    console.log('🚪 Final projects shown in feed:', visibilityFilteredProjects.length);
    console.log('🚪 Breakdown:');
    console.log('  - Eligible registration projects:', filteredRegistrationProjects.length);
    console.log('  - Other projects (no filtering):', otherProjects.length);
    console.log('  - Total shown:', visibilityFilteredProjects.length);
    
    // Filter projects by category if specified - USE SLUG-BASED SYSTEM
    let filteredProjects = visibilityFilteredProjects;
    
    if (category && category !== 'all') {
      console.log('🏷️ FEED API - Filtering for category slug:', category);
      
      filteredProjects = serializedProjects.filter(project => {
        // Use exact slug matching like the categories API
        const hasCategorySlug = project.tags && project.tags.includes(category);
        
        // Debug: Show logic for first few projects
        if (filteredProjects.length < 3) {
          console.log('🔍 DEBUG - Project:', project.title);
          console.log('🔍 DEBUG - Project tags:', project.tags);
          console.log('🔍 DEBUG - Looking for slug:', category);
          console.log('🔍 DEBUG - Has category slug:', hasCategorySlug);
          console.log('---');
        }
        
        return hasCategorySlug;
      });
    }
    
    console.log('🏷️ FEED API - Filtered projects:', filteredProjects.length);
    
    // Apply sorting
    let sortedProjects = [...filteredProjects];
    if (sort === 'trending') {
      sortedProjects.sort((a, b) => {
        const scoreA = a.likeCount + a.shareCount;
        const scoreB = b.likeCount + b.shareCount;
        return scoreB - scoreA || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sort === 'popular') {
      sortedProjects.sort((a, b) => 
        b.likeCount - a.likeCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // Default: latest
      sortedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // Apply limit
    const limitedProjects = sortedProjects.slice(0, limit);
    
    console.log('🏷️ FEED API - Final result:', limitedProjects.length, 'projects');
    
    // Return unified response structure
    return NextResponse.json({
      success: true,
      count: limitedProjects.length,
      projects: limitedProjects
    });
    
  } catch (error) {
    console.error('🏷️ FEED API - Error:', error);
    return NextResponse.json({
      success: false,
      count: 0,
      projects: [],
      error: error instanceof Error ? error.message : 'Failed to fetch projects'
    }, { status: 500 });
  }
}
