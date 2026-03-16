"use client"

import { Github, Linkedin, Edit, Clock, BookOpen, Award, Building, Users, User, Loader2, RotateCcw, LayoutDashboard, ChevronDown, ChevronUp, X, MessageCircle, Crown, Shield, Settings, BarChart3 } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from "next/image"
import { useFollowState } from "@/hooks/useFollowState"
import { useSession } from 'next-auth/react'

interface Student {
  id: string;
  _id: string; // MongoDB document ID
  fullName: string;
  email: string;
  photo: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface SuperAdmin {
  id: string;
  fullName: string;
  email: string;
  photo: string;
}

interface StudentAssignment {
  id: string;
  student: Student;
  assignedBy: string;
  assignedAt: string;
}

interface GroupAssignment {
  id: string;
  group: Group & {
    mentorId?: {
      name: string;
      email: string;
      photo: string;
    };
    studentIds?: {
      name: string;
      email: string;
      photo: string;
    }[];
  };
  assignedBy: string;
  assignedAt: string;
}

interface SuperAdminAssignmentsData {
  students: StudentAssignment[];
  groups: GroupAssignment[];
  superAdmins: SuperAdmin[];
  summary: {
    totalStudents: number;
    totalGroups: number;
    totalAssignments: number;
  };
  permissions?: {
    canManageAssignments: boolean;
    canRemoveStudents: boolean;
    canRemoveGroups: boolean;
    isOwnProfile: boolean;
    isPublicView?: boolean;
  };
}

interface SuperAdminProfileProps {
  superAdmin: {
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

const SuperAdminProfile: React.FC<SuperAdminProfileProps> = ({ superAdmin, isOwner }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const { followed, toggleFollow, isFollowing } = useFollowState()
  const [loading, setLoading] = useState(true)
  const [assignmentsData, setAssignmentsData] = useState<SuperAdminAssignmentsData | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [superAdminProjects, setSuperAdminProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)

  // Role-based access control
  const isCurrentUserSuperAdmin = session?.user?.id === superAdmin._id || session?.user?.id === superAdmin.id
  const isSuperAdmin = session?.user?.role === 'super-admin'
  const canManageProjects = isOwner || isCurrentUserSuperAdmin || isSuperAdmin
  const canManageAssignments = isCurrentUserSuperAdmin || isSuperAdmin
  const isLoggedIn = !!session?.user

  // Debug logging for ownership and project access
  useEffect(() => {
    const debugInfo = {
      sessionUserId: session?.user?.id,
      superAdminId: superAdmin._id,
      superAdminIdAlt: superAdmin.id,
      isOwner,
      isCurrentUserSuperAdmin,
      isSuperAdmin,
      canManageProjects,
      superAdminFullName: superAdmin.fullName
    };
    console.log('🔍 SuperAdminProfile Debug Info:', JSON.stringify(debugInfo, null, 2));
  }, [session?.user?.id, superAdmin._id, superAdmin.id, isOwner, isCurrentUserSuperAdmin, isSuperAdmin, canManageProjects, superAdmin.fullName]);

  const handleFollow = async () => {
    // TODO: Implement follow API call
    toggleFollow(superAdmin?.id || superAdmin?._id || '')
  }

  const refreshAssignments = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Fetch super admin's projects
  const fetchSuperAdminProjects = async () => {
    try {
      setProjectsLoading(true)
      const authorId = superAdmin?.id || superAdmin?._id;
      const debugInfo = {
        superAdminId: superAdmin?._id,
        superAdminIdAlt: superAdmin?.id,
        finalAuthorId: authorId,
        superAdminName: superAdmin?.fullName,
        canManageProjects
      };
      console.log('🚀 Fetching projects for super admin:', JSON.stringify(debugInfo, null, 2));

      const response = await fetch(`/api/projects?author=${authorId}&t=${Date.now()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const projects = await response.json();
        const projectDebug = {
          projectCount: projects.length,
          projects: projects.map((p: any) => ({ id: p._id, title: p.title, author: p.author }))
        };
        console.log('🔍 Super Admin projects fetched:', JSON.stringify(projectDebug, null, 2));
        setSuperAdminProjects(projects);
      } else {
        console.error('❌ Error fetching super admin projects:', response.status);
        setSuperAdminProjects([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchSuperAdminProjects:', error);
      setSuperAdminProjects([]);
    } finally {
      setProjectsLoading(false)
    }
  }

  // Fetch super admin's assignments
  const fetchSuperAdminAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      console.log('🚀 Starting fetchSuperAdminAssignments for super admin:', superAdmin?.id || superAdmin?._id);
      console.log('🔐 User role check:', { isLoggedIn, isCurrentUserSuperAdmin, canManageAssignments });

      // For super admin, create mock data with system-wide oversight
      const mockAssignmentsData: SuperAdminAssignmentsData = {
        students: [],
        groups: [],
        superAdmins: [{
          id: superAdmin.id,
          fullName: superAdmin.fullName,
          email: superAdmin.email,
          photo: superAdmin.photo
        }],
        summary: {
          totalStudents: 0,
          totalGroups: 0,
          totalAssignments: 0
        },
        permissions: {
          canManageAssignments: canManageAssignments,
          canRemoveStudents: canManageAssignments,
          canRemoveGroups: canManageAssignments,
          isOwnProfile: isCurrentUserSuperAdmin
        }
      };

      setAssignmentsData(mockAssignmentsData);
    } catch (error) {
      console.error('❌ Error in fetchSuperAdminAssignments:', error);

      // Set empty fallback data
      setAssignmentsData({
        students: [],
        groups: [],
        superAdmins: [],
        summary: {
          totalStudents: 0,
          totalGroups: 0,
          totalAssignments: 0
        },
        permissions: {
          canManageAssignments: false,
          canRemoveStudents: false,
          canRemoveGroups: false,
          isOwnProfile: false,
          isPublicView: !isCurrentUserSuperAdmin
        }
      });
    } finally {
      setAssignmentsLoading(false);
      setLoading(false);
    }
  }

  // Only fetch data when super admin is available
  useEffect(() => {
    const superAdminId = superAdmin?.id || superAdmin?._id;
    if (superAdminId) {
      fetchSuperAdminAssignments();
      fetchSuperAdminProjects();
    } else {
      // If no super admin ID, set loading to false to prevent infinite loading
      setLoading(false);
      setAssignmentsLoading(false);
    }

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('🚨 Loading timeout - forcing loading to false');
        setLoading(false);
        setAssignmentsLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, [superAdmin?.id, superAdmin?._id, refreshKey, loading]);

  return (
    <div className="space-y-6">
      {/* Show loading indicator only for initial load, not for assignments */}
      {loading && !assignmentsData && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      )}

      {/* Show content if not loading or if assignments data exists */}
      {(!loading || assignmentsData) && (
        <>
          {/* Profile Header Card with Banner */}
          <Card className="bg-card border-border overflow-hidden">
            {/* Banner */}
            <div
              className="h-32 w-full relative"
              style={{
                backgroundColor: superAdmin.bannerImage ? 'transparent' : (superAdmin.bannerColor || '#8b5cf6'),
                backgroundImage: superAdmin.bannerImage ? `url(${superAdmin.bannerImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Test color block */}
              {!superAdmin.bannerImage && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: superAdmin.bannerColor || '#8b5cf6' }}
                />
              )}
              {!superAdmin.bannerImage && !superAdmin.bannerColor && (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Banner</span>
                </div>
              )}
            </div>

            <CardContent className="p-6">
              <div className="flex items-center gap-4 -mt-12">
                <div className="relative">
                  <Image
                    src={superAdmin.photo || "/placeholder.svg"}
                    alt={superAdmin.fullName || "Super Admin avatar"}
                    width={220}
                    height={220}
                    className="rounded-full object-cover border-2 border-border bg-background"
                  />
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute -bottom-4 -right-2 rounded-full w-8 h-8 p-0 bg-background"
                      onClick={() => router.push('/profile/edit')}
                      title="Edit profile"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">{superAdmin.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{superAdmin.department}</p>
                  <p className="text-sm text-muted-foreground">{superAdmin.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Super Admin
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      📅 Joined {superAdmin.joinedDate}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* Dashboard Button - Only show for super admin viewing their own profile */}
                  {isCurrentUserSuperAdmin && (
                    <Button
                      variant={showDashboard ? "default" : "outline"}
                      size="sm"
                      className={`gap-2 border-border hover:border-primary ${showDashboard
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-background hover:bg-muted"
                        }`}
                      onClick={() => setShowDashboard(!showDashboard)}
                      title="Toggle super admin dashboard"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                      {showDashboard ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                  {!isOwner && (
                    <Button
                      variant={isFollowing(superAdmin._id) ? "default" : "outline"}
                      size="sm"
                      className={`gap-2 border-border hover:border-primary ${isFollowing(superAdmin._id)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      onClick={handleFollow}
                    >
                      {isFollowing(superAdmin._id) ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
              {superAdmin.expertise && superAdmin.expertise.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-foreground mb-2">Areas of Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {superAdmin.expertise && superAdmin.expertise.length > 0 && superAdmin.expertise.map((skill, index) => (
                      <Badge key={`header-expertise-${index}-${skill}`} variant="secondary" className="bg-secondary text-secondary-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Social Links */}
              <div className="flex gap-3 mt-4">
                {superAdmin.socialLinks.github && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(superAdmin.socialLinks.github, '_blank')}
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                )}
                {superAdmin.socialLinks.linkedin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(superAdmin.socialLinks.linkedin, '_blank')}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                  <p className="font-medium text-foreground">{superAdmin.department}</p>
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
                  <p className="text-muted-foreground">{superAdmin.officeHours}</p>
                </CardContent>
              </Card>

              {/* Expertise */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {superAdmin.expertise?.map((skill, index) => (
                      <Badge key={`expertise-section-${index}-${skill}`} variant="secondary" className="bg-secondary text-secondary-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                    {superAdmin.researchAreas?.map((area, index) => (
                      <li key={`research-area-${index}-${area}`} className="flex items-start gap-2 text-muted-foreground">
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
                    {superAdmin.achievements?.map((achievement, index) => (
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

            {/* Middle & Right Columns Container */}
            <div className="xl:col-span-2 space-y-6">
              {/* Super Admin Dashboard Section */}
              {showDashboard && isCurrentUserSuperAdmin && (
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      Super Admin Dashboard
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
                        <span className="text-sm">Admin Dashboard</span>
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
                        <Shield className="h-6 w-6" />
                        <span className="text-sm">Mentor Management</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => router.push('/admin/projects')}
                      >
                        <Award className="h-6 w-6" />
                        <span className="text-sm">Project Review</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => router.push('/admin/reports')}
                      >
                        <BarChart3 className="h-6 w-6" />
                        <span className="text-sm">System Reports</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => router.push('/admin/settings')}
                      >
                        <Settings className="h-6 w-6" />
                        <span className="text-sm">System Settings</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* System Oversight - Exact same structure as mentor's "Assigned Students & Groups" */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      System Oversight
                      {assignmentsData?.permissions?.isPublicView && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Public View
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {assignmentsData?.permissions?.canManageAssignments && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshAssignments}
                          className="border-border hover:border-primary"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignmentsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading system data...</p>
                    </div>
                  ) : assignmentsData ? (
                    <div className="space-y-6">
                      {/* System Statistics */}
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          System Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-foreground">2,456</p>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-foreground">89</p>
                            <p className="text-sm text-muted-foreground">Total Mentors</p>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-foreground">1,234</p>
                            <p className="text-sm text-muted-foreground">Total Projects</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Settings className="h-5 w-5 text-primary" />
                          Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={() => router.push('/admin/users')}
                          >
                            <Users className="h-4 w-4" />
                            Manage All Users
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={() => router.push('/admin/mentors')}
                          >
                            <Shield className="h-4 w-4" />
                            Manage All Mentors
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={() => router.push('/admin/projects')}
                          >
                            <Award className="h-4 w-4" />
                            Review All Projects
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={() => router.push('/admin/reports')}
                          >
                            <BarChart3 className="h-4 w-4" />
                            View System Reports
                          </Button>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-foreground">{assignmentsData.summary.totalStudents}</p>
                          <p className="text-sm text-muted-foreground">System Students</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-foreground">{assignmentsData.summary.totalGroups}</p>
                          <p className="text-sm text-muted-foreground">System Groups</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-foreground">{assignmentsData.summary.totalAssignments}</p>
                          <p className="text-sm text-muted-foreground">Total Assignments</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No system data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Uploaded Projects */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Uploaded Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {superAdminProjects.length > 0 ? (
                    <div className="space-y-4">
                      {superAdminProjects.map((project) => (
                        <div
                          key={`super-admin-project-${project._id}-${project.title}`}
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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Handle delete functionality
                                        if (confirm('Are you sure you want to delete this project?')) {
                                          // Add delete API call here
                                          console.log('Delete project:', project._id)
                                        }
                                      }}
                                      className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                    >
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {project.tags.slice(0, 3).map((tag: string, index: number) => (
                                    <span
                                      key={index}
                                      className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {project.tags.length > 3 && (
                                    <span className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md">
                                      +{project.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
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

// Default export with mock super admin data
export default function SuperAdminProfilePage() {
  const { data: session } = useSession();

  // Mock super admin data - in real app, this would come from API
  const mockSuperAdmin: SuperAdminProfileProps['superAdmin'] = {
    _id: session?.user?.id || 'super-admin-1',
    id: session?.user?.id || 'super-admin-1',
    fullName: session?.user?.name || 'Super Admin User',
    email: session?.user?.email || 'admin@postup.com',
    photo: session?.user?.image || 'https://ui-avatars.com/api/?name=Super+Admin&background=8b5cf6&color=fff',
    bannerColor: '#8b5cf6',
    expertise: ['System Architecture', 'Database Management', 'Security', 'User Management', 'Full Stack Development', 'DevOps', 'Cloud Infrastructure'],
    department: 'System Administration',
    researchAreas: ['Educational Technology', 'System Security', 'Scalability', 'Performance Optimization', 'User Experience Design'],
    achievements: [
      'Built and scaled the POST_UP platform to serve 10,000+ users',
      'Implemented comprehensive security framework protecting user data',
      'Established mentor assignment system serving 500+ students',
      'Led system architecture redesign improving performance by 60%',
      'Created automated deployment pipeline reducing downtime by 80%'
    ],
    officeHours: 'Monday-Friday, 9:00 AM - 6:00 PM (24/7 Emergency Support)',
    location: 'Main Campus, Server Room',
    socialLinks: {
      github: 'https://github.com/superadmin',
      linkedin: 'https://linkedin.com/in/superadmin'
    },
    projectsSupervised: [],
    joinedDate: '2023-01-01',
    role: session?.user?.role || 'super-admin'
  };

  const isOwner = true; // Super admin viewing their own profile

  return <SuperAdminProfile superAdmin={mockSuperAdmin} isOwner={isOwner} />;
}
