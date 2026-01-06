"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { collectionCategories } from "@/lib/data/projects"
import { useRouter } from "next/navigation"
import { use } from "react"

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Unwrap params Promise for Next.js 15+
  const resolvedParams = use(params)
  const category = resolvedParams.category
  const categoryData = collectionCategories.find((c) => c.slug === category)
  
  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/projects')
        if (response.ok) {
          const allProjects = await response.json()
          
          // Filter projects by category OR matching tags
          const filtered = allProjects.filter((p: any) => {
            // Include projects that match the category directly
            if (p.category === category) return true
            
            // Include projects that have tags matching the category name or slug
            const categoryKeywords = [
              categoryData?.name?.toLowerCase() || '',
              categoryData?.slug?.toLowerCase() || '',
              // Add common variations for better matching
              categoryData?.name?.toLowerCase().replace(/\s+/g, '') || '',
              categoryData?.slug?.toLowerCase().replace(/-/g, '') || '',
              // Add specific mappings
              categoryData?.slug === 'web-development' ? 'web development' : '',
              categoryData?.slug === 'ai-ml' ? 'ai/ml' : '',
              categoryData?.slug === 'data-analysis' ? 'data analysis' : '',
              categoryData?.slug === 'mobile-app' ? 'mobile app' : '',
              categoryData?.slug === 'cyber-security' ? 'cyber security' : '',
            ].filter(Boolean)
            
            return p.tags?.some((tag: string) => 
              categoryKeywords.some((keyword: string) => 
                tag.toLowerCase().includes(keyword) || 
                keyword.includes(tag.toLowerCase())
              )
            )
          })
          
          setProjects(filtered)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [category, categoryData])

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
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No projects found in this category.</p>
              </div>
            ) : (
              projects.map((project) => <ProjectCard key={project.id} project={project} />)
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
