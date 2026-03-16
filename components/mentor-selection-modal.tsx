"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  X, 
  Search,
  User,
  Mail,
  Star,
  Loader2
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface Mentor {
  id: string;
  name: string;
  email: string;
  photo: string;
  avatar?: string;
  department?: string;
  position?: string;
  expertise?: string[];
}

interface MentorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMentorSelected: (mentor: Mentor, groupId?: string) => void;
  showGroupSelection?: boolean;
  registrationType?: 'individual' | 'group';
  onPrevious?: () => void;
  showNavigation?: boolean;
}

export function MentorSelectionModal({ 
  isOpen, 
  onClose, 
  onMentorSelected,
  showGroupSelection,
  registrationType,
  onPrevious,
  showNavigation = false,
}: MentorSelectionModalProps) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // Fetch mentors and groups when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMentors();
      if (showGroupSelection && registrationType === 'group') {
        fetchGroups();
      }
    }
  }, [isOpen, showGroupSelection, registrationType]);

  // Filter mentors based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMentors(mentors);
    } else {
      const filtered = mentors.filter(mentor =>
        (mentor.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.department || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMentors(filtered);
    }
  }, [searchTerm, mentors]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mentors');
      
      if (!response.ok) {
        // Check if response is HTML (redirect to login)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Authentication required - please login first');
        }
        throw new Error('Failed to fetch mentors');
      }
      
      try {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setMentors(data);
          setFilteredMentors(data);
        } else if (data.success && data.mentors) {
          setMentors(data.mentors);
          setFilteredMentors(data.mentors);
        }
      } catch (parseError) {
        console.error('Error parsing mentors response:', parseError);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      // Set empty arrays to prevent UI crashes
      setMentors([]);
      setFilteredMentors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      
      if (!response.ok) {
        console.error('Failed to fetch groups:', response.status, response.statusText);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Groups API did not return JSON:', contentType);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleMentorSelect = (mentor: Mentor) => {
    setSelectedMentor(mentor);
  };

  const handleConfirmSelection = () => {
    if (selectedMentor) {
      const groupId = showGroupSelection && registrationType === 'group' && selectedGroupId && selectedGroupId !== 'new-group' ? selectedGroupId : undefined;
      onMentorSelected(selectedMentor, groupId);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedMentor(null);
    setSelectedGroupId("");
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[100vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Select a Mentor</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search mentors by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Group Selection (only show for existing group registrations) */}
          {showGroupSelection && registrationType === 'group' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Select Group for Mentor Assignment (Optional)</label>
              <p className="text-xs text-muted-foreground">
                Leave empty if you're creating a new group. Only select if assigning mentor to an existing group.
              </p>
              <Select
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="new-group" value="new-group">
                    <span className="text-muted-foreground">Creating new group</span>
                  </SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={`group-${group.id}`} value={group.id}>
                      <div>
                        <div className="font-medium">{group.name}</div>
                        {group.description && (
                          <div className="text-sm text-muted-foreground">{group.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mentors List */}
          <div className="overflow-y-auto max-h-80 space-y-3 pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading mentors...</span>
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-8 text-white">
                {searchTerm
                  ? "No mentors found matching your search."
                  : "No mentors available."}
              </div>
            ) : (
              filteredMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className={`group p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedMentor?.id === mentor.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleMentorSelect(mentor)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-12 w-12 border-2 border-white">
                      <AvatarImage src={(mentor.avatar || mentor.photo) && (mentor.avatar || mentor.photo).trim() ? (mentor.avatar || mentor.photo) : undefined} alt={mentor.name} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-medium truncate transition-colors ${
                    selectedMentor?.id === mentor.id
                      ? "text-black"
                      : "text-white group-hover:text-black"
                  }`}>
                          {mentor.name}
                        </h3>

                        {selectedMentor?.id === mentor.id && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-500 mt-1 group-hover:text-black">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate">{mentor.email}</span>
                      </div>

                      {mentor.department && (
                        <div className="text-sm text-gray-600 mt-1 group-hover:text-black">
                          {mentor.department}
                        </div>
                      )}

                      {mentor.expertise && mentor.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {mentor.expertise.slice(0, 3).map((skill, index) => (
                            <Badge key={`skill-${mentor.id}-${index}`} variant="secondary" className="text-xs border border-white">
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

          {/* Action Buttons */}
          <div className="flex justify-between space-x-3 pt-4 border-t">
            {showNavigation ? (
              <>
                <Button
                  variant="outline"
                  onClick={onPrevious}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Previous
                </Button>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmSelection}
                    disabled={!selectedMentor}
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={!selectedMentor}
                  className="min-w-[100px]"
                >
                  Select Mentor
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}