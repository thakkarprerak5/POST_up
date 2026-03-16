"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText,
  Users,
  User,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  Search,
  Crown,
  Mail,
  Star,
  Loader2,
  X,
  Shield,
  Send
} from "lucide-react";
import { toast } from "sonner";

interface GroupMember {
  fullName?: string;
  email?: string;
  role?: string;
  id?: string;
  isValidated?: boolean;
  validationStatus?: 'pending' | 'valid' | 'not_found';
}

interface Mentor {
  _id?: string;
  id?: string;
  fullName?: string; // Added to match API response
  name?: string;
  email?: string;
  photo?: string;
  avatar?: string;
  department?: string;
  position?: string;
  expertise?: string[];
}

interface ProjectRegistrationStepperProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const STEPS = [
  { id: 1, title: "Project Details", description: "Basic project information" },
  { id: 2, title: "Group Setup", description: "Team configuration" },
  { id: 3, title: "Mentor Selection", description: "Choose mentor assignment" }
];

export function ProjectRegistrationStepperNew({ isOpen, onClose, user }: ProjectRegistrationStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Project Details
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectDomain, setProjectDomain] = useState('');
  const [techStack, setTechStack] = useState('');
  const [proposalFile, setProposalFile] = useState<File | null>(null);

  // Group Setup
  const [registrationType, setRegistrationType] = useState<'individual' | 'group'>('individual');
  const [groupName, setGroupName] = useState('');
  const [groupLeadId, setGroupLeadId] = useState('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  // Mentor Selection
  const [mentorAssignmentMethod, setMentorAssignmentMethod] = useState<'invitation' | 'admin'>('invitation');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMentors, setLoadingMentors] = useState(false);

  // Validate access control
  const canRegister = user?.type === 'student';
  const isGroupLead = user?.profile?.isGroupLead; // Keep for display but don't restrict

  // Add effect to track registration type changes
  useEffect(() => {
    console.log('🔍 Registration type changed to:', registrationType);
  }, [registrationType]);

  useEffect(() => {
    if (isOpen && registrationType === 'group') {
      fetchStudents();
      fetchMentors();
    }
  }, [isOpen, registrationType]);

  // Validate group member email against user database
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

  // Handle group member email change with validation
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

  const fetchMentors = async () => {
    try {
      setLoadingMentors(true);
      console.log('🔍 Fetching mentors...');

      const response = await fetch('/api/mentors');
      console.log('🔍 Mentors API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch mentors: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 Mentors API response data:', data);

      let mentorList = [];
      if (Array.isArray(data)) {
        mentorList = data;
      } else if (data.success && data.mentors) {
        mentorList = data.mentors;
      } else if (data.mentors) {
        mentorList = data.mentors;
      } else {
        console.warn('🔍 Unexpected mentors data format:', data);
        mentorList = [];
      }

      console.log('🔍 Processed mentor list:', mentorList);
      setMentors(mentorList);

      if (mentorList.length === 0) {
        toast.warning('No mentors available at the moment');
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast.error('Failed to load mentors. Please try again.');
      setMentors([]);
    } finally {
      setLoadingMentors(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setProposalFile(file);
    }
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

  const removeGroupMember = (index: number) => {
    setGroupMembers(groupMembers.filter((_, i) => i !== index));
  };

  const updateGroupMember = (index: number, member: GroupMember) => {
    const updatedMembers = [...groupMembers];
    updatedMembers[index] = member;
    setGroupMembers(updatedMembers);
  };

  const handleMentorSelect = (mentor: Mentor) => {
    console.log('🔍 Mentor selected:', mentor.name, 'ID:', mentor._id || mentor.id);

    // If clicking the already selected mentor, deselect them
    if (selectedMentor && (selectedMentor._id === mentor._id || selectedMentor.id === mentor.id)) {
      console.log('🔍 Deselecting mentor');
      setSelectedMentor(null);
    } else {
      // Select the new mentor (this automatically deselects any previous selection)
      console.log('🔍 Selecting new mentor:', mentor.name);
      setSelectedMentor(mentor);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = () => {
    console.log('🔍 Validating step:', currentStep);
    console.log('🔍 Registration type:', registrationType);
    console.log('🔍 Group name:', groupName);
    console.log('🔍 Group members:', groupMembers);

    switch (currentStep) {
      case 1:
        const step1Valid = projectTitle.trim() && projectDescription.trim();
        console.log('🔍 Step 1 validation:', step1Valid);
        return step1Valid;
      case 2:
        console.log('🔍 Step 2 validation - registrationType:', registrationType);
        console.log('🔍 Step 2 validation - groupName:', groupName);
        console.log('🔍 Step 2 validation - groupName.trim():', groupName.trim());

        if (registrationType === 'group') {
          // For group projects, only require group name initially
          // Group member validation happens when they try to submit
          const step2Valid = groupName.trim();
          console.log('🔍 Step 2 group validation result:', step2Valid);
          return step2Valid;
        }
        console.log('🔍 Step 2 individual validation: true');
        return true;
      case 3:
        // For invitation method, selectedMentor must not be null
        // For admin method, no selection needed
        const step3Valid = mentorAssignmentMethod === 'admin' || (mentorAssignmentMethod === 'invitation' && selectedMentor !== null);
        console.log('🔍 Step 3 validation:', step3Valid);
        console.log('🔍 Step 3 - mentorAssignmentMethod:', mentorAssignmentMethod);
        console.log('🔍 Step 3 - selectedMentor:', selectedMentor);
        return step3Valid;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', projectTitle);
      formData.append('description', projectDescription);
      formData.append('domain', projectDomain);
      formData.append('techStack', techStack);
      formData.append('type', registrationType);

      if (proposalFile) {
        formData.append('proposalFile', proposalFile);
      }

      if (registrationType === 'group') {
        formData.append('groupName', groupName);
        formData.append('groupLeadId', groupLeadId || user?.id || '');

        // Add validated group member emails
        const validatedMembers = groupMembers.filter(m => m.isValidated && m.email);
        validatedMembers.forEach((member, index) => {
          if (member.email) {
            formData.append(`partners[${index}]`, member.email);
          }
        });
      }

      if (mentorAssignmentMethod === 'invitation' && selectedMentor) {
        formData.append('mentorId', selectedMentor._id || selectedMentor.id || '');
        formData.append('mentorName', selectedMentor.fullName || selectedMentor.name || '');
        formData.append('mentorEmail', selectedMentor.email || '');
        formData.append('assignmentMethod', 'invitation');
      } else if (mentorAssignmentMethod === 'admin') {
        formData.append('assignmentMethod', 'admin');
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        // CRITICAL: DO NOT set Content-Type header for FormData
        // The browser will automatically set it with the correct boundary
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Project submission result:', result);

        // Show different success messages based on mentor assignment method
        if (mentorAssignmentMethod === 'invitation' && selectedMentor) {
          toast.success(`Project registered successfully! Invitation sent to ${selectedMentor.name}.`);
        } else if (mentorAssignmentMethod === 'admin') {
          toast.success('Project registered successfully! Admin will assign a mentor soon.');
        } else {
          toast.success('Project registered successfully!');
        }

        onClose();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to register project');
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      toast.error('Failed to register project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setProjectTitle('');
    setProjectDescription('');
    setProjectDomain('');
    setTechStack('');
    setProposalFile(null);
    setRegistrationType('individual');
    setGroupName('');
    setGroupLeadId('');
    setGroupMembers([]);
    setMentorAssignmentMethod('invitation');
    setSelectedMentor(null);
  };

  if (!isOpen) return null;

  // Access control check
  if (!canRegister) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">Only students can register projects.</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter mentors safely with optional chaining
  const filteredMentors = mentors.filter(mentor =>
    (mentor?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mentor?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mentor?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mentor?.department || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4 flex-shrink-0">
          <CardTitle className="text-xl font-semibold">Register Your Project</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 flex-1 overflow-y-auto">
          {/* Stepper Progress */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= step.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-500'
                  }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-100' : 'text-gray-500'
                    }`}>{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`ml-8 flex-1 h-px ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-100">Project Title *</label>
                <Input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Enter your project title"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-100">Project Description *</label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your project in detail"
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-100">Project Domain</label>
                <Input
                  value={projectDomain}
                  onChange={(e) => setProjectDomain(e.target.value)}
                  placeholder="e.g., Web Development, Mobile App, AI/ML"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-100">Tech Stack</label>
                <Input
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder="React, Node.js, MongoDB (comma separated)"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-100">Project Proposal (PDF) *</label>
                <div className="mt-2">
                  <div
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => document.getElementById('proposal-file-input')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      const files = e.dataTransfer.files;
                      if (files && files[0]) {
                        const file = files[0];
                        if (file.type === 'application/pdf') {
                          setProposalFile(file);
                          toast.success('PDF file uploaded successfully');
                        } else {
                          toast.error('Please upload a PDF file only');
                        }
                      }
                    }}
                  >
                    <input
                      id="proposal-file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type === 'application/pdf') {
                            setProposalFile(file);
                            toast.success('PDF file uploaded successfully');
                          } else {
                            toast.error('Please upload a PDF file only');
                          }
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF files only (MAX. 5MB)</p>
                    </div>
                  </div>
                  {proposalFile && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">{proposalFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProposalFile(null);
                          const input = document.getElementById('proposal-file-input') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="ml-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-100">Registration Type</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div
                    className={`p-4 h-auto flex flex-col items-start border-2 rounded-lg cursor-pointer transition-all ${registrationType === 'individual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => {
                      console.log('🔍 Individual project selected');
                      setRegistrationType('individual');
                    }}
                  >
                    <User className="h-5 w-5 mb-2 text-blue-600" />
                    <div className="text-left ">
                      <div className="font-medium text-gray-400 ">Individual Project</div>
                      <div className="text-xs text-gray-500">Register as a solo developer</div>
                    </div>
                  </div>
                  <div
                    className={`p-4 h-auto flex flex-col items-start border-2 rounded-lg cursor-pointer transition-all ${registrationType === 'group'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => {
                      console.log('🔍 Group project selected');
                      setRegistrationType('group');
                    }}
                  >
                    <Users className="h-5 w-5 mb-2 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-gray-400">Group Project</div>
                      <div className="text-xs text-gray-500">
                        {isGroupLead ? 'Register with your team (You are group lead)' : 'Register with your team'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {registrationType === 'group' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-100">Group Name *</label>
                    <Input
                      value={groupName}
                      onChange={(e) => {
                        console.log('🔍 Group name changed to:', e.target.value);
                        setGroupName(e.target.value);
                      }}
                      placeholder="Enter your group name"
                      className="mt-1"
                      required
                    />
                    {groupName.trim() === '' && (
                      <p className="text-xs text-red-500 mt-1">Group name is required to proceed</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-100">Group Lead Email *</label>
                    <p className="text-xs text-gray-500 mb-2">Enter the email address of the group lead</p>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="email"
                        value={groupLeadId}
                        onChange={(e) => {
                          const email = e.target.value;
                          console.log('🔍 Group lead email changed:', email);
                          setGroupLeadId(email);
                        }}
                        onBlur={async () => {
                          // Validate email when user leaves the field
                          if (groupLeadId && groupLeadId.includes('@')) {
                            const validation = await validateGroupMemberEmail(groupLeadId);
                            if (validation.isValid && validation.user) {
                              toast.success(`✅ ${validation.user.fullName} validated as group lead`);
                            } else {
                              toast.error(`⚠️ ${validation.message || 'Email not found in database'}`);
                            }
                          }
                        }}
                        placeholder="groupl ead@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      The group lead's email will be validated against the user database
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-100">Group Members</label>
                    <p className="text-xs text-gray-500 mb-3">
                      Add all group members (excluding the group lead selected above)
                    </p>

                    {groupMembers.length === 0 ? (
                      <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">No additional members added yet</p>
                        <p className="text-xs text-gray-500 mt-1">Click "Add Member" to add group members</p>
                      </div>
                    ) : (
                      groupMembers.map((member, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-100">
                              Member {index + 1}
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeGroupMember(index)}
                              className="px-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-500">Full Name</label>
                              <Input
                                placeholder={`Member ${index + 1} full name`}
                                value={member.fullName || ''}
                                onChange={(e) => updateGroupMember(index, {
                                  ...member,
                                  fullName: e.target.value
                                })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Email *</label>
                              <div className="relative">
                                <Input
                                  type="email"
                                  placeholder={`Member ${index + 1} email`}
                                  value={member.email || ''}
                                  onChange={(e) => handleGroupMemberEmailChange(index, e.target.value)}
                                  className={`mt-1 pr-8 ${member.validationStatus === 'valid'
                                    ? 'border-green-500'
                                    : member.validationStatus === 'not_found'
                                      ? 'border-red-500'
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
                              {member.validationStatus === 'valid' && (
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
                            <label className="text-xs font-medium text-gray-500">Role/Contribution</label>
                            <Input
                              placeholder="e.g., Frontend Developer, UI/UX Designer, Research"
                              value={member.role || ''}
                              onChange={(e) => updateGroupMember(index, {
                                ...member,
                                role: e.target.value
                              })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addGroupMember}
                      className="mt-2 hover:text-gray-400"
                    >
                      <Plus className="h-4 w-4 mr-2 hover:text-gray-400" />
                      Add Member
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-100">Mentor Assignment Method</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div
                    className={`p-4 h-auto flex flex-col items-start border-2 rounded-lg cursor-pointer transition-all ${mentorAssignmentMethod === 'invitation'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => setMentorAssignmentMethod('invitation')}
                  >
                    <Send className="h-5 w-5 mb-2 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-gray-400">Invite Mentor</div>
                      <div className="text-xs text-gray-500">Choose and invite a specific mentor</div>
                    </div>
                  </div>
                  <div
                    className={`p-4 h-auto flex flex-col items-start border-2 rounded-lg cursor-pointer transition-all ${mentorAssignmentMethod === 'admin'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => setMentorAssignmentMethod('admin')}
                  >
                    <Shield className="h-5 w-5 mb-2 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-gray-400">Admin Assignment</div>
                      <div className="text-xs text-gray-500">Let admin assign the best mentor</div>
                    </div>
                  </div>
                </div>
              </div>

              {mentorAssignmentMethod === 'invitation' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>📌 Note:</strong> Select one mentor to invite. Click on a mentor card to select/deselect them.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search mentors by name, email, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="overflow-y-auto max-h-80 space-y-3 pr-2">
                    {loadingMentors ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500">Loading mentors...</span>
                      </div>
                    ) : filteredMentors.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-2">
                          {mentors.length === 0 ? 'No mentors available' : 'No mentors match your search'}
                        </p>
                        {mentors.length === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchMentors}
                            className="mt-2"
                          >
                            Refresh Mentors
                          </Button>
                        )}
                        {searchTerm && mentors.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchTerm('')}
                            className="mt-2"
                          >
                            Clear Search
                          </Button>
                        )}
                      </div>
                    ) : (
                      filteredMentors.map((mentor) => (
                        <div
                          key={mentor._id || mentor.id}
                          className={`group p-4 border rounded-lg cursor-pointer transition-all relative ${selectedMentor?._id === mentor._id || selectedMentor?.id === mentor.id
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          onClick={() => handleMentorSelect(mentor)}
                        >
                          {/* Selection indicator */}
                          {(selectedMentor?._id === mentor._id || selectedMentor?.id === mentor.id) && (
                            <div className="absolute top-2 right-2">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start space-x-3">
                            <Avatar className="h-12 w-12 border-2 border-white">
                              <AvatarImage
                                src={(mentor.avatar || mentor.photo)?.trim() ? (mentor.avatar || mentor.photo) : undefined}
                                alt={mentor.name || 'Mentor'}
                              />
                              <AvatarFallback>
                                <User className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className={`font-medium truncate transition-colors ${selectedMentor?._id === mentor._id || selectedMentor?.id === mentor.id
                                  ? "text-blue-900"
                                  : "text-gray-900 group-hover:text-black"
                                  }`}>
                                  {mentor.fullName || mentor.name || 'Unknown Mentor'}
                                </h3>

                                {(selectedMentor?._id === mentor._id || selectedMentor?.id === mentor.id) && (
                                  <Badge variant="default" className="text-xs bg-blue-600">
                                    Selected
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Mail className="h-3 w-3 mr-1" />
                                <span className="truncate">{mentor.email || 'No email'}</span>
                              </div>

                              {mentor.department && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {mentor.department}
                                </div>
                              )}

                              {mentor.expertise && mentor.expertise.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {mentor.expertise.slice(0, 3).map((skill, index) => (
                                    <Badge key={`skill-${mentor._id || mentor.id}-${index}`} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {mentor.expertise.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{mentor.expertise.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {mentorAssignmentMethod === 'admin' && (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Admin Assignment</h3>
                  <p className="text-gray-600 mb-4">
                    Our admin team will review your project and assign the most suitable mentor based on your requirements and expertise.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Admin reviews your project details</li>
                      <li>• Best mentor match is identified</li>
                      <li>• Mentor assignment is confirmed</li>
                      <li>• You'll receive notification with mentor details</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="hover:text-gray-400"
            >
              <ArrowLeft className="h-4 w-4 mr-2 hover:text-gray-400" />
              Previous
            </Button>

            <div className="flex gap-3 items-center">
              <Button variant="outline" onClick={onClose} className="hover:text-gray-400">
                Cancel
              </Button>
              {currentStep === 3 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateStep()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Project
                    </>
                  )}
                </Button>
              ) : (
                <>
                  {!validateStep() && currentStep === 2 && registrationType === 'group' && (
                    <p className="text-xs text-red-500 mr-3">
                      {groupName.trim() === '' ? 'Group name is required' : 'Complete required fields'}
                    </p>
                  )}
                  <Button
                    onClick={handleNext}
                    disabled={!validateStep()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
