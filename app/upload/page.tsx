"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ProjectUploadForm } from "@/components/project-upload-form"

export default function UploadPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Upload Project</h1>
            <p className="text-muted-foreground mt-1">Share your work with the community</p>
          </div>

          {/* Upload Form */}
          <ProjectUploadForm />
        </div>
      </main>
    </div>
  )
}
