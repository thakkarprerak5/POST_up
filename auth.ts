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
            name: user.fullName,
            image: user.photo,
            role: user.type
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
        if (user.image) token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Add these exports at the bottom of the file
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };