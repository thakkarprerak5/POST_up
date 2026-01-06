import request from 'supertest';
import { connectDB } from '@/lib/db';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// Mock next-auth
jest.mock('next-auth/next');
const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

// Import the route handlers directly
import { PATCH, DELETE } from '@/app/api/projects/[id]/comments/[commentId]/route';

// Mock the database connection
let mongoServer: MongoMemoryServer;

// Mock user data
const mockUser = {
  _id: '507f191e810c19729de860ea',
  email: 'test@example.com',
  name: 'Test User',
};

// Mock project data
const mockProject = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Project',
  description: 'Test Description',
  author: {
    id: mockUser._id,
    name: mockUser.name,
    email: mockUser.email,
  },
  comments: [
    {
      _id: '507f1f77bcf86cd799439012',
      text: 'Test comment',
      userId: mockUser._id,
      userName: mockUser.name,
      createdAt: new Date(),
    },
  ],
};

describe('Comments API', () => {
  beforeAll(async () => {
    // Start an in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  describe('PATCH /api/projects/[id]/comments/[commentId]', () => {
    it('should update a comment', async () => {
      // Mock the session
      mockedGetServerSession.mockResolvedValueOnce({
        user: { email: mockUser.email },
        expires: new Date(Date.now() + 3600 * 1000).toISOString(),
      });

      // Mock the request
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        body: { text: 'Updated comment' },
        query: {
          id: mockProject._id,
          commentId: mockProject.comments[0]._id,
        },
      });

      // Call the API route handler
      const response = await PATCH(
        req as unknown as NextRequest,
        { params: Promise.resolve({ id: mockProject._id, commentId: mockProject.comments[0]._id }) }
      );
      const data = await response.json();

      // Assert the response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Comment updated successfully');
      expect(data.comment.text).toBe('Updated comment');
    });
  });

  describe('DELETE /api/projects/[id]/comments/[commentId]', () => {
    it('should delete a comment', async () => {
      // Mock the session
      mockedGetServerSession.mockResolvedValueOnce({
        user: { email: mockUser.email },
        expires: new Date(Date.now() + 3600 * 1000).toISOString(),
      });

      // Call the API route handler
      const response = await DELETE(
        {} as NextRequest,
        { params: Promise.resolve({ id: mockProject._id, commentId: mockProject.comments[0]._id }) }
      );
      const data = await response.json();

      // Assert the response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Comment deleted successfully');
    });
  });
});
