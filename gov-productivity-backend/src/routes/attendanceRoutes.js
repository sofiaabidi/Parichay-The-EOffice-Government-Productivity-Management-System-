const { Router } = require('express');
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');
const { checkInSchema, checkOutSchema, attendanceUpdateSchema } = require('../utils/validators');

const router = Router();

router.post('/check-in', auth, validateRequest(checkInSchema), attendanceController.checkIn);
router.post('/check-out', auth, validateRequest(checkOutSchema), attendanceController.checkOut);
router.get('/my', auth, attendanceController.getMyAttendance);
router.patch(
  '/:id',
  auth,
  roleCheck('MANAGER', 'ADMIN'),
  validateRequest(attendanceUpdateSchema),
  attendanceController.updateRecord,
);

module.exports = router;

