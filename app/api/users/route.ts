import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth'; // Adjust this path if your auth options are elsewhere
import User from '@/models/User'; // Adjust this path to your actual User model
import { connectDB } from '@/lib/db'; // Adjust this path to your DB connection file

export async function GET(request: Request) {
  try {
    // 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 2. Authorization Check (Admin Only)
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || (currentUser.type !== 'admin' && currentUser.type !== 'super-admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Pagination Setup
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);

    // 4. Secure Database Query (Exclude emails and passwords)
    const users = await User.find({})
      .select('fullName type photo profile isGroupLead') 
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
      .exec();
    
    // 5. Format Response safely
    const mappedUsers = users.map((user: any) => ({
      _id: user._id,
      name: user.fullName || 'Unknown User',
      type: user.type,
      photo: user.photo || user.profile?.photo || '/placeholder.svg',
      isGroupLead: user.profile?.isGroupLead || false
    }));
    
    return NextResponse.json({
      users: mappedUsers,
      pagination: {
        page,
        limit,
        total: await User.countDocuments()
      }
    });
  } catch (error: any) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}