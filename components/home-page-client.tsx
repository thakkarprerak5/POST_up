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
import { useRouter } from "next/router";

const sampleProjects = [
  {
    id: 1,
    author: {
      name: "Sarah Johnson",
      avatar: "/professional-woman-avatar.png",
      username: "@sarahj",
    },
    title: "E-Commerce Dashboard",
    description:
      "A modern e-commerce dashboard with real-time analytics, inventory management, and order tracking. Built with React and Node.js for optimal performance.",
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
    description:
      "An AI-powered content generation tool that helps create blog posts, social media content, and marketing copy using advanced language models.",
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
    description:
      "A collaborative task management application with real-time updates, team workspaces, and productivity insights. Features drag-and-drop functionality.",
    tags: ["Next.js", "Prisma", "PostgreSQL"],
    images: ["/kanban-board.png", "/task-list.jpg", "/team-dashboard.png"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
  },
];

export default function HomePageClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [latest, setLatest] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    month: 0,
    activeMin: 0,
    avgPerDay: 0,
  });
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const sessRes = await fetch("/api/auth/session");
        const sess = await sessRes.json();
        const res = await fetch(
          `/api/projects?limit=8${
            sess?.user?.id ? `&author=${sess.user.id}` : ""
          }`
        );
        const projects = await res.json();
        setLatest(projects);

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
      } catch {}
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
  const suggestions = [
    {
      name: "Dr. Sarah Johnson",
      role: "AI/ML Mentor",
      image: "/professional-woman-professor.png",
    },
    {
      name: "Prof. Michael Chen",
      role: "Web Dev Mentor",
      image: "/professional-asian-professor.png",
    },
    {
      name: "Maya Patel",
      role: "Senior Student",
      image: "/professional-woman-developer-avatar.png",
    },
  ];

  const trending: any[] = [];

  const recentActivity = [
    {
      name: "Sarah Johnson",
      action: "shared a project",
      when: "just now",
      avatar: "/professional-woman-avatar.png",
    },
    {
      name: "Alex Chen",
      action: "shared a project",
      when: "3 minutes ago",
      avatar: "/professional-man-avatar.png",
    },
    {
      name: "Maya Patel",
      action: "updated a project",
      when: "5 minutes ago",
      avatar: "/professional-woman-developer-avatar.png",
    },
  ];

  const trendingProjectsDetailed = [
    {
      title: "Trending Projects",
      count: 18,
      image: "/generic-data-dashboard.png",
    },
  ];

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
                      <AvatarImage src="/young-male-student-developer.jpg" />
                      <AvatarFallback>ST</AvatarFallback>
                    </Avatar>
                    <p className="mt-3 text-lg font-semibold">Student User</p>
                    <p className="text-sm text-muted-foreground">
                      B.Tech Computer Science
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
                    {["React", "Next.js", "Python", "MongoDB"].map((t) => (
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
                <CardContent className="p-3">
                  <p className="text-sm font-semibold mb-3">
                    Mentors & Students to follow
                  </p>
                  <div className="space-y-3">
                    {suggestions.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={s.image} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.role}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={followed[s.name] ? "default" : "outline"}
                          className="gap-2 border-border hover:border-primary hover:text-gray-400"
                          onClick={() =>
                            setFollowed((f) => ({ ...f, [s.name]: !f[s.name] }))
                          }
                        >
                          {followed[s.name] ? "Following" : "Follow"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          <section className="col-span-12 top-6 lg:col-span-6 space-y-6 relative z-10">
            {/* <Card
              className="opacity-0 translate-y-6 transition-all"
              ref={(el) => {
                revealRefs.current[1] = el;
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/young-male-student-developer.jpg" />
                    <AvatarFallback>ST</AvatarFallback>
                  </Avatar>
                  <Input
                    className="flex-1"
                    placeholder="Share an update, link or idea..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button
                    className="gap-1"
                    onClick={() => router.push("/upload")}
                  >
                    Post <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card> */}

            {(latest.length ? latest : sampleProjects)
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
                      <div key={i} className="flex items-center gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={a.avatar} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs">
                            <span className="font-medium">{a.name}</span>{" "}
                            {a.action} • {a.when}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Trending Projects
                    </p>
                    <button className="text-xs text-muted-foreground">
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {trendingProjectsDetailed.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md overflow-hidden border border-border">
                          <Image
                            src={p.image}
                            alt={p.title}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{p.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.count} Projects
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-3">Upcoming Events</p>
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
  const [liked, setLiked] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const authorName = project.author?.name || "Unknown";
  const authorImage = (project.author?.image && !project.author.image.startsWith('blob:')) 
    ? project.author.image 
    : "/placeholder-user.jpg";
  const share = async () => {
    const link = project.liveUrl || project.githubUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(link);
    } catch {}
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
                shared a project • just now
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
              }}
              variant={"embedded"}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border hover:border-primary hover:text-primary bg-transparent"
              onClick={() => setLiked((v) => !v)}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />{" "}
              Like
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border hover:border-primary hover:text-primary bg-transparent"
              onClick={() => setShowComment((v) => !v)}
            >
              <MessageCircle className="h-4 w-4" /> Comment
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border hover:border-primary hover:text-primary bg-transparent"
              onClick={share}
            >
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
          {showComment && (
            <div className="mt-2 flex items-center gap-2 justify-center">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="max-w-[480px]"
              />
              <Button size="sm" onClick={() => setComment("")}>
                Send
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}