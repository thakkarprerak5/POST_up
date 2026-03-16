// components/student/MentorCard.tsx - UPDATED FOR NEW RELATIONAL SYSTEM
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Users, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Mentor {
  id: string;
  name: string;
  email: string;
  photo: string;
}

interface MentorAssignment {
  id: string;
  mentor: Mentor;
  assignedBy: string;
  assignedAt: string;
}

interface MentorCardProps {
  studentId?: string; // Optional: if provided, fetch mentor data for this student
  isOwner?: boolean; // Add isOwner to control chat functionality
  refreshKey?: number; // Add refreshKey to trigger data refresh
}

const MentorCard: React.FC<MentorCardProps> = ({ studentId, isOwner, refreshKey }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState<MentorAssignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  console.log('🚀 MentorCard component rendered with studentId:', studentId);
  console.log('🚀 studentId type:', typeof studentId);
  console.log('🚀 studentId value:', JSON.stringify(studentId));

  // Add useEffect to fetch mentor data when component mounts or studentId changes
  useEffect(() => {
    fetchMentorData();
  }, [studentId, refreshKey]); // Dependencies: fetch when studentId or refreshKey changes

  const handleChatWithMentor = async (mentor: Mentor) => {
    if (!studentId) {
      toast.error('Unable to identify student');
      return;
    }

    setLoading(true);
    console.log('🚀 Starting chat with mentor:', mentor.name);

    try {
      // Call Smart Handshake API
      const response = await fetch('/api/chat/handshake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorId: mentor.id,
          // Note: projectId and projectData can be added here when available
          // For now, we're just creating/finding the chat room
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start chat');
      }

      const data = await response.json();
      console.log('✅ Handshake successful:', data);

      if (data.success && data.chatId) {
        // Navigate to chat with the conversation ID
        router.push(`/chat?activeChat=${data.chatId}`);

        if (data.isNewRoom) {
          toast.success(`Started new chat with ${mentor.name}`);
        } else {
          toast.success(`Opening chat with ${mentor.name}`);
        }
      } else {
        throw new Error('Invalid response from handshake API');
      }
    } catch (error: any) {
      console.error('❌ Failed to start chat:', error);
      toast.error(error.message || 'Failed to start chat with mentor');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorData = async () => {
    console.log('🚀 MentorCard useEffect called with studentId:', studentId, 'refreshKey:', refreshKey);

    if (!studentId) {
      console.log('❌ No studentId provided to MentorCard');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Fetching mentor data for studentId:', studentId);

      const apiUrl = `/api/public/student-mentor?studentId=${studentId}&t=${Date.now()}`;
      console.log('📡 API URL:', apiUrl);

      const response = await fetch(apiUrl);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Raw API response:', data);
        console.log('🔍 data.hasMentor:', data.hasMentor);
        console.log('🔍 data.mentors:', data.mentors);
        console.log('🔍 data.mentors length:', data.mentors?.length);

        if (data.hasMentor && data.mentors && data.mentors.length > 0) {
          console.log('✅ Setting mentors data:', data.mentors);
          setMentors(data.mentors);
          setError(null);
          console.log('✅ Mentor data set successfully');
        } else {
          console.log('⚠️ No mentor data found, setting empty array');
          setMentors([]);
          setError(null);
          console.log('✅ Empty mentor data set');
        }
      } else {
        console.log('❌ Response not OK, status:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response text:', errorText);
        setError(`Failed to fetch mentor information (${response.status})`);
      }
    } catch (err) {
      console.error('❌ Exception in fetchMentorData:', err);
      setError('Failed to fetch mentor information');
    } finally {
      setLoading(false);
    }
  };

  // Main render function
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Mentor
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Mentor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-500 font-medium mb-2">Error loading mentor information</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mentors || mentors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Mentor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Not Assigned Yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Your mentor assignment will appear here once assigned by administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('🎨 Rendering MentorCard with mentors:', mentors);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Your Mentor{mentors.length > 1 ? `s (${mentors.length})` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mentors.map((assignment, index) => {
            return (
              <div key={assignment.id} className={`p-4 border rounded-lg ${index > 0 ? 'mt-4' : ''}`}>

                {/* Mentor Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200">
                    {assignment.mentor.photo && assignment.mentor.photo.trim() ? (
                      <img
                        src={assignment.mentor.photo}
                        alt={assignment.mentor.name}
                        className="w-full h-full object-cover"
                        onLoad={(e) => {
                          console.log('✅ MentorCard: Image loaded successfully:', assignment.mentor.photo);
                        }}
                        onError={(e) => {
                          console.log('❌ MentorCard: Image failed to load:', assignment.mentor.photo);
                          const target = e.target as HTMLImageElement;
                          console.log('🔄 Falling back to placeholder');
                          target.src = '/placeholder-user.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{assignment.mentor.name}</h3>
                    <p className="text-sm text-gray-500">{assignment.mentor.email}</p>
                    <div className="mt-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <User className="h-3 w-3 mr-1" />
                        Assigned Mentor
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {isOwner && (
                    <Button
                      onClick={() => handleChatWithMentor(assignment.mentor)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {loading ? 'Connecting...' : 'Chat with Mentor'}
                    </Button>
                  )}
                  {!isOwner && (
                    <div className="flex-1 text-center text-sm text-gray-500 py-2">
                      Only the student can chat with their assigned mentor
                    </div>
                  )}
                  <Button
                    onClick={() => fetchMentorData()}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-3 w-3" />
                    Refresh
                  </Button>
                </div>

                {/* Assignment Info */}
                <div className="mt-3 text-xs text-gray-500">
                  Assigned by {assignment.assignedBy} on {new Date(assignment.assignedAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Click "Chat with Mentor" to start a conversation. You can discuss your projects, get guidance,
            and receive feedback. Your mentor{mentors.length > 1 ? 's are' : ' is'} here to support your academic journey.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MentorCard;
