'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Users, 
  Send, 
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Mentor {
  id: string;
  name: string;
  email: string;
  photo: string;
  type: string;
  skills?: string[];
  experience?: string;
}

interface MentorSelectionProps {
  projectId: string;
  onMentorSelected: (mentorId: string) => void;
  onInvitationSent: (invitationData: any) => void;
}

export function MentorSelection({ projectId, onMentorSelected, onInvitationSent }: MentorSelectionProps) {
  const { data: session } = useSession();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/assignment-data');
      
      if (response.ok) {
        try {
          const data = await response.json();
          setMentors(data.mentors || []);
        } catch (parseError) {
          console.error('Error parsing assignment data response:', parseError);
          setMentors([]);
        }
      } else {
        // Check if response is HTML (redirect to login)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.error('Authentication required - trying public mentors API');
          // Try the public mentors API as fallback
          try {
            const publicResponse = await fetch('/api/mentors');
            if (publicResponse.ok) {
              try {
                const publicData = await publicResponse.json();
                setMentors(Array.isArray(publicData) ? publicData : (publicData.mentors || []));
              } catch (parseError) {
                console.error('Error parsing public mentors response:', parseError);
                setMentors([]);
              }
            } else {
              console.error('Public mentors API also failed:', publicResponse.status);
              setMentors([]);
            }
          } catch (publicError) {
            console.error('Error calling public mentors API:', publicError);
            setMentors([]);
          }
        } else {
          console.error('Assignment data API failed with status:', response.status);
          setMentors([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
      // Try public mentors API as fallback
      try {
        const publicResponse = await fetch('/api/mentors');
        if (publicResponse.ok) {
          try {
            const publicData = await publicResponse.json();
            setMentors(Array.isArray(publicData) ? publicData : (publicData.mentors || []));
          } catch (parseError) {
            console.error('Error parsing fallback mentors response:', parseError);
            setMentors([]);
          }
        } else {
          console.error('Public mentors API also failed:', publicResponse.status);
          setMentors([]);
        }
      } catch (publicError) {
        console.error('Error calling public mentors API:', publicError);
        setMentors([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendInvitation = async () => {
    if (!selectedMentor || !projectId) return;

    setSending(true);
    try {
      const response = await fetch('/api/mentor/invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorId: selectedMentor,
          projectId: projectId,
          message: invitationMessage
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onInvitationSent(data);
        setInvitationMessage('');
        setSelectedMentor('');
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
    } finally {
      setSending(false);
    }
  };

  if (!session) {
    return (
      <Card className="bg-white border border-gray-200 rounded-xl">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Please sign in to select a mentor.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Users className="h-5 w-5 text-blue-600" />
          Choose Your Mentor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search mentors by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Mentors List */}
        <div className="max-h-64 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            filteredMentors.map((mentor) => (
              <div
                key={mentor.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedMentor === mentor.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMentor(mentor.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={mentor.photo && mentor.photo.trim() ? mentor.photo : undefined} alt={mentor.name} />
                      <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-black">{mentor.name}</h4>
                      <p className="text-sm text-gray-600">{mentor.email}</p>
                      <Badge variant="outline" className="mt-1">
                        {mentor.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      variant={selectedMentor === mentor.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMentor(mentor.id);
                      }}
                    >
                      Select
                    </Button>
                  </div>
                </div>

                {/* Mentor Details */}
                {selectedMentor === mentor.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h5 className="font-medium text-black mb-2">About {mentor.name}</h5>
                    {mentor.skills && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-black">Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mentor.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {mentor.experience && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-black">Experience:</span>
                        <span className="ml-2">{mentor.experience}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {filteredMentors.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No mentors found</p>
              <p className="text-sm">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>

        {/* Invitation Message */}
        {selectedMentor && (
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <h5 className="font-medium text-black">Send Invitation Message</h5>
            <Textarea
              placeholder="Introduce yourself and explain why you'd like this mentor to guide your project..."
              value={invitationMessage}
              onChange={(e) => setInvitationMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={sendInvitation}
              disabled={sending || !invitationMessage.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
