

const { query } = require('../config/database');
const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');
const fieldOrgService = require('./fieldOrgService');

// Default period for absentees calculation (in days)
const ABSENTEES_PERIOD_DAYS = 30;

// Guard flag to prevent recursive/parallel promotion score calculations
let isCalculatingPromotionScores = false;


const normalize = (value, min, max) => {
  if (max === min) {
    return value === 0 ? 0 : 1;
  }
  return (value - min) / (max - min);
};

/**
 * Get overall KPI for a field employee (latest snapshot)
 */
const getOverallKpi = async (userId) => {
  const sql = `
    SELECT final_kpi
    FROM field_employee_kpi_snapshots
    WHERE user_id = $1
    ORDER BY period_end DESC
    LIMIT 1
  `;
  const { rows } = await query(sql, [userId]);
  return rows.length > 0 ? parseFloat(rows[0].final_kpi || 0) : 0;
};

/**
 * Get total number of absentees for a field employee in past period
 */
const getAbsentees = async (userId, days = ABSENTEES_PERIOD_DAYS) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffDateStr = cutoffDate.toISOString().slice(0, 10);

  const sql = `
    SELECT COUNT(*) as absent_count
    FROM field_employee_attendance
    WHERE user_id = $1
      AND date >= $2
      AND present_absent = 'absent'
  `;
  const { rows } = await query(sql, [userId, cutoffDateStr]);
  return parseInt(rows[0]?.absent_count || 0, 10);
};

/**
 * Get team average KPI (average of all field employees' KPIs)
 * @param {boolean} skipComputation - If true, only reads existing snapshots, never triggers computation
 */
const getTeamScore = async (skipComputation = false) => {
  const result = await fieldOrgService.getAverageEmployeeKPI(null, null, skipComputation);
  return result.averageKPI || 0;
};

/**
 * Calculate team contribution = overall_kpi / team_score
 */
const calculateTeamContribution = async (userId) => {
  const overallKpi = await getOverallKpi(userId);
  const teamScore = await getTeamScore();
  
  if (teamScore === 0) {
    return 0; // Avoid division by zero
  }
  
  return overallKpi / teamScore;
};

/**
 * Get average review stars from feedback (peer + manager feedbacks, NOT DPR reviews)
 * Average of all feedback ratings (1-5 scale)
 */
const getAverageStars = async (userId) => {
  const sql = `
    SELECT 
      AVG(rating) as avg_stars
    FROM (
      SELECT rating FROM peer_feedbacks WHERE to_user_id = $1
      UNION ALL
      SELECT rating FROM manager_feedbacks WHERE employee_id = $1
    ) AS all_feedbacks
  `;
  const { rows } = await query(sql, [userId]);
  return rows.length > 0 ? parseFloat(rows[0].avg_stars || 0) : 0;
};

/**
 * Get all field employees with their raw promotion data
 */
const getAllFieldEmployeesPromotionData = async () => {
  // Get all field employees
  const employeesSql = `
    SELECT u.id, u.name
    FROM users u
    WHERE u.role = 'FIELD_EMPLOYEE'
      AND u.is_active = TRUE
  `;
  const { rows: employees } = await query(employeesSql);

  // Calculate team score once (more efficient)
  // Skip computation to prevent circular dependency - only use existing snapshots
  const teamScore = await getTeamScore(true);
  console.log(`[Promotion Score] Team average KPI: ${teamScore.toFixed(2)}`);

  const promotionData = [];

  for (const employee of employees) {
    const userId = employee.id;
    
    const overallKpi = await getOverallKpi(userId);
    const absentees = await getAbsentees(userId);
    
    // Calculate team contribution using pre-calculated team score
    const teamContribution = teamScore > 0 ? overallKpi / teamScore : 0;
    
    const stars = await getAverageStars(userId);

    promotionData.push({
      userId,
      name: employee.name,
      overallKpi,
      absentees,
      teamContribution,
      stars,
    });
  }

  return promotionData;
};

/**
 * Normalize all promotion parameters across all field employees
 */
const normalizePromotionData = (promotionData) => {
  if (promotionData.length === 0) {
    return [];
  }

  // Find min and max for each parameter
  const overallKpis = promotionData.map(d => d.overallKpi);
  const absenteesList = promotionData.map(d => d.absentees);
  const teamContributions = promotionData.map(d => d.teamContribution);
  const starsList = promotionData.map(d => d.stars);

  const minOverallKpi = Math.min(...overallKpis);
  const maxOverallKpi = Math.max(...overallKpis);
  const minAbsentees = Math.min(...absenteesList);
  const maxAbsentees = Math.max(...absenteesList);
  const minTeamContribution = Math.min(...teamContributions);
  const maxTeamContribution = Math.max(...teamContributions);
  const minStars = Math.min(...starsList);
  const maxStars = Math.max(...starsList);

  // Normalize each employee's data
  return promotionData.map(data => {
    // For absentees, we want lower to be better, so we invert: 1 - normalized
    const normalizedAbsentees = 1 - normalize(data.absentees, minAbsentees, maxAbsentees);

    return {
      ...data,
      normalizedOverallKpi: normalize(data.overallKpi, minOverallKpi, maxOverallKpi),
      normalizedAbsentees: normalizedAbsentees,
      normalizedTeamContribution: normalize(data.teamContribution, minTeamContribution, maxTeamContribution),
      normalizedStars: normalize(data.stars, minStars, maxStars),
    };
  });
};

/**
 * Calculate promotion score for a single employee
 * Promotion Score = 0.6*normalized_overall_kpi + 0.2*(normalized_absentees + normalized_team_contribution) + 0.2*normalized_stars
 */
const calculatePromotionScore = (normalizedData) => {
  const score = 
    0.6 * normalizedData.normalizedOverallKpi +
    0.2 * (normalizedData.normalizedAbsentees + normalizedData.normalizedTeamContribution) +
    0.2 * normalizedData.normalizedStars;

  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
};

/**
 * Calculate and store promotion scores for all field employees
 */
const calculateAndStorePromotionScores = async () => {
  // Prevent multiple simultaneous calculations
  if (isCalculatingPromotionScores) {
    console.log('[Promotion Score] ⚠️  Calculation already in progress, skipping duplicate call');
    return [];
  }
  
  isCalculatingPromotionScores = true;
  console.log('[Promotion Score] ========================================');
  console.log('[Promotion Score] Starting calculation for all field employees...');
  
  try {
    // Get all field employees with their raw data
    const promotionData = await getAllFieldEmployeesPromotionData();
    console.log(`[Promotion Score] Found ${promotionData.length} field employees`);

    if (promotionData.length === 0) {
      console.log('[Promotion Score] No field employees found - returning empty array');
      console.log('[Promotion Score] ========================================');
      return [];
    }

    // Log summary of raw data
    console.log(`[Promotion Score] Raw data summary:`, {
      totalEmployees: promotionData.length,
      kpiRange: [
        Math.min(...promotionData.map(d => d.overallKpi)),
        Math.max(...promotionData.map(d => d.overallKpi))
      ],
      absenteesRange: [
        Math.min(...promotionData.map(d => d.absentees)),
        Math.max(...promotionData.map(d => d.absentees))
      ],
      starsRange: [
        Math.min(...promotionData.map(d => d.stars)),
        Math.max(...promotionData.map(d => d.stars))
      ],
      teamScore: promotionData[0]?.teamContribution ? 
        (promotionData[0].overallKpi / promotionData[0].teamContribution).toFixed(2) : 'N/A'
    });

    // Normalize all data
    const normalizedData = normalizePromotionData(promotionData);
    console.log(`[Promotion Score] Normalized data for ${normalizedData.length} employees`);

    // Calculate promotion scores
    const scoresWithData = normalizedData.map(data => ({
      ...data,
      promotionScore: calculatePromotionScore(data),
    }));

    // Store in database
    const results = [];
    const errors = [];
    
    for (const data of scoresWithData) {
      try {
        const sql = `
          INSERT INTO promotion_score (
            user_id, overall_kpi, absentees, team_contribution, stars, promotion_score
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id)
          DO UPDATE SET
            overall_kpi = EXCLUDED.overall_kpi,
            absentees = EXCLUDED.absentees,
            team_contribution = EXCLUDED.team_contribution,
            stars = EXCLUDED.stars,
            promotion_score = EXCLUDED.promotion_score,
            updated_at = NOW()
          RETURNING *
        `;

        const { rows } = await query(sql, [
          data.userId,
          data.overallKpi,
          data.absentees,
          data.teamContribution,
          data.stars,
          data.promotionScore,
        ]);

        if (rows && rows.length > 0) {
          results.push(rows[0]);
          console.log(`[Promotion Score] Stored promotion score for user ${data.userId} (${data.name}): ${data.promotionScore.toFixed(4)}`);
        } else {
          errors.push({ userId: data.userId, error: 'No rows returned from database' });
          console.error(`[Promotion Score] Failed to store promotion score for user ${data.userId} - no rows returned`);
        }
      } catch (err) {
        errors.push({ userId: data.userId, error: err.message });
        console.error(`[Promotion Score] Error storing promotion score for user ${data.userId}:`, err);
      }
    }

    if (errors.length > 0) {
      console.error(`[Promotion Score] ⚠️  Completed with ${errors.length} errors out of ${scoresWithData.length} employees`);
      console.error(`[Promotion Score] Errors:`, errors);
    } else {
      console.log(`[Promotion Score] ✅ Successfully calculated and stored promotion scores for ${results.length} employees`);
    }
    
    console.log(`[Promotion Score] ========================================`);
    return results;
  } catch (error) {
    console.error('[Promotion Score] ❌ Fatal error in calculateAndStorePromotionScores:', error);
    console.error('[Promotion Score] Error stack:', error.stack);
    console.log('[Promotion Score] ========================================');
    throw error;
  } finally {
    isCalculatingPromotionScores = false;
  }
};

/**
 * Calculate and store promotion score for a single field employee
 * NOTE: This method recalculates ALL promotion scores because normalization affects all employees.
 * For efficiency, consider using calculateAndStorePromotionScores() directly.
 */
const calculateAndStorePromotionScoreForEmployee = async (userId) => {
  console.log(`[Promotion Score] Calculating promotion score for employee ${userId}...`);
  console.log(`[Promotion Score] NOTE: Recalculating all promotion scores due to normalization requirements`);

  // Verify user is a field employee
  const userSql = `
    SELECT id, name, role
    FROM users
    WHERE id = $1 AND role = 'FIELD_EMPLOYEE' AND is_active = TRUE
  `;
  const { rows: userRows } = await query(userSql, [userId]);
  
  if (userRows.length === 0) {
    throw new Error(`User ${userId} is not an active field employee`);
  }

  // Since normalization affects all employees, recalculate all promotion scores
  // This ensures consistency across all employees
  const allResults = await calculateAndStorePromotionScores();
  
  // Find and return the specific employee's result
  const employeeResult = allResults.find(r => r.user_id === userId);
  
  if (!employeeResult) {
    throw new Error(`Could not find promotion score result for employee ${userId} after recalculation`);
  }

  console.log(`[Promotion Score] Retrieved promotion score for user ${userId}: ${employeeResult.promotion_score}`);
  return employeeResult;
};

/**
 * Get promotion score for a field employee
 */
const getPromotionScore = async (userId) => {
  const sql = `
    SELECT 
      ps.*,
      u.name,
      u.email
    FROM promotion_score ps
    JOIN users u ON u.id = ps.user_id
    WHERE ps.user_id = $1
  `;
  const { rows } = await query(sql, [userId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Get all promotion scores (leaderboard)
 */
const getAllPromotionScores = async (limit = null) => {
  let sql = `
    SELECT 
      ps.*,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM promotion_score ps
    JOIN users u ON u.id = ps.user_id
    WHERE u.role = 'FIELD_EMPLOYEE' AND u.is_active = TRUE
    ORDER BY ps.promotion_score DESC
  `;
  
  if (limit) {
    sql += ` LIMIT $1`;
    const { rows } = await query(sql, [limit]);
    return rows;
  } else {
    const { rows } = await query(sql);
    return rows;
  }
};

module.exports = {
  calculateAndStorePromotionScores,
  calculateAndStorePromotionScoreForEmployee,
  getPromotionScore,
  getAllPromotionScores,
  getOverallKpi,
  getAbsentees,
  calculateTeamContribution,
  getAverageStars,
};

