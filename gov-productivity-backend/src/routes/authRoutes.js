const { Router } = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../utils/validators');

const router = Router();

router.post(
  '/register',
  auth,
  roleCheck('ADMIN'),
  validateRequest(registerSchema),
  authController.register,
);

router.post('/login', validateRequest(loginSchema), authController.login);

router.get('/me', auth, authController.me);
router.post('/logout', auth, authController.logout);

module.exports = router;