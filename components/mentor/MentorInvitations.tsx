'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  FileText,
  Download,
  Calendar,
  MessageCircle,
  Check,
  X,
  Clock,
  Eye,
  Trash2,
  Mail,
  User,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { MentorGroupDetailsModal } from '@/components/mentor/MentorGroupDetailsModal';

interface MentorInvitation {
  _id?: any;
  id?: string;
  studentId: {
    _id: any;
    fullName: string;
    email: string;
    photo: string;
  };
  groupId?: {
    _id: any;
    name: string;
    description?: string;
    studentIds?: {
      name: string;
      email: string;
      photo: string;
    }[];
  };
  projectId: {
    _id: any;
    title: string;
    createdAt: string;
    registrationType?: string;
    group?: any;
  };
  projectTitle: string;
  projectDescription: string;
  proposalFile?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  sentAt: string;
  respondedAt?: string;
  groupSnapshot?: {
    lead: {
      id: string;
      name: string;
      email: string;
    };
    members: {
      id?: string;
      name?: string;
      email: string;
      status: 'active' | 'pending';
    }[];
  };
  registrationType?: 'individual' | 'group';
}

interface MentorInvitationsProps {
  mentorId?: string; // Make optional
  onInvitationStatusChange?: () => void; // Callback to refresh parent data
}

export function MentorInvitations({ mentorId, onInvitationStatusChange }: MentorInvitationsProps) {
  const { data: session } = useSession();
  const [invitations, setInvitations] = useState<MentorInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });

  // State for group details modal
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any>(null);
  const [invitationForModal, setInvitationForModal] = useState<any>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Use session user ID as the primary mentor ID, fallback to prop
  const currentMentorId = session?.user?.id || mentorId;

  // Check if current user is the mentor (we'll determine this by checking if they can access mentor data)
  const isCurrentUserMentor = !!session?.user?.id && !!currentMentorId;

  console.log('🔍 MentorInvitations Debug:', {
    sessionUserId: session?.user?.id,
    mentorIdProp: mentorId,
    currentMentorId,
    isCurrentUserMentor,
    sessionUserEmail: session?.user?.email,
    sessionUserRole: session?.user?.role
  });

  useEffect(() => {
    if (isCurrentUserMentor && currentMentorId) {
      fetchInvitations();
    } else {
      console.log('🔍 Not fetching invitations - user is not a mentor or no mentor ID');
    }
  }, [isCurrentUserMentor, currentMentorId]);

  const handleViewGroupDetails = async (invitation: any) => {
    console.log('🔍 Viewing group details for invitation:', invitation);

    // Store invitation basic info immediately for fallback/loading state
    setInvitationForModal(invitation);
    setShowGroupDetails(true);

    // Determine the ID to fetch
    // Try explicit groupId first, then fallback to group snapshot ID, then project group ID
    const groupId = invitation.groupId?._id || invitation.groupId || invitation.projectId?.group?._id || invitation.projectId?.group;

    // If we have an ID, fetch fresh data
    if (groupId) {
      try {
        setIsLoadingDetails(true);
        console.log('🔄 Fetching fresh group data for ID:', groupId);

        const response = await fetch(`/api/groups/${groupId}`);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Fresh group data received:', data);
          setSelectedGroupDetails(data.group || data);
        } else {
          console.warn('⚠️ Failed to fetch fresh group data, falling back to invitation snapshot');
          // Fallback is handled by passing invitation data to modal if selectedGroupDetails is null
        }
      } catch (err) {
        console.error('❌ Error fetching group details:', err);
      } finally {
        setIsLoadingDetails(false);
      }
    } else {
      console.warn('⚠️ No valid group ID found for fetch, using snapshot data');
      setIsLoadingDetails(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching invitations for mentor:', mentorId);
      const response = await fetch('/api/mentor/invitations');

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);

      if (!response.ok) {
        console.error('❌ Response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch invitations: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Received data:', data);
      console.log('📊 Invitations count:', data.invitations?.length || 0);

      // Debug each invitation
      if (data.invitations && data.invitations.length > 0) {
        data.invitations.forEach((inv: any, index: number) => {
          const isGroup = Boolean(
            inv.registrationType === 'group' ||
            inv.groupSnapshot ||
            inv.projectId?.registrationType === 'group' ||
            inv.projectId?.group ||
            inv.groupId
          );
          console.log(`🔍 Invitation ${index}:`, {
            _id: inv._id,
            studentId: inv.studentId?._id,
            studentName: inv.studentId?.fullName,
            projectId: inv.projectId?._id,
            projectTitle: inv.projectTitle,
            status: inv.status,
            registrationType: inv.registrationType,
            hasGroupSnapshot: !!inv.groupSnapshot,
            hasGroupId: !!inv.groupId,
            projectRegistrationType: inv.projectId?.registrationType,
            hasProposalFile: !!inv.proposalFile,
            detectedAsGroup: isGroup,
            detectedAsIndividual: !isGroup
          });
        });
      }

      console.log('🔍 Setting invitations state:', data.invitations || []);
      setInvitations(data.invitations || []);
      setStats(data.stats || { total: 0, pending: 0, accepted: 0, rejected: 0 });
    } catch (error) {
      console.error('❌ Failed to fetch invitations:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      // Convert 'accept'/'reject' to 'accepted'/'rejected' for API
      const status = action === 'accept' ? 'accepted' : 'rejected';

      console.log('🚀 Sending invitation response:', { invitationId, action, status });

      // Use POST method instead of PUT due to Next.js routing issue
      const response = await fetch('/api/mentor/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId, status, responseMessage: '' }),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);

        // If invitation not found, remove it from the list and refresh
        if (response.status === 404) {
          console.log('🔄 Invitation not found, removing from UI and refreshing...');
          await fetchInvitations(); // Refresh to clear stale data
          return;
        }
      }

      if (response.ok) {
        // Refresh invitations list
        await fetchInvitations();

        // Trigger parent refresh (e.g., to update Supervised Projects section)
        if (onInvitationStatusChange) {
          onInvitationStatusChange();
        }
      }
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      console.log('🗑️ Deleting invitation:', invitationId);

      const response = await fetch(`/api/mentor/invitations?invitationId=${invitationId}`, {
        method: 'DELETE',
      });

      console.log('📥 Delete response status:', response.status);
      console.log('📥 Delete response ok:', response.ok);

      if (!response.ok) {
        // Check if response is HTML (redirect/login page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.error('❌ Got HTML response instead of JSON - likely authentication issue');
          alert('Session expired. Please refresh the page and try again.');
          return;
        }

        try {
          const errorData = await response.json();
          console.error('❌ Delete error response:', errorData);
          alert(`Failed to delete invitation: ${errorData.error || 'Unknown error'}`);
        } catch (jsonError) {
          console.error('❌ Could not parse error response as JSON:', jsonError);
          alert('Failed to delete invitation: Server error. Please try again.');
        }
        return;
      }

      if (response.ok) {
        console.log('✅ Invitation deleted successfully');
        // Refresh invitations list
        await fetchInvitations();
      }
    } catch (error) {
      console.error('Failed to delete invitation:', error);
      alert('Failed to delete invitation. Please try again.');
    }
  };

  const downloadProposal = (proposalUrl: string) => {
    window.open(proposalUrl, '_blank');
  };

  if (!isCurrentUserMentor) {
    return (
      <Card className="bg-card border-border rounded-xl">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <p>Invitations are private and only visible to mentor.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-card border-border rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('🔍 MentorInvitations Render Debug:', {
    invitationsLength: invitations.length,
    loading,
    error,
    stats,
    invitations: invitations.map(inv => ({
      _id: inv._id,
      status: inv.status,
      studentName: inv.studentId?.fullName,
      projectTitle: inv.projectTitle
    }))
  });

  return (
    <>
      <Card className="bg-gray-800 border-border border-gray-500 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Student Invitations
            <Badge variant="outline" className="ml-auto">
              {stats.pending} Pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No student invitations yet</p>
              <p className="text-sm">Students will appear here when they invite you to mentor their projects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {invitations.map((invitation) => {
                const invitationId = invitation._id?.toString() || invitation.id || '';

                const getStatusBadge = () => {
                  switch (invitation.status) {
                    case 'pending':
                      return (
                        <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white border-0 px-4 py-2 text-xs font-bold rounded-full shadow-lg shadow-amber-500/25">
                          <Clock className="h-4 w-4 mr-2" />
                          Pending
                        </Badge>
                      );
                    case 'accepted':
                      return (
                        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-4 py-2 text-xs font-bold rounded-full shadow-lg shadow-green-500/25">
                          <Check className="h-4 w-4 mr-2" />
                          Accepted
                        </Badge>
                      );
                    case 'rejected':
                      return (
                        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 px-4 py-2 text-xs font-bold rounded-full shadow-lg shadow-red-500/25">
                          <X className="h-4 w-4 mr-2" />
                          Rejected
                        </Badge>
                      );
                  }
                };

                // Improved type detection: check multiple sources
                const isGroupInvitation = Boolean(
                  invitation.registrationType === 'group' ||
                  invitation.groupSnapshot ||
                  invitation.projectId?.registrationType === 'group' ||
                  invitation.projectId?.group ||
                  invitation.groupId
                );

                const getTypeBadge = () => {
                  if (isGroupInvitation) {
                    return (
                      <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-300/50 px-4 py-2 text-xs font-bold rounded-full shadow-md">
                        <Users className="h-4 w-4 mr-2" />
                        Group
                      </Badge>
                    );
                  }
                  return (
                    <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-300/50 px-4 py-2 text-xs font-bold rounded-full shadow-md">
                      <User className="h-4 w-4 mr-2" />
                      Individual
                    </Badge>
                  );
                };

                return (
                  <div key={invitationId} className="bg-white rounded-lg shadow-md border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 w-full">
                    <div className="p-6 space-y-4">
                      {/* Header - Compact */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeBadge()}
                            {getStatusBadge()}
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-1">
                            {invitation.projectId?.title || invitation.projectTitle}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                            {invitation.projectDescription}
                          </p>
                        </div>
                      </div>

                      {/* Proposal Message Section */}
                      {invitation.message && (
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                          <p className="text-xs font-medium text-slate-700 mb-1">Student's Proposal:</p>
                          <p className="text-sm text-slate-600 line-clamp-3">
                            {invitation.message}
                          </p>
                        </div>
                      )}

                      {/* PDF Proposal Section */}
                      {invitation.proposalFile && (
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">Proposal Document</p>
                              <p className="text-xs text-slate-600">PDF attached</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => window.open(invitation.proposalFile, '_blank')}
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View PDF
                            </Button>
                            <Button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = invitation.proposalFile!;
                                link.download = `proposal-${invitationId}.pdf`;
                                link.click();
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50"
                              title="Download PDF"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Student/Group Info - Compact */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                          <AvatarImage src={invitation.studentId?.photo && invitation.studentId?.photo.trim() ? invitation.studentId.photo : undefined} alt={invitation.studentId?.fullName} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold">
                            {invitation.studentId?.fullName?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {isGroupInvitation
                              ? (invitation.groupSnapshot?.lead?.name || invitation.studentId?.fullName || 'Unknown Group Lead')
                              : (invitation.studentId?.fullName || 'Unknown Student')
                            }
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            {isGroupInvitation
                              ? (invitation.groupSnapshot?.lead?.email || invitation.studentId?.email || 'No email')
                              : (invitation.studentId?.email || 'No email')
                            }
                          </p>
                        </div>
                      </div>

                      {/* Group Info - Ultra Compact */}
                      {isGroupInvitation && (
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-900">
                              Group {invitation.groupSnapshot?.members ? `(${invitation.groupSnapshot.members.length} members)` : 'Project'}
                            </span>
                          </div>
                          <Button
                            onClick={() => handleViewGroupDetails(invitation)}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-100"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      )}

                      {/* Action Buttons - Compact */}
                      {invitation.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => respondToInvitation(invitationId, 'accept')}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => respondToInvitation(invitationId, 'reject')}
                            variant="destructive"
                            size="sm"
                            className="flex-1 text-xs h-8"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {/* Status Info - Compact */}
                      {invitation.status !== 'pending' && (
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-500">
                            {invitation.respondedAt && `Responded ${new Date(invitation.respondedAt).toLocaleDateString()}`}
                          </div>
                          <Button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this invitation?')) {
                                deleteInvitation(invitationId);
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Details Modal - Mentor Version - Updated with fresh fetch support */}
      {showGroupDetails && (
        <MentorGroupDetailsModal
          isOpen={showGroupDetails}
          onClose={() => {
            setShowGroupDetails(false);
            setSelectedGroupDetails(null);
            setInvitationForModal(null);
          }}
          isLoading={isLoadingDetails}
          // Pass the fresh data if available
          groupData={selectedGroupDetails}
          // Fallback properties from invitation if fresh data fails or is loading
          projectTitle={invitationForModal?.projectTitle || invitationForModal?.projectId?.title || "Group Project"}
          projectDescription={invitationForModal?.projectDescription || invitationForModal?.projectId?.description || "Group project details"}
          submittedAt={invitationForModal?.sentAt}
          category="Group Project"
          requestedBy={{
            name: invitationForModal?.groupSnapshot?.lead?.name || invitationForModal?.studentId?.fullName || "Unknown",
            email: invitationForModal?.groupSnapshot?.lead?.email || invitationForModal?.studentId?.email || "unknown@example.com",
            avatarUrl: invitationForModal?.studentId?.photo
          }}
          groupSnapshot={{
            id: invitationForModal?.groupId?._id || invitationForModal?.groupId || "group-id",
            name: invitationForModal?.groupId?.name || "Group Name",
            lead: invitationForModal?.groupSnapshot?.lead ? {
              name: invitationForModal.groupSnapshot.lead.name || "Unknown Lead",
              email: invitationForModal.groupSnapshot.lead.email,
              avatarUrl: invitationForModal.groupSnapshot.lead.photo
            } : undefined,
            members: (invitationForModal?.groupSnapshot?.members || []).map((member: any) => ({
              name: member.name || "Unknown Member",
              email: member.email,
              avatarUrl: member.photo,
              status: member.status || 'active'
            }))
          }}
        />
      )}
    </>
  );
}
