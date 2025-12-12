import { connectDB } from '@/lib/db';
import User from '@/models/User';

/**
 * GET /api/users/[id]
 * Get user profile by ID
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = await User.findById(params.id)
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(user);
  } catch (error: any) {
    console.error('GET /api/users/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
