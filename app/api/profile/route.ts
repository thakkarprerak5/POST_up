import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { updateUserProfile, findUserById, findUserByEmail } from '@/models/User';
import { authOptions } from '@/auth';
import { Session } from 'next-auth';
import { connectDB } from '@/lib/db';

type SessionWithUser = Session & {
  user: {
    email: string;
    name?: string | null;
    image?: string | null;
    id: string;
    role?: string;
  };
};

// GET /api/profile
export async function GET(request: Request) {
  await connectDB();
  const url = new URL(request.url);
  const idParam = url.searchParams.get('id');
  const emailParam = url.searchParams.get('email');
  const session = await getServerSession(authOptions) as SessionWithUser | null;

  try {
    let user = null as any;

    if (session?.user?.id) {
      user = await findUserById(session.user.id);
    } else if (idParam) {
      user = await findUserById(idParam);
    } else if (emailParam) {
      user = await findUserByEmail(emailParam);
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userObj = user.toObject();
    delete userObj.password;
    return NextResponse.json(userObj);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/profile
export async function PATCH(request: Request) {
  await connectDB();
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updateData = await request.json();
    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { _id, email, type, id, ...safeUpdateData } = updateData;

    await updateUserProfile(user._id!.toString(), safeUpdateData);

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
