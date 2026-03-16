"use client"

import { StudentProfile } from "@/components/student-profile"
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      return res.json();
    },
    enabled: status === 'authenticated',
  });

  // Move the navigation logic to useEffect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return <StudentProfile student={{ ...user, _id: user._id }} isOwner={true} />;
  console.log('🔍 StudentProfilePage rendering with user:', user);
  console.log('🔍 user._id:', user._id);
  console.log('🔍 user._id type:', typeof user._id);
  console.log('🔍 Passing to StudentProfile:', { ...user, _id: user._id });
}