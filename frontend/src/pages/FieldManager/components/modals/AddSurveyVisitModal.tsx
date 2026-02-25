import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { fieldManagerAPI } from '../../../../services/api';

interface AddSurveyVisitModalProps {
  open: boolean;
  onClose: () => void;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  designation?: string;
}

interface Survey {
  id: number;
  name: string;
}

export function AddSurveyVisitModal({ open, onClose }: AddSurveyVisitModalProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchActiveSurveys();
    }
  }, [open]);

  useEffect(() => {
    if (selectedSurvey) {
      fetchSurveyEmployees(parseInt(selectedSurvey));
    } else {
      setEmployees([]);
      setScores({});
    }
  }, [selectedSurvey]);

  const fetchActiveSurveys = async () => {
    try {
      setLoadingSurveys(true);
      const response = await fieldManagerAPI.getActiveSurveys();
      setSurveys(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch active surveys:", error);
      toast.error("Failed to load surveys");
      setSurveys([]);
    } finally {
      setLoadingSurveys(false);
    }
  };

  const fetchSurveyEmployees = async (surveyId: number) => {
    try {
      setLoadingEmployees(true);
      const response = await fieldManagerAPI.getSurveyEmployees(surveyId);
      setEmployees(response.data || []);
      setScores({}); // Reset scores when employees change
    } catch (error: any) {
      console.error("Failed to fetch survey employees:", error);
      toast.error("Failed to load employees");
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleScoreChange = (employeeId: string, score: string) => {
    // Validate score is between 0 and 10
    const numScore = parseFloat(score);
    if (score === '' || (numScore >= 0 && numScore <= 10)) {
      setScores(prev => ({ ...prev, [employeeId]: score }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedSurvey) {
      toast.error('Please select a survey');
      return;
    }
    const filledScores = Object.entries(scores).filter(([_, score]) => score !== '' && score !== undefined);
    if (filledScores.length === 0) {
      toast.error('Please enter at least one score');
      return;
    }

    try {
      setSubmitting(true);
      const ratings = filledScores.map(([employeeId, score]) => ({
        employee_id: parseInt(employeeId),
        rating: parseFloat(score),
      }));

      await fieldManagerAPI.createSurveyFieldVisit({
        survey_id: parseInt(selectedSurvey),
        visit_date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || null,
        ratings,
      });

      toast.success('Survey visit scores recorded successfully');
      handleClose();
    } catch (error: any) {
      console.error("Failed to submit survey visit:", error);
      toast.error(error.response?.data?.message || 'Failed to record survey visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedSurvey('');
    setScores({});
    setNotes('');
    setEmployees([]);
    onClose();
  };

  const getEmployeeInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#1F2937]">Record Survey Visit Scores</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="survey-select" className="text-[#1F2937]">Select Survey</Label>
          <Select value={selectedSurvey} onValueChange={setSelectedSurvey} disabled={loadingSurveys}>
            <SelectTrigger id="survey-select" className="w-full border-gray-300">
              <SelectValue placeholder={loadingSurveys ? "Loading surveys..." : "Choose a survey"} />
            </SelectTrigger>
            <SelectContent>
              {surveys.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No active surveys</div>
              ) : (
                surveys.map((survey) => (
                  <SelectItem key={survey.id} value={survey.id.toString()}>
                    {survey.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedSurvey && (
          <>
            {loadingEmployees ? (
              <div className="text-center py-8 text-gray-400">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No employees assigned to this survey</div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3 py-4">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                          <span className="text-[#1F2937] text-sm">{getEmployeeInitials(employee.name)}</span>
                        </div>
                        <div>
                          <span className="text-[#1F2937] block">{employee.name}</span>
                          {employee.designation && (
                            <span className="text-xs text-gray-500">{employee.designation}</span>
                          )}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0-10"
                        value={scores[employee.id.toString()] || ''}
                        onChange={(e) => handleScoreChange(employee.id.toString(), e.target.value)}
                        className="w-24 border-gray-300"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            <div className="space-y-2 py-4">
              <Label htmlFor="notes" className="text-[#1F2937]">Visit Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this field visit..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </>
        )}

        {!selectedSurvey && (
          <div className="text-center py-12 text-gray-400">
            <p>Please select a survey to view assigned employees</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-[#1F2937] hover:bg-gray-800 text-white"
            disabled={submitting || !selectedSurvey || employees.length === 0}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
