// auth.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByEmail } from './models/User';
import bcrypt from 'bcryptjs';
import { connectDB } from './lib/db';
import mongoose from 'mongoose';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          console.log('🔍 Looking for user with email:', credentials.email);

          // Temporary bypass: Use direct database query instead of TypeScript model
          const db = mongoose.connection.db;
          if (!db) {
            console.log('Database not connected');
            return null;
          }

          // Debug: Check if we can access the collection
          const collections = await db.listCollections().toArray();
          console.log('Available collections:', collections.map(c => c.name));

          const user = await db.collection('users').findOne({ email: credentials.email });

          console.log('👤 User found:', user ? 'YES' : 'NO');
          if (user) {
            console.log('📧 User email:', user.email);
            console.log('👤 User type:', user.type);
          } else {
            // Check what users exist
            const allUsers = await db.collection('users').find({}).toArray();
            console.log('Total users in database:', allUsers.length);
            allUsers.forEach(u => {
              console.log('  -', u.email);
            });
          }

          if (!user) {
            console.log('No user found with this email');
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log('Invalid password');
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.fullName, // Support both for safety
            image: user.photoUrl || user.photo,
            role: user.type,
            type: user.type
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        console.log('🔹 [JWT] Initial sign in for user:', user.id);
        token.role = (user as any).role || (user as any).type;
        token.id = user.id;
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
        if (user.image) token.image = user.image;

        token.banStatus = (user as any).banStatus || (user as any).account_status || 'ACTIVE';
        token.banReason = (user as any).banReason;
        token.banExpiresAt = (user as any).banExpiresAt;
      }

      // Refetch user data on every JWT access to ensure status is fresh
      if (token.email) {
        try {
          await connectDB();
          const db = mongoose.connection.db;
          if (db) {
            const freshUser = await db.collection('users').findOne({ email: token.email });
            if (freshUser) {
              // Update token with fresh data
              token.banStatus = freshUser.account_status || 'ACTIVE';
              token.banReason = freshUser.banReason;
              token.banExpiresAt = freshUser.banExpiresAt;

              // Also update role if it changed
              token.role = freshUser.type;

              // FIX: Sync profile photo so it always reflects the latest uploaded photo
              const freshPhoto = freshUser.photo || freshUser.photoUrl;
              if (freshPhoto) {
                token.image = freshPhoto;
              }
            }
          }
        } catch (error) {
          console.error('Error refetching user data in JWT callback:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        try {
          const { logDebug } = require('./lib/debug-logger');
          logDebug('AUTH_SESSION_CALLBACK', {
            tokenId: token.id,
            tokenSub: token.sub,
            tokenKeys: Object.keys(token)
          });
        } catch (e) { console.error(e); }

        // Return a NEW object to ensure changes persist and aren't overwritten by internal references
        return {
          ...session,
          user: {
            ...session.user,
            id: (token.id as string) || (token.sub as string),
            role: (token.role as string) === 'super_admin' ? 'super-admin' : (token.role as string),
            name: token.name,
            email: token.email,
            image: (token.image as string) || null,
            type: (token.role as string),
            banStatus: (token.banStatus as string) || 'ACTIVE',
            account_status: (token.banStatus as string) || 'ACTIVE', // Ensure account_status is available
            banReason: (token.banReason as string) || null,
            banExpiresAt: (token.banExpiresAt as string) || null
          }
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Add these exports at the bottom of the file
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };