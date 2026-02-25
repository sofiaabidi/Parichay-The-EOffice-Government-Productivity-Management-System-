const { Router } = require('express');
const promotionScoreController = require('../controllers/promotionScoreController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

// All routes require authentication
router.use(auth);

// Get all promotion scores (leaderboard) - accessible by ADMIN, FIELD_ORG, FIELD_MANAGER
router.get(
  '/',
  roleCheck(['ADMIN', 'FIELD_ORG', 'FIELD_MANAGER']),
  promotionScoreController.getAllPromotionScores
);

// Get promotion score for a specific employee
router.get(
  '/:userId',
  roleCheck(['ADMIN', 'FIELD_ORG', 'FIELD_MANAGER']),
  promotionScoreController.getPromotionScoreById
);

// Calculate and store promotion scores for all field employees - ADMIN and FIELD_ORG only
router.post(
  '/calculate',
  roleCheck(['ADMIN', 'FIELD_ORG']),
  promotionScoreController.calculateAllPromotionScores
);

// Recalculate promotion score for a specific employee - ADMIN and FIELD_ORG only
router.post(
  '/:userId/recalculate',
  roleCheck(['ADMIN', 'FIELD_ORG']),
  promotionScoreController.recalculatePromotionScore
);

module.exports = router;

