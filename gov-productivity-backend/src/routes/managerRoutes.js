const { Router } = require('express');
const managerController = require('../controllers/managerController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

router.use(auth, roleCheck('MANAGER', 'ADMIN'));

router.get('/dashboard/summary', managerController.getSummary);
router.get('/dashboard/leaderboard', managerController.getLeaderboard);
router.get('/dashboard/status-breakdown', managerController.getStatusBreakdown);
router.get('/dashboard/trends', managerController.getTrends);
router.get('/dashboard/pending-approvals', managerController.getPendingApprovals);

module.exports = router;

