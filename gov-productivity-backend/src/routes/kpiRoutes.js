const { Router } = require('express');
const kpiController = require('../controllers/kpiController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');
const { kpiAdjustmentSchema } = require('../utils/validators');

const router = Router();

router.get('/employee/:userId', auth, kpiController.getEmployeeKpi);
router.get('/employee/:userId/history', auth, kpiController.getEmployeeHistory);
router.post(
  '/employee/:userId/adjustments',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  validateRequest(kpiAdjustmentSchema),
  kpiController.adjustEmployeeKpi,
);

router.get(
  '/manager/:managerId',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  kpiController.getManagerKpi,
);

router.get(
  '/manager/:managerId/team-table',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  kpiController.getManagerTeamTable,
);

module.exports = router;

