const { Router } = require('express');
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { loginSchema } = require('../utils/validators');

const router = Router();

// Field Manager login endpoint
router.post(
  '/manager/login',
  validateRequest(loginSchema),
  authController.loginFieldManager,
);

// Field Employee login endpoint
router.post(
  '/employee/login',
  validateRequest(loginSchema),
  authController.loginFieldEmployee,
);

module.exports = router;

