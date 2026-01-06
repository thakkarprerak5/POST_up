import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { updateUserProfile, findUserById, findUserByEmail } from '@/models/User';
import { authOptions } from '@/auth';
import { Session } from 'next-auth';
import { connectDB } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { listProjects } from '@/models/Project';

// Helper function to find user by various ID types
const findUserByAnyId = async (id: string) => {
  try {
    // For non-ObjectId strings, try email first (most common)
    if (!/^[0-9a-f]{24}$/i.test(id)) {
      const emailUser = await findUserByEmail(id);
      if (emailUser) return emailUser;
      
      // If not found by email and not a valid ObjectId, return null
      return null;
    }
    
    // For valid ObjectIds, try to find by ID
    return await findUserById(id);
  } catch (error) {
    console.log('Error finding user by ID:', id, error);
    return null;
  }
};

type SessionWithUser = Session & {
  user: {
    email: string;
    name?: string | null;
    image?: string | null;
    id: string;
    role?: string;
  };
};

// GET /api/profile
export async function GET(request: Request) {
  await connectDB();
  const url = new URL(request.url);
  const idParam = url.searchParams.get('id');
  const emailParam = url.searchParams.get('email');
  const session = await getServerSession(authOptions) as SessionWithUser | null;

  try {
    let user = null as any;

    // Priority: idParam > emailParam > session user
    if (idParam) {
      user = await findUserByAnyId(idParam);
    } else if (emailParam) {
      user = await findUserByEmail(emailParam);
    } else if (session?.user?.id) {
      user = await findUserById(session.user.id);
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's uploaded projects
    const userProjects = await listProjects(
      { 'author.id': user._id.toString() },
      { sort: { createdAt: -1 } }
    );

    const userObj = user.toObject();
    delete userObj.password;
    
    // Add uploaded projects to the response
    userObj.uploadedProjects = userProjects.map((project: any) => ({
      _id: project._id.toString(),
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      tags: project.tags,
      images: project.images,
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl,
      author: project.author,
      createdAt: project.createdAt,
      likeCount: project.likeCount || 0,
      commentCount: project.comments?.length || 0,
    }));

    return NextResponse.json(userObj);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/profile
export async function PATCH(request: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Accept FormData to support file upload from client
    const formData = await request.formData();

    const file = formData.get('profileImage') as any;
    const bannerFile = formData.get('bannerImage') as any;

    let photoUrl: string | undefined;
    let bannerUrl: string | undefined;

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if ((file && typeof file.arrayBuffer === 'function' && file.size > 0) || (bannerFile && typeof bannerFile.arrayBuffer === 'function' && bannerFile.size > 0)) {
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (mkdirErr) {
        console.error('Error creating uploads dir:', mkdirErr);
      }
    }

    if (file && typeof file.arrayBuffer === 'function' && file.size > 0) {
      try {
        const ext = (file.name || 'png').split('.').pop() || 'png';
        const filename = `${uuidv4()}.${ext}`;
        const filePath = join(uploadsDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);
        photoUrl = `/uploads/${filename}`;
      } catch (fileError) {
        console.error('Error saving uploaded profile image:', fileError);
      }
    }

    if (bannerFile && typeof bannerFile.arrayBuffer === 'function' && bannerFile.size > 0) {
      try {
        const ext = (bannerFile.name || 'png').split('.').pop() || 'png';
        const filename = `${uuidv4()}.${ext}`;
        const filePath = join(uploadsDir, filename);
        const bytes = await bannerFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);
        bannerUrl = `/uploads/${filename}`;
      } catch (fileError) {
        console.error('Error saving uploaded banner image:', fileError);
      }
    }

    // Build profile update object from form fields
    const profileUpdate: any = {};

    const fullName = formData.get('fullName')?.toString();
    const bio = formData.get('bio')?.toString();
    const enrollmentNo = formData.get('enrollmentNo')?.toString();
    const course = formData.get('course')?.toString();
    const branch = formData.get('branch')?.toString();
    const yearVal = formData.get('year')?.toString();
    const skillsRaw = formData.get('skills')?.toString();
    const github = formData.get('github')?.toString();
    const linkedin = formData.get('linkedin')?.toString();
    const portfolio = formData.get('portfolio')?.toString();

    const department = formData.get('department')?.toString();
    const expertiseRaw = formData.get('expertise')?.toString();
    const position = formData.get('position')?.toString();
    const experienceVal = formData.get('experience')?.toString();
    const researchAreasRaw = formData.get('researchAreas')?.toString();
    const achievementsRaw = formData.get('achievements')?.toString();
    const officeHours = formData.get('officeHours')?.toString();

    if (bio !== undefined) profileUpdate.bio = bio;
    if (enrollmentNo !== undefined) profileUpdate.enrollmentNo = enrollmentNo;
    if (course !== undefined) profileUpdate.course = course;
    if (branch !== undefined) profileUpdate.branch = branch;
    if (yearVal) profileUpdate.year = parseInt(yearVal) || undefined;
    if (skillsRaw !== undefined) profileUpdate.skills = skillsRaw ? skillsRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (department !== undefined) profileUpdate.department = department;
    if (expertiseRaw !== undefined) profileUpdate.expertise = expertiseRaw ? expertiseRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (position !== undefined) profileUpdate.position = position;
    if (experienceVal) profileUpdate.experience = parseInt(experienceVal) || undefined;
    if (researchAreasRaw !== undefined) profileUpdate.researchAreas = researchAreasRaw ? researchAreasRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (achievementsRaw !== undefined) profileUpdate.achievements = achievementsRaw ? achievementsRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (officeHours !== undefined) profileUpdate.officeHours = officeHours;

    // Social links
    const socialLinks: any = {};
    if (github) socialLinks.github = github;
    if (linkedin) socialLinks.linkedin = linkedin;
    if (portfolio) socialLinks.portfolio = portfolio;
    if (Object.keys(socialLinks).length) profileUpdate.socialLinks = socialLinks;

    // Banner color (simple color hex string) and banner image URL
    const bannerColor = formData.get('bannerColor')?.toString();
    const bannerImageField = formData.get('bannerImage')?.toString();
    if (bannerColor !== undefined) profileUpdate.bannerColor = bannerColor;
    // If a new banner file was uploaded, use its URL. Otherwise if the form included an explicit bannerImage field (possibly empty string), use that to set/clear the stored value.
    if (bannerUrl) {
      profileUpdate.bannerImage = bannerUrl;
    } else if (bannerImageField !== undefined) {
      profileUpdate.bannerImage = bannerImageField;
    }

    // Update profile using helper
    await updateUserProfile(session.user.id, profileUpdate);

    // Update top-level fields like fullName and photo on user document
    const user = await findUserById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Ensure profile object exists and has required `type` to avoid validation errors
    if (!user.profile) user.profile = { type: (user.type as any) || 'student', joinedDate: new Date() } as any;
    if (!user.profile.type) user.profile.type = (user.type as any) || 'student';

    let changed = false;
    if (fullName) {
      user.fullName = fullName;
      changed = true;
    }
    if (photoUrl) {
      user.photo = photoUrl;
      changed = true;
    }

    if (changed) {
      await user.save();
    }

    // Return the updated user object (without password) so clients can update cache/session
    const fresh = await findUserById(session.user.id);
    if (!fresh) return NextResponse.json({ error: 'User not found after update' }, { status: 404 });
    const userObj = (fresh as any).toObject ? (fresh as any).toObject() : fresh;
    delete userObj.password;
    return NextResponse.json(userObj);
  } catch (error: any) {
    console.error('Profile update error:', error);
    const payload: any = { error: 'Failed to update profile' };
    if (process.env.NODE_ENV === 'development') {
      payload.message = error.message;
      payload.stack = error.stack;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
