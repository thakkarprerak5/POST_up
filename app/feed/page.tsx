"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { CategoryCard } from "@/components/category-card"

const categories = [
  {
    name: "Web Developer",
    slug: "web-development",
    icon: "web",
    color: "blue",
  },
  {
    name: "AI/ML",
    slug: "ai-ml",
    icon: "ai",
    color: "purple",
  },
  {
    name: "Data Analysis",
    slug: "data-analysis",
    icon: "data",
    color: "green",
  },
  {
    name: "Mobile App",
    slug: "mobile-app",
    icon: "mobile",
    color: "orange",
  },
  {
    name: "Cyber Security",
    slug: "cyber-security",
    icon: "cyber",
    color: "red",
  },
  {
    name: "Blockchain",
    slug: "blockchain",
    icon: "blockchain",
    color: "indigo",
  },
]

export default function FeedPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 px-4 md:px-8 lg:px-12 max-w-5xl mx-auto">
        <div className="py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Browse Categories</h1>
            <p className="text-muted-foreground mt-1">Explore projects by technology field</p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
