"use client"

import { Github, Linkedin, Edit, Clock, BookOpen, Award, Building } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useFollowState } from "@/hooks/useFollowState"

interface MentorProfileProps {
  mentor: {
    _id: string
    name: string
    title: string
    avatar: string
    bannerImage?: string
    bannerColor?: string
    email: string
    expertise: string[]
    department: string
    researchAreas: string[]
    achievements: string[]
    officeHours: string
    location?: string
    socialLinks: {
      github?: string
      linkedin?: string
    }
    projectsSupervised: {
      id: number
      title: string
      image: string
      studentName: string
    }[]
    joinedDate: string
  }
  isOwner?: boolean
}

export function MentorProfile({ mentor, isOwner = false }: MentorProfileProps) {
  const router = useRouter();
  const { toggleFollow, isFollowing } = useFollowState();
  
  const handleFollow = async () => {
    // TODO: Implement follow API call
    toggleFollow(mentor._id);
  };
  return (
    <div className="space-y-6">
      {/* Profile Header Card with Banner */}
      <Card className="bg-card border-border overflow-hidden">
        {/* Banner */}
        <div 
          className="h-32 w-full relative"
          style={{
            backgroundColor: mentor.bannerImage ? 'transparent' : (mentor.bannerColor || '#3b82f6'),
            backgroundImage: mentor.bannerImage ? `url(${mentor.bannerImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Test color block */}
          {!mentor.bannerImage && (
            <div 
              className="absolute inset-0"
              style={{ backgroundColor: mentor.bannerColor || '#3b82f6' }}
            />
          )}
          {!mentor.bannerImage && !mentor.bannerColor && (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No Banner</span>
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-center gap-4 -mt-12">
            <div className="relative">
              <Image
                src={mentor.avatar || "/placeholder.svg"}
                alt={mentor.name}
                width={190}
                height={190}
                className="rounded-full object-cover border-2 border-border bg-background"
              />
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-4 -right-2 rounded-full w-8 h-8 p-0 bg-background"
                  onClick={() => router.push('/profile/edit')}
                  title="Edit profile"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{mentor.name}</h2>
              <p className="text-sm text-muted-foreground">{mentor.title}</p>
              <p className="text-sm text-muted-foreground">{mentor.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                📅 Joined {mentor.joinedDate}
              </p>
            </div>
            {!isOwner && (
              <Button
                variant={isFollowing(mentor._id) ? "default" : "outline"}
                size="sm"
                className={`gap-2 border-border hover:border-primary ${
                  isFollowing(mentor._id) 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                onClick={handleFollow}
              >
                {isFollowing(mentor._id) ? "Following" : "Follow"}
              </Button>
            )}
          </div>
          {mentor.expertise && mentor.expertise.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Areas of Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-secondary text-secondary-foreground">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {/* Social Links */}
          <div className="flex gap-3 mt-4">
            {mentor.socialLinks.github && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => window.open(mentor.socialLinks.github, '_blank')}
              >
                <Github className="h-4 w-4" />
              </Button>
            )}
            {mentor.socialLinks.linkedin && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => window.open(mentor.socialLinks.linkedin, '_blank')}
              >
                <Linkedin className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Department */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{mentor.department}</p>
            </CardContent>
          </Card>

          {/* Office Hours */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Office Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{mentor.officeHours}</p>
            </CardContent>
          </Card>

          {/* Expertise */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-secondary text-secondary-foreground">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Research Areas */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Research Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mentor.researchAreas.map((area, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    {area}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mentor.achievements.map((achievement, index) => (
                  <li key={index} className="flex items-start gap-3 text-muted-foreground">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                      {index + 1}
                    </span>
                    {achievement}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Projects Supervised */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Projects Supervised ({mentor.projectsSupervised.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mentor.projectsSupervised.map((project) => (
                  <div
                    key={project.id}
                    className="group rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="aspect-video relative bg-muted">
                      <Image
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-foreground mb-1">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">by {project.studentName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
