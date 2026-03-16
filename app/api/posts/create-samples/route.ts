import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Post } from '@/models/Post';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find or create sample users
    let sampleUsers = await User.find({
      email: { $in: ['sarah@example.com', 'alex@example.com', 'maya@example.com'] }
    });

    // Create sample users if they don't exist
    if (sampleUsers.length < 3) {
      const usersToCreate = [
        {
          fullName: 'Sarah Johnson',
          email: 'sarah@example.com',
          type: 'student',
          photo: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random&color=fff'
        },
        {
          fullName: 'Alex Chen',
          email: 'alex@example.com',
          type: 'mentor',
          photo: 'https://ui-avatars.com/api/?name=Alex+Chen&background=random&color=fff'
        },
        {
          fullName: 'Maya Patel',
          email: 'maya@example.com',
          type: 'student',
          photo: 'https://ui-avatars.com/api/?name=Maya+Patel&background=random&color=fff'
        }
      ];

      for (const userData of usersToCreate) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const newUser = new User(userData);
          await newUser.save();
          sampleUsers.push(newUser);
        }
      }
    }

    // Clear existing posts
    await Post.deleteMany({});

    // Create sample posts
    const samplePosts = [
      {
        content: "Just launched my new e-commerce dashboard project! 🚀 It features real-time analytics, inventory management, and order tracking. Built with React, Node.js, and MongoDB. Would love to get your feedback!",
        image: '/generic-data-dashboard.png',
        author: sampleUsers.find(u => u.email === 'sarah@example.com')?._id
      },
      {
        content: "Working on an AI-powered content generation tool that helps create blog posts and social media content. The challenge is making it sound natural and engaging. Any tips on improving AI writing quality? 🤔",
        image: '/futuristic-ai-interface.png',
        author: sampleUsers.find(u => u.email === 'alex@example.com')?._id
      },
      {
        content: "Finally completed my task management app! It's a collaborative tool with real-time updates and team workspaces. The real-time sync was tricky but worth it. Check it out and let me know what you think! 💪",
        image: '/kanban-board.png',
        author: sampleUsers.find(u => u.email === 'maya@example.com')?._id
      },
      {
        content: "Pro tip: Always implement proper error handling in your APIs. Spent 3 hours debugging a silent failure yesterday. Remember to log errors and provide meaningful error messages to your users! 📝",
        author: sampleUsers.find(u => u.email === 'alex@example.com')?._id
      },
      {
        content: "Looking for a mentor who has experience with React Native. I'm building a mobile app and could really use some guidance on performance optimization and best practices. Any recommendations? 🙏",
        author: sampleUsers.find(u => u.email === 'sarah@example.com')?._id
      }
    ];

    // Create posts
    const createdPosts = [];
    for (const postData of samplePosts) {
      if (postData.author) {
        const post = new Post(postData);
        await post.save();
        await post.populate('author', 'fullName email photo avatar type');
        createdPosts.push({
          ...post.toObject(),
          id: post._id.toString(),
          author: {
            ...post.author,
            id: post.author._id.toString(),
            name: post.author.fullName || 'Unknown User',
            role: post.author.type || 'student'
          },
          likeCount: 0,
          commentCount: 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdPosts.length} sample posts`,
      posts: createdPosts
    });

  } catch (error) {
    console.error('Error creating sample posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sample posts' },
      { status: 500 }
    );
  }
}
