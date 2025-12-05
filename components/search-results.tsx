"use client"

import type React from "react"
import {
  Github,
  Linkedin,
  ExternalLink,
  Mail,
  Folder,
  Tag,
  Users,
  GraduationCap,
  Globe,
  Brain,
  BarChart3,
  Smartphone,
  Shield,
  LinkIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

// Sample data for search
const categories = [
  { id: "web", name: "Web Development", slug: "web-development", icon: "web", color: "blue", projectCount: 24 },
  { id: "ai", name: "AI/ML", slug: "ai-ml", icon: "ai", color: "purple", projectCount: 18 },
  { id: "data", name: "Data Analysis", slug: "data-analysis", icon: "data", color: "green", projectCount: 15 },
  { id: "mobile", name: "Mobile App", slug: "mobile-app", icon: "mobile", color: "orange", projectCount: 12 },
  { id: "cyber", name: "Cyber Security", slug: "cyber-security", icon: "cyber", color: "red", projectCount: 8 },
  { id: "blockchain", name: "Blockchain", slug: "blockchain", icon: "blockchain", color: "indigo", projectCount: 6 },
]

const mentors = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    position: "Associate Professor",
    field: "AI/ML",
    email: "sarah.johnson@university.edu",
    image: "/professional-woman-professor.png",
    research: ["Deep Learning", "Neural Networks", "Computer Vision"],
    achievements: ["Best Paper Award 2023", "NSF Research Grant"],
    linkedinUrl: "#",
    githubUrl: "#",
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    position: "Department Head",
    field: "Web Development",
    email: "m.chen@university.edu",
    image: "/professional-asian-professor.png",
    research: ["Full Stack Architecture", "Cloud Computing"],
    achievements: ["Google Developer Expert", "AWS Solutions Architect"],
    linkedinUrl: "#",
    githubUrl: "#",
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    position: "Senior Lecturer",
    field: "Data Analysis",
    email: "e.rodriguez@university.edu",
    image: "/professional-latina-woman.png",
    research: ["Big Data", "Statistical Modeling", "Data Visualization"],
    achievements: ["Data Science Excellence Award"],
    linkedinUrl: "#",
    githubUrl: "#",
  },
]

const students = [
  {
    id: 1,
    name: "Alex Kumar",
    course: "B.Tech Computer Science",
    skills: ["React", "Node.js", "Python", "TensorFlow"],
    image: "/young-male-student-developer.jpg",
    projectCount: 5,
    linkedinUrl: "#",
    githubUrl: "#",
  },
  {
    id: 2,
    name: "Jessica Wang",
    course: "M.Tech Data Science",
    skills: ["Python", "Machine Learning", "SQL", "Tableau"],
    image: "/young-asian-female-student.jpg",
    projectCount: 3,
    linkedinUrl: "#",
    githubUrl: "#",
  },
]

const projects = [
  {
    id: 1,
    title: "E-Commerce Dashboard",
    description: "A full-stack e-commerce admin dashboard with real-time analytics",
    tags: ["React", "Node.js", "MongoDB", "Web Development"],
    author: "Alex Kumar",
    authorImage: "/young-male-student-developer.jpg",
    githubUrl: "#",
    liveUrl: "#",
  },
  {
    id: 2,
    title: "AI Chatbot Assistant",
    description: "An intelligent chatbot using NLP and machine learning",
    tags: ["Python", "TensorFlow", "NLP", "AI/ML"],
    author: "Jessica Wang",
    authorImage: "/young-asian-female-student.jpg",
    githubUrl: "#",
    liveUrl: "#",
  },
  {
    id: 3,
    title: "Blockchain Voting System",
    description: "Decentralized voting application using Ethereum",
    tags: ["Solidity", "Web3.js", "React", "Blockchain"],
    author: "Alex Kumar",
    authorImage: "/young-male-student-developer.jpg",
    githubUrl: "#",
    liveUrl: "#",
  },
  {
    id: 4,
    title: "Sales Data Visualization",
    description: "Interactive dashboard for sales analytics",
    tags: ["Python", "Pandas", "Plotly", "Data Analysis"],
    author: "Jessica Wang",
    authorImage: "/young-asian-female-student.jpg",
    githubUrl: "#",
    liveUrl: "#",
  },
]

const iconMap: Record<string, React.ElementType> = {
  web: Globe,
  ai: Brain,
  data: BarChart3,
  mobile: Smartphone,
  cyber: Shield,
  blockchain: LinkIcon,
}

const colorMap: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#a855f7",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  indigo: "#6366f1",
}

interface SearchResultsProps {
  query: string
  onClose: () => void
}

export function SearchResults({ query, onClose }: SearchResultsProps) {
  const searchLower = query.toLowerCase()

  // Filter categories
  const filteredCategories = categories.filter((cat) => cat.name.toLowerCase().includes(searchLower))

  // Filter mentors by name, field, research, achievements
  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(searchLower) ||
      mentor.field.toLowerCase().includes(searchLower) ||
      mentor.research.some((r) => r.toLowerCase().includes(searchLower)) ||
      mentor.achievements.some((a) => a.toLowerCase().includes(searchLower)) ||
      mentor.position.toLowerCase().includes(searchLower),
  )

  // Filter students by name, skills, course
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchLower) ||
      student.course.toLowerCase().includes(searchLower) ||
      student.skills.some((s) => s.toLowerCase().includes(searchLower)),
  )

  // Filter projects by title, tags, description
  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.tags.some((t) => t.toLowerCase().includes(searchLower)),
  )

  const hasResults =
    filteredCategories.length > 0 ||
    filteredMentors.length > 0 ||
    filteredStudents.length > 0 ||
    filteredProjects.length > 0

  if (!query) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl max-h-[70vh] overflow-y-auto z-50">
      {!hasResults ? (
        <div className="p-8 text-center text-muted-foreground">
          <p>No results found for "{query}"</p>
        </div>
      ) : (
        <div className="p-3">
          {/* Categories/Fields */}
          {filteredCategories.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Folder className="h-4 w-4" />
                Fields / Categories
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-2">
                {filteredCategories.map((cat) => {
                  const Icon = iconMap[cat.icon]
                  const accentColor = colorMap[cat.color] || colorMap.blue

                  return (
                    <Link key={cat.id} href={`/feed/${cat.slug}`} onClick={onClose}>
                      <div className="group relative overflow-hidden rounded-xl bg-card border border-border p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary/50">
                        {/* Animated background on hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                          style={{ backgroundColor: accentColor }}
                        />

                        {/* Icon and content */}
                        <div className="relative flex flex-col items-center gap-3">
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            <Icon className="w-7 h-7 transition-colors duration-300" style={{ color: accentColor }} />
                          </div>

                          <div className="text-center">
                            <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300">
                              {cat.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">{cat.projectCount} projects</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mentors */}
          {filteredMentors.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <GraduationCap className="h-4 w-4" />
                Mentors / Faculty
              </div>
              <div className="space-y-2">
                {filteredMentors.map((mentor) => (
                  <Card key={mentor.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 rounded-lg">
                          <AvatarImage src={mentor.image || "/placeholder.svg"} className="object-cover" />
                          <AvatarFallback className="rounded-lg">
                            {mentor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground text-sm">{mentor.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {mentor.field}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{mentor.position}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{mentor.email}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <a
                              href={mentor.linkedinUrl}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Linkedin className="h-4 w-4" />
                            </a>
                            <a
                              href={mentor.githubUrl}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Github className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Students */}
          {filteredStudents.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Users className="h-4 w-4" />
                Students
              </div>
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 rounded-lg">
                          <AvatarImage src={student.image || "/placeholder.svg"} className="object-cover" />
                          <AvatarFallback className="rounded-lg">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-sm">{student.name}</h4>
                          <p className="text-xs text-muted-foreground">{student.course}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {student.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs px-1.5 py-0">
                                {skill}
                              </Badge>
                            ))}
                            {student.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                +{student.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <a
                              href={student.linkedinUrl}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Linkedin className="h-4 w-4" />
                            </a>
                            <a
                              href={student.githubUrl}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Github className="h-4 w-4" />
                            </a>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {student.projectCount} projects
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Tag className="h-4 w-4" />
                Projects
              </div>
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={project.authorImage || "/placeholder.svg"} className="object-cover" />
                          <AvatarFallback>{project.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-foreground text-sm">{project.title}</h4>
                              <p className="text-xs text-muted-foreground">by {project.author}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <a
                                href={project.githubUrl}
                                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Github className="h-4 w-4" />
                              </a>
                              <a
                                href={project.liveUrl}
                                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.tags.slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
