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

interface AddProjectVisitModalProps {
  open: boolean;
  onClose: () => void;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  designation?: string;
}

interface Project {
  id: number;
  name: string;
}

export function AddProjectVisitModal({ open, onClose }: AddProjectVisitModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchActiveProjects();
    }
  }, [open]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectEmployees(parseInt(selectedProject));
    } else {
      setEmployees([]);
      setScores({});
    }
  }, [selectedProject]);

  const fetchActiveProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await fieldManagerAPI.getActiveProjects();
      setProjects(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch active projects:", error);
      toast.error("Failed to load projects");
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchProjectEmployees = async (projectId: number) => {
    try {
      setLoadingEmployees(true);
      const response = await fieldManagerAPI.getProjectEmployees(projectId);
      setEmployees(response.data || []);
      setScores({}); // Reset scores when employees change
    } catch (error: any) {
      console.error("Failed to fetch project employees:", error);
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
    if (!selectedProject) {
      toast.error('Please select a project');
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
        technical_compliance: parseFloat(score),
        rating: parseFloat(score),
      }));

      await fieldManagerAPI.createProjectFieldVisit({
        project_id: parseInt(selectedProject),
        visit_date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || null,
        ratings,
      });

      toast.success('Project visit scores recorded successfully');
      handleClose();
    } catch (error: any) {
      console.error("Failed to submit project visit:", error);
      toast.error(error.response?.data?.message || 'Failed to record project visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedProject('');
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
          <DialogTitle className="text-[#1F2937]">Record Project Visit Scores</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="project-select" className="text-[#1F2937]">Select Project</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject} disabled={loadingProjects}>
            <SelectTrigger id="project-select" className="w-full border-gray-300">
              <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Choose a project"} />
            </SelectTrigger>
            <SelectContent>
              {projects.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No active projects</div>
              ) : (
                projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedProject && (
          <>
            {loadingEmployees ? (
              <div className="text-center py-8 text-gray-400">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No employees assigned to this project</div>
            ) : (
              <ScrollArea className="h-[400px] w-full pr-4 border border-gray-200 rounded-lg">
                <div className="space-y-3 p-4">
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

        {!selectedProject && (
          <div className="text-center py-12 text-gray-400">
            <p>Please select a project to view assigned employees</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-[#1F2937] hover:bg-gray-800 text-white"
            disabled={submitting || !selectedProject || employees.length === 0}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
