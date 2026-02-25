// Mock data store for employees and managers

export interface Employee {
  id: string;
  name: string;
  department: string;
  managerId: string | null;
  kpiScore: number;
  completedProjects: number;
}

export interface Manager {
  id: string;
  name: string;
  department: string;
  kpiScore: number;
  teamSize: number;
  feedbackRating: number;
}

export interface Feedback {
  id: string;
  managerId: string;
  rating: number;
  description: string;
  submittedAt: Date;
}

// Mock employees
export const employees: Employee[] = [
  { id: 'E001', name: 'Sanya Verma', department: 'Engineering', managerId: null, kpiScore: 92, completedProjects: 15 },
  { id: 'E002', name: 'Rahul Gupta', department: 'Engineering', managerId: 'M001', kpiScore: 88, completedProjects: 12 },
  { id: 'E003', name: 'Priya Sharma', department: 'Engineering', managerId: 'M001', kpiScore: 90, completedProjects: 14 },
  { id: 'E004', name: 'Amit Patel', department: 'Engineering', managerId: 'M001', kpiScore: 85, completedProjects: 10 },
  { id: 'E005', name: 'Neha Singh', department: 'Marketing', managerId: null, kpiScore: 94, completedProjects: 18 },
  { id: 'E006', name: 'Vikram Mehta', department: 'Marketing', managerId: 'M002', kpiScore: 87, completedProjects: 11 },
  { id: 'E007', name: 'Anjali Das', department: 'Sales', managerId: 'M003', kpiScore: 91, completedProjects: 16 },
  { id: 'E008', name: 'Karan Kapoor', department: 'Sales', managerId: null, kpiScore: 89, completedProjects: 13 },
  { id: 'E009', name: 'Divya Nair', department: 'HR', managerId: 'M004', kpiScore: 93, completedProjects: 17 },
  { id: 'E010', name: 'Rohan Joshi', department: 'HR', managerId: null, kpiScore: 86, completedProjects: 9 },
  { id: 'E011', name: 'Sakshi Khandelwal', department: 'Finance', managerId: 'M005', kpiScore: 95, completedProjects: 20 },
  { id: 'E012', name: 'Arjun Reddy', department: 'Finance', managerId: null, kpiScore: 84, completedProjects: 8 },
];

// Mock managers
export const managers: Manager[] = [
  { id: 'M001', name: 'Rajesh Kumar', department: 'Engineering', kpiScore: 91, teamSize: 3, feedbackRating: 4.5 },
  { id: 'M002', name: 'Pooja Malhotra', department: 'Marketing', kpiScore: 89, teamSize: 1, feedbackRating: 4.2 },
  { id: 'M003', name: 'Arun Desai', department: 'Sales', kpiScore: 93, teamSize: 1, feedbackRating: 4.7 },
  { id: 'M004', name: 'Sneha Iyer', department: 'HR', kpiScore: 88, teamSize: 1, feedbackRating: 4.3 },
  { id: 'M005', name: 'Vikas Agarwal', department: 'Finance', kpiScore: 95, teamSize: 1, feedbackRating: 4.8 },
];

// Get unique departments
export const departments = Array.from(
  new Set([...employees.map(e => e.department), ...managers.map(m => m.department)])
).sort();

// Get all feedbacks
export const feedbacks: Feedback[] = [];

// Helper functions
export function getManagersByDepartment(department: string): Manager[] {
  return managers.filter(m => m.department === department);
}

export function getEmployeesByDepartment(department: string): Employee[] {
  return employees.filter(e => e.department === department);
}

export function getManagerById(managerId: string): Manager | undefined {
  return managers.find(m => m.id === managerId);
}

export function getEmployeeById(employeeId: string): Employee | undefined {
  return employees.find(e => e.id === employeeId);
}

export function assignEmployeeToManager(employeeId: string, managerId: string): void {
  const employee = employees.find(e => e.id === employeeId);
  const manager = managers.find(m => m.id === managerId);
  
  if (employee && manager) {
    // Update old manager's team size
    if (employee.managerId) {
      const oldManager = managers.find(m => m.id === employee.managerId);
      if (oldManager) {
        oldManager.teamSize--;
      }
    }
    
    // Update employee
    employee.managerId = managerId;
    
    // Update new manager's team size
    manager.teamSize++;
  }
}

export function deallocateEmployee(employeeId: string): void {
  const employee = employees.find(e => e.id === employeeId);
  
  if (employee && employee.managerId) {
    const manager = managers.find(m => m.id === employee.managerId);
    if (manager) {
      manager.teamSize--;
    }
    employee.managerId = null;
  }
}

export function addFeedback(feedback: Feedback): void {
  feedbacks.push(feedback);
  
  // Update manager's average rating
  const managerFeedbacks = feedbacks.filter(f => f.managerId === feedback.managerId);
  const avgRating = managerFeedbacks.reduce((sum, f) => sum + f.rating, 0) / managerFeedbacks.length;
  
  const manager = managers.find(m => m.id === feedback.managerId);
  if (manager) {
    manager.feedbackRating = avgRating;
  }
}

// Current logged-in user (mock)
export const currentUser = {
  id: 'U001',
  name: 'Rohan Sharma',
  role: 'Admin',
  email: 'rohan.sharma@company.com'
};
