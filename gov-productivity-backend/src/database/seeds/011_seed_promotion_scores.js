

require('dotenv').config();
const promotionScoreService = require('../../services/promotionScoreService');

const seedPromotionScores = async () => {
  console.log('[Seed] Starting promotion scores seeding...');
  console.log('[Seed] This will calculate and store promotion scores for all field employees');
  console.log('[Seed] Data will be retrieved from:');
  console.log('  - field_employee_kpi_snapshots (for overall_kpi)');
  console.log('  - field_employee_attendance (for absentees)');
  console.log('  - dpr_reviews (for stars)');
  console.log('  - Team average KPI (for team_contribution)');
  console.log('');

  try {
    
    const results = await promotionScoreService.calculateAndStorePromotionScores();

    console.log('');
    console.log('[Seed] Promotion scores seeding complete!');
    console.log(`[Seed] Successfully calculated and stored promotion scores for ${results.length} field employees`);
    console.log('');
    console.log('[Seed] Sample results:');
    
    // Show first 5 results as sample
    results.slice(0, 5).forEach((result, index) => {
      const teamContribution = parseFloat(result.team_contribution) || 0;
      const stars = parseFloat(result.stars) || 0;
      const promotionScore = parseFloat(result.promotion_score) || 0;
      const overallKpi = parseFloat(result.overall_kpi) || 0;
      
      console.log(`  ${index + 1}. User ID: ${result.user_id}`);
      console.log(`     - Overall KPI: ${overallKpi.toFixed(2)}`);
      console.log(`     - Absentees: ${result.absentees || 0}`);
      console.log(`     - Team Contribution: ${teamContribution.toFixed(4)}`);
      console.log(`     - Stars: ${stars.toFixed(2)}`);
      console.log(`     - Promotion Score: ${promotionScore.toFixed(4)}`);
      console.log('');
    });

    if (results.length > 5) {
      console.log(`  ... and ${results.length - 5} more employees`);
    }

    console.log('');
    console.log('[Seed] You can now query the promotion_score table to see all scores');
    console.log('[Seed] Or use the API endpoints:');
    console.log('  - GET /field/employee/promotion-score (for field employees)');
    console.log('  - GET /field-org/promotion-scores (for field orgs)');
    console.log('  - GET /promotion-scores (for admins/managers)');

  } catch (error) {
    console.error('[Seed] Error seeding promotion scores:', error);
    console.error('[Seed] Error details:', error.message);
    if (error.stack) {
      console.error('[Seed] Stack trace:', error.stack);
    }
    throw error;
  }
};

// Run the seed
seedPromotionScores()
  .then(() => {
    console.log('[Seed] Promotion scores seeding finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Seed] Promotion scores seeding failed:', error);
    process.exit(1);
  });

