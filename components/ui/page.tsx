"use client"

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { StudentProfile } from "@/components/student-profile";
import MentorProfile from "@/components/mentor-profile";
import ProfileHeader from "@/components/profile/ProfileHeader"; // 👈 IMPORTED HERE
import { Loader2 } from 'lucide-react';
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

// 🛠️ Type Definition
interface UserProfile {
  _id: string;
  email: string;
  fullName: string;
  type: 'student' | 'mentor' | 'admin' | 'super-admin';
  photo?: string;
  profile?: {
    type?: 'student' | 'mentor' | 'admin';
    joinedDate?: string;
    bio?: string;
    bannerImage?: string;
    bannerColor?: string;
    enrollmentNo?: string;
    course?: string;
    branch?: string;
    year?: number;
    skills?: string[];
    position?: string;
    department?: string;
    expertise?: string[];
    researchAreas?: string[];
    achievements?: string[];
    officeHours?: string;
    socialLinks?: {
      github?: string;
      linkedin?: string;
      portfolio?: string;
    };
    projects?: Array<{
      id: string | number;
      title: string;
      description?: string;
      image?: string;
      url?: string;
    }>;
    projectsSupervised?: Array<{
      id: number;
      title: string;
      image: string;
      studentName: string;
    }>;
  };
  uploadedProjects?: Array<{
    _id: string;
    id: string;
    title: string;
    description: string;
    tags: string[];
    images: string[];
    githubUrl?: string;
    liveUrl?: string;
    createdAt: string;
    likeCount: number;
    commentCount: number;
  }>;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [isResolvingMentor, setIsResolvingMentor] = useState(false);

  // 1. Fetch User Data
  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      return res.json();
    },
    enabled: status === 'authenticated',
    retry: 1,
  });

  // 2. Resolve Mentor ID
  const resolveMentorId = async () => {
    if (!user || user.type !== 'mentor' || mentorId) return;

    setIsResolvingMentor(true);
    try {
      const res = await fetch(`/api/mentors/by-email?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const mentorData = await res.json();
        setMentorId(mentorData._id);
      }
    } catch (error) {
      console.error('❌ Error resolving mentor ID:', error);
    } finally {
      setIsResolvingMentor(false);
    }
  };

  useEffect(() => {
    if (user && user.type === 'mentor' && !mentorId) {
      resolveMentorId();
    }
  }, [user, mentorId]);

  useEffect(() => {
    if (status === 'unauthenticated' && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/login');
    }
  }, [status, router, isRedirecting]);

  if (isRedirecting || status === 'loading' || isLoading || isResolvingMentor) {
    return (
      <div className="pt-10 min-h-screen bg-background">
        <Header />
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">Error loading profile: {error.message}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-10 min-h-screen bg-background">
        <Header />
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <p>User not found</p>
        </div>
      </div>
    );
  }

  // 🛡️ Safety Defaults
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=random&color=fff&size=128`;
  const defaultBanner = '/defaults/default-banner.jpg';
  const safeProfile = user.profile || {};

  // =========================================================
  // 🧑‍🏫 MENTOR / ADMIN VIEW
  // =========================================================
  if (['mentor', 'admin', 'super-admin'].includes(user.type)) {
    if (!mentorId && !user._id) {
      return (
        <div className="pt-10 min-h-screen bg-background">
          <Header />
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      );
    }

    const mentorData = {
      _id: user._id || mentorId || '',
      id: user._id || mentorId || '',
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

            {/* 🎯 HERE IS YOUR RESTORED HEADER */}
            <ProfileHeader user={user} isOwner={true} />

            <div className="mt-8">
              <MentorProfile mentor={mentorData} isOwner={true} />
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
    projects: (safeProfile.projects || []).map(project => ({
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

          {/* 🎯 HERE IS YOUR RESTORED HEADER */}
          <ProfileHeader user={user} isOwner={true} />

          <div className="mt-8">
            <StudentProfile student={studentData} isOwner={true} />
          </div>
        </div>
      </main>
    </div>
  );
}