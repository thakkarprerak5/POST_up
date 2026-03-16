import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

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

        await connectDB();
        const students = await User.find({ type: 'student' }).select('-password').sort({ createdAt: -1 });

        return NextResponse.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}
