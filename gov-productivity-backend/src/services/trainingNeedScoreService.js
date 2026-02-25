/**
 * Service for calculating and managing training need scores for field employees
 * Training Need Score = normalized combination of (low KPI, high absentee, low skill score)
 * HIGHER score = Higher training need (better candidate for training)
 */

const { query } = require('../config/database');
const promotionScoreService = require('./promotionScoreService');
const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');

// Default period for calculations (30 days)
const CALCULATION_PERIOD_DAYS = 30;

/**
 * Normalize a value using min-max normalization
 * normalized_value = (value - min) / (max - min)
 * If max === min, return 0.5 (middle value)
 */
const normalize = (value, min, max) => {
  if (max === min) {
    return 0.5; // Return middle value if all values are same
  }
  return (value - min) / (max - min);
};

/**
 * Get overall KPI for a field employee (latest snapshot)
 */
const getKpi = async (userId) => {
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
const getAbsentees = async (userId, days = CALCULATION_PERIOD_DAYS) => {
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
 * Get average skill score for a field employee
 * Returns null if employee has no tasks (to distinguish from 0 skill score)
 */
const getAvgSkillScore = async (userId) => {
  const sql = `
    SELECT 
      AVG(skill_score) as avg_skill_score,
      COUNT(*) as task_count
    FROM skill_score
    WHERE user_id = $1
  `;
  const { rows } = await query(sql, [userId]);
  if (rows.length > 0 && parseInt(rows[0].task_count || 0) > 0) {
    return parseFloat(rows[0].avg_skill_score || 0);
  }
  return null; // No tasks assigned - return null to indicate missing data
};


/**
 * Get all field employees with their raw training need data
 */
const getAllFieldEmployeesTrainingData = async () => {
  // Get all field employees
  const employeesSql = `
    SELECT u.id, u.name
    FROM users u
    WHERE u.role = 'FIELD_EMPLOYEE'
      AND u.is_active = TRUE
  `;
  const { rows: employees } = await query(employeesSql);

  const trainingData = [];

  for (const employee of employees) {
    const userId = employee.id;
    
    const kpi = await getKpi(userId);
    const absentee = await getAbsentees(userId);
    const avgSkillScore = await getAvgSkillScore(userId);

    trainingData.push({
      userId,
      name: employee.name,
      kpi,
      absentee,
      avgSkillScore,
    });
  }

  return trainingData;
};

/**
 * Calculate training need score for all field employees
 * HIGHER score = Higher training need (better candidate for training)
 * Formula: Normalized combination where:
 * - Lower KPI = Higher need (inverted, contributes positively)
 * - Higher absentee = Higher need (contributes positively)
 * - Lower skill score = Higher need (inverted, contributes positively)
 */
const calculateAndStoreTrainingNeedScores = async () => {
  console.log('[Training Need Score] ========================================');
  console.log('[Training Need Score] Starting calculation for all field employees...');
  
  try {
    // Get all field employees with their raw data
    const trainingData = await getAllFieldEmployeesTrainingData();
    console.log(`[Training Need Score] Found ${trainingData.length} field employees`);

    if (trainingData.length === 0) {
      console.log('[Training Need Score] No field employees found - returning empty array');
      console.log('[Training Need Score] ========================================');
      return [];
    }

    // Filter out employees with no skill scores (no tasks assigned) for normalization
    // But we'll still include them in final results with a penalty
    const employeesWithSkills = trainingData.filter(d => d.avgSkillScore !== null);
    const employeesWithoutSkills = trainingData.filter(d => d.avgSkillScore === null);

    // Find min and max for normalization (only from employees with skill scores)
    const kpis = trainingData.map(d => d.kpi);
    const absentees = trainingData.map(d => d.absentee);
    const skillScores = employeesWithSkills.map(d => d.avgSkillScore);

    const minKpi = Math.min(...kpis);
    const maxKpi = Math.max(...kpis);
    const minAbsentee = Math.min(...absentees);
    const maxAbsentee = Math.max(...absentees);
    const minSkillScore = skillScores.length > 0 ? Math.min(...skillScores) : 0;
    const maxSkillScore = skillScores.length > 0 ? Math.max(...skillScores) : 1;

    console.log('[Training Need Score] Normalization ranges:', {
      kpi: [minKpi, maxKpi],
      absentee: [minAbsentee, maxAbsentee],
      skillScore: [minSkillScore, maxSkillScore],
      employeesWithSkills: employeesWithSkills.length,
      employeesWithoutSkills: employeesWithoutSkills.length,
    });

    // Calculate training need scores
    // HIGHER score = Higher training need (better candidate for training)
    // Weights: KPI (40%), Absentee (30%), Skill Score (30%)
    const scoresWithData = trainingData.map(data => {
      // Normalize values (0-1)
      const normalizedKpi = normalize(data.kpi, minKpi, maxKpi);
      const normalizedAbsentee = normalize(data.absentee, minAbsentee, maxAbsentee);
      
      // Handle skill score: if null (no tasks), treat as 0 (worst case for training need)
      const skillScoreForCalc = data.avgSkillScore !== null ? data.avgSkillScore : 0;
      const normalizedSkillScore = normalize(skillScoreForCalc, minSkillScore, maxSkillScore);

      // Invert KPI and Skill Score (lower = higher need, so invert to get positive contribution)
      // Keep Absentee as is (higher = higher need)
      const invertedKpi = 1 - normalizedKpi;
      const invertedSkillScore = 1 - normalizedSkillScore;

      // Calculate training need score (weighted combination)
      // HIGHER score = Higher training need (better candidate for training)
      const trainingNeedScore = 
        0.40 * invertedKpi +           // Lower KPI = Higher need
        0.30 * normalizedAbsentee +    // Higher absentee = Higher need
        0.30 * invertedSkillScore;     // Lower skill = Higher need

      return {
        ...data,
        trainingNeedScore: Math.max(0, Math.min(1, trainingNeedScore)), // Clamp between 0 and 1
      };
    });

    // Store in database
    const results = [];
    const errors = [];
    
    for (const data of scoresWithData) {
      try {
        const sql = `
          INSERT INTO training_need_scores (
            user_id, kpi, absentee, avg_skill_score, training_need_score
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id)
          DO UPDATE SET
            kpi = EXCLUDED.kpi,
            absentee = EXCLUDED.absentee,
            avg_skill_score = EXCLUDED.avg_skill_score,
            training_need_score = EXCLUDED.training_need_score,
            calculated_at = NOW(),
            updated_at = NOW()
          RETURNING *
        `;

        const { rows } = await query(sql, [
          data.userId,
          data.kpi,
          data.absentee,
          data.avgSkillScore !== null ? data.avgSkillScore : null,
          data.trainingNeedScore,
        ]);

        if (rows && rows.length > 0) {
          results.push(rows[0]);
          console.log(`[Training Need Score] Stored training need score for user ${data.userId} (${data.name}): ${data.trainingNeedScore.toFixed(6)}`);
        } else {
          errors.push({ userId: data.userId, error: 'No rows returned from database' });
          console.error(`[Training Need Score] Failed to store training need score for user ${data.userId} - no rows returned`);
        }
      } catch (err) {
        errors.push({ userId: data.userId, error: err.message });
        console.error(`[Training Need Score] Error storing training need score for user ${data.userId}:`, err);
      }
    }

    if (errors.length > 0) {
      console.error(`[Training Need Score] ⚠️  Completed with ${errors.length} errors out of ${scoresWithData.length} employees`);
      console.error(`[Training Need Score] Errors:`, errors);
    } else {
      console.log(`[Training Need Score] ✅ Successfully calculated and stored training need scores for ${results.length} employees`);
    }
    
    console.log(`[Training Need Score] ========================================`);
    return results;
  } catch (error) {
    console.error('[Training Need Score] ❌ Fatal error in calculateAndStoreTrainingNeedScores:', error);
    console.error('[Training Need Score] Error stack:', error.stack);
    console.log('[Training Need Score] ========================================');
    throw error;
  }
};

/**
 * Get top N employees with highest training needs (highest scores)
 * HIGHER score = Higher training need = Better candidate for training
 */
const getTopTrainingNeeds = async (limit = 5) => {
  const sql = `
    SELECT 
      tns.*,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM training_need_scores tns
    JOIN users u ON u.id = tns.user_id
    WHERE u.role = 'FIELD_EMPLOYEE' AND u.is_active = TRUE
    ORDER BY tns.training_need_score DESC
    LIMIT $1
  `;
  const { rows } = await query(sql, [limit]);
  return rows;
};

/**
 * Get training need score for a specific employee
 */
const getTrainingNeedScore = async (userId) => {
  const sql = `
    SELECT 
      tns.*,
      u.name,
      u.email,
      u.department,
      u.designation
    FROM training_need_scores tns
    JOIN users u ON u.id = tns.user_id
    WHERE tns.user_id = $1
  `;
  const { rows } = await query(sql, [userId]);
  return rows.length > 0 ? rows[0] : null;
};

module.exports = {
  calculateAndStoreTrainingNeedScores,
  getTopTrainingNeeds,
  getTrainingNeedScore,
  getKpi,
  getAbsentees,
  getAvgSkillScore,
};

