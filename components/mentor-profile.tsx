"use client"

import { Github, Linkedin, Edit, Clock, BookOpen, Award, Building, Users, User, Loader2, RotateCcw, LayoutDashboard, ChevronDown, ChevronUp, X, Eye, Crown, Users2, Trash2, Shield, Megaphone } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from "next/image"
import { useFollowState } from "@/hooks/useFollowState"
import { SupervisedProjects } from "@/components/mentor/SupervisedProjects"
import { MentorInvitations } from "@/components/mentor/MentorInvitations"
import { MentorGroupDetailsModal } from "@/components/mentor/MentorGroupDetailsModal"
import { MentorRemovalModal } from '@/components/mentor/MentorRemovalModal'
import { EventCard } from "@/components/EventCard"
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

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

interface Mentor {
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

interface MentorAssignmentsData {
  students: StudentAssignment[];
  groups: GroupAssignment[];
  mentors: Mentor[];
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

interface MentorProfileProps {
  mentor: {
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
  }
  isOwner?: boolean;
}

const MentorProfile: React.FC<MentorProfileProps> = ({ mentor, isOwner }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const { followed, toggleFollow, isFollowing } = useFollowState()
  const [loading, setLoading] = useState(true)
  const [assignmentsData, setAssignmentsData] = useState<MentorAssignmentsData | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [mentorProjects, setMentorProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [supervisedProjectsRefreshKey, setSupervisedProjectsRefreshKey] = useState(0)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)

  // State for group details modal
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [showGroupDetails, setShowGroupDetails] = useState(false)

  // Dynamic fetch state for group details
  const [detailedGroup, setDetailedGroup] = useState<any>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const handleViewDetails = async (assignment: any) => {
    // 1. Open the modal with the basic shallow data immediately
    setSelectedGroup(assignment.groupId || assignment);
    setDetailedGroup(null); // Reset previous data
    setShowGroupDetails(true);
    setIsFetchingDetails(true);

    try {
      const groupId = assignment.groupId?._id || assignment.groupId || assignment.id;
      // 2. Fetch the deep-populated data from our working group route
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const fullGroupData = await res.json();
        setDetailedGroup(fullGroupData);
      }
    } catch (error) {
      console.error("Failed to fetch detailed group:", error);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // Modal state for removal
  const [showRemovalModal, setShowRemovalModal] = useState(false)
  const [removalTarget, setRemovalTarget] = useState<{
    id: string;
    name: string;
    type: 'student' | 'group';
    assignmentId: string;
  } | null>(null)

  // Role-based access control
  const isAdmin = session?.user?.role === 'admin' || (session?.user as any)?.type === 'admin'
  const isSuperAdmin = session?.user?.role === 'super-admin' || (session?.user as any)?.type === 'super-admin'
  const isMentor = ['mentor', 'admin', 'super-admin'].includes(session?.user?.role || (session?.user as any)?.type)
  const isCurrentUserMentor = session?.user?.id === mentor._id || session?.user?.id === mentor.id

  const canViewInvitations = isCurrentUserMentor || isAdmin || isSuperAdmin
  const canManageProjects = isOwner || isCurrentUserMentor || isAdmin || isSuperAdmin
  const canManageAssignments = isCurrentUserMentor || isAdmin || isSuperAdmin
  const isLoggedIn = !!session?.user

  // Debug logging for ownership and project access
  useEffect(() => {
    const debugInfo = {
      sessionUserId: session?.user?.id,
      mentorId: mentor._id,
      mentorIdAlt: mentor.id,
      isOwner,
      isCurrentUserMentor,
      isSuperAdmin,
      canManageProjects,
      mentorFullName: mentor.fullName
    };
    console.log('🔍 MentorProfile Debug Info:', JSON.stringify(debugInfo, null, 2));
  }, [session?.user?.id, mentor._id, mentor.id, isOwner, isCurrentUserMentor, isSuperAdmin, canManageProjects, mentor.fullName]);

  // Add debug logging to see what data we're getting
  useEffect(() => {
    if (mentor) {
      console.log('🔍 Mentor data received:', {
        _id: mentor._id,
        id: mentor.id, // Use id field for component
        fullName: mentor.fullName,
        email: mentor.email,
        photo: mentor.photo
      });
    } else {
      console.log('❌ Mentor data is missing or null');
    }
  }, [mentor]);

  // Fetch Announcements (Events)
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!mentor?._id && !mentor?.id) return;
      const mentorId = mentor._id || mentor.id;

      try {
        setAnnouncementsLoading(true);
        // Fetch events organized by this mentor/admin
        // We use 'upcoming' status by default in API, but for profile we might want to see all?
        // The API default is 'upcoming'/'ongoing'.
        const res = await fetch(`/api/events?organizer=${mentorId}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAnnouncements(data.events);
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [mentor]);

  const handleFollow = async () => {
    // TODO: Implement follow API call
    toggleFollow(mentor?.id || mentor?._id || '')
  }

  const refreshAssignments = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleInvitationStatusChange = () => {
    // Refresh supervised projects when an invitation is accepted/rejected
    setSupervisedProjectsRefreshKey(prev => prev + 1)
    // Also refresh assignments in case there are related changes
    refreshAssignments()
  }

  const handleViewGroupDetails = async (group: any) => {
    console.log('🔍 Viewing group details for group:', group)

    // Use the SAME ID logic as the working "Go to Group" button
    const groupId = (group as any)?._id || group?.id;
    if (!groupId) {
      console.error('❌ No group ID found');
      return;
    }

    // Set loading state and show modal immediately
    setShowGroupDetails(true);
    setSelectedGroup({ _id: groupId }); // Pass only the ID, not the full object
  }

  const handleRemoveStudent = (studentId: string, studentName: string, assignmentId: string) => {
    setRemovalTarget({
      id: studentId,
      name: studentName,
      type: 'student',
      assignmentId
    });
    setShowRemovalModal(true);
  }

  const handleRemoveGroup = (groupId: string, groupName: string, assignmentId: string) => {
    setRemovalTarget({
      id: groupId,
      name: groupName,
      type: 'group',
      assignmentId
    });
    setShowRemovalModal(true);
  }

  const handleConfirmRemoval = async (
    reason: 'project_completed' | 'report_issue' | 'other',
    details?: string
  ) => {
    if (!removalTarget) return;

    try {
      const response = await fetch('/api/mentor/remove-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: removalTarget.assignmentId,
          assignmentType: removalTarget.type,
          removalReason: reason,
          removalDetails: details
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const successMessages = {
          project_completed: `${removalTarget.name} has been successfully removed - Project completed`,
          report_issue: `${removalTarget.name} has been temporarily removed - Issue reported`,
          other: `${removalTarget.name} has been removed from mentorship`
        };

        toast.success(successMessages[reason]);
        setShowRemovalModal(false);
        setRemovalTarget(null);
        refreshAssignments(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || error.message || 'Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('An error occurred while removing the assignment');
    }
  }

  // Fetch mentor's projects
  const fetchMentorProjects = async () => {
    try {
      setProjectsLoading(true)
      const authorId = mentor?.id || mentor?._id;
      const debugInfo = {
        mentorId: mentor?._id,
        mentorIdAlt: mentor?.id,
        finalAuthorId: authorId,
        mentorName: mentor?.fullName,
        canManageProjects
      };
      console.log('🚀 Fetching projects for mentor:', JSON.stringify(debugInfo, null, 2));

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
        console.log('🔍 Mentor projects fetched:', JSON.stringify(projectDebug, null, 2));
        setMentorProjects(projects);
      } else {
        console.error('❌ Error fetching mentor projects:', response.status);
        setMentorProjects([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchMentorProjects:', error);
      setMentorProjects([]);
    } finally {
      setProjectsLoading(false)
    }
  }

  // Fetch mentor's assignments
  const fetchMentorAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      console.log('🚀 Starting fetchMentorAssignments for mentor:', mentor?.id || mentor?._id);
      console.log('🔐 User role check:', { isLoggedIn, isCurrentUserMentor, canManageAssignments });

      let response;

      // Choose API based on user role and permissions
      if (isCurrentUserMentor && canManageAssignments) {
        // PRIVATE API: Full data for mentor's own dashboard
        console.log('🔐 Using PRIVATE mentor dashboard API');
        response = await fetch(`/api/mentor/dashboard?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for session
        });
      } else {
        // PUBLIC API: Read-only data for visitors and other users
        console.log('🌐 Using PUBLIC mentor assignments API');
        const mentorId = mentor?.id || mentor?._id;
        response = await fetch(`/api/mentor/${mentorId}/assignments/public?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Raw API response:', data);

        let normalizedData;

        if (isCurrentUserMentor && canManageAssignments) {
          // Handle private API response structure - UPDATED FOR NEW API
          // Remove the old strict check and accept the new structure
          if (data.success && (data.students || data.groups)) {
            console.log('✅ Valid new API structure detected:', {
              hasStudents: !!data.students,
              hasGroups: !!data.groups,
              studentsCount: data.students?.length,
              groupsCount: data.groups?.length
            });

            // NEW API STRUCTURE: { students: [...], groups: [...], summary: {...} }
            normalizedData = {
              students: (data.students || []).map((s: any) => ({
                id: s._id,
                student: {
                  id: s.studentId?.id || s.studentId?._id || 'unknown-student',
                  fullName: s.studentId?.fullName || 'Unknown Student',
                  email: s.studentId?.email || '',
                  photo: s.studentId?.photo || '/placeholder-user.jpg'
                },
                assignedBy: s.assignedBy === s.mentorId ? 'Accepted Invitation' : 'Direct Assignment',
                assignedAt: s.assignedAt
              })),
              groups: (data.groups || []).map((g: any) => ({
                id: g._id,
                group: {
                  id: g.groupId?.id || g.groupId?._id || (typeof g.groupId === 'string' ? g.groupId : 'unknown-group'),
                  name: g.groupId?.name || 'Unknown Group',
                  description: g.groupId?.description || '',
                  mentorId: typeof g.mentorId === 'string' ? g.mentorId : g.mentorId?.fullName || 'Unknown Mentor',
                  lead: g.groupId?.lead, // Pass the populated lead
                  studentIds: g.groupId?.studentIds || [] // Pass the populated members
                },
                assignedBy: g.assignedBy?.fullName || 'System',
                assignedAt: g.assignedAt
              })),
              mentors: (data.mentors || []).map((m: any) => ({
                id: m.id,
                fullName: m.fullName,
                email: m.email,
                photo: m.photo
              })),
              summary: data.summary || {
                totalStudents: (data.students || []).length,
                totalGroups: (data.groups || []).length,
                totalAssignments: (data.students || []).length + (data.groups || []).length
              },
              // Include permissions from private API
              permissions: data.permissions || {
                canManageAssignments: canManageAssignments,
                canRemoveStudents: canManageAssignments,
                canRemoveGroups: canManageAssignments,
                isOwnProfile: isCurrentUserMentor
              }
            };
          } else {
            console.error('❌ Invalid private API response structure:', data);
            throw new Error('Invalid private API response structure');
          }
        } else {
          // Handle public API response structure
          if (data.success && data.data) {
            const publicData = data.data;
            normalizedData = {
              students: publicData.assignments?.students?.map((s: any) => ({
                id: s.id || s._id || `public-${s.name}`, // Use real ID if available
                student: {
                  id: s.id || s._id || `public-${s.name}`,
                  fullName: s.name,
                  email: '', // DELIBERATELY EXCLUDED in public view
                  photo: s.photo
                },
                assignedBy: 'Assigned', // Generic for public view
                assignedAt: s.assignedAt
              })) || [],
              groups: publicData.assignments?.groups?.map((g: any) => ({
                id: g.id || g._id || `public-${g.name}`,
                group: {
                  id: g.id || g._id || `public-${g.name}`,
                  name: g.name,
                  description: '', // Limited info for view
                  mentorId: typeof publicData.mentor?.name === 'string' ? publicData.mentor.name : publicData.mentor?.fullName || 'Unknown Mentor',
                  studentIds: [] // EXCLUDED in view
                },
                assignedBy: 'Assigned',
                assignedAt: g.assignedAt
              })) || [],
              mentors: [], // Not included in public view
              summary: publicData.summary || {
                totalStudents: publicData.assignments?.students?.length || 0,
                totalGroups: publicData.assignments?.groups?.length || 0,
                totalAssignments: (publicData.assignments?.students?.length || 0) + (publicData.assignments?.groups?.length || 0)
              },
              // Public view permissions - NO MANAGEMENT ACCESS
              permissions: {
                canManageAssignments: false,
                canRemoveStudents: false,
                canRemoveGroups: false,
                isOwnProfile: false,
                isPublicView: true
              }
            };
          } else {
            console.error('❌ Invalid public API response structure:', data);
            throw new Error('Invalid public API response structure');
          }
        }

        console.log('🔍 Normalized data for component:', normalizedData);
        setAssignmentsData(normalizedData);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response from API:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error in fetchMentorAssignments:', error);
      console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');

      // Set empty fallback data
      setAssignmentsData({
        students: [],
        groups: [],
        mentors: [],
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
          isPublicView: !isCurrentUserMentor
        }
      });
    } finally {
      setAssignmentsLoading(false);
      setLoading(false);
    }
  }

  // Add debug logging to see what data we're gettings work
  const handleTestClick = () => {
    console.log('🧪 Test button clicked! Remove buttons should be working.');
    alert('Test button clicked! If you see this, the component is working.');
  };

  // Debug logging for mentor projects state
  useEffect(() => {
    console.log('🔍 MentorProjects State Debug:', {
      canManageProjects,
      projectsLoading,
      mentorProjectsLength: mentorProjects.length,
      mentorProjectsData: mentorProjects.map(p => ({ id: p._id, title: p.title }))
    });
  }, [canManageProjects, projectsLoading, mentorProjects.length]);

  // Only fetch data when mentor is available
  useEffect(() => {
    const mentorId = mentor?.id || mentor?._id;
    if (mentorId) {
      fetchMentorAssignments();
      fetchMentorProjects();
    } else {
      // If no mentor ID, set loading to false to prevent infinite loading
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
  }, [mentor?.id, mentor?._id, refreshKey, loading]);

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Show loading indicator only for initial load, not for assignments */}
      {loading && !assignmentsData && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      )}

      {/* Show content if not loading or if assignments data exists */}
      {(!loading || assignmentsData) && (
        <div className="bg-gray-800 max-w-7xl mx-auto  px-6 py-8 rounded-xl">
          {/* Profile Header Card with Banner */}
          <Card className="bg-darkblue-500 mb-7 border-gray-500 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-[1px]">
            {/* Banner */}
            <div
              className="h-32 w-full relative"
              style={{
                backgroundColor: mentor.bannerImage ? 'transparent' : (mentor.bannerColor || '#3b82f6'),
                backgroundImage: mentor.bannerImage ? `url(${mentor.bannerImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Test color block */}
              {!mentor.bannerImage && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: mentor.bannerColor || '#3b82f6' }}
                />
              )}
              {!mentor.bannerImage && !mentor.bannerColor && (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Banner</span>
                </div>
              )}
            </div>

            <CardContent className="p-6">
              <div className="flex items-center gap-4 -mt-12">
                <div className="relative">
                  <Image
                    src={mentor.photo || "/placeholder.svg"}
                    alt={mentor.fullName || "Mentor avatar"}
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
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">
                      {mentor.fullName || 'User'}
                    </h1>

                    {/* Dynamic Role Badges */}
                    {(mentor as any).type === 'super-admin' && (
                      <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30">
                        Super Admin
                      </Badge>
                    )}
                    {(mentor as any).type === 'admin' && (
                      <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30">
                        Admin
                      </Badge>
                    )}
                    {((mentor as any).type === 'mentor' || !(mentor as any).type) && (
                      <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30">
                        Mentor
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-300">{mentor.department}</p>
                  <p className="text-sm text-gray-300">{mentor.email}</p>
                  <p className="text-xs text-gray-300 mt-1">
                    📅 Joined {mentor.joinedDate}
                  </p>
                </div>
                <div className="flex gap-2 relative">
                  {/* Dashboard Button - Only show for mentor viewing their own profile */}
                  {isCurrentUserMentor && (
                    <Button
                      variant={showDashboard ? "default" : "default"}
                      size="sm"
                      className={`gap-2 border-gray-300 hover:border-blue-500 ${showDashboard
                        ? "bg-blue-700 text-white hover:bg-blue-600"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      onClick={() => setShowDashboard(!showDashboard)}
                      title="Toggle mentor dashboard"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                      {showDashboard ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}

                  {/* Admin Dashboard Dropdown (Integrated) */}
                  {isOwner && (isAdmin || isSuperAdmin) && showDashboard && (
                    <div className="absolute right-0 top-full mt-2 flex flex-col gap-2 p-3 bg-[#e6f0fc]/95 backdrop-blur-md border border-[#1E293B] rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2 w-48">
                      <Button
                        variant="ghost"
                        className="justify-start gap-2 text-[#1E293B] hover:bg-[#4F46E5]/95 hover:text-[#4455fc]/95 transition-colors"
                        onClick={() => router.push('/admin')}
                      >
                        <LayoutDashboard size={16} /> Admin Panel
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start gap-2 text-[#1E293B] hover:bg-[#9F1239]/20 hover:text-[#FB7185] transition-colors"
                        onClick={() => router.push('/admin/reports')}
                      >
                        <Shield size={16} /> Reports
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start gap-2 text-[#1E293B] hover:bg-[#B45309]/20 hover:text-[#FBBF24] transition-colors"
                        onClick={() => router.push('/admin/moderation')}
                      >
                        <Users2 size={16} /> Moderation
                      </Button>
                    </div>
                  )}
                  {!isOwner && (
                    <Button
                      variant={isFollowing(mentor._id) ? "default" : "outline"}
                      size="sm"
                      className={`gap-2 border-gray-300 hover:border-blue-500 ${isFollowing(mentor._id)
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      onClick={handleFollow}
                    >
                      {isFollowing(mentor._id) ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
              {mentor.expertise && mentor.expertise.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-100 mb-2">Areas of Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise && mentor.expertise.length > 0 && mentor.expertise.map((skill, index) => (
                      <Badge key={`header-expertise-${index}-${skill}`} variant="secondary" className="bg-gray-100 text-gray-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Social Links */}
              <div className="flex gap-3 mt-4">
                {mentor.socialLinks.github && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(mentor.socialLinks.github, '_blank')}
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                )}
                {mentor.socialLinks.linkedin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(mentor.socialLinks.linkedin, '_blank')}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>


          {/* Main Content Tabs */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Department */}
              <Card className="bg-gray-800 border-gray-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-400" />
                    Department
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-gray-300">{mentor.department}</p>
                </CardContent>
              </Card>

              {/* Office Hours */}
              <Card className="bg-gray-800 border-border border-gray-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Office Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{mentor.officeHours}</p>
                </CardContent>
              </Card>

              {/* Expertise */}
              <Card className="bg-gray-800 border-gray-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise && mentor.expertise.length > 0 && mentor.expertise.map((skill, index) => (
                      <Badge key={`expertise-section-${index}-${skill}`} variant="secondary" className="bg-gray-100 text-gray-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Research Areas */}
              <Card className="bg-gray-800 border-border border-gray-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Research Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {mentor.researchAreas?.map((area, index) => (
                      <li key={`research-area-${index}-${area}`} className="flex items-start gap-2 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="bg-gray-800 border-border border-gray-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {mentor.achievements?.map((achievement, index) => (
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
              {/* Assigned Students & Groups - Show for all users, but with conditional controls */}
              <Card className="bg-gray-800 border-gray-200 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-400" />
                      Assigned Students & Groups
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
                          className="bg-gray-200 border-gray-100 border-1 hover:border-blue-500 text-blue-500 hover:text-gray-300"
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
                      <p className="text-muted-foreground">Loading assignments...</p>
                    </div>
                  ) : assignmentsData ? (
                    <div className="space-y-6">
                      {/* Assigned Students */}
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          Assigned Students ({assignmentsData.summary.totalStudents})
                        </h3>
                        {assignmentsData.students.length > 0 ? (
                          <div className="space-y-3">
                            {assignmentsData.students.map((assignment, index) => {
                              const studentId = assignment.student?.id || assignment.student?._id || assignment.id;

                              // Early return for invalid student data
                              if (!studentId || !assignment.student?.fullName) {
                                return (
                                  <div
                                    key={`student-assignment-${assignment.id || index}-no-id`}
                                    className="flex items-center justify-between p-4 border rounded-lg bg-muted hover:bg-muted/80 transition-colors opacity-50 cursor-not-allowed"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Image
                                        src={assignment.student.photo || "/placeholder.svg"}
                                        alt={assignment.student.fullName || "Student photo"}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover"
                                      />
                                      <div>
                                        <p className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors"
                                          onClick={() => {
                                            if (studentId && assignment.student?.fullName) {
                                              console.log('🖱️ Clicking student name, studentId:', studentId, 'studentName:', assignment.student.fullName);
                                              router.push(`/profile/${studentId}`);
                                            } else {
                                              console.log('🚫 Cannot navigate: Invalid student data', { studentId, studentName: assignment.student.fullName });
                                            }
                                          }}>
                                          {assignment.student.fullName || 'Unknown Student'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Assigned on {new Date(assignment.assignedAt).toLocaleDateString()}
                                        </p>
                                        <Badge variant="outline" className="mt-1 text-xs">
                                          {assignment.assignedBy}
                                        </Badge>
                                      </div>
                                    </div>
                                    {isOwner && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                        title={`View details for ${assignment.student.fullName || 'Unknown Student'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Use the same studentId logic as the working navigation
                                          if (studentId) {
                                            console.log('👁️ Viewing student details via Eye button, studentId:', studentId);
                                            router.push(`/profile/${studentId}`);
                                          } else {
                                            console.error('❌ No studentId found for Eye button');
                                          }
                                        }}
                                      >
                                        View Details
                                      </Button>
                                    )}
                                  </div>
                                );
                              }

                              // Normal student card
                              return (
                                <div
                                  key={`student-assignment-${assignment.id || index}-${studentId}`}
                                  className="flex items-center justify-between p-4 border rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                                  onClick={() => {
                                    if (studentId && assignment.student?.fullName) {
                                      console.log('🖱️ Clicking student card, studentId:', studentId, 'studentName:', assignment.student.fullName);
                                      router.push(`/profile/${studentId}`);
                                    } else {
                                      console.log('🚫 Cannot navigate: Invalid student data', { studentId, studentName: assignment.student.fullName });
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <Image
                                      src={assignment.student.photo || "/placeholder.svg"}
                                      alt={assignment.student.fullName || "Student photo"}
                                      width={40}
                                      height={40}
                                      className="rounded-full object-cover"
                                    />
                                    <div>
                                      <p className="font-medium text-foreground">{assignment.student.fullName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Assigned on {new Date(assignment.assignedAt).toLocaleDateString()}
                                      </p>
                                      <Badge variant="outline" className="mt-1 text-xs">
                                        {assignment.assignedBy}
                                      </Badge>
                                    </div>
                                  </div>
                                  {canManageAssignments && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                        title={`View details for ${assignment.student.fullName}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(`/profile/${studentId}`);
                                        }}
                                      >
                                        View Details
                                      </Button>
                                      {isOwner && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                                          title={`Remove ${assignment.student.fullName}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveStudent(studentId, assignment.student.fullName, assignment.id || assignment._id);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <User className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No students assigned yet</p>
                            <p className="text-sm text-gray-500 mt-2">
                              Students will be assigned to you by administrators.
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          Assigned Groups ({assignmentsData.summary.totalGroups})
                        </h3>
                        {assignmentsData.groups.length > 0 ? (
                          <div className="space-y-4">
                            {assignmentsData.groups.map((assignment, index) => (
                              <Card
                                key={`group-assignment-${assignment.id || index}-${assignment.group?.id || index}`}
                                className="bg-gray-800 border-gray-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-[1px]"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-5 w-5 text-blue-400" />
                                        <h4 className="font-medium text-gray-200 text-lg">
                                          {assignment.group?.name || 'Unknown Group'}
                                        </h4>
                                      </div>
                                      <p className="text-sm text-gray-400 mb-2">
                                        ID: {assignment.group?.id || 'No ID'}
                                      </p>
                                      {assignment.group?.description && (
                                        <p className="text-sm text-gray-300 mb-3">
                                          {assignment.group.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isOwner && (
                                        <Button
                                          onClick={() => handleViewGroupDetails(assignment.group)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-400/10"
                                          title="View Group Details"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        onClick={() => router.push(`/groups/${(assignment.group as any)?._id || assignment.group?.id}`)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-700"
                                        title="Go to Group"
                                      >
                                        <Users className="h-4 w-4" />
                                      </Button>
                                      {canManageAssignments && isOwner && (
                                        <Button
                                          onClick={() => handleRemoveGroup(assignment.group?.id || assignment.group?._id, assignment.group?.name || 'Unknown Group', assignment.id || assignment._id)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-400/10"
                                          title={`Remove ${assignment.group?.name || 'Unknown Group'}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Group Lead Information */}
                                  {assignment.groupId?.lead && (
                                    <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Crown className="h-4 w-4 text-yellow-400" />
                                        <span className="text-sm font-medium text-gray-200">Group Lead</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                                          {assignment.groupId.lead?.photo ? (
                                            <Image
                                              src={assignment.groupId.lead.photo}
                                              alt={assignment.groupId.lead.fullName || 'Group Lead'}
                                              width={32}
                                              height={32}
                                              className="object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <User className="h-4 w-4 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-200">
                                            {assignment.groupId.lead?.fullName || 'Unknown Lead'}
                                          </div>
                                          {assignment.groupId.lead?.email && (
                                            <div className="text-xs text-gray-400">
                                              {assignment.groupId.lead.email}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Group Members */}
                                  {assignment.groupId?.studentIds && assignment.groupId.studentIds.length > 0 && (
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Users2 className="h-4 w-4 text-blue-400" />
                                          <span className="text-sm font-medium text-gray-200">
                                            Members ({assignment.groupId.studentIds.length})
                                          </span>
                                        </div>
                                        {assignment.groupId.studentIds.length > 3 && (
                                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
                                            +{assignment.groupId.studentIds.length - 3} more
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        {assignment.groupId.studentIds.slice(0, 3).map((member: any, idx) => (
                                          <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                                              {member?.photo ? (
                                                <Image
                                                  src={member.photo}
                                                  alt={member.fullName || 'Unknown'}
                                                  width={32}
                                                  height={32}
                                                  className="object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <User className="h-4 w-4 text-gray-400" />
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-200">
                                                {member?.fullName || 'Unknown'}
                                              </div>
                                              {member?.email && (
                                                <div className="text-xs text-gray-400">
                                                  {member.email}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Assignment Details */}
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                                    <div className="text-xs text-gray-400">
                                      Assigned on {new Date(assignment.assignedAt).toLocaleDateString()}
                                    </div>
                                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                      {assignment.assignedBy === mentor._id ? 'Self-Assigned' : 'Admin Assigned'}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No groups assigned yet</p>
                            <p className="text-sm text-gray-500 mt-2">
                              Groups will be assigned to you by administrators.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center p-4 bg-gray-100 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{assignmentsData.summary.totalStudents}</p>
                          <p className="text-sm text-gray-500">Students Assigned</p>
                        </div>
                        <div className="text-center p-4 bg-gray-100 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{assignmentsData.summary.totalGroups}</p>
                          <p className="text-sm text-gray-500">Groups Assigned</p>
                        </div>
                        <div className="text-center p-4 bg-gray-100 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{assignmentsData.summary.totalAssignments}</p>
                          <p className="text-sm text-gray-500">Total Assignments</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No students or groups assigned to you yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Announcements / Events */}
              {(isAdmin || isSuperAdmin) && (
                <Card className="bg-gray-800 border-border border-gray-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-primary" />
                      Announcements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {announcementsLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading announcements...</p>
                      </div>
                    ) : announcements.length > 0 ? (
                      <div className="space-y-4">
                        {announcements.map((event) => (
                          <EventCard
                            key={event._id}
                            event={event}
                            isRegistered={false} // Profile view doesn't need reg status strictly
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">No announcements posted</p>
                        {isCurrentUserMentor && (
                          <Button
                            variant="link"
                            onClick={() => router.push('/events/upload')}
                            className="mt-2 text-primary"
                          >
                            Post an Announcement
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Uploaded Projects */}
              <Card className="bg-gray-800 border-border border-gray-500 ">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Uploaded Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mentorProjects.length > 0 ? (
                    <div className="space-y-4">
                      {mentorProjects.map((project) => (
                        <div
                          key={`mentor-project-${project._id}-${project.title}`}
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
                                      key={`tag-${index}-${tag}`}
                                      className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {project.tags.length > 3 && (
                                    <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                                      +{project.tags.length - 3}
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
                        {isOwner ? "Upload your first project to showcase your work" : "This mentor hasn't uploaded any projects yet"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mentor Invitations */}
              {isOwner && (
                <MentorInvitations
                  mentorId={mentor._id || mentor.id}
                  onInvitationStatusChange={handleInvitationStatusChange}
                />
              )}

              {/* Supervised Projects */}
              <div className="space-y-6">
                <SupervisedProjects
                  mentorId={mentor._id || mentor.id}
                  refreshKey={supervisedProjectsRefreshKey}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {selectedGroup && (
        <MentorGroupDetailsModal
          isOpen={showGroupDetails}
          onClose={() => {
            setShowGroupDetails(false)
            setDetailedGroup(null)
          }}
          isOwner={isOwner}
          groupId={selectedGroup}
          groupData={detailedGroup}
        />
      )}

      {/* Removal Modal */}
      {removalTarget && (
        <MentorRemovalModal
          isOpen={showRemovalModal}
          onClose={() => {
            setShowRemovalModal(false);
            setRemovalTarget(null);
          }}
          onConfirm={handleConfirmRemoval}
          studentName={removalTarget.type === 'student' ? removalTarget.name : undefined}
          groupName={removalTarget.type === 'group' ? removalTarget.name : undefined}
          assignmentType={removalTarget.type}
        />
      )}

    </div>
  )
}

export default MentorProfile;
