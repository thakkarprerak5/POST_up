"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import {
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useFollowState } from "@/hooks/useFollowState";

const sampleProjects = [
  {
    id: 1,
    author: {
      name: "Sarah Johnson",
      avatar: "/professional-woman-avatar.png",
      username: "@sarahj",
    },
    title: "E-Commerce Dashboard",
    description: "A modern e-commerce dashboard with real-time analytics, inventory management, and order tracking.",
    tags: ["React", "Node.js", "MongoDB"],
    images: [
      "/generic-data-dashboard.png",
      "/analytics-chart.png",
      "/generic-mobile-app.png",
    ],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
  },
  {
    id: 2,
    author: {
      name: "Alex Chen",
      avatar: "/professional-man-avatar.png",
      username: "@alexc",
    },
    title: "AI Content Generator",
    description: "An AI-powered content generation tool that helps create blog posts and social media content.",
    tags: ["Python", "OpenAI", "FastAPI"],
    images: [
      "/futuristic-ai-interface.png",
      "/text-editor.png",
      "/content-preview.png",
    ],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
  },
  {
    id: 3,
    author: {
      name: "Maya Patel",
      avatar: "/professional-woman-developer-avatar.png",
      username: "@mayap",
    },
    title: "Task Management App",
    description: "A collaborative task management application with real-time updates and team workspaces.",
    tags: ["Next.js", "Prisma", "PostgreSQL"],
    images: ["/kanban-board.png", "/task-list.jpg", "/team-dashboard.png"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
  },
];

export default function HomePageClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [latest, setLatest] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [trendingProjects, setTrendingProjects] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    month: 0,
    activeMin: 0,
    avgPerDay: 0,
  });
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const router = useRouter();
  const { toggleFollow, isFollowing } = useFollowState();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // Load user profile data
        const userRes = await fetch("/api/profile");
        const userData = await userRes.json();
        setUser(userData);

        // Load projects for feed - ONLY show projects from authenticated users
        const sessRes = await fetch("/api/auth/session");
        const sess = await sessRes.json();
        
        // Only load projects from real authenticated users (with actual accounts)
        let projectsUrl = "/api/projects?limit=8&authenticated=true";
        if (sess?.user?.id) {
          // If user is logged in, show their projects + other authenticated users' projects
          projectsUrl = `/api/projects?limit=8&author=${sess.user.id}&authenticated=true`;
        }
        
        const projectsRes = await fetch(projectsUrl);
        if (!projectsRes.ok) {
          console.error('Projects API error:', projectsRes.status);
          setLatest([]);
          return;
        }
        
        const projectsText = await projectsRes.text();
        let projects = [];
        
        try {
          // Handle case where there might be extra text before JSON
          const jsonStart = projectsText.indexOf('[');
          const jsonEnd = projectsText.lastIndexOf(']') + 1;
          
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonPart = projectsText.substring(jsonStart, jsonEnd);
            projects = JSON.parse(jsonPart);
          } else if (projectsText.trim()) {
            projects = JSON.parse(projectsText);
          }
        } catch (error) {
          console.error('Failed to parse projects JSON:', error);
          console.log('Response text:', projectsText.substring(0, 200));
          projects = [];
        }
        
        setLatest(Array.isArray(projects) ? projects : []);

        // Load mentors
        const mentorsRes = await fetch("/api/mentors");
        const mentorsData = await mentorsRes.json();
        setMentors(mentorsData);

        // Load recent activity
        const activityRes = await fetch("/api/activity/recent?limit=5&authenticated=true");
        const activityData = await activityRes.json();
        console.log('Recent activity data:', activityData);
        setRecentActivity(activityData);

        // Load trending projects (sorted by likes and comments) - only from authenticated users
        const trendingRes = await fetch("/api/projects?limit=10&sort=trending&authenticated=true");
        if (!trendingRes.ok) {
          console.error('Trending API error:', trendingRes.status);
          setTrendingProjects([]);
          return;
        }
        
        const trendingText = await trendingRes.text();
        let trendingData = [];
        
        try {
          // Handle case where there might be extra text before JSON
          const jsonStart = trendingText.indexOf('[');
          const jsonEnd = trendingText.lastIndexOf(']') + 1;
          
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonPart = trendingText.substring(jsonStart, jsonEnd);
            trendingData = JSON.parse(jsonPart);
          } else if (trendingText.trim()) {
            trendingData = JSON.parse(trendingText);
          }
        } catch (error) {
          console.error('Failed to parse trending JSON:', error);
          console.log('Response text:', trendingText.substring(0, 200));
          trendingData = [];
        }
        
        setTrendingProjects(Array.isArray(trendingData) ? trendingData : []);

        if (sess?.user?.id) {
          const allRes = await fetch(
            `/api/projects?author=${sess.user.id}&limit=100` 
          );
          const all = await allRes.json();
          const total = all.length;
          const month = all.filter(
            (p: any) =>
              new Date(p.createdAt).getMonth() === new Date().getMonth() &&
              new Date(p.createdAt).getFullYear() === new Date().getFullYear()
          ).length;
          const activeMin = total * 30;
          const daysInMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0
          ).getDate();
          const avgPerDay = Math.round((month / daysInMonth) * 100) / 100;
          setStats({ total, month, activeMin, avgPerDay });
        }
      } catch (error) {
        console.error("Error loading data:", error);
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

  const upcomingEvents = [
    {
      title: "Upcoming Events",
      subtitle: "1 event",
      image: "/kanban-board.png",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-15 px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside
            className="hidden lg:block lg:col-span-3 opacity-0 translate-y-6 transition-all"
            ref={(el) => {
              revealRefs.current[0] = el;
            }}
          >
            <div className="sticky top-15 z-30 space-y-4">
              <Card className="overflow-hidden rounded-2xl">
                <CardContent className="p-2">
                  <div className="flex flex-col items-center text-center -mt-5">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                      <AvatarImage src={user?.photo || user?.profile?.photo || "/placeholder-user.jpg"} />
                      <AvatarFallback>
                        {(user?.fullName || "User")?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-3 text-lg font-semibold">{user?.fullName || "Student User"}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.profile?.course || "B.Tech Computer Science"}
                      {user?.profile?.branch ? ` • ${user.profile.branch}` : ""}
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    <StatRing
                      label="Projects"
                      value={stats.total || 18}
                      color="text-primary"
                    />
                    <StatRing
                      label="This Month"
                      value={stats.month || 4}
                      color="text-primary"
                    />
                    <StatRing
                      label="Minutes"
                      value={stats.activeMin || 620}
                      color="text-orange-400"
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {(user?.profile?.skills || ["React", "Next.js", "Python", "MongoDB"]).map((t: string) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="rounded-full px-3 py-1"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-3">
                    <Button
                      className="w-full rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      onClick={() => router.push("/upload")}
                    >
                      Upload Project
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-border hover:border-primary hover:text-primary bg-transparent"
                      onClick={() => router.push("/mentors")}
                    >
                      Find Mentors
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="z-20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Active Mentors</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs hover:text-white"
                      onClick={() => router.push('/mentors')}
                    >
                      View All
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {mentors.map((mentor) => (
                      <div 
                        key={mentor.id} 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={(e) => {
                          // Only navigate if click wasn't on follow button
                          if (!(e.target as HTMLElement).closest('button')) {
                            router.push(`/profile/${mentor.id}`);
                          }
                        }}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={mentor.avatar || "/placeholder-user.jpg"} 
                              alt={mentor.name}
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/placeholder-user.jpg';
                              }}
                            />
                            <AvatarFallback className="bg-primary/10">
                              {(mentor.name || '').split(" ").map((n: string) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{mentor.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Mentor{mentor.role ? ` • ${mentor.role}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isFollowing(mentor.id) ? "default" : "outline"}
                          className="shrink-0 h-7 px-3 text-l hover:text-blue-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(mentor.id);
                          }}
                        >
                          {isFollowing(mentor.id) ? "Following" : "Follow"}
                        </Button>
                      </div>
                    ))}
                    
                    {mentors.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No users available</p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-xs"
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

          <section className="col-span-12 top-6 lg:col-span-6 space-y-6 relative z-10">
            {latest
              .filter(
                (p: any) =>
                  !search ||
                  (
                    p.title +
                    " " +
                    (p.description || "") +
                    " " +
                    (p.tags || []).join(" ")
                  )
                    .toLowerCase()
                    .includes(search.toLowerCase())
              )
              .map((project: any) => (
                <FeedCard key={project.id || project._id} project={project} />
              ))}
            
            {latest.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No projects found.</p>
                <Button 
                  variant="link" 
                  onClick={() => router.push("/upload")}
                >
                  Upload your first project
                </Button>
              </div>
            )}
          </section>

          <aside
            className="hidden lg:block lg:col-span-3 opacity-0 translate-y-6 transition-all"
            ref={(el) => {
              revealRefs.current[2] = el;
            }}
          >
            <div className="sticky top-10 space-y-6">
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-3">Recent Activity</p>
                  <div className="space-y-3">
                    {recentActivity.map((a, i) => (
                      <div key={a._id || i} className="flex items-center gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={a.user?.avatar || "/placeholder-user.jpg"} />
                          <AvatarFallback>
                            {a.user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs">
                            <span 
                              className="font-medium hover:text-primary cursor-pointer transition-colors"
                              onClick={() => a.user?._id && router.push(`/profile/${a.user._id}`)}
                            >
                              {a.user?.name || "Anonymous"}
                            </span>{" "}
                            {a.description} • {formatTimeAgo(a.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {recentActivity.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Trending Projects
                    </p>
                  </div>
                  <div className="space-y-3">
                    {trendingProjects.map((project, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                        onClick={() => router.push(`/projects/${project.id || project._id}`)}
                      >
                        <div className="h-9 w-9 rounded-md overflow-hidden border border-border">
                          <Image
                            src={project.images?.[0] || "/placeholder-project.jpg"}
                            alt={project.title}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm truncate">{project.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {(project.likeCount || 0) + (project.commentCount || 0)} interactions
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {trendingProjects.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No trending projects yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {upcomingEvents.map((e, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md overflow-hidden border border-border">
                          <Image
                            src={e.image}
                            alt={e.title}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{e.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.subtitle}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function StatRing({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  const circumference = 2 * Math.PI * 20;
  const percent = 75;
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
            strokeWidth="6"
            className="opacity-20 fill-none"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="fill-none"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedCard({ project }: { project: any }) {
  const { toggleFollow, isFollowing } = useFollowState();
  const authorName = project.author?.name || "Unknown";
  const authorImage = (project.author?.image && !project.author.image.startsWith('blob:')) 
    ? project.author.image 
    : "/placeholder-user.jpg";

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'some time ago';
    }
  };

  return (
    <Card className="group">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={authorImage} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-semibold">{authorName}</p>
              <p className="text-xs text-muted-foreground">
                shared a project • {project.createdAt ? formatTimeAgo(project.createdAt) : 'just now'}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <ProjectCard
              project={{
                id: project.id || project._id,
                author: {
                  name: authorName,
                  avatar: authorImage,
                  username: "@user",
                },
                title: project.title,
                description: project.description,
                tags: project.tags || [],
                images: project.images || [],
                video: project.video,
                githubUrl: project.githubUrl || "#",
                liveUrl: project.liveUrl || "#",
                createdAt: project.createdAt,
                likeCount: project.likeCount || 0,
                likedByUser: project.likedByUser || false,
                comments: project.comments || [],
                shareCount: project.shareCount || 0,
              }}
              variant={"embedded"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
