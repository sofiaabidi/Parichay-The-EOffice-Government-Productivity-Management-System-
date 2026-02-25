const { Router } = require('express');
const fieldEmployeeAttendanceController = require('../controllers/fieldEmployeeAttendanceController');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { checkInSchema, checkOutSchema } = require('../utils/validators');

const router = Router();

router.post('/check-in', auth, validateRequest(checkInSchema), fieldEmployeeAttendanceController.checkIn);
router.post('/check-out', auth, validateRequest(checkOutSchema), fieldEmployeeAttendanceController.checkOut);
router.get('/my', auth, fieldEmployeeAttendanceController.getMyAttendance);
router.get('/today', auth, fieldEmployeeAttendanceController.getTodayAttendance);

module.exports = router;

