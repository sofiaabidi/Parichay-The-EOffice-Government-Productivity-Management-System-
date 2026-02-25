import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { FileText, CheckCircle2, Clock, AlertCircle, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";
import { taskAPI, fileAPI } from "../../../services/api";

interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  priority: string;
  completed_at: string | null;
  draft_number?: number;
  project_name?: string | null;
  latest_feedback?: string | null;
}

export function TaskCompletionSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [isPaperwork, setIsPaperwork] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getMyTasks();
      setTasks(response.data || []);
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "delayed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Delayed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      setSelectedFile(file);
      // Uncheck paperwork when file is selected
      setIsPaperwork(false);
      console.log('[HQ Employee Upload] PDF file selected, will create work_file with isDigital: true');
    }
  };

  const handleUpload = async () => {
    if (!selectedTask) return;

    try {
      if (isPaperwork) {
        // For paperwork, create a work_file with isDigital = false
        console.log('[HQ Employee Upload] Creating work_file for paperwork (isDigital: false)');
        const workFileResponse = await fileAPI.createWorkFile({
          title: `Paperwork for Task ${selectedTask}`,
          description: `Paperwork submission recorded on ${new Date().toLocaleDateString()}`,
          taskId: selectedTask,
          complexity: 'medium',
          targetTimeHours: 8,
          slaTimeHours: 24,
          isDigital: false, // Paperwork is NOT digital
        });
        
        // Mark the work file as completed (paperwork is immediately complete)
        await fileAPI.completeFile(workFileResponse.data.id, {
          completedAt: new Date().toISOString(),
          isDigital: false,
        });
        
        await taskAPI.updateTaskStatus(selectedTask, 'awaiting-review', new Date().toISOString());
        toast.success(`Paperwork submission recorded for task`);
        setOpenDialog(false);
        setSelectedTask(null);
        setIsPaperwork(false);
        await loadTasks();
        return;
      }
      
      if (selectedFile) {
        // For PDF upload, create a work_file with isDigital = true
        console.log('[HQ Employee Upload] Creating work_file for PDF upload (isDigital: true)');
        const workFileResponse = await fileAPI.createWorkFile({
          title: `Document for Task ${selectedTask}`,
          description: `Supporting document uploaded on ${new Date().toLocaleDateString()}`,
          taskId: selectedTask,
          complexity: 'medium',
          targetTimeHours: 8,
          slaTimeHours: 24,
          isDigital: true, // PDF upload IS digital
        });

        await fileAPI.uploadDocument(workFileResponse.data.id, selectedFile);
        await taskAPI.updateTaskStatus(selectedTask, 'awaiting-review', new Date().toISOString());
        
        toast.success(`File ${selectedFile.name} uploaded for task`);
        setOpenDialog(false);
        setSelectedFile(null);
        setSelectedTask(null);
        await loadTasks();
      } else {
        toast.error("Please select a file or check paperwork option");
      }
    } catch (error: any) {
      console.error('[HQ Employee Upload] Upload error:', error);
      toast.error(error.response?.data?.message || "Failed to upload file");
    }
  };

  const handleStatusUpdate = async (taskId: number, newStatus: string) => {
    try {
      await taskAPI.updateTaskStatus(
        taskId,
        newStatus,
        newStatus === 'completed' ? new Date().toISOString() : undefined
      );
      toast.success('Task status updated');
      await loadTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update task status');
    }
  };

  const completed = tasks.filter(t => t.status === "completed").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const delayed = tasks.filter(t => t.status === "delayed").length;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">Loading tasks...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Task Completion
        </h2>
        <div className="flex gap-3 text-sm">
          <span className="text-green-600">{completed} Completed</span>
          <span className="text-yellow-600">{inProgress} In Progress</span>
          <span className="text-red-600">{delayed} Delayed</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task ID</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead>Under What Project</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completion Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No tasks assigned
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  className="hover:bg-gray-50 transition-colors"
                  title={`Task: ${task.title}`}
                >
                  <TableCell className="text-gray-600">#{task.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{task.title}</span>
                      {task.draft_number && task.draft_number > 1 && (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                          Draft {task.draft_number}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {task.project_name || "-"}
                  </TableCell>
                  <TableCell className="text-gray-600 max-w-xs">
                    <div className="truncate" title={task.latest_feedback || task.description || "-"}>
                      {task.latest_feedback || task.description || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(task.due_date)}</TableCell>
                  <TableCell>
                    {getStatusBadge(task.status)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {task.completed_at ? formatDate(task.completed_at) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {task.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(task.id, 'in-progress')}
                          className="text-xs"
                        >
                          Start
                        </Button>
                      )}
                      {task.status === 'in-progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(task.id, 'completed')}
                          className="text-xs"
                        >
                          Complete
                        </Button>
                      )}
                      <Dialog open={openDialog && selectedTask === task.id} onOpenChange={(open) => {
                        setOpenDialog(open);
                        if (!open) {
                          setSelectedTask(null);
                          setSelectedFile(null);
                          setIsPaperwork(false);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTask(task.id);
                              setOpenDialog(true);
                            }}
                            className="hover:bg-blue-50"
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Upload File for {task.title}</DialogTitle>
                            <DialogDescription>
                              Upload a file or check the paperwork option to record the submission.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="file">Upload File (PDF only)</Label>
                              <input
                                id="file"
                                type="file"
                                accept="application/pdf"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                onChange={handleFileChange}
                              />
                            </div>
                            <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3">
                              <Checkbox
                                id="paperwork"
                                checked={isPaperwork}
                                onCheckedChange={(checked) => {
                                  setIsPaperwork(checked === true);
                                  // Clear file selection when paperwork is checked
                                  if (checked === true) {
                                    setSelectedFile(null);
                                  }
                                }}
                              />
                              <Label htmlFor="paperwork" className="cursor-pointer">
                                Paper Work (Non-digital submission)
                              </Label>
                            </div>
                            {isPaperwork && (
                              <p className="text-xs text-gray-500">
                                Paperwork submissions are recorded as non-digital (is_digital = false) for KPI calculation
                              </p>
                            )}
                            <Button 
                              onClick={handleUpload}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Submit
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
