"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { projects, collectionCategories } from "@/lib/data/projects"
import { useRouter } from "next/navigation"

export default function CategoryPage({ params }: { params: { category: string } }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const category = params.category
  const categoryData = collectionCategories.find((c) => c.slug === category)
  const filtered = projects.filter((p) => p.category === category)

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="py-8">
          <Button variant="ghost" className="mb-6 gap-2" onClick={() => router.push('/feed')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>

          <h2 className="text-xl font-semibold text-foreground mb-6">
            {categoryData?.name || category} Projects ({filtered.length})
          </h2>

          <div className="space-y-6">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No projects found in this category.</p>
              </div>
            ) : (
              filtered.map((project) => <ProjectCard key={project.id} project={project} />)
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
