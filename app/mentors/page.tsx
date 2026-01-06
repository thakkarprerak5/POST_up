"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MentorCard } from "@/components/mentor-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// These fields will be dynamically generated from mentor data
const fields = ["All"]

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

const mentorsStatic: Mentor[] = [] // Empty array as fallback

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
          console.log('Fetched mentors data:', data) // Debug log
          
          // Map the data to match our expected format
          const mapped = data.map((mentor: any) => ({
            _id: mentor.id,
            name: mentor.name,
            email: mentor.email || '',
            image: mentor.avatar || '/placeholder-user.jpg',
            title: mentor.title || 'Mentor',
            position: mentor.position || 'Mentor ',
            field: mentor.expertise?.[0] || 'General',
            linkedinUrl: mentor.linkedin || '#',
            githubUrl: mentor.github || '#',
            profile: {
              type: 'mentor' as const,
              expertise: mentor.expertise || ['General'],
              bio: mentor.bio || '',
              skills: mentor.skills || []
            }
          }));
          
          console.log('Mapped mentors:', mapped) // Debug log
          setMentors(mapped);
        }
      } catch (error) {
        console.error('Error loading mentors:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Get unique fields from mentors for the filter
  const availableFields = ["All", "Web Development", "AI/ML", "Data Analysis", "Mobile App", "Cyber Security", "Blockchain"]
  
  // Filter mentors based on selected field
  const filteredMentors = selectedField === "All" 
    ? mentors 
    : mentors.filter(mentor => 
        (mentor.field || '').toLowerCase().includes(selectedField.toLowerCase()) ||
        (mentor.profile?.expertise?.some((e: string) => 
          e.toLowerCase().includes(selectedField.toLowerCase())
        ))
      )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-20 px-4 md:px-8 pb-8 max-w-6xl mx-auto">
        {/* Filter Bar */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {availableFields.map((field) => (
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
          {loading ? (
            // Loading skeleton
            Array(4).fill(0).map((_, i) => (
              <MentorCard 
                key={`loading-${i}`}
                name="Loading..."
                title="Mentor"
                position="Mentor"
                email=""
                field=""
                image=""
                linkedinUrl="#"
                githubUrl="#"
              />
            ))
          ) : filteredMentors.length > 0 ? (
            filteredMentors.map((mentor) => (
            <MentorCard 
              key={mentor._id || mentor.email} // Use _id if available, fallback to email
              name={mentor.name}
              title={mentor.title || 'Mentor'}
              position={mentor.position || 'Position not specified'}
              email={mentor.email}
              field={mentor.field || 'General'}
              image={mentor.image || mentor.avatar || '/placeholder-user.jpg'}
              linkedinUrl={mentor.linkedinUrl || '#'}
              githubUrl={mentor.githubUrl || '#'}
            />
          ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No mentors found{selectedField !== 'All' ? ` in ${selectedField}` : ''}.</p>
              {selectedField !== 'All' && (
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setSelectedField('All')}
                >
                  Show all mentors
                </Button>
              )}
            </div>
          )}
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
