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

        // Get search parameter
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search')?.trim();

        // Build query with search filter
        let query: any = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: new RegExp(search, 'i') } },
                    { email: { $regex: new RegExp(search, 'i') } }
                ]
            };
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
