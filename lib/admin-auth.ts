import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { NextResponse } from 'next/server';

export type AuthResult =
    | { authorized: true; session: any; user: any }
    | { authorized: false; error: string; status: number; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return {
            authorized: false,
            error: 'Unauthorized',
            status: 401,
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        };
    }
    return { authorized: true, session, user: session.user };
}

export async function requireAdmin(): Promise<AuthResult> {
    const auth = await requireAuth();
    if (!auth.authorized) return auth;

    const role = (auth.user as any).type || auth.user.role;
    if (role !== 'admin' && role !== 'super-admin') {
        return {
            authorized: false,
            error: 'Forbidden - Admin access required',
            status: 403,
            response: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        };
    }
    return auth;
}

export async function requireSuperAdmin(): Promise<AuthResult> {
    const auth = await requireAuth();
    if (!auth.authorized) return auth;

    const role = (auth.user as any).type || auth.user.role;
    if (role !== 'super-admin') {
        return {
            authorized: false,
            error: 'Forbidden - Super Admin access required',
            status: 403,
            response: NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
        };
    }
    return auth;
}
