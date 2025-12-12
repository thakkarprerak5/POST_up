import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

/**
 * POST /api/users/[id]/follow
 * Follow or unfollow a user (especially mentors)
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const currentUser = await User.findOne({ email: session.user.email }).exec();
    if (!currentUser) {
      return Response.json({ error: 'Current user not found' }, { status: 404 });
    }

    const targetUser = await User.findById(params.id).exec();
    if (!targetUser) {
      return Response.json({ error: 'Target user not found' }, { status: 404 });
    }

    const currentUserId = currentUser._id.toString();
    const targetUserId = targetUser._id.toString();

    // Prevent self-follow
    if (currentUserId === targetUserId) {
      return Response.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const followIndex = currentUser.following.indexOf(targetUserId);
    const isFollowingIndex = targetUser.followers.indexOf(currentUserId);

    if (followIndex > -1) {
      // Unfollow
      currentUser.following.splice(followIndex, 1);
      currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);
      
      if (isFollowingIndex > -1) {
        targetUser.followers.splice(isFollowingIndex, 1);
        targetUser.followerCount = Math.max(0, targetUser.followerCount - 1);
      }
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      currentUser.followingCount = currentUser.following.length;
      
      targetUser.followers.push(currentUserId);
      targetUser.followerCount = targetUser.followers.length;
    }

    await currentUser.save();
    await targetUser.save();

    return Response.json({
      following: followIndex === -1,
      followerCount: targetUser.followerCount,
      followingCount: currentUser.followingCount
    });
  } catch (error: any) {
    console.error('POST /api/users/[id]/follow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
