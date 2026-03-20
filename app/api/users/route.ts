import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

/**
 * GET /api/users
 * Returns a list of all registered users excluding the currently logged-in user.
 * Available to any authenticated user (students, mentors, admins) for Chat discovery.
 */
export async function GET(request: Request) {
  try {
    // 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 2. Find the current user's document to get their ObjectId
    const currentUser = await User.findOne({ email: session.user.email }).select('_id').lean();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Pagination
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
    const search = url.searchParams.get('q') || '';

    // 4. Build query — exclude current user, optionally search by name
    const query: any = { _id: { $ne: (currentUser as any)._id } };
    if (search) {
      query.fullName = { $regex: search, $options: 'i' };
    }

    // 5. Fetch users — only safe, non-sensitive fields
    const users = await User.find(query)
      .select('fullName type photo')
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    // 6. Format response
    const mappedUsers = (users as any[]).map((user) => ({
      _id: user._id.toString(),
      id: user._id.toString(),
      name: user.fullName || 'Unknown User',
      fullName: user.fullName || 'Unknown User',
      type: user.type,
      photo: user.photo || '/placeholder-user.jpg',
      avatar: user.photo || '/placeholder-user.jpg',
    }));

    return NextResponse.json(mappedUsers);
  } catch (error: any) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}