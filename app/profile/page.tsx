"use client"

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudentProfile } from "@/components/student-profile";
import MentorProfile from "@/components/mentor-profile";
import { Loader2 } from 'lucide-react';
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";

export default function MyProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mentorId, setMentorId] = useState<string | null>(null);
    const [isResolvingMentor, setIsResolvingMentor] = useState(false);

    const { data: user, isLoading, error } = useQuery<any>({
        queryKey: ['my-profile'],
        queryFn: async () => {
            const res = await fetch('/api/profile');
            if (!res.ok) throw new Error('Failed to fetch profile');
            return res.json();
        },
        enabled: status === 'authenticated',
        retry: 1,
    });

    // Resolve mentor ID from email when user is a mentor
    useEffect(() => {
        if (!user || user.type !== 'mentor' || mentorId) return;
        setIsResolvingMentor(true);
        fetch(`/api/mentors/by-email?email=${encodeURIComponent(user.email)}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?._id) setMentorId(data._id); })
            .catch(console.error)
            .finally(() => setIsResolvingMentor(false));
    }, [user, mentorId]);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    if (status === 'loading' || isLoading || isResolvingMentor) {
        return (
            <div className="pt-10 min-h-screen bg-background">
                <Header />
                <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading profile...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
                <p className="text-red-500">Error loading profile: {(error as Error).message}</p>
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

    // ── Mentor / Admin / Super-Admin view ──────────────────────────────────────
    if (['mentor', 'admin', 'super-admin'].includes(user.type)) {
        const mentorData = {
            _id: user._id || mentorId || '',
            id: user._id || mentorId || '',
            fullName: user.fullName || user.name || 'User',
            name: user.fullName || user.name || 'User',
            title: user.profile?.position || (user.type !== 'mentor' ? 'Administrator' : 'Mentor'),
            email: user.email,
            photo: user.photo || user.photoUrl || '',
            avatar: user.photo || user.photoUrl || '',
            bannerImage: user.profile?.bannerImage || '',
            bannerColor: user.profile?.bannerColor || '',
            bio: user.profile?.bio || '',
            expertise: user.profile?.expertise || [],
            department: user.profile?.department || '',
            researchAreas: user.profile?.researchAreas || [],
            achievements: user.profile?.achievements || [],
            officeHours: user.profile?.officeHours || 'Not specified',
            socialLinks: user.profile?.socialLinks || {},
            projectsSupervised: user.profile?.projectsSupervised || [],
            joinedDate: new Date(user.profile?.joinedDate || user.createdAt || Date.now())
                .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            role: user.type,
        };

        return (
            <div className="pt-10 min-h-screen bg-background">
                <Header />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="pt-4 px-4 md:px-4 lg:px-4">
                    <div className="container mx-auto py-8 px-4">
                        <MentorProfile mentor={mentorData} isOwner={true} />
                    </div>
                </main>
            </div>
        );
    }

    // ── Student view ───────────────────────────────────────────────────────────
    const studentData = {
        id: user._id,
        _id: user._id,
        name: user.fullName || user.name || 'User',
        username: user.profile?.enrollmentNo || '',
        email: user.email,
        avatar: user.photo || user.photoUrl || '',
        bannerImage: user.profile?.bannerImage || '',
        bannerColor: user.profile?.bannerColor || '',
        bio: user.profile?.bio || '',
        course: user.profile?.course || 'Course not specified',
        branch: user.profile?.branch || 'Branch not specified',
        year: user.profile?.year || 1,
        skills: user.profile?.skills || [],
        projects: (user.profile?.projects || []).map((p: any) => ({
            id: p.id ? parseInt(String(p.id)) : Math.floor(Math.random() * 1000),
            title: p.title || 'Untitled Project',
            image: p.image || '/default-project.png',
            tags: [],
            description: p.description || '',
            ...(p.url && { url: p.url }),
        })),
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
        socialLinks: {
            github: user.profile?.socialLinks?.github || '',
            linkedin: user.profile?.socialLinks?.linkedin || '',
            portfolio: user.profile?.socialLinks?.portfolio || '',
        },
        joinedDate: new Date(user.profile?.joinedDate || user.createdAt || Date.now())
            .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
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
