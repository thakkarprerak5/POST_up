"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Users, 
  User, 
  Plus,
  ArrowRight
} from "lucide-react";
import { MentorSelection } from "@/components/student/MentorSelection";

interface ProjectRegistrationProps {
  user?: any;
  onOpenRegistration: () => void;
}

export function ProjectRegistration({ user, onOpenRegistration }: ProjectRegistrationProps) {
  // Check if user can register (student or group lead)
  const canRegister = user?.type === 'student' || user?.profile?.isGroupLead;
  const [showMentorSelection, setShowMentorSelection] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const handleMentorSelected = (mentorId: string) => {
    // Store selected mentor for later use
    console.log('Selected mentor:', mentorId);
  };

  const handleInvitationSent = (invitationData: any) => {
    console.log('Invitation sent:', invitationData);
    // Handle success - maybe show a success message
  };

  if (!canRegister) {
    return null;
  }

  return (
    <>
      <Card className="overflow-hidden bg-gray-900 border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg border border-white">
                <FileText className="h-4 w-4 text-white" />
              </div>
              Project Registration
            </h3>
            <Badge 
              variant="secondary" 
              className="text-xs bg-blue-600 text-white border border-white"
            >
              {user?.profile?.isGroupLead ? 'Group Lead' : 'Student'}
            </Badge>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              Register your project and get mentor guidance for successful completion
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="flex items-center gap-2 p-2.5 bg-gray-800 border border-white rounded-lg group cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setShowMentorSelection(false)}
              >
                <User className="h-4 w-4 text-blue-400 group-hover:text-white" />
                <span className="text-sm font-medium text-white group-hover:text-blue-400">Admin Assigned</span>
              </div>
              <div 
                className="flex items-center gap-2 p-2.5 bg-gray-800 border border-white rounded-lg group cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setShowMentorSelection(true)}
              >
                <Users className="h-4 w-4 text-green-400 group-hover:text-white" />
                <span className="text-sm font-medium text-white group-hover:text-green-400">Choose Mentor</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span className="group-hover:text-white">Choose registration type</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span className="group-hover:text-white">Upload project proposal</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span className="group-hover:text-white">Get assigned mentor or invite specific mentor</span>
              </div>
            </div>
            
            <Button 
              onClick={onOpenRegistration}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 border border-white"
            >
              Start Registration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mentor Selection Modal */}
      {showMentorSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-black">Choose Your Mentor</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowMentorSelection(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
              
              <MentorSelection
                projectId={selectedProjectId}
                onMentorSelected={handleMentorSelected}
                onInvitationSent={handleInvitationSent}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
