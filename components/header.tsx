"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react";
import { Search, X, MessageCircle, ChevronDown, Shield, Lock } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchResults } from "./search-results";
import { menuItems } from "@/components/sidebar"; // Import static menuItems
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { LayoutDashboard } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Feed", href: "/feed" },
  { name: "Upload Project", href: "/upload" },
  { name: "Mentors", href: "/mentors" },
]

import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const { data: session, status } = useSession();
  const loading = status === "loading";

  // Try to fetch the latest profile so header avatar matches profile page immediately after edits
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    // Only fetch when session exists OR always fetch since profile API works independently
    enabled: true,
    // keep it fresh for a short time
    staleTime: 1000 * 30,
  })

  const avatarSrc = profile?.photo && !profile?.photo.startsWith('blob:')
    ? profile?.photo
    : session?.user?.image || "/placeholder-user.jpg"

  // Fetch unread message count from database
  useEffect(() => {
    const updateMessageCount = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/chat');
          if (response.ok) {
            const data = await response.json();
            const totalUnread = data.chats?.reduce((sum: number, chat: any) => {
              return sum + (chat.unreadCount || 0);
            }, 0) || 0;
            setMessageCount(totalUnread);
          }
        } catch (error) {
          console.error('Error fetching message count:', error);
        }
      }
    };

    // Initial load
    updateMessageCount();

    // Refresh message count periodically
    const interval = setInterval(updateMessageCount, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
      // CRITICAL FIX: Only close profile dropdown if click is outside profile container
      // This prevents dropdown from closing when clicking on menu items
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
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar/95 backdrop-blur-md border-b border-border/50 shadow-[0_1px_3px_rgb(0,0,0,0.05)]">
        <div className="flex items-center justify-between h-full px-6">

          {/* Left — Logo */}
          <div className="text-xl font-bold">
            <img
              src="/Screenshot 2025-12-04 002445.jpeg"
              alt="Profile"
              className="w-32 h-10 rounded-lg object-cover shadow-sm"
            />
          </div>

          {/* Center — Navigation */}
          <nav className="hidden ml-20 md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-5 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${pathname === item.href
                  ? "text-sidebar-primary-foreground bg-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
              >
                {item.name}
              </Link>
            ))}
            {/* Admin Upload Event Link */}
            {(session?.user?.role === 'admin' || session?.user?.role === 'super-admin' || (session?.user as any)?.type === 'admin' || (session?.user as any)?.type === 'super-admin') && (
              <Link
                href="/events/upload"
                className={`px-5 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${pathname === '/events/upload'
                  ? "text-sidebar-primary-foreground bg-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
              >
                Upload Event
              </Link>
            )}

          </nav>

          {/* Right — Theme, Search, Chat, Profile */}
          <div className="flex items-center gap-2">

            {/* Search */}
            <div ref={searchRef}>
              {searchOpen ? (
                <div className="relative flex items-center gap-2">
                  <Input
                    type="search"
                    placeholder="Search projects, mentors..."
                    className="w-64 h-10 bg-background border-border/50 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    autoFocus
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-lg hover:bg-secondary/50" onClick={handleCloseSearch}>
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
                  className="w-10 h-10 rounded-lg hover:bg-secondary/50 transition-all duration-200"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Chat */}
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-lg hover:bg-secondary/50 transition-all duration-200 relative"
              onClick={() => router.push("/chat")}
            >
              <MessageCircle className="h-5 w-5" />
              {messageCount >= 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground rounded-full shadow-sm">
                  {messageCount > 99 ? '99+' : messageCount}
                </span>
              )}
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 border border-border/50 rounded-full px-3 py-1.5 hover:bg-secondary/50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-background"
                />
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg shadow-black/10 py-2 z-50">
                  {menuItems.map((item: any) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/50 w-full text-left transition-colors duration-150"
                      onClick={() => setProfileOpen(false)}
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{item.name}</span>
                    </Link>
                  ))}

                  {/* Admin Panel & Mentor Dashboard Links - Restored for Admin Users */}
                  {(session?.user?.role === 'admin' || session?.user?.role === 'super-admin' || (session?.user as any)?.type === 'admin' || (session?.user as any)?.type === 'super-admin') && (
                    <>
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/50 w-full text-left text-primary font-medium transition-colors duration-150"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    </>
                  )}

                  <div className="border-t border-border/50 my-1" />

                  <button
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/50 w-full text-left transition-colors duration-150 relative group"
                    onClick={() => {
                      setProfileOpen(false)
                      setChangePasswordOpen(true)
                    }}
                  >
                    <Lock className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                    <span className="text-foreground group-hover:text-blue-500 transition-colors">Change Password</span>
                  </button>

                  <div className="border-t border-border/50 my-1" />

                  <button
                    className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground w-full text-left transition-colors duration-150"
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

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </>
  )
}
