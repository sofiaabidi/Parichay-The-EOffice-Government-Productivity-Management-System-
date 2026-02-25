import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log 404 errors with full URL for debugging
    if (error.response?.status === 404) {
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || 'GET';
      const fullUrl = `${error.config?.baseURL || ''}${url}`;
      console.error(`[404 Error] ${method} ${fullUrl}`);
      console.error('Request config:', error.config);
    }
    
    // Only clear session and redirect on explicit token expiration/invalid token errors
    // Don't clear session on permission errors (401s) or other temporary failures
    if (error.response?.status === 401) {
      const errorMessage = (error.response?.data?.message || '').toLowerCase();
      const requestUrl = error.config?.url || '';
      
      // Only treat as auth error if it's explicitly a token validation endpoint
      // OR if the error message explicitly mentions token expiration/invalidation
      const isAuthValidationEndpoint = requestUrl.includes('/auth/me') || 
                                       requestUrl.includes('/auth/verify');
      
      // Only clear session if error explicitly mentions token expiration or invalid token
      const isExplicitTokenError = errorMessage.includes('token expired') ||
                                    errorMessage.includes('invalid token') ||
                                    errorMessage.includes('jwt expired') ||
                                    errorMessage.includes('jwt invalid') ||
                                    (errorMessage.includes('token') && errorMessage.includes('expired')) ||
                                    (isAuthValidationEndpoint && error.response?.status === 401);
      
      // Only clear session and redirect if it's an explicit token error
      // This prevents clearing session on permission errors or temporary API failures
      if (isExplicitTokenError) {
        const currentPath = window.location.pathname;
        // Only redirect if we're not already on the login page
        if (currentPath !== '/' && currentPath !== '/login') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          // Use a small delay to avoid redirect loops
          setTimeout(() => {
            if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
              window.location.href = '/';
            }
          }, 100);
        }
      }
      // For other 401 errors (permission errors, etc.), just reject the promise
      // Don't clear session - let the component handle the error
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  loginFieldManager: (email: string, password: string) =>
    api.post('/field/auth/manager/login', { email, password }),
  loginFieldEmployee: (email: string, password: string) =>
    api.post('/field/auth/employee/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Attendance API
export const attendanceAPI = {
  checkIn: (date?: string) => api.post('/attendance/check-in', { date }),
  checkOut: (date?: string) => api.post('/attendance/check-out', { date }),
  getMyAttendance: (month?: number, year?: number) =>
    api.get('/attendance/my', { params: { month, year } }),
};

// Field Employee Attendance API
export const fieldEmployeeAttendanceAPI = {
  checkIn: (date?: string) => api.post('/field-employee-attendance/check-in', { date }),
  checkOut: (date?: string) => api.post('/field-employee-attendance/check-out', { date }),
  getMyAttendance: (month?: number, year?: number) =>
    api.get('/field-employee-attendance/my', { params: { month, year } }),
  getTodayAttendance: () => api.get('/field-employee-attendance/today'),
};

// KPI API
export const kpiAPI = {
  getEmployeeKpi: (userId: number, periodStart?: string, periodEnd?: string) =>
    api.get(`/kpis/employee/${userId}`, { params: { periodStart, periodEnd } }),
  getEmployeeHistory: (userId: number) =>
    api.get(`/kpis/employee/${userId}/history`),
  getManagerKpi: (managerId: number, periodStart?: string, periodEnd?: string) =>
    api.get(`/kpis/manager/${managerId}`, { params: { periodStart, periodEnd } }),
  getTeamKpiTable: (managerId: number, periodStart?: string, periodEnd?: string) =>
    api.get(`/kpis/manager/${managerId}/team-table`, { params: { periodStart, periodEnd } }),
  adjustKpi: (userId: number, delta: number, periodStart: string, periodEnd: string, reason?: string) =>
    api.post(`/kpis/employee/${userId}/adjustments`, { delta, periodStart, periodEnd, reason }),
};

// Task API
export const taskAPI = {
  getMyTasks: () => api.get('/tasks/my'),
  updateTaskStatus: (taskId: number, status: string, completedAt?: string, feedback?: { rating: number; comment?: string }) =>
    api.patch(`/tasks/${taskId}/status`, { status, completedAt, feedback }),
  createTask: (data: {
    title: string;
    description?: string;
    assignedTo: number;
    priority: string;
    dueDate: string;
    projectId?: number;
    milestoneId?: number;
    expectedOutput?: string;
    cost?: string;
    skillIds?: number[];
  }) => api.post('/tasks', data),
  getTeamTasks: (status?: string) => api.get('/tasks/team', { params: { status } }),
};

// Project API
export const projectAPI = {
  listProjects: (includeDetails?: boolean) => 
    api.get('/projects', { params: { includeDetails: includeDetails ? 'true' : 'false' } }),
  createProject: (data: {
    name: string;
    description?: string;
    status?: string;
    startDate?: string;
    dueDate?: string;
    memberIds?: number[];
    milestones?: Array<{
      name: string;
      deadline?: string;
      budget?: string;
      expectedOutput?: string;
      description?: string;
    }>;
    budget?: string;
    dprDeadline?: string;
  }) => api.post('/projects', data),
  updateProject: (id: number, data: { status?: string; description?: string }) =>
    api.patch(`/projects/${id}`, data),
};

// Milestone API
export const milestoneAPI = {
  createMilestone: (projectId: number, data: {
    name: string;
    deadline?: string;
    budget?: string;
    expectedOutput?: string;
    description?: string;
  }) => api.post(`/projects/${projectId}/milestones`, data),
  getMilestones: (projectId: number) => api.get(`/projects/${projectId}/milestones`),
  updateMilestone: (milestoneId: number, data: {
    name?: string;
    deadline?: string;
    budget?: string;
    expectedOutput?: string;
    status?: string;
  }) => api.patch(`/milestones/${milestoneId}`, data),
  deleteMilestone: (milestoneId: number) => api.delete(`/milestones/${milestoneId}`),
};

// Task Submission API
export const taskSubmissionAPI = {
  createSubmission: (taskId: number, data: {
    milestoneId?: number;
    cost?: string;
    notes?: string;
    files: File[];
  }) => {
    const formData = new FormData();
    formData.append('taskId', taskId.toString());
    if (data.milestoneId) formData.append('milestoneId', data.milestoneId.toString());
    if (data.cost) formData.append('cost', data.cost);
    if (data.notes) formData.append('notes', data.notes);
    data.files.forEach(file => formData.append('files', file));
    return api.post('/task-submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSubmissions: (params?: { taskId?: number; milestoneId?: number }) =>
    api.get('/task-submissions', { params }),
  updateSubmissionStatus: (submissionId: number, data: {
    status: 'approved' | 'rejected' | 'pending-review';
    remarks?: string;
  }) => api.patch(`/task-submissions/${submissionId}/status`, data),
};

// Manager API
export const managerAPI = {
  getDashboardSummary: (periodStart?: string, periodEnd?: string) =>
    api.get('/manager/dashboard/summary', { params: { periodStart, periodEnd } }),
  getLeaderboard: (periodStart?: string, periodEnd?: string) =>
    api.get('/manager/dashboard/leaderboard', { params: { periodStart, periodEnd } }),
  getStatusBreakdown: () => api.get('/manager/dashboard/status-breakdown'),
  getTrends: () => api.get('/manager/dashboard/trends'),
  getPendingApprovals: () => api.get('/manager/dashboard/pending-approvals'),
  getTeamMembers: () => api.get('/users/manager/team'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  getMyTrainings: () => api.get('/users/employee/trainings'),
  getMyRecognitions: () => api.get('/users/employee/recognitions'),
  getMySkills: () => api.get('/users/employee/skills'),
  addSkill: (payload: { name: string; userId?: number }) => api.post('/users/employee/skills', payload),
  deleteSkill: (skillId: number) => api.delete(`/users/employee/skills/${skillId}`),
  getMyBadges: () => api.get('/users/employee/badges'),
  getManagerTeam: () => api.get('/users/manager/team'),
  getEmployeePeers: () => api.get('/users/employee/peers'),
  getDepartmentLeaderboard: () => api.get('/users/employee/department-leaderboard'),
  generateBadges: () => api.post('/users/badges/generate'),
};

// Feedback API
export const feedbackAPI = {
  getMyFeedback: () => api.get('/feedback/my'),
  addTaskFeedback: (taskId: number, data: { toUserId: number; rating: number; comment?: string }) =>
    api.post(`/feedback/tasks/${taskId}`, data),
  addPeerFeedback: (data: { toUserId: number; regarding?: string; rating: number; comment?: string }) =>
    api.post('/feedback/peer', data),
  addManagerFeedback: (data: { employeeId: number; regarding?: string; rating: number; comment?: string }) =>
    api.post('/feedback/manager', data),
};

// File API
export const fileAPI = {
  listMyFiles: () => api.get('/files/my'),
  uploadDocument: (fileId: number, file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post(`/files/${fileId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  createWorkFile: (data: {
    title: string;
    description?: string;
    taskId?: number;
    managerId?: number;
    complexity: string;
    complexityWeight?: number;
    targetTimeHours: number;
    slaTimeHours: number;
    isDigital: boolean;
  }) => api.post('/files', data),
  completeFile: (fileId: number, data: {
    completedAt?: string;
    grammarScore?: number;
    clarityScore?: number;
    isDigital?: boolean;
  }) => api.patch(`/files/${fileId}/complete`, data),
  downloadDocument: (documentId: number) => 
    api.get(`/files/documents/${documentId}/download`, { 
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    }),
};

export const notificationsAPI = {
  list: (params?: { unreadOnly?: boolean; limit?: number }) =>
    api.get('/notifications', { params }),
  markRead: (ids: number[]) => api.post('/notifications/read', { ids }),
};

// HQ Organization API
export const hqOrgAPI = {
  getManagersLeaderboard: (periodStart?: string, periodEnd?: string) =>
    api.get('/hq-org/leaderboard/managers', { params: { periodStart, periodEnd } }),
  getEmployeesLeaderboard: (periodStart?: string, periodEnd?: string) =>
    api.get('/hq-org/leaderboard/employees', { params: { periodStart, periodEnd } }),
  getAllManagers: () => api.get('/hq-org/managers'),
  submitFeedbackToManager: (data: { managerId: string; rating: number; comment: string; regarding?: string }) =>
    api.post('/hq-org/feedback/manager', data),
  getDepartments: () => api.get('/hq-org/departments'),
  getManagersByDepartment: (department: string) => api.get(`/hq-org/managers/department/${encodeURIComponent(department)}`),
  getEmployeesWithStatus: () => api.get('/hq-org/employees'),
  assignEmployeeToManager: (data: { employeeId: string; managerId: string }) =>
    api.post('/hq-org/assign-team', data),
  deallocateEmployee: (data: { employeeId: string }) =>
    api.post('/hq-org/deallocate-team', data),
  createUser: (data: { name: string; email: string; password: string; role: 'EMPLOYEE' | 'MANAGER'; department?: string; designation?: string }) =>
    api.post('/hq-org/users', data),
  getPromotionCandidates: (periodStart?: string, periodEnd?: string) =>
    api.get('/hq-org/promotion-candidates', { params: { periodStart, periodEnd } }),
  getTrainingRecommendations: (periodStart?: string, periodEnd?: string) =>
    api.get('/hq-org/training-recommendations', { params: { periodStart, periodEnd } }),
};

// Field Organization API
export const fieldOrgAPI = {
  getAllFieldManagers: () => api.get('/field-org/managers'),
  getFieldEmployeesWithStatus: () => api.get('/field-org/employees'),
  getFieldUserStats: () => api.get('/field-org/stats'),
  getFieldManagersLeaderboard: (periodStart?: string, periodEnd?: string) =>
    api.get('/field-org/leaderboard/managers', { params: { periodStart, periodEnd } }),
  getFieldEmployeesLeaderboard: (periodStart?: string, periodEnd?: string) =>
    api.get('/field-org/leaderboard/employees', { params: { periodStart, periodEnd } }),
  getAverageManagerKPI: (periodStart?: string, periodEnd?: string) =>
    api.get('/field-org/average-kpi/managers', { params: { periodStart, periodEnd } }),
  getAverageEmployeeKPI: (periodStart?: string, periodEnd?: string) =>
    api.get('/field-org/average-kpi/employees', { params: { periodStart, periodEnd } }),
  getPromotionCandidates: (periodStart?: string, periodEnd?: string) =>
    api.get('/field-org/promotion-candidates', { params: { periodStart, periodEnd } }),
  getTrainingRecommendations: (periodStart?: string, periodEnd?: string) =>
    api.get('/field-org/training-recommendations', { params: { periodStart, periodEnd } }),
  submitFeedbackToManager: (data: { managerId: string; rating: number; comment: string; regarding?: string }) =>
    api.post('/field-org/feedback/manager', data),
  createUser: (data: { 
    name: string; 
    email: string; 
    password: string; 
    role: 'FIELD_EMPLOYEE' | 'FIELD_MANAGER'; 
    department?: string; 
    designation?: string;
    phone?: string;
    qualifications?: string;
    joiningMonth?: string;
    joiningYear?: string;
  }) => api.post('/field-org/users', data),
  assignEmployeeToManager: (data: { employeeId: string; managerId: string }) =>
    api.post('/field-org/assign-team', data),
  deallocateEmployee: (data: { employeeId: string }) =>
    api.post('/field-org/deallocate-team', data),
  getWeeklyKpiSnapshots: (limit?: number) =>
    api.get('/field-org/weekly-kpi-snapshots', { params: { limit } }),
  getStaffingOverview: () => api.get('/field-org/staffing-overview'),
  getTopPromotionScores: (limit?: number) =>
    api.get('/field-org/promotion-scores/top', { params: { limit } }),
};


// Field Manager API
export const fieldManagerAPI = {
  getMyTeam: () => api.get('/field/manager/team'),
  getMyProjects: () => api.get('/field/manager/projects'),
  getMySurveys: () => api.get('/field/manager/surveys'),
  getMyKPI: (periodStart?: string, periodEnd?: string) =>
    api.get('/field/manager/kpi', { params: { periodStart, periodEnd } }),
  getTeamKPITable: (periodStart?: string, periodEnd?: string) =>
    api.get('/field/manager/kpi/team-table', { params: { periodStart, periodEnd } }),
  getLeaderboard: (periodStart?: string, periodEnd?: string) =>
    api.get('/field/manager/kpi/leaderboard', { params: { periodStart, periodEnd } }),
  getDashboardSummary: (periodStart?: string, periodEnd?: string) =>
    api.get('/field/manager/dashboard/summary', { params: { periodStart, periodEnd } }),
  getOngoingActivities: () => api.get('/field/manager/dashboard/ongoing-activities'),
  getPendingApprovals: () => api.get('/field/manager/dashboard/pending-approvals'),
  getMyFeedback: () => api.get('/field/manager/feedback'),
  getMyLocations: () => api.get('/field/manager/locations'),
  saveLocation: (data: { location_id: string; latitude: number; longitude: number; description?: string; interest?: 'Project' | 'Survey' }) =>
    api.post('/field/manager/locations', data),
  deleteLocation: (id: number) => api.delete(`/field/manager/locations/${id}`),
  createSurvey: (data: { name: string; description?: string; total_area: string; expected_time: string; location_id?: string; deadline?: string; member_ids: number[] }) =>
    api.post('/field/manager/surveys', data),
  getActiveSurveys: () => api.get('/field/manager/surveys/active'),
  getSurveyEmployees: (surveyId: number) => api.get(`/field/manager/surveys/${surveyId}/employees`),
  createSurveyFieldVisit: (data: { survey_id: number; visit_date?: string; notes?: string; ratings: Array<{ employee_id: number; rating: number; notes?: string }> }) =>
    api.post('/field/manager/surveys/field-visits', data),
  getSurveySubmissions: () => api.get('/field/manager/surveys/submissions'),
  reviewSurveySubmission: (submissionId: number, data: { status: 'approved' | 'rejected'; remarks?: string }) =>
    api.post(`/field/manager/surveys/submissions/${submissionId}/review`, data),
  getActiveProjects: () => api.get('/field/manager/projects/active'),
  getProjectEmployees: (projectId: number) => api.get(`/field/manager/projects/${projectId}/employees`),
  createProjectFieldVisit: (data: { project_id: number; visit_date?: string; notes?: string; ratings: Array<{ employee_id: number; technical_compliance?: number; rating?: number; remarks?: string }> }) =>
    api.post('/field/manager/projects/field-visits', data),
  submitDprReview: (projectId: number, data: { authenticity_stars: number; data_correctness_stars: number; technical_correctness_stars: number; completeness_stars: number; tools_and_resources_stars: number; actual_submission_date?: string; remarks?: string }) =>
    api.post(`/field/manager/projects/${projectId}/dpr-review`, data),
  getAvailableSkills: () => api.get('/field/manager/skills/available'),
};

// Field Employee API
export const fieldEmployeeAPI = {
  getMyProjects: () => api.get('/field/employee/projects'),
  getMySurveys: () => api.get('/field/employee/surveys'),
  getMyKPI: (periodStart?: string, periodEnd?: string) =>
    api.get('/field/employee/kpi', { params: { periodStart, periodEnd } }),
  getMyKPIHistory: () => api.get('/field/employee/kpi/history'),
  getMyDailyKPIHistory: (limit?: number) =>
    api.get('/field/employee/kpi/daily-history', { params: { limit } }),
  getMyLocations: () => api.get('/field/employee/locations'),
  saveLocation: (data: { location_id: string; latitude: number; longitude: number; description?: string }) =>
    api.post('/field/employee/locations', data),
  getMyFieldVisits: () => api.get('/field/employee/field-visits'),
  getMyTrainings: () => api.get('/field/employee/trainings'),
  getMyPeers: () => api.get('/field/employee/peers'),
  getMyFeedback: () => api.get('/field/employee/feedback'),
  getLocationById: (locationId: string) => api.get(`/field/employee/locations/by-id/${locationId}`),
  deleteLocation: (id: number) => api.delete(`/field/employee/locations/${id}`),
  submitSurveySubmission: (data: { survey_id: number; area_covered: string; time_taken: string; notes?: string; file_document_ids?: any[] }) =>
    api.post('/field/employee/surveys/submit', data),
  uploadSurveyFiles: (submissionId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/surveys/submissions/${submissionId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSurveyFile: (fileId: number) => api.get(`/surveys/files/${fileId}`, { responseType: 'blob' }),
  getSubmissionFiles: (submissionId: number) => api.get(`/surveys/submissions/${submissionId}/files`),
  getAvailableSkills: () => api.get('/field/employee/skills/available'),
  getMySkills: () => api.get('/field/employee/skills'),
  saveMySkills: (skills: string[]) => api.post('/field/employee/skills', { skills }),
};

export default api;

