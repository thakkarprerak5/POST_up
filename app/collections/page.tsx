"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { CollectionCategoryCard } from "@/components/collection-category-card"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List, ArrowLeft } from "lucide-react"

const userCategories = [
  {
    name: "Web Developer",
    slug: "web-development",
    icon: "web",
    color: "blue",
    projectCount: 3,
  },
  {
    name: "AI/ML",
    slug: "ai-ml",
    icon: "ai",
    color: "purple",
    projectCount: 1,
  },
  {
    name: "Data Analysis",
    slug: "data-analysis",
    icon: "data",
    color: "green",
    projectCount: 0,
  },
  {
    name: "Mobile App",
    slug: "mobile-app",
    icon: "mobile",
    color: "orange",
    projectCount: 2,
  },
  {
    name: "Cyber Security",
    slug: "cyber-security",
    icon: "cyber",
    color: "red",
    projectCount: 0,
  },
  {
    name: "Blockchain",
    slug: "blockchain",
    icon: "blockchain",
    color: "indigo",
    projectCount: 1,
  },
]

const userProjects = [
  {
    id: 1,
    category: "web-development",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "E-Commerce Dashboard",
    description:
      "A full-stack e-commerce dashboard with real-time analytics, inventory management, and order tracking. Built with Next.js and PostgreSQL.",
    tags: ["React", "Next.js", "PostgreSQL", "Web Development"],
    images: ["/ecommerce-dashboard-analytics.png", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/ecommerce-dashboard",
    liveUrl: "https://ecommerce-dashboard.vercel.app",
  },
  {
    id: 2,
    category: "web-development",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "Portfolio Website",
    description: "Personal developer portfolio with dark mode, project showcase, and contact form integration.",
    tags: ["React", "Tailwind CSS", "Framer Motion", "Web Development"],
    images: ["/developer-portfolio-website-dark.jpg", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/portfolio",
    liveUrl: "https://johndoe-portfolio.vercel.app",
  },
  {
    id: 3,
    category: "web-development",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "Task Management App",
    description:
      "Kanban-style task management application with drag-and-drop functionality, team collaboration, and deadline reminders.",
    tags: ["React", "TypeScript", "DnD Kit", "Web Development"],
    images: ["/task-management-kanban.png", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/task-manager",
    liveUrl: "https://task-manager-app.vercel.app",
  },
  {
    id: 4,
    category: "ai-ml",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "AI Chatbot Assistant",
    description:
      "An intelligent chatbot powered by GPT-4 with context awareness, conversation history, and custom training capabilities.",
    tags: ["Python", "OpenAI", "LangChain", "AI/ML"],
    images: ["/ai-chatbot-interface-dark.jpg", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/ai-chatbot",
    liveUrl: "https://ai-chatbot-demo.vercel.app",
  },
  {
    id: 5,
    category: "mobile-app",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "Fitness Tracker App",
    description:
      "Cross-platform mobile app for tracking workouts, calories, and health metrics with weekly progress reports.",
    tags: ["React Native", "Expo", "Firebase", "Mobile App"],
    images: ["/generic-mobile-app.png", "/analytics-chart.png", "/generic-data-dashboard.png"],
    githubUrl: "https://github.com/johndoe/fitness-tracker",
    liveUrl: "https://expo.dev/@johndoe/fitness-tracker",
  },
  {
    id: 6,
    category: "mobile-app",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "Recipe Sharing App",
    description: "Social mobile app for discovering, sharing, and saving recipes with ingredient shopping lists.",
    tags: ["Flutter", "Dart", "Supabase", "Mobile App"],
    images: ["/generic-mobile-app.png", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/recipe-app",
    liveUrl: "https://play.google.com/store/apps/details?id=com.johndoe.recipes",
  },
  {
    id: 7,
    category: "blockchain",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "NFT Marketplace",
    description: "Decentralized NFT marketplace with wallet integration, minting capabilities, and auction features.",
    tags: ["Solidity", "Ethereum", "Web3.js", "Blockchain"],
    images: ["/generic-data-dashboard.png", "/analytics-chart.png", "/ecommerce-dashboard-analytics.png"],
    githubUrl: "https://github.com/johndoe/nft-marketplace",
    liveUrl: "https://nft-marketplace-demo.vercel.app",
  },
]

type ViewMode = "feed" | "all"

export default function CollectionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("feed")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const totalProjects = userCategories.reduce((sum, cat) => sum + cat.projectCount, 0)

  const filteredProjects = selectedCategory ? userProjects.filter((p) => p.category === selectedCategory) : userProjects

  const selectedCategoryData = selectedCategory ? userCategories.find((c) => c.slug === selectedCategory) : null

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="py-8">
          {/* Page Header with View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">My Project Collection</h1>
              <p className="text-muted-foreground mt-1">
                {totalProjects} {totalProjects === 1 ? "project" : "projects"} uploaded
              </p>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === "feed" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setViewMode("feed")
                  setSelectedCategory(null)
                }}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Feed View
              </Button>
              <Button
                variant={viewMode === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setViewMode("all")
                  setSelectedCategory(null)
                }}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                All Projects
              </Button>
            </div>
          </div>

          {/* Feed View - Category Grid */}
          {viewMode === "feed" && !selectedCategory && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {userCategories.map((category) => (
                <CollectionCategoryCard
                  key={category.slug}
                  category={category}
                  onClick={() => {
                    if (category.projectCount > 0) {
                      setSelectedCategory(category.slug)
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* Feed View - Selected Category Projects */}
          {viewMode === "feed" && selectedCategory && (
            <div>
              {/* Back Button */}
              <Button variant="ghost" className="mb-6 gap-2" onClick={() => setSelectedCategory(null)}>
                <ArrowLeft className="h-4 w-4" />
                Back to Categories
              </Button>

              {/* Category Title */}
              <h2 className="text-xl font-semibold text-foreground mb-6">
                {selectedCategoryData?.name} Projects ({filteredProjects.length})
              </h2>

              {/* Projects List */}
              <div className="space-y-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {/* All Projects View */}
          {viewMode === "all" && (
            <div className="space-y-6">
              {userProjects.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You haven't uploaded any projects yet.</p>
                </div>
              ) : (
                userProjects.map((project) => <ProjectCard key={project.id} project={project} />)
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
