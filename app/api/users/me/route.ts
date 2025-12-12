import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

/**
 * GET /api/users/me
 * Get current authenticated user's profile and following list
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email })
      .select('name email avatar profile following followers followerCount followingCount')
      .lean()
      .exec();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(user);
  } catch (error: any) {
    console.error('GET /api/users/me error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
