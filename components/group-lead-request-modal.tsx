"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Send,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface GroupLeadRequest {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

interface GroupLeadRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onRequestSubmitted?: () => void;
}

export function GroupLeadRequestModal({ 
  isOpen, 
  onClose, 
  user,
  onRequestSubmitted 
}: GroupLeadRequestModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequests, setExistingRequests] = useState<GroupLeadRequest[]>([]);

  const hasPendingRequest = existingRequests.some(req => req.status === 'pending');
  const hasApprovedRequest = user?.profile?.isGroupLead;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/group-lead/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          reason: reason.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onRequestSubmitted?.();
          handleClose();
        }
      }
    } catch (error) {
      console.error('Error submitting group lead request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Request Group Lead Status</CardTitle>
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
          {/* Current Status */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Current Status</h4>
            <div className="flex items-center gap-2">
              {hasApprovedRequest ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">You are a Group Lead</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </>
              ) : hasPendingRequest ? (
                <>
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-700">Request Pending</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Pending Approval
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">Not a Group Lead</span>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    No Status
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Existing Requests */}
          {existingRequests.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Your Requests</h4>
              {existingRequests.map((request) => (
                <div key={request.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm mb-1">{request.reason}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Reason:</strong> {request.rejectionReason}
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={
                        request.status === 'approved' ? 'default' :
                        request.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                      className="flex items-center gap-1"
                    >
                      {request.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                      {request.status === 'rejected' && <XCircle className="h-3 w-3" />}
                      {request.status === 'pending' && <Clock className="h-3 w-3" />}
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Request Form */}
          {!hasApprovedRequest && !hasPendingRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Why do you want to be a Group Lead?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Please explain why you should be granted group lead status. 
                  This will be reviewed by administrators.
                </p>
                <Textarea
                  placeholder="I want to be a group lead because..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!reason.trim() || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Info for approved users */}
          {hasApprovedRequest && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">✅ Group Lead Privileges</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Register group projects</li>
                <li>• Manage team members</li>
                <li>• Submit project proposals</li>
                <li>• Coordinate with mentors</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
