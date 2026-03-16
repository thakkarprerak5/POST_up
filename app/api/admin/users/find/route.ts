import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';

async function checkAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'admin' || user.type === 'super-admin' ||
        user.role === 'admin' || user.role === 'super-admin';
}

export async function GET(req: NextRequest) {
    try {
        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email')?.trim(); // Trim whitespace

        if (!email) {
            return NextResponse.json({
                error: 'Email parameter is required'
            }, { status: 400 });
        }

        await connectDB();

        // Search for user by email (case-insensitive, exact match)
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }).select('-password');

        if (!user) {
            return NextResponse.json({
                error: 'User not found',
                message: `No user found with email: ${email}`
            }, { status: 404 });
        }

        console.log('✅ User found:', { email: user.email, type: user.type, id: user._id });

        return NextResponse.json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            type: user.type,
            createdAt: user.createdAt
        });

    } catch (error: any) {
        console.error('❌ User search error:', error);
        return NextResponse.json({
            error: 'Search failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
