"use client"

import { Github, Linkedin, Mail } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MentorCardProps {
  name: string
  title: string
  position: string
  email: string
  field: string
  image: string
  linkedinUrl: string
  githubUrl: string
}

export function MentorCard({ name, title, position, email, field, image, linkedinUrl, githubUrl }: MentorCardProps) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex gap-5">
          {/* Left - Profile Image */}
          <div className="flex-shrink-0">
            <Avatar className="h-24 w-24 rounded-xl border-2 border-border">
              <AvatarImage src={image || "/placeholder.svg"} alt={name} className="object-cover" />
              <AvatarFallback className="text-2xl rounded-xl bg-muted">
                {(name || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Middle - Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{title}</span>
              <h3 className="text-lg font-semibold text-foreground truncate">{name}</h3>
            </div>

            <Badge variant="secondary" className="mb-2">
              {position}
            </Badge>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <a href={`mailto:${email}`} className="truncate hover:text-primary transition-colors">
                {email}
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs border-border hover:border-primary hover:text-primary bg-transparent"
                asChild
              >
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs border-border hover:border-primary hover:text-primary bg-transparent"
                asChild
              >
                <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>

          {/* Right - Field Badge */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground">Mentor in</span>
            <Badge
              className="text-xs font-medium px-3 py-1.5"
              style={{
                backgroundColor: getFieldColor(field).bg,
                color: getFieldColor(field).text,
              }}
            >
              {field}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getFieldColor(field: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    "Web Development": { bg: "#3b82f6", text: "#ffffff" },
    "AI/ML": { bg: "#8b5cf6", text: "#ffffff" },
    "Data Analysis": { bg: "#10b981", text: "#ffffff" },
    "Mobile App": { bg: "#f59e0b", text: "#000000" },
    "Cyber Security": { bg: "#ef4444", text: "#ffffff" },
    Blockchain: { bg: "#06b6d4", text: "#000000" },
  }
  return colors[field] || { bg: "#6b7280", text: "#ffffff" }
}
