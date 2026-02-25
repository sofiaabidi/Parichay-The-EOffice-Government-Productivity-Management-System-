import { useState, useEffect } from "react";
import { AlertCircle, Clock, CheckCircle, X } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { managerAPI, taskAPI, userAPI, fileAPI } from "../../../services/api";

interface Approval {
  id: number;
  title: string;
  assigned_to: number;
  due_date: string;
  status: string;
  draft_number?: number;
  documents?: Array<{
    id: number;
    originalName: string;
    storagePath: string;
    uploadedAt: string;
  }>;
}

export function PendingApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Approval | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState({
    rating: 0,
    comment: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [approvalsRes, membersRes] = await Promise.all([
        managerAPI.getPendingApprovals(),
        userAPI.getManagerTeam(),
      ]);
      
      // Handle response - backend returns arrays directly or wrapped in data
      const approvalsData = Array.isArray(approvalsRes.data) ? approvalsRes.data : (Array.isArray(approvalsRes) ? approvalsRes : []);
      const members = membersRes.data?.members || (Array.isArray(membersRes.data) ? membersRes.data : []);
      
      setApprovals(approvalsData);
      setTeamMembers(members);
      
      console.log('PendingApprovals loaded:', { approvalsCount: approvalsData.length, memberCount: members.length });
    } catch (error: any) {
      console.error('Failed to load pending approvals:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (userId: number) => {
    const member = teamMembers.find(m => m.id === userId);
    return member?.name || `User ${userId}`;
  };

  const getStatusInfo = (approval: Approval) => {
    const dueDate = new Date(approval.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return { status: "overdue", daysRemaining };
    } else if (daysRemaining <= 2) {
      return { status: "near-deadline", daysRemaining };
    }
    return { status: "pending", daysRemaining };
  };

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === "overdue") {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }
    if (status === "near-deadline") {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Clock className="w-3 h-3 mr-1" />
          {daysRemaining} days left
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
        <Clock className="w-3 h-3 mr-1" />
        {daysRemaining} days left
      </Badge>
    );
  };

  const getRowColor = (status: string) => {
    if (status === "overdue") return "bg-red-50 border-red-200";
    if (status === "near-deadline") return "bg-yellow-50 border-yellow-200";
    return "bg-white border-gray-200";
  };

  const handleApprove = async (taskId: number, taskName: string) => {
    try {
      await taskAPI.updateTaskStatus(taskId, 'completed');
      toast.success(`"${taskName}" has been approved`);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve task");
    }
  };

  const handleRejectClick = (approval: Approval) => {
    setSelectedTask(approval);
    setRejectionFeedback({ rating: 0, comment: "" });
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedTask) return;
    
    if (!rejectionFeedback.rating) {
      toast.error("Please provide a rating");
      return;
    }

    try {
      await taskAPI.updateTaskStatus(selectedTask.id, 'rejected', undefined, {
        rating: rejectionFeedback.rating,
        comment: rejectionFeedback.comment || undefined,
      });
      toast.success(`"${selectedTask.title}" has been rejected and reassigned with feedback`);
      setRejectDialogOpen(false);
      setSelectedTask(null);
      setRejectionFeedback({ rating: 0, comment: "" });
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject task");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getDocumentUrl = async (documentId: number) => {
    try {
      const response = await fileAPI.downloadDocument(documentId);
      
      // Check response status
      if (response.status !== 200) {
        toast.error("Failed to open PDF");
        return;
      }
      
      // Check if response data is a blob
      let blob: Blob;
      if (response.data instanceof Blob) {
        // Check if it's an error JSON wrapped in blob
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          const text = await response.data.text();
          const errorJson = JSON.parse(text);
          toast.error(errorJson.message || "Failed to open PDF");
          return;
        }
        blob = response.data;
      } else {
        blob = new Blob([response.data], { type: 'application/pdf' });
      }
      
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(blobUrl, '_blank');
      if (!newWindow) {
        toast.error("Please allow popups to view PDF");
        window.URL.revokeObjectURL(blobUrl);
        return;
      }
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error: any) {
      console.error('PDF download error:', error);
      
      // Handle blob error responses
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          toast.error(errorJson.message || "Failed to open PDF");
        } catch {
          toast.error("Failed to open PDF. Please check your connection.");
        }
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to open PDF. Please check your connection.");
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">Loading approvals...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-orange-600" />
        <h2>Pending Approvals</h2>
        <Badge className="ml-auto">{approvals.length} pending</Badge>
      </div>
      {approvals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No pending approvals</div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => {
            const statusInfo = getStatusInfo(approval);
            return (
              <div
                key={approval.id}
                className={`p-4 rounded-lg border ${getRowColor(statusInfo.status)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4>{approval.title}</h4>
                      {approval.draft_number && approval.draft_number > 1 && (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                          Draft {approval.draft_number}
                        </Badge>
                      )}
                      {getStatusBadge(statusInfo.status, statusInfo.daysRemaining)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Assigned to: {getMemberName(approval.assigned_to)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Deadline: {formatDate(approval.due_date)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(approval.id, approval.title)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleRejectClick(approval)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
                {approval.documents && approval.documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {approval.documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => getDocumentUrl(doc.id)}
                        className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                      >
                        {doc.originalName || 'Attachment'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Feedback Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Task with Feedback</DialogTitle>
            <DialogDescription>
              Provide feedback for {selectedTask?.title}. The task will be reassigned with an increased draft number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRejectionFeedback({ ...rejectionFeedback, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rejectionFeedback.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  </button>
                ))}
                {rejectionFeedback.rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rejectionFeedback.rating} / 5
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection-comment">Feedback Comment *</Label>
              <Textarea
                id="rejection-comment"
                placeholder="Explain what needs to be improved..."
                rows={4}
                value={rejectionFeedback.comment}
                onChange={(e) =>
                  setRejectionFeedback({ ...rejectionFeedback, comment: e.target.value })
                }
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setSelectedTask(null);
                  setRejectionFeedback({ rating: 0, comment: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={!rejectionFeedback.rating || !rejectionFeedback.comment.trim()}
              >
                Reject & Reassign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
