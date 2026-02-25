import { useState } from 'react';
import { X, Upload, Image as ImageIcon, FileText, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { taskSubmissionAPI } from '../../../services/api';
import { toast } from 'sonner';

interface UploadModalProps {
  milestone: any;
  taskId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UploadModal({ milestone, taskId, onClose, onSuccess }: UploadModalProps) {
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages([...images, ...newImages]);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newDocs = Array.from(e.target.files);
      setDocuments([...documents, ...newDocs]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (images.length === 0 && documents.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (!taskId) {
      toast.error('Task ID is missing');
      return;
    }

    setIsSubmitting(true);

    try {
      const allFiles = [...images, ...documents];

      await taskSubmissionAPI.createSubmission(taskId, {
        milestoneId: milestone.id,
        cost: cost || undefined,
        notes: notes || undefined,
        files: allFiles,
      });

      toast.success('Files uploaded successfully!');
      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setIsSubmitting(false);
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
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-[#1C1C28] text-lg mb-1">Upload Files</h3>
              <p className="text-[#6B6B6B] text-sm">{milestone.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] space-y-6">
            {/* Image Upload */}
            <div>
              <label className="text-[#1C1C28] mb-2 block">Upload Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="size-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-[#6B6B6B] mb-1">Click to upload images</p>
                  <p className="text-[#9CA3AF] text-sm">PNG, JPG up to 10MB each</p>
                </label>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="bg-gray-100 rounded-lg p-3 border">
                        <ImageIcon className="size-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-xs text-[#6B6B6B] truncate">{image.name}</p>
                      </div>
                      <button
                        onClick={() => removeImage(index)}
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <FileText className="size-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-[#6B6B6B] mb-1">Click to upload documents</p>
                  <p className="text-[#9CA3AF] text-sm">PDF, DOC, DOCX, XLS, XLSX up to 10MB each</p>
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

            {/* Cost */}
            <div>
              <Label htmlFor="cost" className="text-[#1C1C28] mb-2 block">Cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="pl-8 border-gray-300"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[#1C1C28] mb-2 block">Notes / Observations</label>
              <Textarea
                placeholder="Add any notes or observations about this milestone..."
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
              {images.length} image(s) and {documents.length} document(s) selected
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="size-4 mr-2" />
                {isSubmitting ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
