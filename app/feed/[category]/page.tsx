"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getCategoryBySlug } from "@/lib/category-tags"
import { useRouter } from "next/navigation"
import { use } from "react"

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Unwrap params Promise for Next.js 15+
  const resolvedParams = use(params)
  const category = resolvedParams.category
  const categoryData = getCategoryBySlug(category)
  
  // NO FRONTEND FILTERING NEEDED - Backend handles all filtering
  // Projects are already filtered by the unified Feed API
  
  // Fetch projects from unified Feed API with backend filtering
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        
        // Use unified Feed API with category filter
        const response = await fetch(`/api/feed?category=${category}&limit=50`)
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const feedData = await response.json()
        
        if (!feedData.success) {
          throw new Error(feedData.error || 'Failed to fetch projects')
        }
        
        console.log("🔥 CATEGORY PAGE - Projects from unified API:", feedData.count, "for category:", category)
        
        // Backend already filtered, no frontend filtering needed
        setProjects(feedData.projects)
        setAllProjects(feedData.projects)
        
      } catch (error) {
        console.error('Error fetching projects:', error)
        setProjects([])
        setAllProjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [category])
  
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="py-8">
          <Button variant="ghost" className="mb-6 gap-2" onClick={() => router.push('/feed')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>

          <h2 className="text-xl font-semibold text-foreground mb-6">
            {categoryData?.name || category} Projects ({projects.length})
          </h2>
          
          
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-card rounded-lg overflow-hidden">
                      <div className="bg-muted h-48"></div>
                      <div className="p-6 space-y-4">
                        <div className="bg-muted h-4 rounded w-3/4"></div>
                        <div className="bg-muted h-3 rounded w-full"></div>
                        <div className="bg-muted h-3 rounded w-2/3"></div>
                        <div className="flex gap-2">
                          <div className="bg-muted h-6 rounded w-16"></div>
                          <div className="bg-muted h-6 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-6">
                  There are no projects in the {categoryData?.name || category} category yet.
                </p>
                <Button onClick={() => router.push('/projects/new')}>
                  Create the first project
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
                </p>
                
                                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <ProjectCard key={project._id || project.id} project={project} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
