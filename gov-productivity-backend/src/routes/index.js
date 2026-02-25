const { Router } = require('express');
const authRoutes = require('./authRoutes');
const fieldAuthRoutes = require('./fieldAuthRoutes');
const fieldEmployeeRoutes = require('./fieldEmployeeRoutes');
const fieldManagerRoutes = require('./fieldManagerRoutes');
const surveyRoutes = require('./surveyRoutes');
const userRoutes = require('./userRoutes');
const kpiRoutes = require('./kpiRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const fieldEmployeeAttendanceRoutes = require('./fieldEmployeeAttendanceRoutes');
const taskRoutes = require('./taskRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const fileRoutes = require('./fileRoutes');
const projectRoutes = require('./projectRoutes');
const managerRoutes = require('./managerRoutes');
const notificationRoutes = require('./notificationRoutes');
const milestoneRoutes = require('./milestoneRoutes');
const taskSubmissionRoutes = require('./taskSubmissionRoutes');
const hqOrgRoutes = require('./hqOrgRoutes');
const fieldOrgRoutes = require('./fieldOrgRoutes');
const promotionScoreRoutes = require('./promotionScoreRoutes');
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

router.use('/auth', authRoutes);
router.use('/field/auth', fieldAuthRoutes);
router.use('/field/employee', fieldEmployeeRoutes);
router.use('/field/manager', fieldManagerRoutes);
router.use('/surveys', surveyRoutes);
router.use('/users', userRoutes);
router.use('/kpis', kpiRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/field-employee-attendance', fieldEmployeeAttendanceRoutes);
router.use('/tasks', taskRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/files', fileRoutes);
router.use('/projects', projectRoutes);
router.use('/manager', managerRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', milestoneRoutes);
router.use('/task-submissions', taskSubmissionRoutes);
router.use('/hq-org', hqOrgRoutes);
router.use('/field-org', fieldOrgRoutes);
router.use('/promotion-scores', promotionScoreRoutes);

router.get('/audit/logs', auth, roleCheck('ADMIN'), auditController.listRecent);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;