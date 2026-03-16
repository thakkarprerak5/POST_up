import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { calculateTrendingScore } from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { filterProjectsByVisibility, getVisibilityStats } from '@/lib/project-visibility-filter';
import { getProjectCategories } from '@/lib/category-tags';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Wait for connection to be fully established
        let retries = 0;
        while (require('mongoose').connection.readyState !== 1 && retries < 5) {
            console.log('🔍 Trending API: Waiting for connection... state:', require('mongoose').connection.readyState);
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        // Get user session for likedByUser calculation
        const session = await getServerSession(authOptions);
        let currentUser = null;
        if (session?.user?.email) {
            currentUser = await User.findOne({ email: session.user.email }).exec();
        }

        console.log('🔥 Trending API - Getting projects from main feed first...');
        
        // Step 1: Get projects from main feed (same data source as main feed)
        // Use the exact same query and logic as main feed API
        const Project = require('@/models/Project').default;
        
        // Use same base query as main feed API
        const baseQuery = {
          isDeleted: { $ne: true }
          // Remove visibility filter to fetch all projects
          // Remove projectStatus filter to fetch all projects
        };
        
        // Use same query as main feed API - EXACT SAME as main feed
        const allProjects = await Project.find({})
          .sort({ createdAt: -1 })
          .limit(1000)
          .lean(); // Use lean for better performance
        
        console.log('🔥 Trending API - Raw projects from main feed:', allProjects.length);
        
        // Debug: Check if we're getting the same projects as main feed
        if (allProjects.length > 0) {
            console.log('🔍 DEBUG - First 3 projects in trending API:');
            allProjects.slice(0, 3).forEach((project, index) => {
                console.log(`  ${index + 1}. "${project.title}" - authorId: "${project.authorId || 'empty'}" - isDeleted: ${project.isDeleted}`);
            });
        }
        
        // Serialize projects with proper author handling (same as main feed)
        const feedProjects = await Promise.all(allProjects.map(async (project: any) => {
            // Handle author data properly (fetch real user data)
            let authorData = {
                id: '',
                name: 'Unknown Author',
                username: 'unknown',
                image: null,
                avatar: null,
                profileImage: null
            };
            
            if (project.authorId) {
                try {
                    const user = await User.findById(project.authorId).lean();
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
                            profileImage: finalPhoto // Include profileImage field for compatibility
                        };
                        
                        console.log('👤 Fetched user data for:', userName, 'original photo:', !!originalPhoto && originalPhoto !== '/placeholder-user.jpg', 'final photo:', finalPhoto);
                    }
                } catch (error) {
                    console.log('⚠️ Could not fetch user for authorId:', project.authorId);
                }
            }
            
            const projectTags = project.tags || [];
            const projectCategories = getProjectCategories(projectTags);
            
            return {
                _id: project._id.toString(),
                title: project.title,
                description: project.description,
                tags: project.tags || [],
                categories: projectCategories, // Auto-derived categories
                images: project.images || [],
                githubUrl: project.githubUrl || '#',
                liveUrl: project.liveUrl || '#',
                author: authorData,
                authorId: project.authorId,
                likes: project.likes || [],
                likeCount: project.likeCount || 0,
                comments: project.comments || [],
                commentsCount: project.comments?.length || 0,
                shares: project.shares || [],
                shareCount: project.shareCount || 0,
                origin: project.proposalSource === 'direct_registration' ? 'project_registration' : 'other',
                mentorId: project.mentorId,
                mentorStatus: project.mentorStatus,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                views: project.views || 0,
                invitations: project.invitations || 0,
                trendingScore: 0, // Will be calculated later
                likedByUser: false, // Will be calculated later
                type: 'project'
            };
        }));
        
        console.log('🔥 Trending API - Serialized projects from main feed:', feedProjects.length);

        // Step 2: Apply same filtering logic as main feed
        // Separate projects from registration vs other sources
        const registrationProjects = feedProjects.filter(project => 
            project.proposalSource === 'direct_registration'
        );
        const otherProjects = feedProjects.filter(project => 
            project.proposalSource !== 'direct_registration'
        );
        
        console.log('🔥 Trending API - Registration projects from main feed:', registrationProjects.length);
        console.log('🔥 Trending API - Other projects from main feed:', otherProjects.length);

        // Apply 3-Step Gate filtering ONLY to registration projects
        let filteredRegistrationProjects = registrationProjects;
        if (registrationProjects.length > 0) {
            console.log('🚪 Applying 3-Step Gate filtering to trending registration projects...');
            console.log('🚪 Registration projects before filtering:', registrationProjects.length);
            
            filteredRegistrationProjects = filterProjectsByVisibility(registrationProjects);
            console.log('🚪 Registration projects that passed filtering:', filteredRegistrationProjects.length);
            console.log('🚪 Registration projects filtered out (not shown):', registrationProjects.length - filteredRegistrationProjects.length);
            
            // Log visibility statistics for debugging
            const visibilityStats = getVisibilityStats(registrationProjects);
            console.log('🚪 Visibility Stats for trending registration projects:', visibilityStats);
        }

        // Combine ONLY eligible registration projects with other projects
        // Ineligible registration projects are NOT shown in trending
        const visibilityFilteredProjects = [...filteredRegistrationProjects, ...otherProjects];
        console.log('🔥 Trending API - Final projects eligible for trending:', visibilityFilteredProjects.length);
        console.log('🔥 Trending API - Breakdown:');
        console.log('  - Eligible registration projects:', filteredRegistrationProjects.length);
        console.log('  - Other projects (no filtering):', otherProjects.length);
        console.log('  - Total eligible:', visibilityFilteredProjects.length);

        // If no projects pass filtering, show all projects (fallback like main feed)
        let finalProjects = visibilityFilteredProjects;
        if (visibilityFilteredProjects.length === 0) {
            console.log('🔥 Trending API - No projects passed filtering, showing all projects as fallback');
            finalProjects = feedProjects;
        }

        // Step 3: Apply trending logic to filtered projects
        console.log('🔥 Trending API - Applying trending scores to filtered projects...');
        
        const projectsWithScores = finalProjects.map((project) => {
            // Calculate trending score
            const trendingScore = calculateTrendingScore(project);

            // Calculate likedByUser
            let likedByUser = false;
            if (currentUser && project.likes && Array.isArray(project.likes)) {
                const userIdStr = currentUser._id.toString();
                likedByUser = project.likes.some((likeId: any) => likeId.toString() === userIdStr);
            }

            return {
                ...project,
                trendingScore,
                likedByUser
            };
        });

        console.log('🔥 Trending API - Projects with trending scores:', projectsWithScores.length);

        // Step 4: Sort by trending score (descending)
        const sortedProjects = projectsWithScores.sort((a, b) => b.trendingScore - a.trendingScore);

        // Step 5: Add rank to each project
        const rankedProjects = sortedProjects.slice(0, limit).map((project, index) => ({
            ...project,
            rank: index + 1
        }));

        console.log(`🔥 Trending API - Returning ${rankedProjects.length} trending projects`);
        console.log('🔥 Top 3:', rankedProjects.slice(0, 3).map(p => ({
            title: p.title,
            score: p.trendingScore,
            rank: p.rank,
            author: p.author.name
        })));

        return NextResponse.json({
            success: true,
            projects: rankedProjects,
            total: rankedProjects.length
        });

    } catch (error) {
        console.error('🔥 Trending API Error Details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            error: error
        });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch trending projects',
                projects: [],
                total: 0
            },
            { status: 500 }
        );
    }
}
