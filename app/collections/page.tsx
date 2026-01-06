"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { CollectionCategoryCard } from "@/components/collection-category-card"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List, ArrowLeft } from "lucide-react"
import { collectionCategories } from "@/lib/data/projects"
import { useSession } from "next-auth/react"

type ViewMode = "feed" | "all"

export default function CollectionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("feed")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  // Fetch user's actual projects from API
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!session?.user?.id) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/projects?author=${session.user.id}&limit=100`)
        if (!res.ok) throw new Error('Failed to fetch projects')
        const projects = await res.json()
        setUserProjects(projects)
      } catch (error) {
        console.error('Error fetching user projects:', error)
        setUserProjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserProjects()
  }, [session])

  // Calculate project counts for each category based on user's actual projects
  const categoriesWithCounts = collectionCategories.map((category) => {
    const matchingProjects = userProjects.filter((project) => {
      // Check if project category matches
      if (project.category === category.slug) return true
      
      // Check if project tags match category
      const categoryKeywords = [
        category.name?.toLowerCase() || '',
        category.slug?.toLowerCase() || '',
        category.name?.toLowerCase().replace(/\s+/g, '') || '',
        category.slug?.toLowerCase().replace(/-/g, '') || ''
      ].filter(Boolean)
      
      return project.tags?.some((tag: string) => 
        categoryKeywords.some(keyword => 
          tag.toLowerCase().includes(keyword) || 
          keyword.includes(tag.toLowerCase())
        )
      )
    })
    
    return {
      ...category,
      projectCount: matchingProjects.length
    }
  })

  const totalProjects = userProjects.length
  const filteredProjects = selectedCategory ? userProjects.filter((p) => p.category === selectedCategory) : userProjects
  const selectedCategoryData = selectedCategory ? categoriesWithCounts.find((c) => c.slug === selectedCategory) : null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="py-8">
          {/* Page Header with View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">My Project Collection</h1>
              <p className="text-muted-foreground mt-1">
                {loading ? 'Loading...' : `${totalProjects} ${totalProjects === 1 ? "project" : "projects"} uploaded`}
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

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading your projects...</p>
            </div>
          )}

          {/* Content - Only show when not loading */}
          {!loading && (
            <>
              {/* Feed View - Category Grid */}
              {viewMode === "feed" && !selectedCategory && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {categoriesWithCounts.map((category) => (
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
                    {filteredProjects.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No projects found in this category.</p>
                      </div>
                    ) : (
                      filteredProjects.map((project) => (
                        <ProjectCard key={project.id || project._id} project={project} />
                      ))
                    )}
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
                    userProjects.map((project) => (
                      <ProjectCard key={project.id || project._id} project={project} />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
