import { useState } from 'react';
import { X, Upload, Image as ImageIcon, FileText, MapPin, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { fieldEmployeeAPI } from '../../../services/api';
import { toast } from 'sonner';

interface SurveySubmitModalProps {
  survey: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SurveySubmitModal({ survey, onClose, onSuccess }: SurveySubmitModalProps) {
  const [areaCovered, setAreaCovered] = useState('');
  const [timeTaken, setTimeTaken] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newDocs = Array.from(e.target.files);
      setDocuments([...documents, ...newDocs]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!areaCovered || !timeTaken) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // First, submit the survey data
      const submissionData = {
        survey_id: survey.id,
        area_covered: areaCovered,
        time_taken: timeTaken,
        notes: notes || null,
      };

      const submissionResponse = await fieldEmployeeAPI.submitSurveySubmission(submissionData);
      const submissionId = submissionResponse.data.id;

      // Upload files if any
      const allFiles = [...photos, ...documents];
      if (allFiles.length > 0) {
        try {
          await fieldEmployeeAPI.uploadSurveyFiles(submissionId, allFiles);
        } catch (fileError: any) {
          console.error("File upload error:", fileError);
          // Continue even if file upload fails - submission is already created
          toast.warning('Survey submitted but some files failed to upload');
        }
      }

      toast.success('Survey submitted successfully!');
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error("Failed to submit survey:", error);
      toast.error(error.response?.data?.message || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-yellow-50">
            <div>
              <h3 className="text-[#1C1C28] text-lg mb-1">Submit Survey Data</h3>
              <p className="text-[#6B6B6B] text-sm">{survey.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] space-y-6">
            {/* Survey Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#6B6B6B] text-sm mb-2 block">Expected Area</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="size-4 text-gray-400" />
                  <span className="text-[#1C1C28]">{survey.area}</span>
                </div>
              </div>
              <div>
                <label className="text-[#6B6B6B] text-sm mb-2 block">Estimated Time</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-[#1C1C28]">{survey.estimatedTime}</span>
                </div>
              </div>
            </div>

            {/* Area Covered Input */}
            <div>
              <label className="text-[#1C1C28] mb-2 block">
                Area Covered <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., 120 hectares or 12 km"
                value={areaCovered}
                onChange={(e) => setAreaCovered(e.target.value)}
              />
            </div>

            {/* Time Taken Input */}
            <div>
              <label className="text-[#1C1C28] mb-2 block">
                Time Taken <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., 5.5 hours"
                value={timeTaken}
                onChange={(e) => setTimeTaken(e.target.value)}
              />
            </div>

            {/* Geotagged Photos Upload */}
            <div>
              <label className="text-[#1C1C28] mb-2 block">Upload Geotagged Photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <ImageIcon className="size-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-[#6B6B6B] mb-1">Click to upload geotagged photos</p>
                  <p className="text-[#9CA3AF] text-sm">PNG, JPG with GPS data</p>
                </label>
              </div>

              {/* Photo Preview */}
              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="bg-gray-100 rounded-lg p-3 border aspect-square flex items-center justify-center">
                        <ImageIcon className="size-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-[#6B6B6B] truncate mt-1">{photo.name}</p>
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document Upload */}
            <div>
              <label className="text-[#1C1C28] mb-2 block">Upload Documents</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="survey-document-upload"
                />
                <label htmlFor="survey-document-upload" className="cursor-pointer">
                  <FileText className="size-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-[#6B6B6B] mb-1">Click to upload survey documents</p>
                  <p className="text-[#9CA3AF] text-sm">PDF, DOC, DOCX, XLS, XLSX</p>
                </label>
              </div>

              {/* Document List */}
              {documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-green-600" />
                        <div>
                          <p className="text-sm text-[#1C1C28]">{doc.name}</p>
                          <p className="text-xs text-[#6B6B6B]">
                            {(doc.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(index)}
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes/Observations */}
            <div>
              <label className="text-[#1C1C28] mb-2 block">Notes / Observations</label>
              <Textarea
                placeholder="Add any notes, observations, or challenges faced during the survey..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-[#6B6B6B]">
              {photos.length} photo(s) and {documents.length} document(s) selected
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Upload className="size-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
