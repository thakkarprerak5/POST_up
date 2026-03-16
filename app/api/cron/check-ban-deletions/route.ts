import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User, { getUsersForPermanentDeletion } from '@/models/User';
import Project from '@/models/Project';
import Post from '@/models/Post';
import Comment from '@/models/Comment';

// Security: Verify API key or secret token
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

export async function GET(req: NextRequest) {
    try {
        // Verify authorization
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get users who have been properly banned for more than 48 hours
        const usersToDelete = await getUsersForPermanentDeletion();

        if (usersToDelete.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No users due for permanent deletion',
                deletedCount: 0
            });
        }

        const deletionResults = [];

        for (const user of usersToDelete) {
            try {
                const userId = user._id.toString();

                // Delete all user's content
                const projectsDeleted = await Project.deleteMany({ authorId: userId });
                const postsDeleted = await Post.deleteMany({ authorId: userId });
                const commentsDeleted = await Comment.deleteMany({ userId: userId });

                // Delete the user account
                await User.findByIdAndDelete(userId);

                deletionResults.push({
                    userId,
                    email: user.email,
                    fullName: user.fullName,
                    banTimestamp: user.ban_timestamp,
                    contentDeleted: {
                        projects: projectsDeleted.deletedCount || 0,
                        posts: postsDeleted.deletedCount || 0,
                        comments: commentsDeleted.deletedCount || 0
                    }
                });

                console.log(`✅ Permanently deleted user ${userId} (${user.email}) and all associated content`);
            } catch (error) {
                console.error(`❌ Error deleting user ${user._id}:`, error);
                deletionResults.push({
                    userId: user._id.toString(),
                    error: 'Failed to delete user'
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Permanently deleted ${deletionResults.length} users`,
            deletedCount: deletionResults.length,
            results: deletionResults
        });

    } catch (error) {
        console.error('Error in ban deletion cron job:', error);
        return NextResponse.json({
            error: 'Failed to process ban deletions'
        }, { status: 500 });
    }
}
