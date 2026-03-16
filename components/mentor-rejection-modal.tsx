"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Mail, UserPlus, AlertCircle } from "lucide-react";

interface MentorRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteNewMentor: () => void;
  onDirectRegistration: () => void;
  mentorName?: string;
  projectTitle?: string;
}

export function MentorRejectionModal({
  isOpen,
  onClose,
  onInviteNewMentor,
  onDirectRegistration,
  mentorName = "Mentor",
  projectTitle = "Your Project"
}: MentorRejectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <Card className="bg-white shadow-xl border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Mentor Invitation Response
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Rejection Message */}
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Invitation Declined
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {mentorName} has declined the invitation for "{projectTitle}".
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">
                What would you like to do next?
              </p>

              {/* Option 1: Invite New Mentor */}
              <Button
                onClick={onInviteNewMentor}
                className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 text-white"
                variant="default"
              >
                <Mail className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Invite Another Mentor</div>
                  <div className="text-xs opacity-90">Send invitation to a different mentor</div>
                </div>
              </Button>

              {/* Option 2: Direct Registration */}
              <Button
                onClick={onDirectRegistration}
                className="w-full justify-start gap-3 bg-green-600 hover:bg-green-700 text-white"
                variant="default"
              >
                <UserPlus className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Register Without Mentor</div>
                  <div className="text-xs opacity-90">Admin will assign mentor later</div>
                </div>
              </Button>
            </div>

            {/* Help Text */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> Your proposal PDF has been removed for privacy.
                You'll need to upload it again when registering.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
