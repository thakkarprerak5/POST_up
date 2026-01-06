"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { StudentProfile } from '@/components/student-profile'
import { MentorProfile } from '@/components/mentor-profile'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { use } from 'react'

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Unwrap params Promise for Next.js 15+
  const resolvedParams = use(params)
  const userId = resolvedParams.id

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: async () => {
      const res = await fetch(`/api/profile?id=${encodeURIComponent(userId || '')}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
    enabled: Boolean(userId),
    retry: 1,
  })

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/session')
      return res.json()
    },
  })

  const isOwner = session?.user?.id === userId

  if (isLoading) {
    return (
      <div className="pt-10 min-h-screen bg-background">
        <Header />
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="pt-10 min-h-screen bg-background">
        <Header />
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <p>User not found</p>
        </div>
      </div>
    )
  }

  // render mentor or student profile; mark isOwner=false
  if (user.type === 'mentor') {
    const mentorData = {
      _id: user._id, // Add the _id field for follow state
      name: user.fullName,
      title: user.profile?.position || 'Mentor',
      email: user.email,
      avatar: user.photo || '',
      bio: user.profile?.bio || '',
      expertise: user.profile?.expertise || [],
      department: user.profile?.department || '',
      researchAreas: user.profile?.researchAreas || [],
      achievements: user.profile?.achievements || [],
      officeHours: user.profile?.officeHours || '',
      socialLinks: user.profile?.socialLinks || {},
      projectsSupervised: user.profile?.projectsSupervised || [],
      joinedDate: new Date(user.profile?.joinedDate || Date.now()).toLocaleDateString(),
    }

    return (
      <div className="pt-10 min-h-screen bg-background">
        <Header />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="pt-16 px-4 md:px-8 lg:px-12">
          <div className="container mx-auto py-8 px-4">
            <div
              data-reportable="true"
              data-reportable-type="user"
              data-reportable-id={user._id}
              data-reported-user-id={user._id}
              data-reportable-title={user.fullName}
              data-reportable-author={user.fullName}
            >
              <MentorProfile mentor={mentorData} isOwner={isOwner} />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const studentData = {
    name: user.fullName,
    username: user.profile?.enrollmentNo || '',
    email: user.email,
    avatar: user.photo || '',
    bannerImage: user.profile?.bannerImage || '',
    bannerColor: user.profile?.bannerColor || '',
    bio: user.profile?.bio || '',
    course: user.profile?.course || '',
    branch: user.profile?.branch || '',
    year: user.profile?.year || 1,
    skills: user.profile?.skills || [],
    projects: (user.profile?.projects || []).map((p: any) => ({ id: p.id, title: p.title, image: p.image || '/default-project.png', description: p.description || '', tags: p.tags || [] })),
    uploadedProjects: (user.uploadedProjects || []).map((p: any) => ({
      _id: p._id,
      id: p.id,
      title: p.title,
      description: p.description,
      tags: p.tags || [],
      images: p.images || [],
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
      createdAt: p.createdAt,
      likeCount: p.likeCount || 0,
      commentCount: p.commentCount || 0,
    })),
    socialLinks: user.profile?.socialLinks || {},
    joinedDate: new Date(user.profile?.joinedDate || Date.now()).toLocaleDateString(),
  }

  return (
    <div className="pt-10 min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="pt-16 px-4 md:px-8 lg:px-12">
        <div className="container mx-auto py-8 px-4">
          <div
            data-reportable="true"
            data-reportable-type="user"
            data-reportable-id={user._id}
            data-reported-user-id={user._id}
            data-reportable-title={user.fullName}
            data-reportable-author={user.fullName}
          >
            <StudentProfile student={studentData} isOwner={isOwner} />
          </div>
        </div>
      </main>
    </div>
  )
}
