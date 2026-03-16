import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { listProjects } from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user in database
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id.toString();

    // Calculate date ranges for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log('📊 Activity Stats - User:', user.fullName);
    console.log('📅 Date Range:', {
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
      now: now.toISOString()
    });

    // Query for user's projects
    const userProjectsQuery = {
      'author.id': userId,
      isDeleted: { $ne: true }
    };

    const allProjects = await listProjects(userProjectsQuery, { limit: 1000 });
    console.log('📁 Total projects found:', allProjects.length);

    // Calculate total projects
    const totalProjects = allProjects.length;

    // Calculate projects created this month
    const projectsThisMonth = allProjects.filter((project: any) => {
      const createdAt = new Date(project.createdAt);
      return createdAt >= startOfMonth && createdAt <= endOfMonth;
    }).length;

    console.log('📈 Monthly projects:', projectsThisMonth);

    // Calculate minutes spent (real-time calculation)
    let totalMinutesSpent = 0;

    // Method 1: Based on project activity (more realistic)
    // Each project contributes estimated minutes based on complexity and recent activity
    allProjects.forEach((project: any) => {
      const createdAt = new Date(project.createdAt);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Base minutes per project (estimated development time)
      let projectMinutes = 30; // Base 30 minutes per project
      
      // Add minutes for engagement (likes, comments, shares)
      const engagementMinutes = (project.likeCount || 0) * 2 + // 2 minutes per like
                               (project.comments?.length || 0) * 5 + // 5 minutes per comment
                               (project.shareCount || 0) * 3; // 3 minutes per share
      
      projectMinutes += engagementMinutes;
      
      // Cap maximum minutes per project to avoid unrealistic values
      projectMinutes = Math.min(projectMinutes, 240); // Max 4 hours per project
      
      totalMinutesSpent += projectMinutes;
    });

    // Method 2: Alternative calculation based on login sessions (if available)
    // This would require a UserActivity collection - for now using project-based calculation

    console.log('⏱️ Calculated minutes:', {
      totalMinutesSpent,
      method: 'project-based',
      projectsAnalyzed: totalProjects
    });

    // Calculate additional stats for UX
    const daysInMonth = endOfMonth.getDate();
    const avgMinutesPerDay = Math.round(totalMinutesSpent / Math.max(daysInMonth, 1));
    const avgProjectsPerDay = Math.round((projectsThisMonth / Math.max(daysInMonth, 1)) * 100) / 100;

    const stats = {
      totalProjects,
      projectsThisMonth,
      totalMinutesSpent,
      avgMinutesPerDay,
      avgProjectsPerDay,
      // Additional useful stats
      userId,
      userName: user.fullName,
      calculatedAt: now.toISOString(),
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' })
    };

    console.log('✅ Final Activity Stats:', stats);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    });

    // Return safe default values on error
    return NextResponse.json({
      totalProjects: 0,
      projectsThisMonth: 0,
      totalMinutesSpent: 0,
      avgMinutesPerDay: 0,
      avgProjectsPerDay: 0,
      error: 'Failed to calculate stats'
    }, { status: 500 });
  }
}
