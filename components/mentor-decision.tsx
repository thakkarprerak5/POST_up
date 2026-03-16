"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  User,
  Calendar,
  MessageSquare,
  Download,
  Eye
} from "lucide-react";
import { RejectionModal } from "./rejection-modal";

interface MentorInvitation {
  id: string;
  projectTitle: string;
  projectDescription: string;
  proposalUrl: string;
  studentName: string;
  studentEmail: string;
  optionalMessage?: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface MentorDecisionProps {
  user?: any;
}

export function MentorDecision({ user }: MentorDecisionProps) {
  const [invitations, setInvitations] = useState<MentorInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<MentorInvitation | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectedInvitation, setRejectedInvitation] = useState<MentorInvitation | null>(null);

  useEffect(() => {
    if (user?.type === 'mentor') {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/mentor/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (invitationId: string, decision: 'accept' | 'reject') => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/mentor/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision }),
      });

      if (response.ok) {
        // Update local state
        setInvitations(invitations.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: decision === 'accept' ? 'accepted' : 'rejected' }
            : inv
        ));

        // If rejected, show rejection modal
        if (decision === 'reject') {
          const rejectedInv = invitations.find(inv => inv.id === invitationId);
          if (rejectedInv) {
            setRejectedInvitation(rejectedInv);
            setShowRejectionModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    }
  };

  const viewProposal = (invitation: MentorInvitation) => {
    setSelectedInvitation(invitation);
    setShowProposalModal(true);
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const respondedInvitations = invitations.filter(inv => inv.status !== 'pending');

  if (user?.type !== 'mentor') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Pending Invitations ({pendingInvitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading invitations...</p>
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <Card key={invitation.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{invitation.projectTitle}</h4>
                          <Badge variant="secondary" className="text-xs">
                            Pending
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {invitation.projectDescription}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{invitation.studentName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(invitation.sentAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {invitation.optionalMessage && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded mb-3">
                            <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>Message from student:</span>
                            </div>
                            <p className="text-sm text-blue-800">{invitation.optionalMessage}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewProposal(invitation)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Proposal
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleDecision(invitation.id, 'accept')}
                            className="bg-green-600 hover:bg-green-700 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDecision(invitation.id, 'reject')}
                            className="text-xs"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responded Invitations */}
      {respondedInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Previous Responses ({respondedInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {respondedInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{invitation.projectTitle}</h5>
                    <p className="text-xs text-muted-foreground">
                      {invitation.studentName} • {new Date(invitation.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={invitation.status === 'accepted' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {invitation.status === 'accepted' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accepted
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected
                        </>
                      )}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewProposal(invitation)}
                      className="text-xs"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Modal */}
      {showProposalModal && selectedInvitation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">Project Proposal</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedInvitation.projectTitle}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowProposalModal(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Student Info */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedInvitation.studentName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedInvitation.studentEmail}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sent:</span>
                    <p className="font-medium">{new Date(selectedInvitation.sentAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge 
                      variant={selectedInvitation.status === 'accepted' ? 'default' : 
                              selectedInvitation.status === 'rejected' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {selectedInvitation.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Project Description */}
              <div>
                <h4 className="font-medium mb-2">Project Description</h4>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                  {selectedInvitation.projectDescription}
                </p>
              </div>

              {/* Optional Message */}
              {selectedInvitation.optionalMessage && (
                <div>
                  <h4 className="font-medium mb-2">Message from Student</h4>
                  <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
                    {selectedInvitation.optionalMessage}
                  </p>
                </div>
              )}

              {/* Proposal PDF */}
              <div>
                <h4 className="font-medium mb-2">Project Proposal</h4>
                <div className="flex items-center gap-3 p-4 border border-dashed rounded-lg">
                  <FileText className="h-8 w-8 text-red-500" />
                  <div className="flex-1">
                    <p className="font-medium">Project Proposal PDF</p>
                    <p className="text-sm text-muted-foreground">Click to view or download</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedInvitation.proposalUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View PDF
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedInvitation.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowProposalModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDecision(selectedInvitation.id, 'reject');
                      setShowProposalModal(false);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Invitation
                  </Button>
                  <Button
                    onClick={() => {
                      handleDecision(selectedInvitation.id, 'accept');
                      setShowProposalModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Invitation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && rejectedInvitation && (
        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => {
            setShowRejectionModal(false);
            setRejectedInvitation(null);
          }}
          mentorName={user?.name || 'Mentor'}
          projectName={rejectedInvitation.projectTitle}
          onSendNewInvitation={() => {
            setShowRejectionModal(false);
            setRejectedInvitation(null);
            // TODO: Navigate to mentor selection or project registration
          }}
          onDirectRegistration={() => {
            setShowRejectionModal(false);
            setRejectedInvitation(null);
            // TODO: Navigate to project registration with admin assignment
          }}
        />
      )}
    </div>
  );
}
