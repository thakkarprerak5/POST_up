"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, X, MessageCircle, ChevronDown } from "lucide-react"
import { useQuery } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { SearchResults } from "./search-results"
import { menuItems } from "@/components/sidebar"
import { useSession, signOut } from "next-auth/react"

const navItems = [
  { name: "Home", href: "/" },
  { name: "Feed", href: "/feed" },
  { name: "Upload Project", href: "/upload" },
  { name: "Mentors", href: "/mentors" },
]

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  // Try to fetch the latest profile so header avatar matches profile page immediately after edits
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    // Only fetch when session exists
    enabled: Boolean(session),
    // keep it fresh for a short time
    staleTime: 1000 * 30,
  })

  const avatarSrc = profile?.photo && !profile?.photo.startsWith('blob:') 
    ? profile?.photo 
    : session?.user?.image || "/placeholder-user.jpg"

  

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowResults(e.target.value.length > 0)
  }

  const handleCloseSearch = () => {
    setSearchOpen(false)
    setSearchQuery("")
    setShowResults(false)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-border">
        <div className="flex items-center justify-between h-full px-4 md:px-6">

          {/* Left — Logo */}
          <div className="text-xl font-bold ml-14">
            <img
              src="/Screenshot 2025-12-04 002445.jpeg"
              alt="Profile"
              className="w-28 h-13 rounded-full object-cover border-b-2 border-blue-900"
            />
          </div>

          {/* Center — Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-md ${
                  pathname === item.href
                    ? "text-foreground bg-muted border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right — Search, Chat, Profile */}
          <div className="flex items-center gap-3">

            {/* Search */}
            <div ref={searchRef}>
              {searchOpen ? (
                <div className="relative flex items-center gap-2">
                  <Input
                    type="search"
                    placeholder="Search projects, mentors..."
                    className="w-48 md:w-80 h-9 bg-muted border-border"
                    autoFocus
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <Button variant="ghost" size="icon" className="w-9 h-9" onClick={handleCloseSearch}>
                    <X className="h-4 w-4" />
                  </Button>

                  {showResults && (
                    <SearchResults query={searchQuery} onClose={() => setShowResults(false)} />
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Chat */}
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 relative"
              onClick={() => router.push("/chat")}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground rounded-full">
                4
              </span>
            </Button>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 border border-border rounded-full px-2 py-1 hover:bg-muted transition"
              >
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#34233b] border border-border rounded-lg shadow-blue-950 py-2 z-50">

                  {/* Menu Items */}
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted"
                      onClick={() => setProfileOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}

                  <div className="border-t border-border my-1" />

                  
                  <div className="border-t border-border my-1" />    
                  {/* Logout */}
                  <button
                    className="block px-4 py-2 text-sm text-white-600 hover:bg-muted w-full text-left"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    Logout
                  </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </header>
    </>
  )
}
