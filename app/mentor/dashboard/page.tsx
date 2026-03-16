'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MentorHeroBanner } from '@/components/mentor/MentorHeroBanner';
import { MentorStatGrid } from '@/components/mentor/MentorStatGrid';
import { MentorDashboardTabs } from '@/components/mentor/MentorDashboardTabs';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    totalAssignments: 0,
    pendingInvitations: 0
  });
  const [mentorProfile, setMentorProfile] = useState<any>(null);

  // Role-based access control
  const isSuperAdmin = session?.user?.role === 'super-admin';
  const isAdmin = session?.user?.role === 'admin';
  const canViewInvitations = !!session?.user?.id;
  const isOwner = true; // Dashboard is always own view

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mentor/dashboard?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        if (data.mentor) {
          setMentorProfile(data.mentor);
        }

        if (data.summary) {
          setStats(data.summary);
        }
      } else {
        console.error('❌ Mentor Dashboard API Error');
      }
    } catch (error) {
      console.error('❌ Failed to fetch mentor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mentorProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Could not load profile data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <MentorHeroBanner
        mentor={mentorProfile}
        isOwner={isOwner}
        onEdit={() => router.push('/profile/edit')}
        onViewPublic={() => router.push(`/profile/${mentorProfile._id || mentorProfile.id}`)}
      />

      <MentorStatGrid stats={stats} />

      <MentorDashboardTabs
        mentorId={mentorProfile._id || mentorProfile.id}
        isOwner={isOwner}
        canViewInvitations={canViewInvitations}
        invitationCount={stats.pendingInvitations}
      />
    </div>
  );
}
