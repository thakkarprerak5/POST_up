// components/student/AdminAssignmentRequest.tsx - Student requests admin assignment
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  _id: string;
  title: string;
  description: string;
  proposalFile?: string;
  registrationType: 'individual' | 'group';
  authorId: string;
  groupId?: string;
}

interface AdminAssignmentRequest {
  _id: string;
  projectId: string;
  projectTitle: string;
  status: 'pending' | 'assigned' | 'cancelled';
  createdAt: string;
}

interface AdminAssignmentRequestProps {
  project: Project;
  existingRequest?: AdminAssignmentRequest;
  onRequestCreated?: () => void;
}

export default function AdminAssignmentRequestComponent({ 
  project, 
  existingRequest,
  onRequestCreated 
}: AdminAssignmentRequestProps) {
  const [loading, setLoading] = useState(false);

  const handleRequestAdminAssignment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student/admin-assignment-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project._id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Admin assignment request created successfully');
        onRequestCreated?.();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to create request: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating admin assignment request:', error);
      toast.error('Failed to create admin assignment request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (existingRequest) {
      switch (existingRequest.status) {
        case 'pending':
          return (
            <Badge variant="outline" className="border border-yellow-400 text-yellow-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pending Admin Assignment
            </Badge>
          );
        case 'assigned':
          return (
            <Badge variant="outline" className="border border-green-400 text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Mentor Assigned by Admin
            </Badge>
          );
        case 'cancelled':
          return (
            <Badge variant="outline" className="border border-red-400 text-red-600">
              Request Cancelled
            </Badge>
          );
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Admin Assignment Request
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{project.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-3">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Type: {project.registrationType}</span>
            <span>•</span>
            <span>Assignment: Admin Assignment</span>
          </div>

          {!existingRequest && (
            <div className="pt-2 border-t border-gray-100">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Request Admin Assignment</p>
                    <p className="text-xs">
                      Instead of inviting a mentor directly, you can request the Super Admin to assign a mentor for your project.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleRequestAdminAssignment}
                disabled={loading}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? 'Creating Request...' : 'Request Admin Assignment'}
              </Button>
            </div>
          )}

          {existingRequest && existingRequest.status === 'pending' && (
            <div className="pt-2 border-t border-gray-100">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Request Pending</p>
                    <p className="text-xs">
                      Your admin assignment request is pending review. The Super Admin will assign a mentor to your project.
                    </p>
                    <p className="text-xs mt-1">
                      Requested on: {new Date(existingRequest.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {existingRequest && existingRequest.status === 'assigned' && (
            <div className="pt-2 border-t border-gray-100">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Mentor Assigned</p>
                    <p className="text-xs">
                      Your project has been assigned a mentor by the Super Admin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
