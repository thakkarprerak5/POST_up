"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { EventUploadForm } from "@/components/event-upload-form"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function EventUploadPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { data: session, status } = useSession()

    if (status === "loading") {
        return <div>Loading...</div>
    }

    // Strict Access Control
    const userRole = (session?.user as any)?.role || (session?.user as any)?.type;
    if (!session || (userRole !== 'admin' && userRole !== 'super-admin')) {
        redirect("/feed")
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="pt-16 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto">
                <div className="py-8">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold text-foreground">Post Announcement</h1>
                        <p className="text-muted-foreground mt-1">Create an event or announcement for the community</p>
                    </div>

                    {/* Upload Form */}
                    <EventUploadForm />
                </div>
            </main>
        </div>
    )
}
