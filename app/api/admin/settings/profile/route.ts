import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { name, currentPassword, newPassword, photo } = await req.json();
        const userId = session.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Role check: Only allow if user is an admin or super-admin
        if (user.type !== 'admin' && user.type !== 'super-admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update Name
        if (name && name !== user.fullName) {
            user.fullName = name;
        }

        // Update Photo
        if (photo) {
            // In a real app, this would verify the URL or handle upload
            user.photo = photo;
        }

        // Update Password
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required to set new password' }, { status: 400 });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
            }

            user.password = newPassword; // Pre-save hook will hash this
        }

        await user.save();

        return NextResponse.json({ message: 'Profile updated successfully', user: { name: user.fullName, email: user.email, photo: user.photo } });

    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
