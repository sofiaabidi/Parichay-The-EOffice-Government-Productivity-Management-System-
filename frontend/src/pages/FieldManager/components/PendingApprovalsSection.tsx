import { useState, useEffect } from 'react';
import { AlertCircle, Check, X, Clock, FileText, MessageSquare, Image as ImageIcon, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { fieldManagerAPI, fieldEmployeeAPI } from '../../../services/api';

interface SurveySubmission {
  id: number;
  survey_id: number;
  survey_name: string;
  submitted_by_name: string;
  submitted_by_email: string;
  area_covered: string;
  time_taken: string;
  notes: string;
  submitted_at: string;
  deadline: string;
  files: Array<{
    id: number;
    original_name: string;
    mime_type: string;
    file_type: string;
    file_size: number;
  }>;
}

export function PendingApprovalsSection() {
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SurveySubmission | null>(null);
  const [remarks, setRemarks] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [viewingFile, setViewingFile] = useState<{ id: number; name: string; type: string } | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fieldManagerAPI.getSurveySubmissions();
      const submissionsData = response.data || [];
      
      // Calculate days left for each submission
      const formattedSubmissions = submissionsData.map((sub: any) => {
        const deadline = sub.deadline ? new Date(sub.deadline) : null;
        const today = new Date();
        const daysLeft = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        return {
          ...sub,
          daysLeft: daysLeft !== null ? daysLeft : null,
          deadline: deadline ? deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null,
          submitted_at: new Date(sub.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        };
      });
      
      setSubmissions(formattedSubmissions);
    } catch (error: any) {
      console.error("Failed to fetch survey submissions:", error);
      toast.error("Failed to load survey submissions");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (submission: SurveySubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setRemarks('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission || !reviewAction) return;

    try {
      const reviewData = {
        status: reviewAction === 'approve' ? 'approved' : 'rejected',
        remarks: remarks.trim() || null,
      };

      await fieldManagerAPI.reviewSurveySubmission(selectedSubmission.id, reviewData);
      toast.success(`Survey ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
      setReviewAction(null);
      setRemarks('');
      fetchSubmissions(); // Refresh list
    } catch (error: any) {
      console.error("Failed to review survey:", error);
      toast.error(error.response?.data?.message || 'Failed to review survey');
    }
  };

  const handleViewFile = async (file: { id: number; original_name: string; mime_type: string }) => {
    try {
      const response = await fieldEmployeeAPI.getSurveyFile(file.id);
      const blob = new Blob([response.data], { type: file.mime_type });
      const url = window.URL.createObjectURL(blob);
      
      if (file.mime_type.startsWith('image/')) {
        // Open image in new tab
        window.open(url, '_blank');
      } else {
        // Download PDF/document
        const link = document.createElement('a');
        link.href = url;
        link.download = file.original_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      window.URL.revokeObjectURL(url);
      setViewingFile({ id: file.id, name: file.original_name, type: file.mime_type });
    } catch (error: any) {
      console.error("Failed to view file:", error);
      toast.error('Failed to open file');
    }
  };

  const pendingCount = submissions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <h2 className="text-gray-900">Pending Approvals for Surveys</h2>
        </div>
        {pendingCount > 0 && (
          <div className="bg-gray-800 px-4 py-2 rounded-xl">
            <p className="text-sm text-white">{pendingCount} pending</p>
          </div>
        )}
      </div>

      {/* Approval Cards */}
      {loading ? (
        <Card className="p-6 shadow-lg border-0 rounded-2xl">
          <div className="text-center py-12 text-gray-400">
            <p>Loading survey submissions...</p>
          </div>
        </Card>
      ) : submissions.length === 0 ? (
        <Card className="p-6 shadow-lg border-0 rounded-2xl">
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No pending survey approvals</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card
              key={submission.id}
              className="p-6 shadow-lg border-0 rounded-2xl bg-yellow-50"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left side - Submission details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3 flex-wrap">
                    <h3 className="text-gray-900 font-medium text-lg">
                      {submission.survey_name}
                    </h3>
                    {submission.daysLeft !== null && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                        submission.daysLeft < 0 ? 'bg-red-100 text-red-800' :
                        submission.daysLeft < 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {submission.daysLeft < 0 ? `${Math.abs(submission.daysLeft)} days overdue` :
                         submission.daysLeft === 0 ? 'Due today' :
                         `${submission.daysLeft} days left`}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Submitted by:</strong> {submission.submitted_by_name} ({submission.submitted_by_email})</p>
                    <p><strong>Area Covered:</strong> {submission.area_covered}</p>
                    <p><strong>Time Taken:</strong> {submission.time_taken}</p>
                    <p><strong>Submitted:</strong> {submission.submitted_at}</p>
                    {submission.deadline && <p><strong>Deadline:</strong> {submission.deadline}</p>}
                    {submission.notes && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-xs text-gray-500 mb-1">Notes:</p>
                        <p className="text-sm">{submission.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Files */}
                  {submission.files && submission.files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                      <div className="flex flex-wrap gap-2">
                        {submission.files.map((file) => (
                          <Button
                            key={file.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewFile(file)}
                            className="flex items-center gap-2"
                          >
                            {file.file_type === 'image' ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span className="max-w-[150px] truncate">{file.original_name}</span>
                            <Eye className="w-4 h-4" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side - Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                  <Button
                    onClick={() => handleReview(submission, 'approve')}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview(submission, 'reject')}
                    variant="destructive"
                    className="rounded-xl flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Survey' : 'Reject Survey'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && `Review submission for: ${selectedSubmission.survey_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="remarks">Remarks / Feedback</Label>
              <Textarea
                id="remarks"
                placeholder="Enter your feedback/remarks here..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-32"
              />
              {reviewAction === 'approve' && (
                <p className="text-xs text-gray-500 mt-2">
                  Survey score will be calculated automatically based on coverage, speed, and supervisor ratings.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false);
                setSelectedSubmission(null);
                setReviewAction(null);
                setRemarks('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

