import { connectDB } from '@/lib/db';
import Project from '@/models/Project';

/**
 * GET /api/users/[id]/projects
 * Get all projects for a specific user
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const projects = await Project.find({ 'author._id': params.id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return Response.json(projects);
  } catch (error: any) {
    console.error('GET /api/users/[id]/projects error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
