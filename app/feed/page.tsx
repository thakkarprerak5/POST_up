"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { CategoryCard } from "@/components/category-card"
import { categories } from "@/lib/data/projects"

export default function FeedPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

  // Fetch all projects to count per category
  useEffect(() => {
    const fetchProjectCounts = async () => {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const allProjects = await response.json()
          
          // Count projects for each category
          const counts: Record<string, number> = {}
          categories.forEach(category => {
            const categoryProjects = allProjects.filter((project: any) => {
              // Include projects that match the category directly via tags
              const categoryKeywords = [
                category.name?.toLowerCase() || '',
                category.slug?.toLowerCase() || '',
                // Add common variations for better matching
                category.name?.toLowerCase().replace(/\s+/g, '') || '',
                category.slug?.toLowerCase().replace(/-/g, '') || '',
                // Add specific mappings
                category.slug === 'web-development' ? 'web development' : '',
                category.slug === 'ai-ml' ? 'ai/ml' : '',
                category.slug === 'data-analysis' ? 'data analysis' : '',
                category.slug === 'mobile-app' ? 'mobile app' : '',
                category.slug === 'cyber-security' ? 'cyber security' : '',
              ].filter(Boolean)
              
              return project.tags?.some((tag: string) => 
                categoryKeywords.some((keyword: string) => 
                  tag.toLowerCase().includes(keyword) || 
                  keyword.includes(tag.toLowerCase())
                )
              )
            })
            counts[category.slug] = categoryProjects.length
          })
          
          setCategoryCounts(counts)
        }
      } catch (error) {
        console.error('Error fetching project counts:', error)
      }
    }

    fetchProjectCounts()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />
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
              <CategoryCard 
                key={category.slug} 
                category={category} 
                projectCount={categoryCounts[category.slug] || 0}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
