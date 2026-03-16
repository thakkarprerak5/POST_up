"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Upload, 
  FileText, 
  Send,
  User,
  Mail,
  Star,
  CheckCircle,
  Users,
  Crown
} from "lucide-react";

interface GroupMember {
  fullName?: string;
  email?: string;
  role?: string;
}

interface MentorInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor?: any;
  user?: any;
  onInvitationSent?: () => void;
  projectData?: {
    title: string;
    description: string;
    type: 'individual' | 'group';
    groupName?: string;
    groupLeadId?: string;
    groupMembers?: any[];
    groupMemberEmails?: string[];
  };
}

export function MentorInvitationModal({ 
  isOpen, 
  onClose, 
  mentor, 
  user, 
  onInvitationSent,
  projectData 
}: MentorInvitationModalProps) {
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [optionalMessage, setOptionalMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group form states
  const [groupName, setGroupName] = useState('');
  const [groupLeadId, setGroupLeadId] = useState('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  // Pre-fill project data when available
  useEffect(() => {
    if (projectData) {
      setProjectTitle(projectData.title || '');
      setProjectDescription(projectData.description || '');
      if (projectData.type === 'group') {
        setGroupName(projectData.groupName || '');
        setGroupLeadId(projectData.groupLeadId || '');
        setGroupMembers(projectData.groupMembers || []);
      }
    }
  }, [projectData]);

  // Fetch available students for group member selection
  useEffect(() => {
    if (isOpen && projectData?.type === 'group') {
      fetchStudents();
    }
  }, [isOpen, projectData]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const students = await response.json();
        const studentUsers = students.filter((u: any) => u.type === 'student');
        setAvailableStudents(studentUsers);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const addGroupMember = () => {
    setGroupMembers([...groupMembers, { fullName: '', email: '', role: '' }]);
  };

  const updateGroupMember = (index: number, member: GroupMember) => {
    const updatedMembers = [...groupMembers];
    updatedMembers[index] = member;
    setGroupMembers(updatedMembers);
  };

  const removeGroupMember = (index: number) => {
    setGroupMembers(groupMembers.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setProposalFile(file);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!projectTitle || !projectDescription || !proposalFile) {
      return;
    }

    // Additional validation for group registrations
    if (projectData?.type === 'group') {
      if (!groupName || !groupLeadId) {
        return;
      }
      // Check if at least one member has valid data
      const hasValidMember = groupMembers.some(member => 
        member.fullName?.trim() && member.email?.trim()
      );
      if (!hasValidMember) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('mentorId', mentor?.id);
      formData.append('projectId', ''); // Will be created with the project
      formData.append('projectTitle', projectTitle);
      formData.append('projectDescription', projectDescription);
      formData.append('proposalFile', proposalFile);
      formData.append('message', optionalMessage);
      
      // Add group data if it's a group registration
      if (projectData?.type === 'group') {
        formData.append('registrationType', 'group');
        
        // Use group member emails from projectData if available, otherwise extract from local state
        let groupMemberEmails: string[] = [];
        
        if (projectData.groupMemberEmails && projectData.groupMemberEmails.length > 0) {
          // Use pre-filled emails from projectData
          groupMemberEmails = projectData.groupMemberEmails;
        } else {
          // Fallback: extract emails from local groupMembers state
          groupMemberEmails = groupMembers
            .filter(member => member.email?.trim())
            .map(member => member.email!.trim());
        }
        
        if (groupMemberEmails.length > 0) {
          const jsonString = JSON.stringify(groupMemberEmails);
          console.log('🔍 JSON String being sent:', jsonString);
          console.log('🔍 JSON String type:', typeof jsonString);
          console.log('🔍 JSON String length:', jsonString.length);
          
          // Test JSON parsing in frontend
          try {
            const parsed = JSON.parse(jsonString);
            console.log('🔍 JSON parsing test successful:', parsed);
          } catch (e) {
            console.error('❌ JSON parsing test failed:', e);
          }
          
          formData.append('groupMemberEmails', jsonString);
        }
      }
      
      console.log('🔍 Sending mentor invitation:', {
        mentorId: mentor?.id,
        projectTitle,
        projectDescription,
        proposalFile: proposalFile.name,
        optionalMessage,
        studentId: user?.id,
        registrationType: projectData?.type,
        groupData: projectData?.type === 'group' ? {
          groupName,
          groupLeadId,
          groupMembers,
          groupMemberEmails: projectData.groupMemberEmails
        } : undefined
      });
      
      // Debug the FormData contents
      console.log('🔍 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      const response = await fetch('/api/mentor/invitation', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Invitation sent successfully:', data);
        onInvitationSent?.();
        onClose();
        
        // Reset form
        setProjectTitle('');
        setProjectDescription('');
        setProposalFile(null);
        setOptionalMessage('');
        setGroupName('');
        setGroupLeadId('');
        setGroupMembers([]);
      } else {
        const error = await response.json();
        console.error('Failed to send invitation:', error);
        throw new Error(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending mentor invitation:', error);
      // You might want to show an error toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">Invite Mentor</CardTitle>
            <p className="text-sm text-muted-foreground">
              Send a project invitation to {mentor?.name || 'selected mentor'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Mentor Info */}
          {mentor && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                  {mentor.name?.charAt(0) || 'M'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{mentor.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {mentor.email}
                  </p>
                  {mentor.skills && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mentor.skills.slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {mentor.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{mentor.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="h-4 w-4 fill-current" />
                    <span>4.8</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </div>
          )}

          {/* Group Information Display (for group registrations) */}
          {projectData?.type === 'group' && (
            <div className="space-y-4 p-4 bg-muted border border rounded-lg">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" />
                Group Information
              </h3>
              
              {/* Group Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Group Name</label>
                <div className="p-2 bg-background border border-border rounded-md">
                  {projectData.groupName || 'Not specified'}
                </div>
              </div>

              {/* Group Lead */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Group Lead</label>
                <div className="p-2 bg-background border border-border rounded-md">
                  {projectData.groupLeadId ? (
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-primary" />
                      <span>
                        {availableStudents.find((s: any) => s._id === projectData.groupLeadId)?.fullName || 'Unknown Lead'}
                      </span>
                    </div>
                  ) : (
                    'Not specified'
                  )}
                </div>
              </div>

              {/* Group Members */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Group Members</label>
                <div className="space-y-2">
                  {projectData.groupMembers && projectData.groupMembers.length > 0 ? (
                    projectData.groupMembers.map((member: any, index: number) => (
                      <div key={index} className="p-2 bg-background border border-border rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {member.fullName || `Member ${index + 1}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.email}
                            </div>
                            {member.role && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Role: {member.role}
                              </div>
                            )}
                            {member.isValidated && (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600">Validated</span>
                              </div>
                            )}
                          </div>
                          {member.isValidated ? (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No group members added
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Project Information</h3>
            
            <div>
              <label className="text-sm font-medium">Project Title *</label>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter your project title"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Project Description *</label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Brief description of your project (max 200 words)"
                className="mt-1"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Proposal Upload */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project Proposal (PDF) *</label>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a one-page PDF proposal for the mentor to review
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF files only (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                {proposalFile && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">{proposalFile.name}</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProposalFile(null)}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optional Message */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Optional Message to Mentor</label>
              <Textarea
                value={optionalMessage}
                onChange={(e) => setOptionalMessage(e.target.value)}
                placeholder="Any additional information you'd like to share with the mentor"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !projectTitle ||
                !projectDescription ||
                !proposalFile
              }
              className="bg-gradient-to-r from-primary to-accent"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
        </CardContent>
      </Card>
    </div>
  );
}
