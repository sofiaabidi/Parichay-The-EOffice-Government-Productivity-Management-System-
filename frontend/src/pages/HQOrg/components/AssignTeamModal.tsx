import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { hqOrgAPI } from '../../../services/api';

interface AssignTeamModalProps {
  open: boolean;
  onClose: () => void;
  onAssignmentChange?: () => void;
}

interface Department {
  name: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string | null;
  teamSize: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string | null;
  managerId: string | null;
  managerName: string | null;
}

export function AssignTeamModal({ open, onClose, onAssignmentChange }: AssignTeamModalProps) {
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deallocating, setDeallocating] = useState(false);

  // Load departments on mount
  useEffect(() => {
    if (open) {
      loadDepartments();
      loadEmployees();
    }
  }, [open]);

  // Load managers when department changes
  useEffect(() => {
    if (open && selectedDepartment) {
      loadManagers(selectedDepartment);
    } else {
      setManagers([]);
      setSelectedManagerId('');
    }
  }, [open, selectedDepartment]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await hqOrgAPI.getDepartments();
      setDepartments(response.data || []);
    } catch (error: any) {
      console.error('Failed to load departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadManagers = async (department: string) => {
    try {
      setLoadingManagers(true);
      const response = await hqOrgAPI.getManagersByDepartment(department);
      setManagers(response.data || []);
    } catch (error: any) {
      console.error('Failed to load managers:', error);
      toast.error('Failed to load managers');
    } finally {
      setLoadingManagers(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await hqOrgAPI.getEmployeesWithStatus();
      setEmployees(response.data || []);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Show all HQ employees (not filtered by department)
  // Calculate counts for all employees
  const counts = useMemo(() => {
    const allocated = employees.filter(emp => emp.managerId !== null).length;
    const unallocated = employees.filter(emp => emp.managerId === null).length;
    return { allocated, unallocated, total: employees.length };
  }, [employees]);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employees.find(e => e.id === selectedEmployeeId);
  }, [selectedEmployeeId, employees]);

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedManagerId('');
    setSelectedEmployeeId('');
  };

  const handleAllocate = async () => {
    if (!selectedEmployeeId || !selectedManagerId) {
      toast.error('Please select both an employee and a manager');
      return;
    }

    // Check if employee is already assigned
    if (selectedEmployee?.managerId) {
      toast.error('This employee is already assigned to a manager. Please deallocate first.');
      return;
    }

    try {
      setAssigning(true);
      await hqOrgAPI.assignEmployeeToManager({
        employeeId: selectedEmployeeId,
        managerId: selectedManagerId,
      });
      
      toast.success('Employee allocated successfully');
      setSelectedEmployeeId('');
      // Reload data
      await Promise.all([
        loadEmployees(),
        selectedDepartment && loadManagers(selectedDepartment),
      ]);
      // Trigger leaderboard refresh
      if (onAssignmentChange) {
        onAssignmentChange();
      }
    } catch (error: any) {
      console.error('Failed to allocate employee:', error);
      toast.error(error.response?.data?.message || 'Failed to allocate employee');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeallocate = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (!selectedEmployee?.managerId) {
      toast.error('This employee is not assigned to any manager');
      return;
    }

    try {
      setDeallocating(true);
      await hqOrgAPI.deallocateEmployee({
        employeeId: selectedEmployeeId,
      });
      
      toast.success('Employee deallocated successfully');
      setSelectedEmployeeId('');
      // Reload data
      await Promise.all([
        loadEmployees(),
        selectedDepartment && loadManagers(selectedDepartment),
      ]);
      // Trigger leaderboard refresh
      if (onAssignmentChange) {
        onAssignmentChange();
      }
    } catch (error: any) {
      console.error('Failed to deallocate employee:', error);
      toast.error(error.response?.data?.message || 'Failed to deallocate employee');
    } finally {
      setDeallocating(false);
    }
  };

  const handleClose = () => {
    setSelectedDepartment('');
    setSelectedManagerId('');
    setSelectedEmployeeId('');
    setManagers([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl border-gray-200/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Users className="size-5 text-white" />
            </div>
            <span>Assign Team</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Select a department, then assign employees to managers.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-5">
          {/* Department Selection */}
          <div className="space-y-2">
            <Label className="text-gray-700">Department Name *</Label>
            <Select 
              value={selectedDepartment} 
              onValueChange={handleDepartmentChange}
              disabled={loadingDepartments}
            >
              <SelectTrigger className="rounded-xl border-gray-300">
                <SelectValue placeholder={loadingDepartments ? "Loading departments..." : "Select a department"} />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Count Labels */}
          <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-blue-600">{counts.allocated}</div>
              <div className="text-xs text-gray-600">Allocated</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-orange-600">{counts.unallocated}</div>
              <div className="text-xs text-gray-600">Unallocated</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-gray-700">{counts.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>

          {/* Manager Selection - Only shown when department is selected */}
          {selectedDepartment && (
            <div className="space-y-2">
              <Label className="text-gray-700">Select Manager</Label>
              <Select 
                value={selectedManagerId} 
                onValueChange={setSelectedManagerId}
                disabled={loadingManagers}
              >
                <SelectTrigger className="rounded-xl border-gray-300">
                  <SelectValue placeholder={loadingManagers ? "Loading managers..." : "Choose a manager"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingManagers ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="size-4 animate-spin text-gray-400" />
                    </div>
                  ) : managers.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">No managers found in this department</div>
                  ) : (
                    managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{manager.name}</span>
                          <span className="ml-4 text-xs text-gray-500">
                            — {manager.teamSize} {manager.teamSize === 1 ? 'employee' : 'employees'} assigned
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employee Selection - Always shown */}
          <div className="space-y-2">
            <Label className="text-gray-700">Select Employee</Label>
            <Select 
              value={selectedEmployeeId} 
              onValueChange={setSelectedEmployeeId}
              disabled={loadingEmployees}
            >
              <SelectTrigger className="rounded-xl border-gray-300">
                <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Choose an employee"} />
              </SelectTrigger>
              <SelectContent>
                {loadingEmployees ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="size-4 animate-spin text-gray-400" />
                  </div>
                ) : employees.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No employees found</div>
                ) : (
                  employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <span>{employee.name}</span>
                        {employee.managerId ? (
                          <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Assigned to: {employee.managerName}
                          </span>
                        ) : (
                          <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleAllocate}
              disabled={!selectedDepartment || !selectedManagerId || !selectedEmployeeId || assigning || selectedEmployee?.managerId !== null}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl"
            >
              {assigning ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Allocating...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 size-4" />
                  Allocate
                </>
              )}
            </Button>
            <Button
              onClick={handleDeallocate}
              disabled={!selectedEmployeeId || !selectedEmployee?.managerId || deallocating}
              variant="outline"
              className="flex-1 rounded-xl border-red-300 text-red-600 hover:bg-red-50"
            >
              {deallocating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deallocating...
                </>
              ) : (
                <>
                  <UserX className="mr-2 size-4" />
                  Deallocate
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
