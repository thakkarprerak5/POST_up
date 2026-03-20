import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { findUserById, findUserByEmail, updateUserProfile } from '@/models/User';
import User from '@/models/User';
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
    if (!/^[0-9a-f]{24}$/i.test(id)) {
      const emailUser = await findUserByEmail(id);
      if (emailUser) return emailUser;
      return null;
    }
    return await findUserById(id);
  } catch (error) {
    console.log('🔍 Profile API: Error finding user by ID:', id, error);
    return null;
  }
};

// Self-healing: Create missing profile documents for bulk users
const ensureProfileExists = async (user: any) => {
  if (!user || !user._id) return user;
  
  // Check if profile exists and has required fields
  const hasValidProfile = user.profile && 
    typeof user.profile === 'object' && 
    user.profile.type !== undefined;
  
  if (!hasValidProfile) {
    console.log('🔧 Self-Healing: Creating missing profile for user:', user._id);
    
    // Create default profile based on user type
    const defaultProfile = {
      type: user.type === 'mentor' ? 'mentor' : 'student',
      bio: '',
      joinedDate: user.createdAt || new Date(),
      bannerImage: '',
      bannerColor: '',
      enrollmentNo: '',
      course: '',
      branch: '',
      year: 1,
      skills: [],
      department: '',
      expertise: [],
      position: '',
      experience: 0,
      researchAreas: [],
      achievements: [],
      officeHours: 'To be scheduled',
      isGroupLead: false,
      groupLeadRequests: [],
      projectsSupervised: [],
      socialLinks: { github: '', linkedin: '', portfolio: '' },
      projects: []
    };
    
    // Update user with new profile
    await User.findByIdAndUpdate(user._id, { 
      $set: { profile: defaultProfile } 
    });
    
    // Return updated user
    const updatedUser = await findUserById(user._id);
    return updatedUser || user;
  }
  
  return user;
};

// GET /api/profile
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const session = await getServerSession(authOptions);

    let user = null;
    let isPublicView = false;

    // Priority 1: Query parameter for public view
    if (idParam) {
      user = await findUserByAnyId(idParam);
      isPublicView = true;
      console.log('🔍 Profile API: Public view requested for ID:', idParam);
    } 
    // Priority 2: Session for private view
    else if (session?.user?.id) {
      user = await findUserById(session.user.id);
      isPublicView = false;
      console.log('🔍 Profile API: Private view requested for session user:', session.user.id);
    } 
    else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Apply self-healing if profile is missing
    user = await ensureProfileExists(user);

    // Fetch user's uploaded projects
    // author is stored as an ObjectId reference — query by ObjectId directly
    const userProjects = await listProjects(
      { author: user._id, isDeleted: { $ne: true } },
      { sort: { createdAt: -1 }, limit: 100 }
    );

    // Convert Mongoose doc to plain object safely
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    userObj.id = user._id.toString();

    // Use embedded profile directly from User document.
    // Provide a safe fallback object so UI never crashes on missing data.
    userObj.profile = userObj.profile || {
      type: userObj.type === 'mentor' ? 'mentor' : 'student',
      bio: '',
      enrollmentNo: '',
      course: '',
      branch: '',
      skills: [],
      expertise: [],
      socialLinks: { github: '', linkedin: '', portfolio: '' },
      joinedDate: userObj.createdAt || new Date()
    };

    // Ensure top-level fields exist for UI compatibility
    userObj.fullName = userObj.fullName || userObj.name || 'User';
    userObj.photo = userObj.photo || userObj.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userObj.fullName)}&background=random&color=fff&size=200`;

    // Add uploaded projects to response
    userObj.uploadedProjects = userProjects.map((project: any) => ({
      _id: project._id,
      id: project._id,
      title: project.title,
      description: project.description,
      tags: project.tags,
      images: project.images,
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl,
      createdAt: project.createdAt,
      likeCount: project.likeCount || 0,
      commentCount: project.comments?.length || 0,
    }));

    // Public view: Exclude sensitive fields
    if (isPublicView) {
      console.log('🔍 Profile API: Returning public view (sensitive fields excluded)');
      delete userObj.email;
      delete userObj.resetOtp;
      delete userObj.otpExpires;
      delete userObj.account_status;
      delete userObj.ban_timestamp;
      delete userObj.banReason;
      delete userObj.bannedBy;
      delete userObj.groupId;
      delete userObj.directMentorId;
      delete userObj.followers;
      delete userObj.following;
      delete userObj.followerCount;
      delete userObj.followingCount;
      delete userObj.isActive;
      delete userObj.isBlocked;
    }

    return NextResponse.json(userObj);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // Ensure upload directory exists
    if ((file && file.size > 0) || (bannerFile && bannerFile.size > 0)) {
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (mkdirErr) {
        console.error('Error creating uploads dir:', mkdirErr);
      }
    }

    // Handle Profile Image Upload
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

    // Handle Banner Image Upload
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
    if (github !== undefined) socialLinks.github = github;
    if (linkedin !== undefined) socialLinks.linkedin = linkedin;
    if (portfolio !== undefined) socialLinks.portfolio = portfolio;
    if (Object.keys(socialLinks).length) profileUpdate.socialLinks = socialLinks;

    // Banner logic
    const bannerColor = formData.get('bannerColor')?.toString();
    const bannerImageField = formData.get('bannerImage')?.toString();
    if (bannerColor !== undefined) profileUpdate.bannerColor = bannerColor;
    if (bannerUrl) {
      profileUpdate.bannerImage = bannerUrl;
    } else if (bannerImageField !== undefined) {
      profileUpdate.bannerImage = bannerImageField;
    }

    // ✅ Use updateUserProfile helper which writes to profile.* fields on the User document
    if (fullName) profileUpdate.username = fullName; // updateUserProfile maps username → fullName
    await updateUserProfile(session.user.id, profileUpdate);

    // Update photo on the User document directly if a new photo was uploaded
    if (photoUrl) {
      await User.findByIdAndUpdate(session.user.id, { $set: { photo: photoUrl } });
    }

    // Return the updated user object
    const freshUser = await findUserById(session.user.id);
    if (!freshUser) {
      return NextResponse.json({ error: 'User not found after update' }, { status: 404 });
    }
    const userObj = (freshUser as any).toObject ? (freshUser as any).toObject() : freshUser;
    delete userObj.password;

    // Ensure safe profile fallback in response
    userObj.profile = userObj.profile || {};
    userObj.fullName = userObj.fullName || userObj.name || 'User';
    userObj.photo = userObj.photo || userObj.photoUrl;

    return NextResponse.json(userObj);

  } catch (error: any) {
    console.error('Profile update error:', error);
    const payload: any = { error: 'Failed to update profile' };
    if (process.env.NODE_ENV === 'development') {
      payload.message = error.message;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}