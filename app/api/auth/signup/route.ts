// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/models/User';
import { connectDB } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Successfully connected to database');

    // Parse form data
    const formData = await req.formData();
    
    // Log form data for debugging
    const formDataObj = Object.fromEntries(formData.entries());
    console.log('Form data received:', formDataObj);

    // Get text fields with proper type checking
    const fullName = formData.get('fullName')?.toString() || '';
    const email = formData.get('email')?.toString()?.toLowerCase() || ''; // Convert email to lowercase
    const password = formData.get('password')?.toString() || '';
    const type = (formData.get('type') as 'student' | 'mentor') || 'student';
    const file = formData.get('profileImage') as File | null;

    // Get role-specific fields with proper type checking
    const enrollmentNo = formData.get('enrollmentNo')?.toString() || '';
    const course = formData.get('course')?.toString() || '';
    const branch = formData.get('branch')?.toString() || '';
    const department = formData.get('department')?.toString() || '';
    const expertise = formData.get('expertise')?.toString() || '';

    // Input validation
    if (!fullName || !email || !password || !type) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Handle file upload
    let photoUrl = '/default-avatar.png';
    if (file && file.size > 0) {
      try {
        // Ensure uploads directory exists
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const fileExt = file.name.split('.').pop() || 'png';
        const filename = `${uuidv4()}.${fileExt}`;
        const filePath = join(uploadsDir, filename);
        
        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Ensure the uploads directory exists
        await mkdir(uploadsDir, { recursive: true });
        await writeFile(filePath, buffer);
        
        photoUrl = `/uploads/${filename}`;
      } catch (fileError) {
        console.error('Error saving file:', fileError);
        // Continue with default avatar
      }
    }

    // Create user with profile based on type
    const userData: any = {
      fullName: fullName.trim(),
      email: email.trim(),
      password: password, // Password will be hashed by the pre-save hook
      type,
      photo: photoUrl,
      profile: {
        type,
        joinedDate: new Date(),
        bio: '',
        socialLinks: {},
        ...(type === 'student'
          ? {
              enrollmentNo: enrollmentNo.trim(),
              course: course.trim(),
              branch: branch.trim(),
              year: 1,
              skills: [],
              projects: []
            }
          : {
              department: department.trim(),
              expertise: expertise ? expertise.split(',').map((e: string) => e.trim()).filter(Boolean) : [],
              position: 'Mentor',
              experience: 0,
              researchAreas: [],
              achievements: [],
              officeHours: 'To be scheduled',
              projectsSupervised: []
            })
      }
    };

    console.log('Creating user with data:', JSON.stringify(userData, null, 2));
    
    // Create the user
    const user = await createUser(userData);
    console.log('User created successfully:', user._id);

    // Convert Mongoose document to plain object and remove sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return NextResponse.json(
      { 
        success: true, 
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          type: user.type,
          photo: user.photo,
          profile: user.profile
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Log detailed error information
    const errorDetails = {
      message: error.message,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      ...(error.errors && { 
        errors: Object.entries(error.errors).reduce((acc: any, [key, value]) => {
          acc[key] = (value as any).message;
          return acc;
        }, {})
      })
    };
    
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    // Handle specific errors
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return NextResponse.json(
        { error: 'Email already in use. Please use a different email or log in.' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const errorMessages = error.errors ? 
        Object.values(error.errors).map((e: any) => e.message) : 
        ['Validation failed. Please check your input.'];
      
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errorMessages
        },
        { status: 400 }
      );
    }
    
    // For other errors, return a generic message in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An error occurred during signup. Please try again.';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          details: errorDetails 
        })
      },
      { status: 500 }
    );
  }
}