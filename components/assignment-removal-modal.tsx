"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  X,
  AlertTriangle,
  User,
  Users,
  Calendar,
  Mail
} from "lucide-react";

interface AssignmentRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  assignment: {
    id: string;
    type: 'invitation' | 'admin-assignment';
    mentor: {
      id: string;
      name: string;
      email: string;
      photo?: string;
    };
    student?: {
      id: string;
      name: string;
      email: string;
      photo?: string;
    };
    group?: {
      id: string;
      name: string;
      description?: string;
    };
    projectTitle: string;
    createdAt: string;
  };
  currentUserRole: 'super-admin' | 'admin' | 'mentor';
  isSubmitting?: boolean;
}

export function AssignmentRemovalModal({
  isOpen,
  onClose,
  onConfirm,
  assignment,
  currentUserRole,
  isSubmitting = false
}: AssignmentRemovalModalProps) {
  const [removalReason, setRemovalReason] = useState('');
  const [error, setError] = useState('');

  const isAdmin = currentUserRole === 'super-admin' || currentUserRole === 'admin';
  const requiresReason = isAdmin;

  const handleConfirm = async () => {
    if (requiresReason && !removalReason.trim()) {
      setError('Removal reason is required for admin users');
      return;
    }

    try {
      await onConfirm(removalReason.trim());
      setRemovalReason('');
      setError('');
    } catch (err) {
      setError('Failed to remove assignment. Please try again.');
    }
  };

  const handleClose = () => {
    setRemovalReason('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Remove Mentor Assignment
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This action will remove the mentor assignment. The assignment will be marked as removed but not deleted.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Assignment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assignment Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mentor Info */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Mentor</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={assignment.mentor.photo && assignment.mentor.photo.trim() ? assignment.mentor.photo : undefined} alt={assignment.mentor.name} />
                    <AvatarFallback>
                      {assignment.mentor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{assignment.mentor.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {assignment.mentor.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student/Group Info */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {assignment.group ? 'Group' : 'Student'}
                </h4>
                {assignment.group ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{assignment.group.name}</p>
                    </div>
                    {assignment.group.description && (
                      <p className="text-sm text-muted-foreground">{assignment.group.description}</p>
                    )}
                  </div>
                ) : assignment.student ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={assignment.student.photo && assignment.student.photo.trim() ? assignment.student.photo : undefined} alt={assignment.student.name} />
                      <AvatarFallback>
                        {assignment.student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{assignment.student.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {assignment.student.email}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Project Info */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Project</h4>
              <p className="font-medium">{assignment.projectTitle}</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(assignment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Assignment Type */}
            <div className="flex items-center gap-2">
              <Badge variant={assignment.type === 'invitation' ? 'default' : 'secondary'}>
                {assignment.type === 'invitation' ? 'Invitation-based' : 'Admin-assigned'}
              </Badge>
              <Badge variant="outline">
                {currentUserRole === 'super-admin' && 'Super Admin'}
                {currentUserRole === 'admin' && 'Admin'}
                {currentUserRole === 'mentor' && 'Mentor'}
              </Badge>
            </div>
          </div>

          {/* Removal Reason */}
          {requiresReason && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Removal Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Please provide a reason for removing this assignment..."
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                className="min-h-[100px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                This reason will be logged for audit purposes and visible to other administrators.
              </p>
            </div>
          )}

          {/* Warning Message */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900">
                  Removal Consequences
                </p>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Mentor will be immediately removed from student/group profile</li>
                  <li>• Assignment will be marked as "removed" (not deleted)</li>
                  <li>• Student/group may request a new mentor assignment</li>
                  <li>• This action will be logged for audit purposes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isSubmitting || (requiresReason && !removalReason.trim())}
            >
              {isSubmitting ? 'Removing...' : 'Remove Assignment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
