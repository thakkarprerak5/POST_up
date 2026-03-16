"use client"

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { StudentProfile } from "@/components/student-profile";
import MentorProfile from "@/components/mentor-profile";
import ProfileHeader from "@/app/profile/ProfileHeader";
import { Loader2 } from 'lucide-react';
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

export default function PublicProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get the target user ID from the URL params
  const targetUserId = params?.id as string;

  // 1. Fetch The Public User Data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['public-profile', targetUserId],
    queryFn: async () => {
      // Fetch THEIR profile using the ID
      const res = await fetch(`/api/profile?id=${targetUserId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      return res.json();
    },
    enabled: !!targetUserId,
    retry: 1,
  });

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="pt-10 min-h-screen bg-background">
        <Header />
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading profile...</span>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className="pt-10 min-h-screen bg-background">
        <Header />
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
          <p className="text-red-500 mb-4">User not found or profile is private.</p>
          <Button onClick={() => router.push('/feed')}>Go Back to Feed</Button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // 4. Determine if viewing own profile
  const isOwner = session?.user?.email === user.email;

  // 🛡️ Safety Defaults for Public View
  const safeProfile = user.profile || {};
  // Use a fallback avatar helper if photo is missing
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=random`;
  const defaultBanner = '/defaults/default-banner.jpg';

  // =========================================================
  // 🧑‍🏫 MENTOR / ADMIN VIEW
  // =========================================================
  if (['mentor', 'admin', 'super-admin'].includes(user.type)) {
    const mentorData = {
      _id: user._id,
      id: user._id,
      fullName: user.fullName || "Mentor",
      name: user.fullName || "Mentor",
      title: safeProfile.position || (user.type === 'admin' ? 'Administrator' : 'Mentor'),
      email: user.email,
      photo: user.photo || defaultAvatar,
      avatar: user.photo || defaultAvatar,
      bannerImage: safeProfile.bannerImage || defaultBanner,
      bannerColor: safeProfile.bannerColor || '',
      bio: safeProfile.bio || 'No bio provided.',
      expertise: safeProfile.expertise || [],
      department: safeProfile.department || 'General',
      researchAreas: safeProfile.researchAreas || [],
      achievements: safeProfile.achievements || [],
      officeHours: safeProfile.officeHours || 'By Appointment',
      socialLinks: safeProfile.socialLinks || {},
      projectsSupervised: safeProfile.projectsSupervised || [],
      joinedDate: new Date(safeProfile.joinedDate || user.createdAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      role: user.type
    };

    return (
      <div className="pt-10 min-h-screen bg-background">
        <Header />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="pt-4 px-4 md:px-4 lg:px-4">
          <div className="container mx-auto py-8 px-4">
            <ProfileHeader user={user} isOwner={isOwner} />
            <div className="mt-8">
              <MentorProfile mentor={mentorData} isOwner={isOwner} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // 👨‍🎓 STUDENT VIEW
  // =========================================================
  const studentData = {
    id: user._id,
    _id: user._id,
    name: user.fullName || "Student",
    username: safeProfile.enrollmentNo || '',
    email: user.email,
    avatar: user.photo || defaultAvatar,
    bannerImage: safeProfile.bannerImage || defaultBanner,
    bannerColor: safeProfile.bannerColor || '',
    bio: safeProfile.bio || 'No bio added yet.',
    course: safeProfile.course || 'Course not specified',
    branch: safeProfile.branch || 'Branch not specified',
    year: safeProfile.year || 1,
    skills: safeProfile.skills || [],
    projects: (safeProfile.projects || []).map((project: any) => ({
      id: project.id ? Number(project.id) : Math.floor(Math.random() * 10000),
      title: project.title || 'Untitled Project',
      image: project.image || '/default-project.png',
      tags: [],
      description: project.description || '',
      ...(project.url && { url: project.url })
    })),
    uploadedProjects: (user.uploadedProjects || []).map((project: any) => ({
      _id: project._id,
      id: project.id,
      title: project.title || "Untitled",
      description: project.description || "",
      tags: project.tags || [],
      images: project.images || [],
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl,
      createdAt: project.createdAt,
      likeCount: project.likeCount || 0,
      commentCount: project.commentCount || 0,
    })),
    socialLinks: {
      github: safeProfile.socialLinks?.github || '',
      linkedin: safeProfile.socialLinks?.linkedin || '',
      portfolio: safeProfile.socialLinks?.portfolio || ''
    },
    joinedDate: new Date(safeProfile.joinedDate || user.createdAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
  };

  return (
    <div className="pt-10 min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="pt-16 px-4 md:px-8 lg:px-12">
        <div className="container mx-auto py-8 px-4">
          <ProfileHeader user={user} isOwner={isOwner} />
          <div className="mt-8">
            <StudentProfile student={studentData} isOwner={isOwner} />
          </div>
        </div>
      </main>
    </div>
  );
}