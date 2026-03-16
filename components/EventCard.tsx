"use client";

import { Calendar, Clock, MapPin, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClickableProfilePhoto } from "@/components/clickable-profile-photo";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface EventCardProps {
    event: {
        _id: string;
        title: string;
        description: string;
        coverImage?: string;
        date: Date | string;
        time: string;
        duration?: number;
        location?: string;
        organizer: {
            id: string;
            name: string;
            photo?: string;
            type: string;
        };
        attendeeCount: number;
        maxAttendees?: number;
        tags?: string[];
        status: string;
        videoUrl?: string;
    };
    onRegister?: (eventId: string) => void;
    onProfilePhotoClick?: (imageUrl: string, name: string) => void;
    isRegistered?: boolean;
}

export function EventCard({ event, onRegister, onProfilePhotoClick, isRegistered = false }: EventCardProps) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const handleRegister = () => {
        if (onRegister) {
            onRegister(event._id);
        }
    };

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Cover Image with Gradient Overlay */}
            <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                {event.videoUrl ? (
                    <video
                        src={event.videoUrl}
                        className="w-full h-full object-cover"
                        controls
                    />
                ) : event.coverImage ? (
                    <Image
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-white/30" />
                    </div>
                )}

                {/* Glassmorphism Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Event Status Badge */}
                <div className="absolute top-4 right-4">
                    <Badge
                        variant={event.status === 'upcoming' ? 'default' : 'secondary'}
                        className="bg-white/90 text-foreground backdrop-blur-sm"
                    >
                        {event.status}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-6">
                {/* Event Title */}
                <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                    {event.title}
                </h3>

                {/* Organizer Info */}
                <div className="flex items-center gap-3 mb-4">
                    <ClickableProfilePhoto
                        imageUrl={event.organizer.photo}
                        avatar="/placeholder-user.jpg"
                        name={event.organizer.name}
                        size="sm"
                        className="h-8 w-8"
                        onPhotoClick={onProfilePhotoClick}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {event.organizer.name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                            {event.organizer.type}
                        </Badge>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                </p>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>{event.time} {event.duration && `(${event.duration} min)`}</span>
                    </div>

                    {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>{event.location}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>
                            {event.attendeeCount} {event.maxAttendees && `/ ${event.maxAttendees}`} attending
                        </span>
                    </div>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {event.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Register Button */}
                <Button
                    onClick={handleRegister}
                    className={cn(
                        "w-full font-semibold",
                        isRegistered
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700"
                    )}
                    disabled={event.maxAttendees !== undefined && event.attendeeCount >= event.maxAttendees}
                >
                    {isRegistered ? "Registered ✓" : event.maxAttendees !== undefined && event.attendeeCount >= event.maxAttendees ? "Event Full" : "Register for Event"}
                </Button>
            </CardContent>
        </Card>
    );
}

// Skeleton loader for EventCard
export function EventCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </CardContent>
        </Card>
    );
}
