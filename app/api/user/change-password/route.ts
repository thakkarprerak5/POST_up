// app/api/user/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendPasswordChangedEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized. Please log in.' },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await request.json();

        // Validate inputs
        if (!currentPassword || typeof currentPassword !== 'string') {
            return NextResponse.json(
                { error: 'Current password is required' },
                { status: 400 }
            );
        }

        if (!newPassword || typeof newPassword !== 'string') {
            return NextResponse.json(
                { error: 'New password is required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'New password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        if (currentPassword === newPassword) {
            return NextResponse.json(
                { error: 'New password must be different from current password' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Find user by email from session
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 400 }
            );
        }

        // Update password (Mongoose pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        console.log(`✅ Password changed successfully for user: ${user.email}`);

        // Send confirmation email (non-blocking)
        try {
            await sendPasswordChangedEmail(user.email);
        } catch (emailError) {
            console.error('⚠️ Failed to send password changed confirmation email:', emailError);
            // Don't fail the request if confirmation email fails
        }

        return NextResponse.json(
            { message: 'Password changed successfully.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('❌ Change password error:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
