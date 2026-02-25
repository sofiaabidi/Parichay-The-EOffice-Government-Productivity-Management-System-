import React, { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, UserMinus, Users, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { fieldOrgAPI } from '../../../services/api';

interface AssignTeamModalProps {
  onClose: () => void;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string | null;
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

export function AssignTeamModal({ onClose }: AssignTeamModalProps) {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deallocating, setDeallocating] = useState(false);

  const loadManagers = async () => {
    try {
      setLoadingManagers(true);
      const response = await fieldOrgAPI.getAllFieldManagers();
      const managersData = Array.isArray(response.data) ? response.data : [];
      setManagers(managersData);
      console.log(`Loaded ${managersData.length} managers from API`);
    } catch (error: any) {
      console.error('Failed to load managers:', error);
      toast.error('Failed to load managers');
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await fieldOrgAPI.getFieldEmployeesWithStatus();
      const employeesData = Array.isArray(response.data) ? response.data : [];
      setEmployees(employeesData);
      console.log(`Loaded ${employeesData.length} employees from API`);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadManagers(),
      loadEmployees(),
    ]);
  }, []);

  // Load data when modal opens
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    // Extract unique departments from employees
    const uniqueDepartments = Array.from(
      new Set(employees.map(emp => emp.department).filter(dept => dept && dept !== 'N/A'))
    ).sort();
    setDepartments(uniqueDepartments);
  }, [employees]);

  // Filter employees by selected department
  const filteredEmployees = selectedDepartment
    ? employees.filter(emp => emp.department === selectedDepartment)
    : employees;

  const handleAllocate = async () => {
    if (!selectedManager) {
      toast.error('Please select a manager');
      return;
    }
    if (!selectedDepartment) {
      toast.error('Please select a department');
      return;
    }
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployee);
    if (employee?.managerId) {
      toast.error('This employee is already assigned to a manager. Please deallocate first.');
      return;
    }

    try {
      setAssigning(true);
      await fieldOrgAPI.assignEmployeeToManager({
        employeeId: selectedEmployee,
        managerId: selectedManager,
      });
      
      toast.success('Employee allocated successfully!');
      setSelectedEmployee('');
      setSelectedDepartment('');
      // Reload data to get updated assignments
      await loadEmployees();
    } catch (error: any) {
      console.error('Failed to allocate employee:', error);
      toast.error(error.response?.data?.message || 'Failed to allocate employee');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeallocate = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee to deallocate');
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee || !employee.managerId) {
      toast.error('Employee is not assigned to any manager');
      return;
    }

    try {
      setDeallocating(true);
      await fieldOrgAPI.deallocateEmployee({
        employeeId: selectedEmployee,
      });
      
      toast.success('Employee deallocated successfully!');
      setSelectedEmployee('');
      setSelectedDepartment('');
      // Reload data to get updated assignments
      await loadEmployees();
    } catch (error: any) {
      console.error('Failed to deallocate employee:', error);
      toast.error(error.response?.data?.message || 'Failed to deallocate employee');
    } finally {
      setDeallocating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <h2>Assign Team</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              disabled={loadingManagers || loadingEmployees}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${(loadingManagers || loadingEmployees) ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Step 1: Select Manager */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 1: Select Manager *
            </label>
            <select
              value={selectedManager}
              onChange={(e) => {
                setSelectedManager(e.target.value);
                setSelectedEmployee(''); // Reset employee when manager changes
              }}
              disabled={loadingManagers}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingManagers ? 'Loading managers...' : 'Choose a manager...'}
              </option>
              {loadingManagers ? (
                <option value="" disabled>Loading...</option>
              ) : managers.length === 0 ? (
                <option value="" disabled>No managers found</option>
              ) : (
                managers.map((manager) => {
                  const assignedCount = employees.filter(e => e.managerId === manager.id).length;
                  return (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} — {assignedCount} {assignedCount === 1 ? 'employee' : 'employees'} assigned
                    </option>
                  );
                })
              )}
            </select>
            {loadingManagers && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading managers from database...</span>
              </div>
            )}
          </div>

          {/* Step 2: Select Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 2: Select Department *
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedEmployee(''); // Reset employee when department changes
              }}
              disabled={departments.length === 0}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Choose a department...</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {departments.length === 0 && !loadingEmployees && (
              <p className="text-xs text-gray-500 mt-1">No departments available</p>
            )}
          </div>

          {/* Step 3: Select Employee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 3: Select Employee *
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={loadingEmployees || !selectedDepartment}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedDepartment 
                  ? 'Please select a department first...' 
                  : loadingEmployees 
                  ? 'Loading employees...' 
                  : 'Choose an employee...'}
              </option>
              {loadingEmployees ? (
                <option value="" disabled>Loading...</option>
              ) : filteredEmployees.length === 0 && selectedDepartment ? (
                <option value="" disabled>No employees found in this department</option>
              ) : (
                filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} — {employee.managerId ? `Assigned to ${employee.managerName}` : 'Unassigned'}
                  </option>
                ))
              )}
            </select>
            {loadingEmployees && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading employees from database...</span>
              </div>
            )}
            {selectedDepartment && filteredEmployees.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'} in {selectedDepartment}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={handleAllocate}
              disabled={!selectedManager || !selectedDepartment || !selectedEmployee || assigning || employees.find(e => e.id === selectedEmployee)?.managerId !== null}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Allocating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Allocate
                </>
              )}
            </button>
            <button
              onClick={handleDeallocate}
              disabled={!selectedEmployee || !employees.find(e => e.id === selectedEmployee)?.managerId || deallocating}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl hover:from-rose-700 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deallocating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Deallocating...
                </>
              ) : (
                <>
                  <UserMinus className="w-5 h-5" />
                  Deallocate
                </>
              )}
            </button>
          </div>

          {/* Current Assignments Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-gray-900 mb-3">Current Assignment Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <p className="text-sm text-gray-600 mb-1">Assigned Employees</p>
                <p className="text-2xl text-emerald-600">{employees.filter(e => e.managerId).length}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">Unassigned Employees</p>
                <p className="text-2xl text-amber-600">{employees.filter(e => !e.managerId).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
