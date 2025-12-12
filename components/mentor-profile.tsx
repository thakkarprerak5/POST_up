"use client"

import { Github, Linkedin, Mail, MapPin, Calendar, Edit, Clock, BookOpen, Award, Building } from "lucide-react"
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface MentorProfileProps {
  mentor: {
    name: string
    title: string
    avatar: string
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
  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-accent/20 via-primary/10 to-primary/20" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={mentor.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{(mentor.name || "M")[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{mentor.name}</h1>
                  <p className="text-muted-foreground">{mentor.title}</p>
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-muted hover:text-blue-900 bg-unmuted"
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
              <a href={`mailto:${mentor.email}`} className="hover:text-primary transition-colors">
                {mentor.email}
              </a>
            </div>
            {mentor.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{mentor.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Member since {mentor.joinedDate}</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2 mt-4">
            {mentor.socialLinks.github && (
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                <a href={mentor.socialLinks.github} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
            )}
            {mentor.socialLinks.linkedin && (
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                <a href={mentor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
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
