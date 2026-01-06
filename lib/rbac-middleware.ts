import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import User from '@/models/User';

export async function withAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await mongoose.connect(process.env.MONGODB_URI!);
      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Add user info to request for use in handlers
      req.headers.set('x-user-id', user._id.toString());
      req.headers.set('x-user-email', user.email);
      req.headers.set('x-user-role', user.type);
      req.headers.set('x-user-name', user.fullName);

      return await handler(req, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
}

export async function withAdminAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await mongoose.connect(process.env.MONGODB_URI!);
      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user is admin or super admin
      if (user.type !== 'admin' && user.type !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }

      // Add user info to request for use in handlers
      req.headers.set('x-user-id', user._id.toString());
      req.headers.set('x-user-email', user.email);
      req.headers.set('x-user-role', user.type);
      req.headers.set('x-user-name', user.fullName);

      return await handler(req, context);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
}

export async function withSuperAdminAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await mongoose.connect(process.env.MONGODB_URI!);
      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user is super admin
      if (user.type !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 });
      }

      // Add user info to request for use in handlers
      req.headers.set('x-user-id', user._id.toString());
      req.headers.set('x-user-email', user.email);
      req.headers.set('x-user-role', user.type);
      req.headers.set('x-user-name', user.fullName);

      return await handler(req, context);
    } catch (error) {
      console.error('Super admin auth middleware error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
}

export async function withReportingAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await mongoose.connect(process.env.MONGODB_URI!);
      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user is allowed to report (not admin or super admin)
      if (user.type === 'admin' || user.type === 'super_admin') {
        return NextResponse.json({ error: 'Admins and Super Admins cannot report content' }, { status: 403 });
      }

      // Add user info to request for use in handlers
      req.headers.set('x-user-id', user._id.toString());
      req.headers.set('x-user-email', user.email);
      req.headers.set('x-user-role', user.type);
      req.headers.set('x-user-name', user.fullName);

      return await handler(req, context);
    } catch (error) {
      console.error('Reporting auth middleware error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
}
