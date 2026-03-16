"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Github, Linkedin, Shield, MapPin, Building, Globe } from "lucide-react";
import Image from "next/image";

interface MentorHeroBannerProps {
    mentor: {
        _id: string;
        fullName: string;
        email: string;
        photo?: string;
        bannerImage?: string;
        bannerColor?: string;
        department?: string;
        position?: string;
        location?: string;
        socialLinks?: {
            github?: string;
            linkedin?: string;
            portfolio?: string;
        };
        expertise?: string[];
        type?: string;
    };
    isOwner?: boolean;
    isFollowing?: boolean;
    onFollow?: () => void;
    onEdit?: () => void;
    onViewPublic?: () => void;
}

export function MentorHeroBanner({
    mentor,
    isOwner,
    isFollowing,
    onFollow,
    onEdit,
    onViewPublic,
}: MentorHeroBannerProps) {
    return (
        <div className="relative w-full rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm mb-6 group">
            {/* Banner Background */}
            <div
                className="h-48 w-full relative"
                style={{
                    background: mentor.bannerImage
                        ? `url(${mentor.bannerImage}) center/cover no-repeat`
                        : mentor.bannerColor
                            ? mentor.bannerColor
                            : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                }}
            >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-6 relative">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 gap-6">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 rounded-full p-1 bg-background ring-4 ring-background/50 shadow-xl overflow-hidden">
                            <Image
                                src={mentor.photo || "/placeholder-user.jpg"}
                                alt={mentor.fullName || "Mentor Profile"}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-background rounded-full" title="Active"></div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 pt-2 md:pt-0 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                                {mentor.fullName}
                            </h1>
                            <div className="flex items-center gap-2">
                                {mentor.type === 'admin' || mentor.type === 'super-admin' ? (
                                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-200">
                                        <Shield className="w-3 h-3 mr-1" />
                                        {mentor.type === 'super-admin' ? 'Super Admin' : 'Admin'}
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200">
                                        Mentor
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <p className="text-muted-foreground font-medium mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            {mentor.position && <span>{mentor.position}</span>}
                            {mentor.department && (
                                <span className="flex items-center gap-1">
                                    <Building className="w-3.5 h-3.5" />
                                    {mentor.department}
                                </span>
                            )}
                            {mentor.location && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {mentor.location}
                                </span>
                            )}
                        </p>

                        {/* Social Links & Expertise (Desktop) */}
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            {mentor.socialLinks?.github && (
                                <a href={mentor.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Github className="w-5 h-5" />
                                </a>
                            )}
                            {mentor.socialLinks?.linkedin && (
                                <a href={mentor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-600 transition-colors">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            )}
                            {mentor.socialLinks?.portfolio && (
                                <a href={mentor.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Globe className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 self-start md:self-end mt-4 md:mt-0 w-full md:w-auto">
                        {isOwner ? (
                            <>
                                <Button variant="outline" size="sm" onClick={onViewPublic} className="flex-1 md:flex-none">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Public View
                                </Button>
                                <Button size="sm" onClick={onEdit} className="flex-1 md:flex-none">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant={isFollowing ? "outline" : "default"}
                                size="sm"
                                onClick={onFollow}
                                className="flex-1 md:flex-none min-w-[100px]"
                            >
                                {isFollowing ? "Following" : "Follow"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
