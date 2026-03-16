"use client";



import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";

import { MentorInvitationModal } from "./mentor-invitation-modal";

import { MentorSelectionModal } from "./mentor-selection-modal";

import { GroupLeadRequestModal } from "./group-lead-request-modal";

import { toast } from "sonner";

import { 

  X, 

  Upload, 

  FileText, 

  User, 

  Users, 

  Send,

  CheckCircle,

  AlertCircle,

  Crown

} from "lucide-react";



interface MentorInvitation {

  id: string;

  mentorId: string;

  studentId: string;

  projectId?: string;

  status: 'pending' | 'accepted' | 'rejected';

  message?: string;

  createdAt: Date;

  respondedAt?: Date;

}



interface ProjectRegistrationModalProps {

  isOpen: boolean;

  onClose: () => void;

  user?: any;

}



interface GroupMember {

  fullName?: string;

  email?: string;

  role?: string;

  id?: string; // User ID if found in database

  isValidated?: boolean; // Whether email is validated against user database

  validationStatus?: 'pending' | 'valid' | 'not_found';

}



export function ProjectRegistrationModal({ isOpen, onClose, user }: ProjectRegistrationModalProps) {

  const [registrationType, setRegistrationType] = useState<'individual' | 'group'>('individual');

  const [mentorAssignmentMethod, setMentorAssignmentMethod] = useState<'invitation' | 'admin'>('invitation');

  const [projectTitle, setProjectTitle] = useState('');

  const [projectDescription, setProjectDescription] = useState('');

  const [proposalFile, setProposalFile] = useState<File | null>(null);

  const [groupName, setGroupName] = useState('');

  const [partners, setPartners] = useState(['', '']);

  const [groupLeadId, setGroupLeadId] = useState('');

  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  const [availableStudents, setAvailableStudents] = useState<any[]>([]);



  // Initialize group members when component mounts

  useEffect(() => {

    if (isOpen && registrationType === 'group') {

      setGroupMembers([]);

      setGroupLeadId('');

    }

  }, [isOpen, registrationType]);

  const [optionalMessage, setOptionalMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);

  const [showMentorInvitation, setShowMentorInvitation] = useState(false);

  const [showMentorSelection, setShowMentorSelection] = useState(false);

  const [selectedMentor, setSelectedMentor] = useState<any>(null);

  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const [rejectedInvitation, setRejectedInvitation] = useState<MentorInvitation | null>(null);

  const [showGroupLeadRequest, setShowGroupLeadRequest] = useState(false);

  const [invitations, setInvitations] = useState<MentorInvitation[]>([]);



  const isGroupLead = user?.profile?.isGroupLead;



  // Fetch available students for group member selection

  useEffect(() => {

    const fetchStudents = async () => {

      try {

        const response = await fetch('/api/users');

        if (response.ok) {

          const students = await response.json();

          console.log('🔍 Fetched students:', students);

          // Filter only students (not mentors or admins)

          const studentUsers = students.filter((u: any) => u.type === 'student');

          console.log('🔍 Filtered student users:', studentUsers);

          setAvailableStudents(studentUsers);

        }

      } catch (error) {

        console.error('Error fetching students:', error);

      }

    };



    if (isOpen && registrationType === 'group') {

      fetchStudents();

    }

  }, [isOpen, registrationType]);



  // Validate access: only students can register (group projects open to all students)

  const canRegister = user?.type === 'student';

  const canRegisterGroup = canRegister; // Any student can start group registration



  if (!isOpen) return null;



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (file && file.type === 'application/pdf') {

      setProposalFile(file);

    }

  };



  const addPartnerField = () => {

    setPartners([...partners, '']);

  };



  const updatePartner = (index: number, value: string) => {

    const updatedPartners = [...partners];

    updatedPartners[index] = value;

    setPartners(updatedPartners);

  };



  const removePartner = (index: number) => {

    setPartners(partners.filter((_, i) => i !== index));

  };



  const validateGroupMemberEmail = async (email: string): Promise<{ isValid: boolean; user?: any; message?: string }> => {
    if (!email || !email.includes('@')) {
      return { isValid: false, message: 'Invalid email format' };
    }

    try {
      const response = await fetch(`/api/users/lookup?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          return { isValid: true, user: data.user };
        } else {
          return { isValid: false, message: 'User not found in database' };
        }
      } else {
        return { isValid: false, message: 'Failed to validate email' };
      }
    } catch (error) {
      console.error('Error validating email:', error);
      return { isValid: false, message: 'Validation error' };
    }
  };

  const handleGroupMemberEmailChange = async (index: number, email: string) => {
    const updatedMembers = [...groupMembers];
    const member = { ...updatedMembers[index], email };
    
    // Reset validation status
    member.validationStatus = 'pending';
    member.isValidated = false;
    member.id = undefined;
    member.fullName = member.fullName || '';

    // Validate email if it's not empty
    if (email && email.includes('@')) {
      member.validationStatus = 'pending';
      const validation = await validateGroupMemberEmail(email);
      
      if (validation.isValid && validation.user) {
        member.validationStatus = 'valid';
        member.isValidated = true;
        member.id = validation.user._id;
        member.fullName = member.fullName || validation.user.fullName;
        
        toast.success(`✅ ${validation.user.fullName} validated successfully`);
      } else {
        member.validationStatus = 'not_found';
        member.isValidated = false;
        member.id = undefined;
        
        toast.warning(`⚠️ ${validation.message || 'Email not found in database'}`);
      }
    }

    updatedMembers[index] = member;
    setGroupMembers(updatedMembers);
  };

  const addGroupMember = () => {
    setGroupMembers([...groupMembers, { 
      fullName: '', 
      email: '', 
      role: '',
      validationStatus: 'pending',
      isValidated: false
    }]);
  };



  const updateGroupMember = (index: number, member: GroupMember) => {

    const updatedMembers = [...groupMembers];

    updatedMembers[index] = member;

    setGroupMembers(updatedMembers);

  };



  const removeGroupMember = (index: number) => {

    setGroupMembers(groupMembers.filter((_, i) => i !== index));

  };



  const handleDecision = async (invitationId: string, decision: 'accept' | 'reject') => {

    try {

      const response = await fetch(`/api/mentor/invitations/${invitationId}/respond`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({ decision }),

      });



      if (response.ok) {

        setInvitations(invitations.map((inv: MentorInvitation) => 

          inv.id === invitationId 

            ? { ...inv, status: decision === 'accept' ? 'accepted' : 'rejected' }

            : inv

        ));



        if (decision === 'accept') {

          console.log('Invitation accepted successfully');

        }

      }

    } catch (error) {

      console.error('Error responding to invitation:', error);

    }

  };



  const handleSubmit = async () => {

    setIsSubmitting(true);

    try {

      console.log('Submitting project registration:', {

        registrationType,

        mentorAssignmentMethod,

        projectTitle,

        projectDescription,

        proposalFile,

        groupName,

        partners,

        optionalMessage

      });

      

      // Create FormData for file upload

      const formData = new FormData();

      formData.append('title', projectTitle);

      formData.append('description', projectDescription);

      formData.append('type', registrationType);

      if (proposalFile) {

        formData.append('proposalFile', proposalFile);

      }

      

      if (registrationType === 'group') {

        formData.append('groupName', groupName);

        formData.append('groupLeadId', groupLeadId || user.id);

        partners.forEach((partner, index) => {

          if (partner.trim()) {

            formData.append(`partners[${index}]`, partner.trim());

          }

        });

      }

      

      if (mentorAssignmentMethod === 'invitation' && selectedMentor) {

        formData.append('mentorId', selectedMentor.id);

        formData.append('assignmentMethod', 'invitation');

      } else if (mentorAssignmentMethod === 'admin') {

        formData.append('assignmentMethod', 'admin');

      }

      

      if (optionalMessage.trim()) {

        formData.append('message', optionalMessage.trim());

      }

      

      const response = await fetch('/api/projects', {

        method: 'POST',

        body: formData

      });

      

      if (response.ok) {

        const result = await response.json();

        console.log('✅ Project registration successful:', result);

        

        // Show success message based on assignment method

        if (result.adminRequestCreated) {

          toast.success(result.adminRequestMessage || 'Project registered successfully! Your admin assignment request has been submitted to the Super Admin.');

        } else {

          toast.success('Project registered successfully!');

        }

        

        onClose();

        setCurrentStep(1);

        setProjectTitle('');

        setProjectDescription('');

        setProposalFile(null);

        setGroupName('');

        setPartners(['', '']);

        setOptionalMessage('');

      } else {

        const errorData = await response.json();

        console.error('❌ Project registration failed:', errorData);

        

        toast.error(errorData.error || 'Failed to register project');

      }

    } catch (error) {

      console.error('Error submitting project registration:', error);

      

      toast.error('Error registering project');

    } finally {

      setIsSubmitting(false);

    }

  };



  return (

    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">

      <Card className="w-full max-w-4xl max-h-[85vh] bg-background border-border shadow-xl">

        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">

          <CardTitle className="text-xl font-semibold text-foreground">Project Registration</CardTitle>

          <Button 

            variant="ghost" 

            size="sm" 

            onClick={onClose}

            className="hover:bg-muted text-muted-foreground"

          >

            <X className="h-4 w-4" />

          </Button>

        </CardHeader>

        

        <CardContent className="space-y-6 p-6 overflow-y-auto max-h-[60vh]">

          {/* Progress Indicator */}

          <div className="flex items-center justify-between mb-6">

            <div className="flex items-center space-x-2">

              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${

                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'

              }`}>

                1

              </div>

              <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>Registration Type</span>

            </div>

            <div className="flex-1 h-1 bg-white  mx-2"></div>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${

              currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'

            }`}>

              2

            </div>

            <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>Mentor Assignment</span>

            <div className="flex-1 h-1 bg-white mx-2"></div>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${

              currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'

            }`}>

              3

            </div>

            <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>Project Details</span>

          </div>



          {/* Step 1: Registration Type */}

          {currentStep === 1 && (

            <div className="space-y-4">

              <h3 className="text-lg font-semibold text-foreground">Choose Registration Type</h3>

              <div className="grid grid-cols-2 gap-4">

                <Card 

                  className={`cursor-pointer transition-all border ${

                    registrationType === 'individual' 

                      ? 'ring-2 ring-primary bg-primary/10 border-primary' 

                      : 'hover:bg-muted border-border'

                  }`}

                  onClick={() => setRegistrationType('individual')}

                >

                  <CardContent className="p-4 text-center">

                    <div className="h-8 w-8 mx-auto mb-2 bg-primary/20 rounded-lg flex items-center justify-center">

                      <User className="h-4 w-4 text-primary" />

                    </div>

                    <h4 className="font-medium text-foreground">Individual</h4>

                    <p className="text-sm text-muted-foreground mt-1">

                      Register a project as an individual student

                    </p>

                  </CardContent>

                </Card>

                

                <Card 

                  className={`cursor-pointer transition-all border ${

                    registrationType === 'group' 

                      ? 'ring-2 ring-primary bg-primary/10 border-primary' 

                      : 'hover:bg-muted border-border'

                  }`}

                  onClick={() => setRegistrationType('group')}

                >

                  <CardContent className="p-4 text-center">

                    <div className="h-8 w-8 mx-auto mb-2 bg-primary/20 rounded-lg flex items-center justify-center">

                      <Users className="h-4 w-4 text-primary" />

                    </div>

                    <h4 className="font-medium text-foreground">Group</h4>

                    <p className="text-sm text-muted-foreground mt-1">

                      Register a project as a group

                    </p>

                  </CardContent>

                </Card>

              </div>

            </div>

          )}



          {/* Step 2: Mentor Assignment Method */}

          {currentStep === 2 && (

            <div className="space-y-4">

              <h3 className="text-lg font-semibold text-foreground">Choose Mentor Assignment Method</h3>

              <div className="grid grid-cols-2 gap-4">

                <Card 

                  className={`cursor-pointer transition-all border ${

                    mentorAssignmentMethod === 'invitation' 

                      ? 'ring-2 ring-primary bg-primary/10 border-primary' 

                      : 'hover:bg-muted border-border'

                  }`}

                  onClick={() => setMentorAssignmentMethod('invitation')}

                >

                  <CardContent className="p-4 text-center">

                    <div className="h-8 w-8 mx-auto mb-2 bg-primary/20 rounded-lg flex items-center justify-center">

                      <Send className="h-4 w-4 text-primary" />

                    </div>

                    <h4 className="font-medium text-foreground">Invite Mentor</h4>

                    <p className="text-sm text-muted-foreground mt-1">

                      Send invitation to a specific mentor

                    </p>

                  </CardContent>

                </Card>

                

                <Card 

                  className={`cursor-pointer transition-all border ${

                    mentorAssignmentMethod === 'admin' 

                      ? 'ring-2 ring-primary bg-primary/10 border-primary' 

                      : 'hover:bg-muted border-border'

                  }`}

                  onClick={() => setMentorAssignmentMethod('admin')}

                >

                  <CardContent className="p-4 text-center">

                    <div className="h-8 w-8 mx-auto mb-2 bg-primary/20 rounded-lg flex items-center justify-center">

                      <Crown className="h-4 w-4 text-primary" />

                    </div>

                    <h4 className="font-medium text-foreground">Admin Assignment</h4>

                    <p className="text-sm text-muted-foreground mt-1">

                      Super Admin will assign mentor later

                    </p>

                  </CardContent>

                </Card>

              </div>

            </div>

          )}



          {/* Step 3: Project Details */}

          {currentStep === 3 && (

            <div className="space-y-4">

              <h3 className="text-lg font-semibold text-foreground">Project Details</h3>

              

              {/* Group Details (if group registration) */}

              {registrationType === 'group' && (

                <div className="space-y-4 p-4 bg-muted border border rounded-lg">

                  <h4 className="font-medium flex items-center gap-2 text-foreground">

                    <Users className="h-4 w-4 text-muted-foreground" />

                    Group Information

                  </h4>

                  

                  {/* Group Name */}

                  <div className="space-y-2">

                    <label className="text-sm font-medium text-foreground">Group Name *</label>

                    <Input

                      placeholder="Enter your group name"

                      value={groupName}

                      onChange={(e) => setGroupName(e.target.value)}

                      required

                      className="bg-background border text-foreground focus:ring-2 focus:ring-primary focus:border-primary"

                    />

                  </div>



                  {/* Group Lead Selection */}

                  <div className="space-y-2">

                    <label className="text-sm font-medium text-foreground">Group Lead *</label>

                    <div className="relative">

                      <select 

                        value={groupLeadId}

                        onChange={(e) => {

                          const newLeadId = e.target.value;

                          console.log('🔍 Group lead selected:', newLeadId);

                          setGroupLeadId(newLeadId);

                          

                          // Update group members to remove the selected lead from additional members

                          if (newLeadId && availableStudents.length > 0) {

                            const selectedLead = availableStudents.find((s: any) => s.id === newLeadId);

                            if (selectedLead) {

                              setGroupMembers(prev => prev.filter(m => m.email !== selectedLead.email));

                            }

                          }

                        }}

                        className="w-full p-3 pr-10 border border-border bg-background text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"

                        required

                      >

                        <option value="">Select group lead...</option>

                        {availableStudents.map((student: any) => (

                          <option key={student.id} value={student.id}>

                            {student.name} {student.id === user?._id ? '(You)' : ''}

                          </option>

                        ))}

                      </select>

                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">

                        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />

                        </svg>

                      </div>

                    </div>

                    {/* Debug info */}

                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">

                      <div>🔍 Debug Info:</div>

                      <div>Available Students: {availableStudents.length}</div>

                      <div>Group Lead ID: {groupLeadId || 'Not selected'}</div>

                      <div>Current User ID: {user?._id}</div>

                      <div>First Student: {availableStudents[0]?.name || 'None'}</div>

                    </div>

                    <p className="text-xs text-muted-foreground">

                      Select who will be group lead. The group lead will be responsible for submitting and managing the project.

                    </p>

                  </div>



                  {/* Selected Group Lead Display */}

                  {groupLeadId && availableStudents.length > 0 && (

                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">

                      <div className="flex items-center gap-2">

                        <Crown className="h-4 w-4 text-primary" />

                        <span className="text-sm font-medium text-foreground">Group Lead:</span>

                        <span className="text-sm text-foreground">

                          {availableStudents.find((s: any) => s.id === groupLeadId)?.name}

                          {groupLeadId === user?._id && ' (You)'}

                        </span>

                      </div>

                    </div>

                  )}



                  {/* Additional Group Members */}

                  <div className="space-y-2">

                    <label className="text-sm font-medium text-foreground">Additional Group Members</label>

                    <p className="text-xs text-muted-foreground mb-3">

                      Add other group members (excluding the group lead selected above)

                    </p>

                    

                    {groupMembers.length === 0 ? (

                      <div className="text-center py-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">

                        <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />

                        <p className="text-sm text-muted-foreground">No additional members added yet</p>

                        <p className="text-xs text-muted-foreground mt-1">Click "Add Member" to add group members</p>

                      </div>

                    ) : (

                      groupMembers.map((member, index) => (

                        <div key={index} className="border border-border rounded-lg p-3 space-y-2 bg-background">

                          <div className="flex items-center justify-between mb-2">

                            <h4 className="text-sm font-medium text-foreground">

                              Member {index + 1}

                              {member.email === user?.email && member.email !== availableStudents.find((s: any) => s._id === groupLeadId)?.email && ' (You)'}

                            </h4>

                            <Button

                              variant="outline"

                              size="sm"

                              onClick={() => removeGroupMember(index)}

                              className="px-2 border-border text-muted-foreground hover:bg-muted"

                              title="Remove member"

                            >

                              <X className="h-3 w-3" />

                            </Button>

                          </div>

                          

                          <div className="grid grid-cols-2 gap-2">

                            <div>

                              <label className="text-xs font-medium text-muted-foreground">Full Name *</label>

                              <Input

                                placeholder={`Member ${index + 1} full name`}

                                value={member.fullName || ''}

                                onChange={(e) => updateGroupMember(index, { 

                                  ...member, 

                                  fullName: e.target.value 

                                })}

                                className="bg-background border text-foreground focus:ring-2 focus:ring-primary focus:border-primary mt-1"

                              />

                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Email *</label>
                              <div className="relative">
                                <Input
                                  type="email"
                                  placeholder={`Member ${index + 1} email`}
                                  value={member.email || ''}
                                  onChange={(e) => handleGroupMemberEmailChange(index, e.target.value)}
                                  className={`bg-background border text-foreground focus:ring-2 focus:ring-primary focus:border-primary mt-1 pr-8 ${
                                    member.validationStatus === 'valid' 
                                      ? 'border-green-500 focus:border-green-500' 
                                      : member.validationStatus === 'not_found'
                                      ? 'border-red-500 focus:border-red-500'
                                      : ''
                                  }`}
                                />
                                {member.validationStatus && (
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    {member.validationStatus === 'valid' ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : member.validationStatus === 'not_found' ? (
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                    ) : null}
                                  </div>
                                )}
                              </div>
                              {member.validationStatus === 'valid' && member.isValidated && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✅ {member.fullName} validated
                                </p>
                              )}
                              {member.validationStatus === 'not_found' && (
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ User not found in database
                                </p>
                              )}
                            </div>

                          </div>

                          

                          <div>

                            <label className="text-xs font-medium text-muted-foreground">Role/Contribution</label>

                            <Input

                              placeholder="e.g., Frontend Developer, UI/UX Designer, Research"

                              value={member.role || ''}

                              onChange={(e) => updateGroupMember(index, { 

                                ...member, 

                                role: e.target.value 

                              })}

                              className="bg-background border text-foreground focus:ring-2 focus:ring-primary focus:border-primary mt-1"

                            />

                          </div>

                        </div>

                      ))

                    )}

                    

                    <Button

                      variant="outline"

                      size="sm"

                      onClick={() => {
                        // Add new empty member
                        setGroupMembers([...groupMembers, { 
                          fullName: '', 
                          email: '', 
                          role: '',
                          validationStatus: 'pending',
                          isValidated: false
                        }]);
                      }}

                      className="border-border text-muted-foreground hover:bg-muted"

                    >

                      <Users className="h-4 w-4 mr-2" />

                      Add Member

                    </Button>

                    <p className="text-xs text-muted-foreground mt-2">

                      Add additional group members. The group lead was already selected above.

                    </p>

                  </div>

                </div>

              )}



              {/* Basic Project Information */}

              <div className="space-y-4">

                <div>

                  <label className="text-sm font-medium text-foreground">Project Title *</label>

                  <Input

                    value={projectTitle}

                    onChange={(e) => setProjectTitle(e.target.value)}

                    placeholder="Enter project title"

                    className="mt-1 bg-background border text-foreground focus:ring-2 focus:ring-primary focus:border-primary"

                    required

                  />

                </div>

                

                <div>

                  <label className="text-sm font-medium text-foreground">Project Description *</label>

                  <Textarea

                    value={projectDescription}

                    onChange={(e) => setProjectDescription(e.target.value)}

                    placeholder="Brief description of your project"

                    className="mt-1 bg-background border text-foreground focus:ring-2 focus:ring-primary focus:border-primary"

                    rows={3}

                    required

                  />

                </div>

              </div>



              {/* Proposal Upload */}

              <div className="space-y-4">

                <div>

                  <label className="text-sm font-medium text-foreground">Project Proposal (PDF) *</label>

                  <div className="mt-2">

                    <div className="flex items-center justify-center w-full">

                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">

                        <div className="flex flex-col items-center justify-center pt-5 pb-6">

                          <Upload className="w-8 h-8 mb-3 text-muted-foreground" />

                          <p className="mb-2 text-sm text-muted-foreground">

                            <span className="font-semibold">Click to upload</span> or drag and drop

                          </p>

                          <p className="text-xs text-muted-foreground">PDF files only (MAX. 5MB)</p>

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



                {/* Optional Message (for mentor invitation) */}

                {mentorAssignmentMethod === 'invitation' && (

                  <div>

                    <label className="text-sm font-medium text-foreground">Optional Message to Mentor</label>

                    <Textarea

                      value={optionalMessage}

                      onChange={(e) => setOptionalMessage(e.target.value)}

                      placeholder="Any additional information for the mentor"

                      className="mt-1 bg-background border text-foreground focus:ring-2 focus:ring-primary focus:border-primary"

                      rows={2}

                    />

                  </div>

                )}

              </div>

            </div>

          )}



          {/* Navigation Buttons */}

          <div className="flex justify-between pt-4 border-t border-border">

            <Button

              variant="outline"

              onClick={() => setCurrentStep(currentStep - 1)}

              disabled={currentStep === 1}

              className="border text-muted-foreground hover:bg-muted"

            >

              Previous

            </Button>

            

            {currentStep < 3 ? (

              <Button

                onClick={() => {

                  if (currentStep === 2 && mentorAssignmentMethod === 'invitation') {

                    setShowMentorSelection(true);

                  } else {

                    setCurrentStep(currentStep + 1);

                  }

                }}

                disabled={

                  (currentStep === 1 && !registrationType) ||

                  (currentStep === 2 && !mentorAssignmentMethod)

                }

                className="bg-primary hover:bg-primary/90 text-primary-foreground"

              >

                {currentStep === 2 && mentorAssignmentMethod === 'invitation' ? 'Choose Mentor' : 'Next'}

              </Button>

            ) : (

              <Button

                onClick={handleSubmit}

                disabled={

                  isSubmitting ||

                  !projectTitle ||

                  !projectDescription ||

                  !proposalFile ||

                  (registrationType === 'group' && !groupName)

                }

                className="bg-primary hover:bg-primary/90 text-primary-foreground"

              >

                {isSubmitting ? 'Submitting...' : 'Submit Registration'}

              </Button>

            )}

          </div>

        </CardContent>

      </Card>

      

      {/* Mentor Selection Modal */}

      <MentorSelectionModal

        isOpen={showMentorSelection}

        onClose={() => setShowMentorSelection(false)}

        onMentorSelected={(mentor: any, groupId?: string) => {

          setSelectedMentor(mentor);

          setShowMentorSelection(false);

          setShowMentorInvitation(true);

        }}

        showGroupSelection={registrationType === 'group'}

        registrationType={registrationType}

        onPrevious={() => setCurrentStep(currentStep - 1)}

        showNavigation={true}

      />

      

      {/* Mentor Invitation Modal */}

      <MentorInvitationModal

        isOpen={showMentorInvitation}

        onClose={() => setShowMentorInvitation(false)}

        mentor={selectedMentor}

        user={user}

        projectData={{

          title: projectTitle,

          description: projectDescription,

          type: registrationType,

          groupName: registrationType === 'group' ? groupName : undefined,

          groupLeadId: registrationType === 'group' ? groupLeadId : undefined,

          groupMembers: registrationType === 'group' ? groupMembers : undefined

        }}

        onInvitationSent={() => {

          setShowMentorInvitation(false);

          setCurrentStep(currentStep + 1);

        }}

      />

      

      {/* Group Lead Request Modal */}

      <GroupLeadRequestModal

        isOpen={showGroupLeadRequest}

        onClose={() => setShowGroupLeadRequest(false)}

        user={user}

        onRequestSubmitted={() => {

          window.location.reload();

        }}

      />

    </div>

  );

}