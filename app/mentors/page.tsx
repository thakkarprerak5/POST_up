"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MentorCard } from "@/components/mentor-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const fields = ["All", "Web Development", "AI/ML", "Data Analysis", "Mobile App", "Cyber Security", "Blockchain"]

interface Mentor {
  _id?: string
  name: string
  title?: string
  position?: string
  email: string
  field?: string
  image?: string
  avatar?: string
  profile?: {
    bio?: string
    skills?: string[]
    type: 'student' | 'mentor'
  }
  followerCount?: number
  followingCount?: number
  linkedinUrl?: string
  githubUrl?: string
}

const mentorsStatic = [
  {
    name: "Sarah Johnson",
    title: "Dr.",
    position: "Senior Faculty",
    email: "sarah.johnson@university.edu",
    field: "Web Development",
    image: "/professional-woman-professor.png",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
  },
  {
    name: "Michael Chen",
    title: "Prof.",
    position: "Department Head",
    email: "michael.chen@university.edu",
    field: "AI/ML",
    image: "/professional-asian-professor.png",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
  },
  {
    name: "Emily Rodriguez",
    title: "Ms.",
    position: "Industry Mentor",
    email: "emily.rodriguez@techcorp.com",
    field: "Data Analysis",
    image: "/professional-latina-woman.png",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
  },
  {
    name: "David Kim",
    title: "Mr.",
    position: "Tech Lead",
    email: "david.kim@startup.io",
    field: "Mobile App",
    image: "/professional-korean-man-developer.jpg",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
  },
  {
    name: "Amanda Foster",
    title: "Dr.",
    position: "Research Lead",
    email: "amanda.foster@security.org",
    field: "Cyber Security",
    image: "/black-woman-scientist.png",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
  },
  {
    name: "James Wilson",
    title: "Mr.",
    position: "Blockchain Expert",
    email: "james.wilson@crypto.dev",
    field: "Blockchain",
    image: "/professional-man-blockchain-developer.jpg",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
  },
]

export default function MentorsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedField, setSelectedField] = useState("All")
  const [mentors, setMentors] = useState<Mentor[]>(mentorsStatic)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/mentors')
        if (res.ok) {
          const data = await res.json()
          const mapped = data.map((u: any) => ({
            name: u.fullName,
            title: u.profile?.position || 'Mentor',
            position: u.profile?.position || 'Mentor',
            email: u.email,
            field: u.profile?.department || 'Mentor',
            image: u.photo || '/professional-woman-professor.png',
          }))
          setMentors(mapped)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredMentors = selectedField === "All" ? mentors : mentors.filter((mentor) => mentor.field === selectedField)

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-20 px-4 md:px-8 pb-8 max-w-6xl mx-auto">
        {/* Filter Bar */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {fields.map((field) => (
              <Button
                key={field}
                variant={selectedField === field ? "default" : "outline"}
                size="sm"
                className={`h-9 ${
                  selectedField === field
                    ? "bg-primary text-primary-foreground"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
                onClick={() => setSelectedField(field)}
              >
                {field}
              </Button>
            ))}
          </div>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(loading ? [] : filteredMentors).map((mentor) => (
            <MentorCard key={mentor.email} {...mentor} />
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No mentors found in this field.</p>
          </div>
        )}
      </main>
    </div>
  )
}
