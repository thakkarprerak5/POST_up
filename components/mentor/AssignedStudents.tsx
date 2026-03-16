// components/mentor/AssignedStudents.tsx - UPDATED WITH REMOVAL MODAL
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, User, MessageCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MentorRemovalModal } from '@/components/mentor/MentorRemovalModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Student {
  id: string;
  name: string;
  email: string;
  photo: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface StudentAssignment {
  groupId: null;
  _id: string;
  mentorId: string;
  assignedToType: string;
  studentId: {
    _id: string;
    fullName: string;
    email: string;
    photo: string;
    id: string;
  };
  assignedBy: string;
  assignedAt: string;
  status: string;
}

interface GroupAssignment {
  id: string;
  group: Group;
  assignedBy: string;
  assignedAt: string;
}

interface MentorAssignmentsData {
  success: boolean;
  mentor: {
    id: string;
    name: string;
    email: string;
    photo: string;
  };
  students: StudentAssignment[];  // Changed from assignments.students to students
  groups: GroupAssignment[];      // Changed from assignments.groups to groups
  summary: {
    totalStudents: number;
    totalGroups: number;
    totalAssignments: number;
  };
  permissions: {
    canManageAssignments: boolean;
    canRemoveStudents: boolean;
    canRemoveGroups: boolean;
    isOwnProfile: boolean;
  };
}

export function AssignedStudents() {
  const [data, setData] = useState<MentorAssignmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Modal state for removal
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [removalTarget, setRemovalTarget] = useState<{
    id: string;
    name: string;
    type: 'student' | 'group';
    assignmentId: string;
  } | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchAssignedData();
  }, []);

  const fetchAssignedData = async () => {
    try {
      if (!refreshing) setLoading(true);

      const response = await fetch(`/api/mentor/dashboard?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const assignmentsData = await response.json();
        setData(assignmentsData);
      } else {
        toast.error('Failed to fetch assigned students and groups');
      }
    } catch (error) {
      console.error('Error fetching assigned data:', error);
      toast.error('Error fetching assigned students and groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignedData();
  };

  const handleChatWithStudent = async (studentId: string, studentName: string) => {
    try {
      const checkResponse = await fetch('/api/chat/check-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds: [studentId],
          isGroup: false,
        }),
      });

      let chatId = null;

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.exists && checkData.chatId) {
          chatId = checkData.chatId;
        }
      }

      if (!chatId) {
        const createResponse = await fetch('/api/chat/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantIds: [studentId],
            isGroup: false,
          }),
        });

        if (createResponse.ok) {
          const chatData = await createResponse.json();
          chatId = chatData.chatId;
        } else {
          toast.error('Failed to start chat');
          return;
        }
      }

      if (chatId) {
        router.push(`/chat?chat=${chatId}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Error starting chat');
    }
  };

  const handleRemoveStudent = (studentId: string, studentName: string, assignmentId: string) => {
    setRemovalTarget({
      id: studentId,
      name: studentName,
      type: 'student',
      assignmentId
    });
    setShowRemovalModal(true);
  };

  const handleRemoveGroup = (groupId: string, groupName: string, assignmentId: string) => {
    setRemovalTarget({
      id: groupId,
      name: groupName,
      type: 'group',
      assignmentId
    });
    setShowRemovalModal(true);
  };

  const handleConfirmRemoval = async (
    reason: 'project_completed' | 'report_issue' | 'other',
    details?: string
  ) => {
    if (!removalTarget) return;

    setRemoving(true);
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
          removalDetails: details,
        }),
      });

      if (response.ok) {
        const successMessages = {
          project_completed: `${removalTarget.name} marked as project completed`,
          report_issue: `Report created for ${removalTarget.name}`,
          other: `${removalTarget.name} removed from your mentorship`,
        };

        toast.success(successMessages[reason]);
        setShowRemovalModal(false);
        setRemovalTarget(null);
        fetchAssignedData(); // Refresh data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned To You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.totalAssignments === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned To You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No Students or Groups Assigned</p>
            <p className="text-sm text-gray-400 mt-2">
              Students and groups will be assigned to you by administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned To You
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </CardTitle>
          <p className="text-sm text-gray-600">
            You are mentoring {data.summary.totalStudents} student{data.summary.totalStudents !== 1 ? 's' : ''} across {data.summary.totalGroups} group{data.summary.totalGroups !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Groups Assigned */}
          {data.groups.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Groups Assigned ({data.groups.length})
              </h3>
              <div className="space-y-4">
                {data.groups.map((assignment: any) => (
                  <Card key={assignment._id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {assignment.groupId?.name || 'Unknown Group'}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Group Assignment
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/mentor/groups/${assignment.groupId?._id || assignment.groupId}`)}
                            className="text-xs h-7"
                          >
                            View Details
                          </Button>
                          <button
                            onClick={() => handleRemoveGroup(
                              assignment.groupId?._id || assignment.groupId,
                              assignment.groupId?.name || 'Unknown Group',
                              assignment._id
                            )}
                            className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                            title="Remove this group assignment"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                      {assignment.groupId?.description && (
                        <p className="text-sm text-gray-600">{assignment.groupId.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-gray-500">
                        Assigned on {new Date(assignment.assignedAt || assignment.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Individual Students */}
          {data.students.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Individual Students ({data.students.length})
              </h3>
              <div className="space-y-3">
                {data.students.map((assignment: any) => (
                  <div key={assignment._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={assignment.studentId?.photo && assignment.studentId.photo.trim() ? assignment.studentId.photo : undefined}
                          alt={assignment.studentId?.fullName || 'Student'}
                        />
                        <AvatarFallback>
                          {(assignment.studentId?.fullName || 'S').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {assignment.studentId?.fullName || 'Unknown Student'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {assignment.studentId?.email || 'No email'}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {assignment.assignedBy === assignment.mentorId ? 'Accepted Invitation' : 'Direct Assignment'}
                        </Badge>
                        {assignment.project && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">Working on: </span>
                            <a
                              href={`/projects/${assignment.project.id || assignment.projectId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              {assignment.project.title}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleChatWithStudent(
                          assignment.studentId?._id,
                          assignment.studentId?.fullName || 'Student'
                        )}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </button>
                      <button
                        onClick={() => handleRemoveStudent(
                          assignment.studentId?._id,
                          assignment.studentId?.fullName || 'Unknown Student',
                          assignment._id
                        )}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        title="Remove this student assignment"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{data.summary.totalGroups}</p>
                    <p className="text-sm text-blue-700">Groups Assigned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{data.summary.totalStudents}</p>
                    <p className="text-sm text-green-700">Individual Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{data.summary.totalAssignments}</p>
                    <p className="text-sm text-purple-700">Total Assignments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

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
          isLoading={removing}
        />
      )}
    </>
  );
}
