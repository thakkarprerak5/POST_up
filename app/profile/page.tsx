"use client"

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { StudentProfile } from "@/components/student-profile";
import { MentorProfile } from "@/components/mentor-profile";
import { Loader2 } from 'lucide-react';
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

interface UserProfile {
  _id: string;
  email: string;
  fullName: string;
  type: 'student' | 'mentor';
  photo?: string;
  profile: {
    type: 'student' | 'mentor';
    joinedDate: string;
    bio?: string;
    // Student specific
    enrollmentNo?: string;
    course?: string;
    branch?: string;
    year?: number;
    skills?: string[];
    // Mentor specific
    department?: string;
    expertise?: string[];
    position?: string;
    experience?: number;
    researchAreas?: string[];
    achievements?: string[];
    officeHours?: string;
    // Common
    socialLinks?: {
      github?: string;
      linkedin?: string;
      portfolio?: string;
    };
    projects?: Array<{
      id: string;
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
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    if (status === 'unauthenticated' && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/login');
    }
  }, [status, router, isRedirecting]);

  if (isRedirecting || status === 'loading' || isLoading) {
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

  // Format data based on user type
  const commonProfileData = {
    name: user.fullName,
    email: user.email,
    avatar: user.photo || '',
    bio: user.profile.bio || '',
    socialLinks: user.profile.socialLinks || {},
    joinedDate: new Date(user.profile.joinedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  // Format data for MentorProfile component
  if (user.type === 'mentor') {
    const mentorData = {
      name: user.fullName,
      title: user.profile.position || 'Mentor',
      email: user.email,
      avatar: user.photo || '',
      bio: user.profile.bio || '',
      expertise: user.profile.expertise || [],
      department: user.profile.department || 'Department not specified',
      researchAreas: user.profile.researchAreas || [],
      achievements: user.profile.achievements || [],
      officeHours: user.profile.officeHours || 'Not specified',
      socialLinks: user.profile.socialLinks || {},
      projectsSupervised: user.profile.projectsSupervised || [],
      joinedDate: new Date(user.profile.joinedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    return (
      <div className="pt-10 min-h-screen bg-background">
        <Header />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="pt-16 px-4 md:px-8 lg:px-12">
          <div className="container mx-auto py-8 px-4">
            <MentorProfile mentor={mentorData} isOwner={true} />
          </div>
        </main>
      </div>
    );
  }

  // Format data for StudentProfile component
  const studentData = {
    name: user.fullName,
    username: user.profile.enrollmentNo || '',
    email: user.email,
    avatar: user.photo || '',
    bio: user.profile.bio || '',
    course: user.profile.course || 'Course not specified',
    branch: user.profile.branch || 'Branch not specified',
    year: user.profile.year || 1,
    skills: user.profile.skills || [],
    // Map projects to match the expected type
    projects: (user.profile.projects || []).map(project => ({
      id: project.id ? parseInt(project.id) : Math.floor(Math.random() * 1000), // Ensure ID is a number
      title: project.title || 'Untitled Project',
      image: project.image || '/default-project.png',
      tags: [], // Initialize empty tags array as it's required
      description: project.description || '',
      // Include url if it exists
      ...(project.url && { url: project.url })
    })),
    socialLinks: {
      github: user.profile.socialLinks?.github || '',
      linkedin: user.profile.socialLinks?.linkedin || '',
      portfolio: user.profile.socialLinks?.portfolio || ''
    },
    joinedDate: new Date(user.profile.joinedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  return (
    <div className="pt-10 min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="pt-16 px-4 md:px-8 lg:px-12">
        <div className="container mx-auto py-8 px-4">
          <StudentProfile student={studentData} isOwner={true} />
        </div>
      </main>
    </div>
  );
}
