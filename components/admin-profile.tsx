"use client"

import { Github, Linkedin, Edit, Clock, BookOpen, Award, Building, Users, User, Loader2, RotateCcw, LayoutDashboard, ChevronDown, ChevronUp, X, MessageCircle } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from "next/image"
import { useFollowState } from "@/hooks/useFollowState"
import { useSession } from 'next-auth/react'

interface AdminProfileProps {
  admin: {
    _id: string;
    id: string;
    fullName: string;
    email: string;
    photo: string;
    bannerImage?: string;
    bannerColor?: string;
    expertise: string[];
    department: string;
    researchAreas: string[];
    achievements: string[];
    officeHours: string;
    location?: string;
    socialLinks: {
      github?: string;
      linkedin?: string;
    }
    projectsSupervised: {
      id: number;
      title: string;
      image: string;
      studentName: string;
    }[];
    joinedDate: string;
    role: string;
  }
  isOwner?: boolean;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ admin, isOwner }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const { followed, toggleFollow, isFollowing } = useFollowState()
  const [loading, setLoading] = useState(true)
  const [adminProjects, setAdminProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)

  // Role-based access control
  const isCurrentUserAdmin = session?.user?.id === admin._id || session?.user?.id === admin.id
  const isSuperAdmin = session?.user?.role === 'super-admin'
  const canManageProjects = isOwner || isCurrentUserAdmin || isSuperAdmin
  const isLoggedIn = !!session?.user

  const handleFollow = async () => {
    toggleFollow(admin?.id || admin?._id || '')
  }

  // Fetch admin's projects
  const fetchAdminProjects = async () => {
    try {
      setProjectsLoading(true)
      const authorId = admin?.id || admin?._id;

      const response = await fetch(`/api/projects?author=${authorId}&t=${Date.now()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const projects = await response.json();
        setAdminProjects(projects);
      } else {
        setAdminProjects([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchAdminProjects:', error);
      setAdminProjects([]);
    } finally {
      setProjectsLoading(false)
    }
  }

  // Only fetch data when admin is available
  useEffect(() => {
    const adminId = admin?.id || admin?._id;
    if (adminId) {
      fetchAdminProjects();
    } else {
      setLoading(false);
    }

    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [admin?.id, admin?._id, loading]);

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Profile Header Card with Banner - EXACT SAME AS MENTOR */}
          <Card className="bg-card border-border overflow-hidden">
            {/* Banner */}
            <div
              className="h-32 w-full relative"
              style={{
                backgroundColor: admin.bannerImage ? 'transparent' : (admin.bannerColor || '#3b82f6'),
                backgroundImage: admin.bannerImage ? `url(${admin.bannerImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {!admin.bannerImage && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: admin.bannerColor || '#3b82f6' }}
                />
              )}
              {!admin.bannerImage && !admin.bannerColor && (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Banner</span>
                </div>
              )}
            </div>

            <CardContent className="p-6">
              <div className="flex items-center gap-4 -mt-12">
                <div className="relative">
                  <Image
                    src={admin.photo || "/placeholder.svg"}
                    alt={admin.fullName || "Admin avatar"}
                    width={220}
                    height={220}
                    className="rounded-full object-cover border-2 border-border bg-background"
                  />
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute -bottom-4 -right-2 rounded-full w-8 h-8 p-0 bg-background"
                      onClick={() => router.push('/admin/settings/profile')}
                      title="Edit profile"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">{admin.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{admin.department}</p>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Admin
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      📅 Joined {admin.joinedDate}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isCurrentUserAdmin && (
                    <Button
                      variant={showDashboard ? "default" : "outline"}
                      size="sm"
                      className={`gap-2 border-border hover:border-primary ${showDashboard
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-background hover:bg-muted"
                        }`}
                      onClick={() => setShowDashboard(!showDashboard)}
                      title="Toggle admin dashboard"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                      {showDashboard ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                  {!isOwner && (
                    <Button
                      variant={isFollowing(admin._id) ? "default" : "outline"}
                      size="sm"
                      className={`gap-2 border-border hover:border-primary ${isFollowing(admin._id)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      onClick={handleFollow}
                    >
                      {isFollowing(admin._id) ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
              {admin.expertise && admin.expertise.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-foreground mb-2">Areas of Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {admin.expertise.map((skill, index) => (
                      <Badge key={`header-expertise-${index}-${skill}`} variant="secondary" className="bg-secondary text-secondary-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                {admin.socialLinks.github && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(admin.socialLinks.github, '_blank')}
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                )}
                {admin.socialLinks.linkedin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(admin.socialLinks.linkedin, '_blank')}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - EXACT SAME AS MENTOR */}
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Department
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-foreground">{admin.department}</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Office Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{admin.officeHours}</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {admin.expertise?.map((skill, index) => (
                      <Badge key={`expertise-section-${index}-${skill}`} variant="secondary" className="bg-secondary text-secondary-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Research Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {admin.researchAreas?.map((area, index) => (
                      <li key={`research-area-${index}-${area}`} className="flex items-start gap-2 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {admin.achievements?.map((achievement, index) => (
                      <li key={`achievement-${index}-${achievement}`} className="flex items-start gap-3 text-muted-foreground">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                          {index + 1}
                        </span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Middle & Right Columns Container - EXACT SAME AS MENTOR */}
            <div className="xl:col-span-2 space-y-6">
              {/* Admin Dashboard Section */}
              {showDashboard && isCurrentUserAdmin && (
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      Admin Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => router.push('/admin')}
                      >
                        <LayoutDashboard className="h-6 w-6" />
                        <span className="text-sm">Main Dashboard</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => router.push('/admin/users')}
                      >
                        <Users className="h-6 w-6" />
                        <span className="text-sm">User Management</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => router.push('/admin/mentors')}
                      >
                        <Award className="h-6 w-6" />
                        <span className="text-sm">Mentor Management</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assigned Students & Groups - EXACT SAME AS MENTOR */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Assigned Students & Groups
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border hover:border-primary"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Assigned Students */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Assigned Students (0)
                      </h3>
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">No students assigned yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Students will be assigned to you by administrators.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Assigned Groups (0)
                      </h3>
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">No groups assigned yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Groups will be assigned to you by administrators.
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-foreground">0</p>
                        <p className="text-sm text-muted-foreground">Students Assigned</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-foreground">0</p>
                        <p className="text-sm text-muted-foreground">Groups Assigned</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-foreground">0</p>
                        <p className="text-sm text-muted-foreground">Total Assignments</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uploaded Projects - EXACT SAME AS MENTOR */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Uploaded Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {adminProjects.length > 0 ? (
                    <div className="space-y-4">
                      {adminProjects.map((project) => (
                        <div
                          key={`admin-project-${project._id}-${project.title}`}
                          className="group rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/projects/${project._id}`)}
                        >
                          <div className="flex gap-4 p-4">
                            <div className="w-24 h-24 relative flex-shrink-0 rounded-md overflow-hidden bg-muted">
                              <Image
                                src={project.images?.[0] || "/placeholder.svg"}
                                alt={project.title || "Project image"}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground mb-1 truncate">{project.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{project.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <span>🔄</span> {project.shareCount || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span>💬</span> {project.commentsCount || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span>❤️</span> {project.likeCount || 0}
                                  </span>
                                </div>
                                {isOwner && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/projects/${project._id}/edit`)
                                      }}
                                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">No projects uploaded yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Your uploaded projects will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { AdminProfile };
