"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { CategoryCard } from "@/components/category-card"

export default function FeedPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories ONLY from /api/categories - NO frontend calculation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/categories')
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const categoriesData = await response.json()
        
        console.log("📊 FEED PAGE - Categories from backend:", categoriesData)
        
        // Validate that count field exists - build must fail if missing
        categoriesData.forEach((category: any) => {
          if (typeof category.count !== 'number') {
            throw new Error(`Missing count field for category: ${category.slug}`)
          }
          console.log("Category from backend:", {
            name: category.name,
            slug: category.slug,
            count: category.count
          });
        })
        
        // Store categories directly - NO calculation, just rendering
        setCategories(categoriesData)
        
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch categories')
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
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
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-32"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Error loading categories: {error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {categories.map((category: any) => (
                <CategoryCard 
                  key={category.slug} 
                  title={category.name}
                  count={category.count}
                  href={`/feed/${category.slug}`}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
