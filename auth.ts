// auth.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from './lib/db';
import mongoose from 'mongoose';

// Detect if running on Vercel (HTTPS) to set secure cookies
const useSecureCookies = !!process.env.VERCEL;

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
          console.log('[AUTH] Looking for user with email:', credentials.email);

          const db = mongoose.connection.db;
          if (!db) {
            console.log('[AUTH] Database not connected');
            return null;
          }

          const user = await db.collection('users').findOne({ email: credentials.email });

          if (!user) {
            console.log('[AUTH] No user found with email:', credentials.email);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password for:', credentials.email);
            return null;
          }

          console.log('[AUTH] Login successful for:', credentials.email, 'type:', user.type);

          // Return the user object that NextAuth will pass to the jwt callback
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.fullName,
            image: user.photo || user.photoUrl || null,
            role: user.type,
            type: user.type,
          };
        } catch (error) {
          console.error('[AUTH] Authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, copy user fields to the token
      if (user) {
        console.log('[JWT] Initial sign in for:', user.email);
        token.id = user.id;
        token.role = (user as any).role || (user as any).type;
        token.email = user.email || undefined;
        token.name = user.name || undefined;
        token.image = user.image || undefined;
        token.banStatus = (user as any).banStatus || 'ACTIVE';
        token.banReason = (user as any).banReason || undefined;
        token.banExpiresAt = (user as any).banExpiresAt || undefined;
      }

      // Refresh user data from DB on every token access to keep status/photo in sync
      if (token.email) {
        try {
          await connectDB();
          const db = mongoose.connection.db;
          if (db) {
            const freshUser = await db.collection('users').findOne({ email: token.email });
            if (freshUser) {
              token.banStatus = freshUser.account_status || 'ACTIVE';
              token.banReason = freshUser.banReason;
              token.banExpiresAt = freshUser.banExpiresAt;
              token.role = freshUser.type;

              // Sync profile photo
              const freshPhoto = freshUser.photo || freshUser.photoUrl;
              if (freshPhoto) {
                token.image = freshPhoto;
              }
            }
          }
        } catch (error) {
          console.error('[JWT] Error refreshing user data:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Map token fields → session.user so the client has access
      if (session?.user) {
        console.log('[SESSION] Building session for token.id:', token.id, 'token.sub:', token.sub);

        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = (token.role as string) === 'super_admin' ? 'super-admin' : (token.role as string);
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = (token.image as string) || null;
        (session.user as any).type = (token.role as string);
        (session.user as any).banStatus = (token.banStatus as string) || 'ACTIVE';
        (session.user as any).account_status = (token.banStatus as string) || 'ACTIVE';
        (session.user as any).banReason = (token.banReason as string) || null;
        (session.user as any).banExpiresAt = (token.banExpiresAt as string) || null;
      }

      // CRUCIAL: always return the session object
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
  // Vercel-aware cookie configuration
  cookies: useSecureCookies
    ? {
        sessionToken: {
          name: `__Secure-next-auth.session-token`,
          options: {
            httpOnly: true,
            sameSite: 'lax' as const,
            path: '/',
            secure: true,
          },
        },
      }
    : undefined,
};

// Route handler exports
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };