"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X, 
  AlertCircle,
  Send,
  Users
} from "lucide-react";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorName: string;
  projectName: string;
  onSendNewInvitation: () => void;
  onDirectRegistration: () => void;
}

export function RejectionModal({ 
  isOpen, 
  onClose, 
  mentorName, 
  projectName,
  onSendNewInvitation,
  onDirectRegistration
}: RejectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      {/* Modal content */}
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">Invitation Rejected</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Your mentor invitation was not accepted
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Rejection Details */}
          <div className="text-center space-y-2">
            <p className="text-sm">
              <span className="font-medium">{mentorName}</span> has declined your invitation for the project:
            </p>
            <p className="text-base font-semibold text-red-600">
              "{projectName}"
            </p>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h4 className="font-medium text-center">What would you like to do next?</h4>
            
            <div className="space-y-3">
              <Button
                onClick={onSendNewInvitation}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                <Send className="h-4 w-4 mr-2" />
                Send New Invitation
              </Button>
              
              <Button
                variant="outline"
                onClick={onDirectRegistration}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Register Without Mentor
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              You can also contact the Super Admin for mentor assignment assistance
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
