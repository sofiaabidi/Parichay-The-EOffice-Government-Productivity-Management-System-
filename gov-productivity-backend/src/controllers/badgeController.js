const badgeService = require('../services/badgeService');

const generateBadges = async (req, res, next) => {
  try {
    const result = await badgeService.generateSystemBadges();
    res.json({
      success: true,
      message: `Generated ${result.badgesAwarded} badges`,
      ...result,
    });
  } catch (error) {
    console.error('Error in generateBadges controller:', error);
    next(error);
  }
};

module.exports = {
  generateBadges,
};

