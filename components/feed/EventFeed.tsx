"use client";

import { useEffect, useState } from "react";
import { EventCard, EventCardSkeleton } from "@/components/EventCard";
import { Calendar } from "lucide-react";

interface EventFeedProps {
    onProfilePhotoClick: (imageUrl: string, name: string) => void;
}

export function EventFeed({ onProfilePhotoClick }: EventFeedProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/events?limit=50');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.events)) {
                        setEvents(data.events);
                    }
                }
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const handleRegister = async (eventId: string) => {
        // TODO: Implement event registration
        console.log('Register for event:', eventId);
    };

    // Adapt event to post format for PostCard compatibility
    const adaptEventToPost = (event: any) => {
        return {
            id: event._id,
            content: event.description || 'No description available',
            title: event.title,
            type: 'event' as const,
            image: event.coverImage || null,
            author: {
                id: event.organizer.id,
                name: event.organizer.name,
                photo: event.organizer.photo || '/placeholder-user.jpg',
                role: event.organizer.type
            },
            likeCount: 0, // Events don't have likes yet
            commentCount: 0, // Events don't have comments yet
            createdAt: event.createdAt,
            likedByUser: false,
            likes: [],
            tags: event.tags || [] // Pass tags to PostCard
        };
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <EventCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming events</h3>
                <p className="text-sm text-muted-foreground">Events organized by mentors and admins will appear here</p>
            </div>
        );
    }

    return (
        <div>
            {/* Events Header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mb-6">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                    Upcoming Events - {events.length} event{events.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                    <EventCard
                        key={event._id}
                        event={event}
                        onRegister={handleRegister}
                        onProfilePhotoClick={onProfilePhotoClick}
                    />
                ))}
            </div>
        </div>
    );
}
