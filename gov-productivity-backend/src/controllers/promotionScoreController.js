const promotionScoreService = require('../services/promotionScoreService');

/**
 * Get promotion score for the authenticated field employee
 */
const getMyPromotionScore = async (req, res, next) => {
  try {
    console.log(`[Promotion Score Controller] GET /field/employee/promotion-score - Employee ID: ${req.user.id}`);
    
    let promotionScore = await promotionScoreService.getPromotionScore(req.user.id);
    
    // If not found, calculate and store it
    if (!promotionScore) {
      console.log(`[Promotion Score Controller] No promotion score found, calculating for employee ${req.user.id}...`);
      promotionScore = await promotionScoreService.calculateAndStorePromotionScoreForEmployee(req.user.id);
    }
    
    console.log(`[Promotion Score Controller] Returning promotion score for employee ${req.user.id}`);
    res.json(promotionScore);
  } catch (error) {
    console.error(`[Promotion Score Controller] ERROR for employee ${req.user.id}:`, error);
    next(error);
  }
};

/**
 * Calculate and store promotion scores for all field employees (admin/org only)
 */
const calculateAllPromotionScores = async (req, res, next) => {
  try {
    console.log(`[Promotion Score Controller] POST /promotion-scores/calculate - User ID: ${req.user.id}`);
    
    const results = await promotionScoreService.calculateAndStorePromotionScores();
    
    console.log(`[Promotion Score Controller] Calculated promotion scores for ${results.length} employees`);
    res.json({
      message: 'Promotion scores calculated and stored successfully',
      count: results.length,
      results,
    });
  } catch (error) {
    console.error(`[Promotion Score Controller] ERROR calculating promotion scores:`, error);
    next(error);
  }
};

/**
 * Get all promotion scores (leaderboard) - for managers/orgs
 */
const getAllPromotionScores = async (req, res, next) => {
  try {
    console.log(`[Promotion Score Controller] GET /promotion-scores - User ID: ${req.user.id}`);
    
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
    const scores = await promotionScoreService.getAllPromotionScores(limit);
    
    console.log(`[Promotion Score Controller] Returning ${scores.length} promotion scores`);
    res.json(scores);
  } catch (error) {
    console.error(`[Promotion Score Controller] ERROR fetching promotion scores:`, error);
    next(error);
  }
};

/**
 * Get promotion score for a specific employee (by ID) - for managers/orgs
 */
const getPromotionScoreById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(`[Promotion Score Controller] GET /promotion-scores/${userId} - Requested by: ${req.user.id}`);
    
    const promotionScore = await promotionScoreService.getPromotionScore(parseInt(userId, 10));
    
    if (!promotionScore) {
      return res.status(404).json({ message: 'Promotion score not found for this employee' });
    }
    
    console.log(`[Promotion Score Controller] Returning promotion score for employee ${userId}`);
    res.json(promotionScore);
  } catch (error) {
    console.error(`[Promotion Score Controller] ERROR fetching promotion score for ${req.params.userId}:`, error);
    next(error);
  }
};

/**
 * Recalculate promotion score for a specific employee - for managers/orgs
 */
const recalculatePromotionScore = async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(`[Promotion Score Controller] POST /promotion-scores/${userId}/recalculate - Requested by: ${req.user.id}`);
    
    const promotionScore = await promotionScoreService.calculateAndStorePromotionScoreForEmployee(parseInt(userId, 10));
    
    console.log(`[Promotion Score Controller] Recalculated promotion score for employee ${userId}`);
    res.json({
      message: 'Promotion score recalculated successfully',
      promotionScore,
    });
  } catch (error) {
    console.error(`[Promotion Score Controller] ERROR recalculating promotion score for ${userId}:`, error);
    next(error);
  }
};

module.exports = {
  getMyPromotionScore,
  calculateAllPromotionScores,
  getAllPromotionScores,
  getPromotionScoreById,
  recalculatePromotionScore,
};

