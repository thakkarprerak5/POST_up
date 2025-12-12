"use client"

import { Github, Linkedin, Globe, Mail, MapPin, Calendar, Edit } from "lucide-react"
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface StudentProfileProps {
  student: {
    name: string
    username: string
    avatar: string
    bannerImage?: string
    bannerColor?: string
    course: string
    branch: string
    bio: string
    skills: string[]
    socialLinks: {
      github?: string
      linkedin?: string
      portfolio?: string
    }
    projects: {
      id: number
      title: string
      image: string
      tags: string[]
    }[]
    joinedDate: string
    location?: string
    email: string
  }
  isOwner?: boolean
}

export function StudentProfile({ student, isOwner = false }: StudentProfileProps) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="bg-card border-border overflow-hidden">
        {student.bannerImage ? (
          <div className="h-52 relative">
            <Image src={student.bannerImage} alt="banner" fill className="object-cover" />
          </div>
        ) : student.bannerColor ? (
          <div className="h-32" style={{ background: student.bannerColor }} />
        ) : (
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
        )}
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={student.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{student.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
                  <p className="text-muted-foreground">@{student.username}</p>
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-muted hover:text-blue-800 bg-unmuted"
                    onClick={() => router.push('/profile/edit')}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>{student.email}</span>
            </div>
            {student.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{student.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Joined {student.joinedDate}</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2 mt-4">
            {student.socialLinks.github && (
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                <a href={student.socialLinks.github} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
            )}
            {student.socialLinks.linkedin && (
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                <a href={student.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </Button>
            )}
            {student.socialLinks.portfolio && (
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                <a href={student.socialLinks.portfolio} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4" />
                  Portfolio
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Course / Branch */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Education</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{student.course}</p>
              <p className="text-sm text-muted-foreground">{student.branch}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-secondary text-secondary-foreground">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bio & Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{student.bio}</p>
            </CardContent>
          </Card>

          {/* Projects Uploaded */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Projects Uploaded ({student.projects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {student.projects.map((project) => (
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
                      <h4 className="font-medium text-foreground mb-2">{project.title}</h4>
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
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
