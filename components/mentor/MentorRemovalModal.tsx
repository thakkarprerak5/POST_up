'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Flag, X } from 'lucide-react';

interface MentorRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: 'project_completed' | 'report_issue' | 'other', details?: string) => void;
  studentName?: string;
  groupName?: string;
  assignmentType: 'student' | 'group';
  isLoading?: boolean;
}

const removalOptions = [
  {
    value: 'project_completed' as const,
    title: 'Project Completed',
    description: 'Mentorship ends normally - No reassignment needed',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    value: 'report_issue' as const,
    title: 'Report Issue',
    description: 'Create a report entry - Mentorship suspended pending investigation',
    icon: Flag,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  {
    value: 'other' as const,
    title: 'Other',
    description: 'Mentorship terminated - Student eligible for reassignment',
    icon: X,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
];

export function MentorRemovalModal({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  groupName,
  assignmentType,
  isLoading = false
}: MentorRemovalModalProps) {
  const [selectedReason, setSelectedReason] = useState<'project_completed' | 'report_issue' | 'other'>('project_completed');
  const [otherDetails, setOtherDetails] = useState('');

  const targetName = assignmentType === 'student' ? studentName : groupName;
  const selectedOption = removalOptions.find(option => option.value === selectedReason);

  const handleConfirm = () => {
    if (selectedReason === 'other' && !otherDetails.trim()) {
      return; // Require details for "Other" option
    }
    onConfirm(selectedReason, selectedReason === 'other' ? otherDetails.trim() : undefined);
  };

  const isConfirmDisabled = isLoading || (selectedReason === 'other' && !otherDetails.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Remove {assignmentType === 'student' ? 'Student' : 'Group'} from Mentorship
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Select a reason for removing <span className="font-semibold text-gray-900">{targetName}</span> from your mentorship
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Target Information */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {assignmentType === 'student' ? 'Student' : 'Group'} Name
                  </p>
                  <p className="text-lg font-semibold text-gray-900">{targetName}</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {assignmentType === 'student' ? 'Individual' : 'Group'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Removal Reason Options */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-900">Removal Reason</Label>
            <RadioGroup value={selectedReason} onValueChange={(value) => setSelectedReason(value as any)}>
              {removalOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="relative">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={option.value}
                      className={`
                        flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer
                        transition-all duration-200 hover:shadow-md
                        ${selectedReason === option.value
                          ? `${option.bgColor} ${option.borderColor} border-opacity-100 shadow-sm`
                          : 'bg-white border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className={`p-2 rounded-lg ${option.bgColor}`}>
                        <Icon className={`h-5 w-5 ${option.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{option.title}</h3>
                          {selectedReason === option.value && (
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Additional Details for "Other" Reason */}
          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="details" className="text-sm font-semibold text-gray-900">
                Additional Details <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="details"
                placeholder="Please provide a detailed explanation for the removal..."
                value={otherDetails}
                onChange={(e) => setOtherDetails(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {otherDetails.length}/500 characters
              </p>
            </div>
          )}

          {/* Warning for Report Issue */}
          {selectedReason === 'report_issue' && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">Report System Integration</p>
                <p className="text-sm text-amber-700 mt-1">
                  This will create a formal report entry and suspend the mentorship pending investigation. 
                  You will need to provide specific details about the issue in the report form.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`
              px-6
              ${selectedReason === 'project_completed' 
                ? 'bg-green-600 hover:bg-green-700' 
                : selectedReason === 'report_issue'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-red-600 hover:bg-red-700'
              }
            `}
          >
            {isLoading ? 'Processing...' : `Remove ${assignmentType === 'student' ? 'Student' : 'Group'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
