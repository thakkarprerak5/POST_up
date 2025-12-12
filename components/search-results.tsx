"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Github, ExternalLink, Tag, Users, GraduationCap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface SearchResultsProps {
  query: string
  onClose: () => void
}

export function SearchResults({ query, onClose }: SearchResultsProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])

  useEffect(() => {
    if (!query) return
    let mounted = true
    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        if (!mounted) return
        setUsers(data.users || [])
        setProjects(data.projects || [])
        setCollections(data.collections || [])
      } catch (err) {
        console.warn('Search error', err)
        if (mounted) {
          setUsers([])
          setProjects([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    const t = setTimeout(fetchResults, 200) // small debounce
    return () => {
      mounted = false
      clearTimeout(t)
    }
  }, [query])

  if (!query) return null

  const hasResults = users.length > 0 || projects.length > 0 || collections.length > 0
  const hasCollections = collections.length > 0

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl max-h-[70vh] overflow-y-auto z-50">
      {loading ? (
        <div className="p-6 text-center text-muted-foreground">Searching...</div>
      ) : !hasResults ? (
        <div className="p-6 text-center text-muted-foreground">No results found for "{query}"</div>
      ) : (
        <div className="p-3 space-y-4">
          {users.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Users className="h-4 w-4" />
                People
              </div>
              <div className="space-y-2 p-2">
                {users.map((u) => (
                  <Link key={u._id || u.id} href={`/profile/${u._id || u.id}`} onClick={onClose}>
                    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={u.photo || u.profile?.photo || '/placeholder-user.jpg'} className="object-cover" />
                            <AvatarFallback>{(u.fullName || u.email || 'U')[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium text-sm truncate">{u.fullName || u.email}</h4>
                              <Badge variant="outline" className="text-xs">{u.type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{u.profile?.bio || ''}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Tag className="h-4 w-4" />
                Projects
              </div>
              <div className="space-y-2 p-2">
                {projects.map((p) => (
                  <Link key={p._id || p.id} href={`/projects/${p._id || p.id}`} onClick={onClose}>
                    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.images?.[0] || p.author?.image || '/placeholder.svg'} className="object-cover" />
                            <AvatarFallback>{(p.author?.name || 'A')[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-foreground text-sm truncate">{p.title}</h4>
                                <p className="text-xs text-muted-foreground">by {p.author?.name}</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(p.tags || []).slice(0, 4).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {hasCollections && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Tag className="h-4 w-4" />
                Collections
              </div>
              <div className="space-y-2 p-2">
                {collections.map((c) => (
                  <Link key={c.slug || c.id} href={`/feed/${c.slug}`} onClick={onClose}>
                    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-sm">{(c.name || '').charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium text-sm truncate">{c.name}</h4>
                              <Badge variant="outline" className="text-xs">{c.projectCount ?? ''}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">Category • {c.slug}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
