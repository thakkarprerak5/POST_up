"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ProjectUploadForm } from "@/components/project-upload-form"
import { Loader2 } from "lucide-react"

export default function EditProjectPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    const fetchProject = async () => {
      // Get the ID from params - handle both Promise and direct access
      let id: string | undefined
      if (params && typeof params === 'object' && 'id' in params) {
        id = params.id as string
      }
      
      if (!id) return
      
      try {
        const response = await fetch(`/api/projects/${id}`)
        if (!response.ok) {
          throw new Error('Project not found')
        }
        const data = await response.json()
        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [params])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'Project not found'}</p>
            <button
              onClick={() => router.back()}
              className="text-primary hover:underline"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Edit Project</h1>
            <p className="text-muted-foreground mt-1">Update your project information</p>
          </div>

          {/* Edit Form */}
          <ProjectUploadForm 
            isEdit={true}
            initialData={project}
            onSuccess={() => router.push(`/projects/${project._id || project.id}`)}
          />
        </div>
      </main>
    </div>
  )
}
