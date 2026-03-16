"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClickableProfilePhoto } from "@/components/clickable-profile-photo";
import { ProfilePhotoModal } from "@/components/profile-photo-modal";
import { ProjectRegistrationFab } from "@/components/project-registration-fab";
import { ProjectRegistrationStepperNew } from "@/components/project-registration-stepper-new";
import { MentorRejectionModal } from "@/components/mentor-rejection-modal";
import { Card, CardContent } from "@/components/ui/card";
import { SlidingTabBar, TabValue } from "@/components/ui/sliding-tab-bar";
import { ProjectFeed } from "@/components/feed/ProjectFeed";
import { TrendingFeed } from "@/components/feed/TrendingFeed";
import { EventFeed } from "@/components/feed/EventFeed";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFollowState } from "@/hooks/useFollowState";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePageClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, month: 0, activeMin: 0, avgPerDay: 0 });
  const [modalState, setModalState] = useState({
    isOpen: false,
    imageUrl: '',
    name: ''
  });
  const [showProjectRegistration, setShowProjectRegistration] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionData, setRejectionData] = useState({
    mentorName: '',
    projectTitle: ''
  });
  const [user, setUser] = useState<any>(null);

  // Triple-Feed State
  const [activeTab, setActiveTab] = useState<TabValue>('projects');

  const revealRefs = useRef<(HTMLElement | null)[]>([]);
  const router = useRouter();
  const { toggleFollow, isFollowing } = useFollowState();

  // Global modal handler for all profile photos
  const handleProfilePhotoClick = (imageUrl: string, name: string) => {
    if (imageUrl && imageUrl !== '/placeholder-user.jpg') {
      setModalState({
        isOpen: true,
        imageUrl,
        name
      });
    }
  };

  // Rejection modal handlers
  const handleRejection = (mentorName: string, projectTitle: string) => {
    setRejectionData({ mentorName, projectTitle });
    setShowRejectionModal(true);
  };

  const handleInviteNewMentor = () => {
    setShowRejectionModal(false);
    setShowProjectRegistration(true);
  };

  const handleDirectRegistration = () => {
    setShowRejectionModal(false);
    setShowProjectRegistration(true);
  };

  useEffect(() => {
    const load = async () => {
      try {
        // Load user profile data
        const userRes = await fetch("/api/profile");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData && typeof userData === 'object' ? userData : null);
        } else {
          console.log('Profile API returned:', userRes.status);
          setUser(null);
        }

        // Load mentors
        const mentorsRes = await fetch("/api/mentors");
        if (mentorsRes.ok) {
          const mentorsData = await mentorsRes.json();
          setMentors(Array.isArray(mentorsData) ? mentorsData : []);
        } else {
          console.log('Mentors API returned:', mentorsRes.status);
          setMentors([]);
        }

        // Load recent activity - show all activity
        const activityRes = await fetch("/api/activity/recent?limit=5");
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          console.log('Recent activity data:', activityData);
          setRecentActivity(Array.isArray(activityData) ? activityData : []);
        } else {
          console.log('Activity API returned:', activityRes.status);
          setRecentActivity([]);
        }


        // Load real-time activity stats
        setPostsLoading(true);
        const statsRes = await fetch("/api/user/activity-stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          console.log('📊 Activity Stats Response:', statsData);
          setStats({
            total: statsData.totalProjects || 0,
            month: statsData.projectsThisMonth || 0,
            activeMin: statsData.totalMinutesSpent || 0,
            avgPerDay: statsData.avgProjectsPerDay || 0
          });
        } else {
          console.log('Activity Stats API returned:', statsRes.status);
          setStats({ total: 0, month: 0, activeMin: 0, avgPerDay: 0 });
        }
        setPostsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack available');
        console.error("Error details:", {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'Unknown'
        });
      }
    };
    load();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            entry.target.classList.add("opacity-100", "translate-y-0");
        });
      },
      { threshold: 0.12 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      // For debugging, always show the actual time difference
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      // For older dates, show the actual date
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'some time ago';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Mobile Menu Button - Fixed Position */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-background border border-border"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-14 px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside
            className="hidden lg:block lg:col-span-3 opacity-0 translate-y-6 transition-all"
            ref={(el) => {
              revealRefs.current[0] = el;
            }}
          >
            <div className="sticky top-14 z-30 space-y-6">
              <Card className="overflow-hidden rounded-2xl border border-border/40 ring-1 ring-border/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-card">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <ClickableProfilePhoto
                      imageUrl={user?.photo || user?.profile?.photo}
                      avatar="/placeholder-user.jpg"
                      name={user?.fullName || "Student User"}
                      size="custom"
                      className="h-24 w-24 border-4 border-background shadow-xl ring-4 ring-primary/20"
                      onPhotoClick={handleProfilePhotoClick}
                    />
                    <p className="mt-4 text-xl font-bold text-foreground">{user?.fullName || "Student User"}</p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {user?.profile?.course || "B.Tech Computer Science"}
                      {user?.profile?.branch ? ` • ${user.profile.branch}` : ""}
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <StatRing
                      label="Projects"
                      value={stats.total}
                      loading={postsLoading}
                      color="text-primary"
                    />
                    <StatRing
                      label="This Month"
                      value={stats.month}
                      loading={postsLoading}
                      color="text-primary"
                    />
                    <StatRing
                      label="Minutes"
                      value={stats.activeMin}
                      loading={postsLoading}
                      color="text-orange-400"
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {(user?.profile?.skills || ["React", "Next.js", "Python", "MongoDB"]).map((t: string) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-xs font-medium bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <Button
                      className="w-full rounded-full bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-medium"
                      onClick={() => router.push("/upload")}
                    >
                      Upload Project
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-border/50 hover:border-primary/50 hover:text-primary hover:bg-primary/5 bg-transparent transition-all duration-300 font-medium hover:scale-[1.01] active:scale-[0.99]"
                      onClick={() => router.push("/mentors")}
                    >
                      Find Mentors
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/40 ring-1 ring-border/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Active Mentors</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-sidebar-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
                      onClick={() => router.push('/mentors')}
                    >
                      View All
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {mentors.map((mentor, index) => (
                      <div
                        key={mentor._id || mentor.id || `mentor-${index}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-all duration-200 cursor-pointer group"
                        onClick={(e) => {
                          // Only navigate if click wasn't on follow button
                          if (!(e.target as HTMLElement).closest('button')) {
                            router.push(`/profile/${mentor._id || mentor.id}`);
                          }
                        }}
                      >
                        <div className="relative">
                          <ClickableProfilePhoto
                            imageUrl={mentor.avatar || mentor.photo}
                            avatar="/placeholder-user.jpg"
                            name={mentor.name || mentor.fullName || "Mentor"}
                            size="md"
                            className="h-10 w-10 ring-2 ring-background group-hover:ring-primary/20 transition-all duration-200"
                            onPhotoClick={handleProfilePhotoClick}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{mentor.name || mentor.fullName || "Mentor"}</p>
                          <p className="text-xs text-muted-foreground font-medium">
                            Mentor{mentor.role ? ` • ${mentor.role}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isFollowing(mentor._id || mentor.id) ? "default" : "outline"}
                          className="shrink-0 h-8 px-3 text-xs hover:scale-105 transition-transform duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(mentor._id || mentor.id);
                          }}
                        >
                          {isFollowing(mentor._id || mentor.id) ? "Following" : "Follow"}
                        </Button>
                      </div>
                    ))}

                    {mentors.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-secondary/50 flex items-center justify-center">
                          <div className="w-8 h-8 text-muted-foreground">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          </div>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">No mentors available</h4>
                        <p className="text-xs text-muted-foreground mb-4">Check back later for available mentors</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-4 text-xs hover:bg-primary/5 hover:border-primary/50 transition-colors"
                          onClick={() => router.push('/mentors')}
                        >
                          Browse all mentors
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          <section className="col-span-12 mt-6 lg:col-span-6 space-y-6 relative z-10">
            {/* Triple-Feed Tab Bar */}
            <SlidingTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className="mb-6"
            />

            {/* Feed Content with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'projects' && (
                  <ProjectFeed
                    onProfilePhotoClick={handleProfilePhotoClick}
                    currentUser={user}
                  />
                )}

                {activeTab === 'trending' && (
                  <TrendingFeed
                    onProfilePhotoClick={handleProfilePhotoClick}
                    currentUser={user}
                  />
                )}

                {activeTab === 'events' && (
                  <EventFeed
                    onProfilePhotoClick={handleProfilePhotoClick}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          <aside
            className="hidden lg:block lg:col-span-3 opacity-0 translate-y-6 transition-all"
            ref={(el) => {
              revealRefs.current[2] = el;
            }}
          >
            <div className="sticky top-1 space-y-6">
              <Card className="border border-border/40 ring-1 ring-border/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Recent Activity</p>
                  <div className="space-y-4">
                    {recentActivity.map((a, i) => (
                      <div key={a._id || i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/20 transition-all duration-200 group">
                        <ClickableProfilePhoto
                          imageUrl={a.user?.profileImage || a.user?.avatar}
                          avatar="/placeholder-user.jpg"
                          name={a.user?.name || 'User'}
                          size="sm"
                          className="h-8 w-8 ring-2 ring-background group-hover:ring-primary/20 transition-all duration-200"
                          onPhotoClick={handleProfilePhotoClick}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span
                              className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors duration-200"
                              onClick={() => a.user?._id && router.push(`/profile/${a.user._id}`)}
                            >
                              {a.user?.name || "Anonymous"}
                            </span>{" "}
                            <span className="text-muted-foreground">{a.description}</span>
                            <span className="text-muted-foreground/70"> • {formatTimeAgo(a.timestamp)}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                    {recentActivity.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-secondary/30 flex items-center justify-center">
                          <div className="w-8 h-8 text-muted-foreground">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                          </div>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">No recent activity</h4>
                        <p className="text-xs text-muted-foreground">Activity will appear here as people interact</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Action Button */}
      <ProjectRegistrationFab
        user={user}
        onClick={() => setShowProjectRegistration(true)}
      />

      {/* Global Profile Photo Modal */}
      <ProfilePhotoModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, imageUrl: '', name: '' })}
        imageUrl={modalState.imageUrl}
        alt={modalState.name}
      />

      {/* Project Registration Stepper */}
      <ProjectRegistrationStepperNew
        isOpen={showProjectRegistration}
        onClose={() => setShowProjectRegistration(false)}
        user={user}
      />

      {/* Mentor Rejection Modal */}
      <MentorRejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onInviteNewMentor={handleInviteNewMentor}
        onDirectRegistration={handleDirectRegistration}
        mentorName={rejectionData.mentorName}
        projectTitle={rejectionData.projectTitle}
      />
    </div>
  );
}

function StatRing({
  label,
  value,
  loading = false,
  color,
}: {
  label: string;
  value: number | string;
  loading?: boolean;
  color?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const circumference = 2 * Math.PI * 20;

  // Animate number when value changes
  useEffect(() => {
    if (loading) {
      setDisplayValue(0);
      return;
    }

    const targetValue = typeof value === 'number' ? value : parseInt(value) || 0;
    const duration = 1000; // 1 second animation
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setDisplayValue(targetValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, loading]);

  // Calculate percentage based on reasonable maximums
  const getMaxValue = () => {
    switch (label) {
      case 'Projects': return 50;
      case 'This Month': return 20;
      case 'Minutes': return 1000;
      default: return 100;
    }
  };

  const percent = Math.min((displayValue / getMaxValue()) * 100, 100);
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${color || "text-primary"}`}>
        <svg viewBox="0 0 48 48" className="w-20 h-20">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-15 fill-none"
          />
          {!loading && (
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="fill-none transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {loading ? (
              <div className="animate-pulse">
                <div className="w-6 h-4 bg-muted rounded mx-auto mb-1"></div>
                <div className="w-8 h-2 bg-muted rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <p className="text-xl font-bold">{displayValue}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

