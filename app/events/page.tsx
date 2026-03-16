"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { EventCard, EventCardSkeleton } from "@/components/EventCard"
import { Calendar } from "lucide-react"

export default function EventFeedPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/events')
                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setEvents(data.events)
                    } else {
                        throw new Error(data.error || "Failed to fetch events")
                    }
                } else {
                    throw new Error("Failed to fetch events")
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()
    }, [])

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="pt-16 px-4 md:px-8 lg:px-12 max-w-5xl mx-auto">
                <div className="py-8">
                    {/* Page Title */}
                    <div className="mb-8 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Calendar className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Events & Announcements</h1>
                            <p className="text-muted-foreground mt-1">Stay updated with the latest community happenings</p>
                        </div>
                    </div>

                    {/* Event Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <EventCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">
                            Error: {error}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground">No Upcoming Events</h3>
                            <p className="text-muted-foreground">Check back later for new announcements.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {events.map((event) => (
                                <EventCard
                                    key={event._id}
                                    event={event}
                                    isRegistered={false} // TODO: Implement registration check
                                    onRegister={(id) => console.log('Register for', id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
