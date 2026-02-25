import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, Upload, FileText, X, Map } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import SurveySubmitModal from './SurveySubmitModal';
import { fieldEmployeeAPI } from '../../../services/api';
import { toast } from 'sonner';

interface SurveysSectionProps {
  onKpiRefresh?: () => void;
}

export default function SurveysSection({ onKpiRefresh }: SurveysSectionProps) {
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSurveyDetails, setSelectedSurveyDetails] = useState<any>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await fieldEmployeeAPI.getMySurveys();
      const surveysData = response.data || [];

      // Transform backend data to frontend format
      const formattedSurveys = surveysData.map((s: any) => {
        // Determine status: if no submission, it's 'pending'
        // If submission exists, use approval_status (which could be 'pending', 'approved', 'rejected')
        let status = 'pending';
        if (s.submission_id) {
          status = s.approval_status === 'pending' ? 'submitted' : s.approval_status;
        }

        // Format estimated time - stored as VARCHAR, could be string like "2 hours" or "3 days"
        // Check both estimatedTime (from alias) and expected_time (original column name)
        const estimatedTimeValue = s.estimatedTime || s.expected_time;
        let formattedEstimatedTime = '';
        if (estimatedTimeValue !== null && estimatedTimeValue !== undefined && estimatedTimeValue !== '' && String(estimatedTimeValue).trim() !== '') {
          formattedEstimatedTime = String(estimatedTimeValue).trim();
        }

        return {
          id: s.id,
          name: s.name,
          status, // 'pending', 'submitted', 'approved', 'rejected'
          area: s.area || '',
          estimatedTime: formattedEstimatedTime,
          deadline: s.deadline ? new Date(s.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null,
          locationId: s.location_id, // Survey location ID
          submissionId: s.submission_id, // Submission ID for fetching files
          surveyScore: s.survey_score !== null && s.survey_score !== undefined ? Number(s.survey_score) : null, // Calculated score - ensure it's a number
          areaCovered: s.area_covered,
          timeTaken: s.time_taken,
          managerRemarks: s.manager_remarks,
          submittedDate: s.submittedDate ? new Date(s.submittedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null,
        };
      });

      setSurveys(formattedSurveys);

      // Debug: Log raw response and first survey to check estimated time
      console.log('Raw surveys response:', response.data);
      if (formattedSurveys.length > 0) {
        console.log('First survey raw data:', surveysData[0]);
        console.log('First survey formatted:', formattedSurveys[0]);
        console.log('Estimated time value:', formattedSurveys[0].estimatedTime);
      }
    } catch (error: any) {
      console.error("Failed to fetch surveys:", error);
      toast.error("Failed to load surveys");
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleSubmitSurvey = (survey: any) => {
    setSelectedSurvey(survey);
    setSubmitModalOpen(true);
  };

  const handleSubmissionSuccess = () => {
    fetchSurveys(); // Refresh surveys after submission
    setSubmitModalOpen(false);
    // Trigger KPI refresh after survey submission
    if (onKpiRefresh) {
      // Small delay to allow backend to process and recalculate
      setTimeout(() => {
        onKpiRefresh();
      }, 1000);
    }
  };

  const handleViewDetails = async (survey: any) => {
    setSelectedSurveyDetails(survey);
    setDetailsModalOpen(true);
    setSubmissionFiles([]);

    // Fetch files if submission exists
    if (survey.submissionId) {
      try {
        setLoadingFiles(true);
        const response = await fieldEmployeeAPI.getSubmissionFiles(survey.submissionId);
        setSubmissionFiles(response.data?.files || []);
      } catch (error: any) {
        console.error("Failed to fetch submission files:", error);
        // Don't show error toast, just log it - files might not exist
      } finally {
        setLoadingFiles(false);
      }
    }
  };

  const handleSeeSurveyLocation = async (survey: any) => {
    if (!survey?.locationId) {
      toast.error('No location ID found for this survey');
      return;
    }

    try {
      setSavingLocation(true);

      // First, get the location details
      const locationResponse = await fieldEmployeeAPI.getLocationById(survey.locationId);

      if (!locationResponse || !locationResponse.data) {
        toast.error('Location not found. The location may not exist in the database.');
        return;
      }

      const location = locationResponse.data;

      if (!location) {
        toast.error('Location not found');
        return;
      }

      // Check if employee already has this location saved
      const myLocationsResponse = await fieldEmployeeAPI.getMyLocations();
      const myLocations = myLocationsResponse.data || [];
      const alreadySaved = myLocations.some((loc: any) => loc.location_id === location.location_id);

      if (alreadySaved) {
        toast.info('Location already saved to your map');
        // Still show it on the map by triggering a custom event
        window.dispatchEvent(new CustomEvent('showLocationOnMap', {
          detail: { lat: Number(location.latitude), lng: Number(location.longitude) }
        }));
      } else {
        try {
          // Save the location to employee's locations
          await fieldEmployeeAPI.saveLocation({
            location_id: location.location_id,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            description: `Survey: ${survey.name}`,
          });

          toast.success('Location saved and shown on map');
        } catch (saveError: any) {
          // If location already exists (e.g., created by manager), just show it
          if (saveError.response?.status === 500 || saveError.response?.status === 409 ||
            saveError.message?.includes('already exists') ||
            saveError.response?.data?.message?.includes('already exists')) {
            toast.info('Location shown on map');
          } else {
            throw saveError;
          }
        }

        // Show it on the map regardless of save status
        window.dispatchEvent(new CustomEvent('showLocationOnMap', {
          detail: { lat: Number(location.latitude), lng: Number(location.longitude) }
        }));
      }
    } catch (error: any) {
      console.error("Failed to save location:", error);
      toast.error(error.response?.data?.message || 'Failed to save location');
    } finally {
      setSavingLocation(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-[#1C1C28] text-xl">My Surveys</h2>
        <div className="text-center py-12 text-gray-400">Loading surveys...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#1C1C28] text-xl">My Surveys</h2>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          {surveys.filter(s => s.status === 'approved').length} Approved
        </Badge>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No surveys assigned to you yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${survey.status === 'approved'
                ? 'border-l-green-500'
                : survey.status === 'submitted'
                  ? 'border-l-blue-500'
                  : 'border-l-orange-500'
                }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-[#1C1C28] mb-2">{survey.name}</h3>
                  <Badge className={getStatusColor(survey.status)} variant="outline">
                    {survey.status}
                  </Badge>
                </div>
              </div>

              {/* Survey Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-gray-400" />
                  <span className="text-[#6B6B6B]">Area: </span>
                  <span className="text-[#1C1C28]">{survey.area}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-gray-400" />
                  <span className="text-[#6B6B6B]">Estimated Time: </span>
                  <span className="text-[#1C1C28]">{survey.estimatedTime || 'Not set'}</span>
                </div>
                {survey.deadline && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-4 text-orange-400" />
                      <span className="text-[#6B6B6B]">Deadline: </span>
                      <span className="text-orange-600">{survey.deadline}</span>
                    </div>
                    {survey.locationId && (
                      <Button
                        onClick={() => handleSeeSurveyLocation(survey)}
                        disabled={savingLocation}
                        className="w-fit bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        size="sm"
                      >
                        <Map className="size-4 mr-2" />
                        {savingLocation ? 'Loading...' : 'See Survey Location'}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Approved Survey Details */}
              {survey.status === 'approved' && (
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="size-5 text-green-600" />
                    <span className="text-green-700">Survey Approved</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {survey.surveyScore !== null && survey.surveyScore !== undefined && (
                      <div>
                        <div className="text-[#6B6B6B]">Survey Score</div>
                        <div className="text-[#1C1C28] text-lg">
                          {typeof survey.surveyScore === 'number'
                            ? survey.surveyScore.toFixed(2)
                            : Number(survey.surveyScore || 0).toFixed(2)}%
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-[#6B6B6B]">Area Covered</div>
                      <div className="text-[#1C1C28] text-lg">{survey.areaCovered}</div>
                    </div>
                    <div>
                      <div className="text-[#6B6B6B]">Time Taken</div>
                      <div className="text-[#1C1C28] text-lg">{survey.timeTaken}</div>
                    </div>
                    <div>
                      <div className="text-[#6B6B6B]">Submitted</div>
                      <div className="text-[#1C1C28] text-lg">{survey.submittedDate}</div>
                    </div>
                  </div>
                  {survey.managerRemarks && (
                    <div className="pt-3 border-t border-green-200">
                      <div className="text-[#6B6B6B] text-sm mb-1">Manager Remarks</div>
                      <div className="text-[#1C1C28] text-sm">{survey.managerRemarks}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Rejected Survey Details */}
              {survey.status === 'rejected' && (
                <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="size-5 text-red-600" />
                    <span className="text-red-700">Survey Rejected</span>
                  </div>
                  {survey.managerRemarks && (
                    <div>
                      <div className="text-[#6B6B6B] text-sm mb-1">Manager Feedback</div>
                      <div className="text-[#1C1C28] text-sm">{survey.managerRemarks}</div>
                    </div>
                  )}
                  {survey.submittedDate && (
                    <div className="text-xs text-[#6B6B6B]">
                      Submitted: {survey.submittedDate}
                    </div>
                  )}
                </div>
              )}

              {/* Submitted Survey Details */}
              {survey.status === 'submitted' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-blue-700 mb-3">Pending Manager Review</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[#6B6B6B]">Area Covered</div>
                      <div className="text-[#1C1C28]">{survey.areaCovered}</div>
                    </div>
                    <div>
                      <div className="text-[#6B6B6B]">Time Taken</div>
                      <div className="text-[#1C1C28]">{survey.timeTaken}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[#6B6B6B]">
                    Submitted: {survey.submittedDate}
                  </div>
                </div>
              )}

              {/* Pending Survey - Action Button */}
              {survey.status === 'pending' && (
                <Button
                  onClick={() => handleSubmitSurvey(survey)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Upload className="size-4 mr-2" />
                  Submit Survey Data
                </Button>
              )}

              {/* View Details Button for Approved/Submitted */}
              {(survey.status === 'approved' || survey.status === 'submitted') && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleViewDetails(survey)}
                >
                  <FileText className="size-4 mr-2" />
                  View Survey Details
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Survey Submit Modal */}
      {submitModalOpen && selectedSurvey && (
        <SurveySubmitModal
          survey={selectedSurvey}
          onClose={() => setSubmitModalOpen(false)}
          onSuccess={handleSubmissionSuccess}
        />
      )}

      {/* View Survey Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Details: {selectedSurveyDetails?.name}</DialogTitle>
          </DialogHeader>
          {selectedSurveyDetails && (
            <div className="space-y-6 py-4">
              {/* Survey Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Area</p>
                  <p className="font-medium">{selectedSurveyDetails.area}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estimated Time</p>
                  <p className="font-medium">{selectedSurveyDetails.estimatedTime || 'Not set'}</p>
                </div>
                {selectedSurveyDetails.deadline && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Deadline</p>
                    <p className="font-medium">{selectedSurveyDetails.deadline}</p>
                  </div>
                )}
                {selectedSurveyDetails.submittedDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Submitted</p>
                    <p className="font-medium">{selectedSurveyDetails.submittedDate}</p>
                  </div>
                )}
              </div>

              {/* Submission Details */}
              {(selectedSurveyDetails.status === 'submitted' || selectedSurveyDetails.status === 'approved') && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Submission Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Area Covered</p>
                      <p className="font-medium">{selectedSurveyDetails.areaCovered}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Time Taken</p>
                      <p className="font-medium">{selectedSurveyDetails.timeTaken}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Approved Details */}
              {selectedSurveyDetails.status === 'approved' && selectedSurveyDetails.surveyScore !== null && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Review Results</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Survey Score</p>
                      <p className="font-medium text-lg text-green-600">
                        {typeof selectedSurveyDetails.surveyScore === 'number'
                          ? selectedSurveyDetails.surveyScore.toFixed(2)
                          : Number(selectedSurveyDetails.surveyScore || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  {selectedSurveyDetails.managerRemarks && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Manager Remarks</p>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedSurveyDetails.managerRemarks}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rejected Details */}
              {selectedSurveyDetails.status === 'rejected' && selectedSurveyDetails.managerRemarks && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 text-red-600">Rejection Feedback</h4>
                  <p className="text-sm bg-red-50 p-3 rounded border border-red-200">
                    {selectedSurveyDetails.managerRemarks}
                  </p>
                </div>
              )}

              {/* Files Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Uploaded Files</h4>
                {loadingFiles ? (
                  <p className="text-sm text-gray-500">Loading files...</p>
                ) : submissionFiles.length > 0 ? (
                  <div className="space-y-2">
                    {submissionFiles.map((file: any) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="size-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.original_name}</p>
                            <p className="text-xs text-gray-500">
                              {file.file_type} • {(file.file_size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fieldEmployeeAPI.getSurveyFile(file.id);
                              const blob = response.data;
                              const url = window.URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            } catch (error: any) {
                              console.error("Failed to open file:", error);
                              toast.error('Failed to open file');
                            }
                          }}
                          className="ml-2 flex-shrink-0"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : selectedSurveyDetails?.submissionId ? (
                  <p className="text-sm text-gray-500">No files uploaded for this submission</p>
                ) : (
                  <p className="text-sm text-gray-500">No submission found. Files will appear after submission.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
