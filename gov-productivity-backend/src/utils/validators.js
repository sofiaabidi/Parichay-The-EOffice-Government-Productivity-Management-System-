const Joi = require('joi');

const roleEnum = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'FIELD_MANAGER', 'FIELD_EMPLOYEE', 'HQ_ORG', 'FIELD_ORG'];
const taskStatusEnum = ['pending', 'in-progress', 'completed', 'delayed', 'rejected', 'awaiting-review'];
const priorityEnum = ['low', 'medium', 'high'];
const trainingStatusEnum = ['completed', 'upcoming', 'in-progress'];
const messageTypeEnum = ['general', 'task', 'alert'];

const emailField = Joi.string()
  .email({ tlds: { allow: false } })
  .required();

const registerSchema = Joi.object({
  name: Joi.string().max(150).required(),
  email: emailField,
  password: Joi.string().min(8).required(),
  role: Joi.string().valid(...roleEnum).required(),
  department: Joi.string().allow(null, ''),
  designation: Joi.string().allow(null, ''),
});

const loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().required(),
});

const createTaskSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  projectId: Joi.number().integer().allow(null),
  milestoneId: Joi.number().integer().allow(null),
  assignedTo: Joi.number().integer().required(),
  priority: Joi.string().valid(...priorityEnum).default('medium'),
  dueDate: Joi.date().iso().required(),
  expectedOutput: Joi.string().allow('', null),
  cost: Joi.string().allow('', null),
  skillIds: Joi.array().items(Joi.number().integer()).allow(null).optional(),
});

const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid(...taskStatusEnum).required(),
  completedAt: Joi.date().iso().optional(),
  feedback: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().allow('', null).required(),
  }).optional(),
});

const createFileSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  taskId: Joi.number().integer().allow(null),
  managerId: Joi.number().integer().allow(null),
  complexity: Joi.string().valid('low', 'medium', 'high').required(),
  complexityWeight: Joi.number().positive().default(1),
  targetTimeHours: Joi.number().positive().required(),
  slaTimeHours: Joi.number().positive().required(),
  isDigital: Joi.boolean().required(),
});

const completeFileSchema = Joi.object({
  completedAt: Joi.date().iso().optional(),
  grammarScore: Joi.number().min(0).max(1).allow(null),
  clarityScore: Joi.number().min(0).max(1).allow(null),
  isDigital: Joi.boolean().optional(),
});

const reviewFileSchema = Joi.object({
  grammarScore: Joi.number().min(0).max(1).optional(),
  clarityScore: Joi.number().min(0).max(1).optional(),
});

const checkInSchema = Joi.object({
  date: Joi.date().iso().optional(),
});

const checkOutSchema = Joi.object({
  date: Joi.date().iso().optional(),
});

const attendanceUpdateSchema = Joi.object({
  status: Joi.string().valid('present', 'absent', 'half-day').optional(),
  checkInTime: Joi.date().iso().optional(),
  checkOutTime: Joi.date().iso().optional(),
});

const feedbackSchema = Joi.object({
  toUserId: Joi.number().integer().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('', null),
});

const peerFeedbackSchema = Joi.object({
  toUserId: Joi.number().integer().required(),
  regarding: Joi.string().max(200).allow('', null),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('', null),
});

const managerFeedbackSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  regarding: Joi.string().max(200).allow('', null),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('', null),
});

const createProjectSchema = Joi.object({
  name: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'on-hold', 'completed').default('active'),
  startDate: Joi.date().iso().optional(),
  dueDate: Joi.date().iso().optional(),
  memberIds: Joi.array().items(Joi.number().integer()).optional(),
  budget: Joi.string().allow('', null).optional(),
  dprDeadline: Joi.date().iso().allow(null).optional(),
  project_type: Joi.string().valid('hq', 'field').optional(),
  milestones: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      deadline: Joi.date().iso().allow(null).optional(),
      budget: Joi.string().allow('', null).optional(),
      expectedOutput: Joi.string().allow('', null).optional(),
      description: Joi.string().allow('', null).optional(),
    })
  ).optional(),
});

const trainingSchema = Joi.object({
  userId: Joi.number().integer().required(),
  name: Joi.string().required(),
  status: Joi.string().valid(...trainingStatusEnum).required(),
  startDate: Joi.date().iso().optional(),
  completionDate: Joi.date().iso().allow(null),
  durationHours: Joi.number().positive().allow(null),
});

const recognitionSchema = Joi.object({
  userId: Joi.number().integer().required(),
  title: Joi.string().required(),
  type: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  date: Joi.date().iso().required(),
  issuedBy: Joi.string().allow('', null),
});

const skillSchema = Joi.object({
  name: Joi.string().max(120).required(),
  userId: Joi.number().integer().optional(),
});

const badgeSchema = Joi.object({
  userId: Joi.number().integer().required(),
  name: Joi.string().max(150).required(),
  description: Joi.string().allow('', null),
  icon: Joi.string().allow('', null),
  awardedAt: Joi.date().iso().optional(),
  metadata: Joi.object().optional(),
});

const notificationReadSchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer()).min(1).required(),
});

const messageSchema = Joi.object({
  receiverId: Joi.number().integer().required(),
  subject: Joi.string().max(200).allow('', null),
  body: Joi.string().max(5000).required(),
  messageType: Joi.string().valid(...messageTypeEnum).default('general'),
  relatedTaskId: Joi.number().integer().allow(null),
});

const kpiAdjustmentSchema = Joi.object({
  delta: Joi.number().min(-20).max(20).required(),
  reason: Joi.string().max(500).allow('', null),
  periodStart: Joi.date().iso().optional(),
  periodEnd: Joi.date().iso().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskStatusSchema,
  createFileSchema,
  completeFileSchema,
  reviewFileSchema,
  checkInSchema,
  checkOutSchema,
  attendanceUpdateSchema,
  feedbackSchema,
  peerFeedbackSchema,
  managerFeedbackSchema,
  createProjectSchema,
  trainingSchema,
  recognitionSchema,
  skillSchema,
  badgeSchema,
  notificationReadSchema,
  messageSchema,
  kpiAdjustmentSchema,
};

