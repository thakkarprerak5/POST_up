import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getDeletedProjects } from '@/models/Project';

/**
 * GET /api/projects/deleted
 * Get all deleted projects that can still be restored
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const deletedProjects = await getDeletedProjects(user._id.toString());
    
    // Calculate time remaining for each project
    const now = new Date();
    const projectsWithTimeRemaining = deletedProjects.map(project => ({
      ...project.toObject(),
      timeRemaining: project.restoreAvailableUntil ? 
        Math.max(0, project.restoreAvailableUntil.getTime() - now.getTime()) : 0,
      hoursRemaining: project.restoreAvailableUntil ? 
        Math.max(0, (project.restoreAvailableUntil.getTime() - now.getTime()) / (1000 * 60 * 60)) : 0
    }));

    return Response.json(projectsWithTimeRemaining);
  } catch (error: any) {
    console.error('GET /api/projects/deleted error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
