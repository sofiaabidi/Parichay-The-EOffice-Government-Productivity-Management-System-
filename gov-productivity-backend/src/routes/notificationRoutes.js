const { Router } = require('express');
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { notificationReadSchema } = require('../utils/validators');

const router = Router();

router.use(auth);

router.get('/', notificationController.listNotifications);
router.post('/read', validateRequest(notificationReadSchema), notificationController.markNotificationsRead);

module.exports = router;


