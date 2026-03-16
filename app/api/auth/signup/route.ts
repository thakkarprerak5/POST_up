import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/models/User';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    const email = formData.get('email')?.toString()?.toLowerCase() || '';
    const password = formData.get('password')?.toString() || '';
    const type = (formData.get('type') as 'student' | 'mentor') || 'student';
    const file = formData.get('profileImage') as File | null;

    // Get role-specific fields
    const enrollmentNo = formData.get('enrollmentNo')?.toString() || '';
    const course = formData.get('course')?.toString() || '';
    const branch = formData.get('branch')?.toString() || '';
    const department = formData.get('department')?.toString() || '';
    const expertise = formData.get('expertise')?.toString() || '';

    // Input validation
    if (!fullName || !email || !password || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Handle file upload
    let photoUrl = '/placeholder-user.jpg';
    if (file && file.size > 0) {
      try {
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });
        const fileExt = file.name.split('.').pop() || 'png';
        const filename = `${uuidv4()}.${fileExt}`;
        const filePath = join(uploadsDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);
        photoUrl = `/uploads/${filename}`;
      } catch (fileError) {
        console.error('Error saving file:', fileError);
      }
    }

    // Build embedded profile to match profileSchema exactly
    let embeddedProfile: any;
    if (type === 'student') {
      embeddedProfile = {
        type: 'student',
        enrollmentNo: enrollmentNo.trim() || `S-${Date.now()}`,
        course: course.trim(),
        branch: branch.trim(),
        bio: '',
        skills: [],
        joinedDate: new Date(),
        socialLinks: { github: '', linkedin: '', portfolio: '' }
      };
    } else {
      embeddedProfile = {
        type: 'mentor',
        department: department.trim(),
        expertise: expertise ? expertise.split(',').map((e: string) => e.trim()).filter(Boolean) : [],
        position: 'Mentor',
        experience: 0,
        bio: '',
        skills: [],
        joinedDate: new Date(),
        socialLinks: { github: '', linkedin: '', portfolio: '' }
      };
    }

    // SINGLE-STEP: Create User with embedded profile.
    // The pre-save hook in User.ts will hash the password automatically.
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.trim(),
      password: password, // plain text — pre-save hook hashes it
      type,
      photo: photoUrl,
      isActive: true,
      account_status: 'ACTIVE',
      profile: embeddedProfile
    });

    const savedUser = await newUser.save();
    console.log('User created successfully:', savedUser._id);

    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    return NextResponse.json(
      { success: true, user: userResponse },
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