/**
 * Service for managing weekly KPI snapshots for field employees and managers
 * Calculates and stores weekly aggregated KPI scores
 */

const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Calculate the average KPI score for all field employees and managers for a given week
 * Formula: (sum of all field employees final_kpi + sum of all field managers final_kpi) / 
 *          (total number of field employees + total number of field managers)
 * 
 * @param {Date|string} weekStart - Start date of the week (Monday)
 * @param {Date|string} weekEnd - End date of the week (Sunday)
 * @returns {Promise<Object>} - Object containing average KPI and counts
 */
const calculateWeeklyFieldKpi = async (weekStart, weekEnd) => {
  try {
    // Ensure dates are in correct format
    const startDate = weekStart instanceof Date ? weekStart.toISOString().slice(0, 10) : weekStart;
    const endDate = weekEnd instanceof Date ? weekEnd.toISOString().slice(0, 10) : weekEnd;

    logger.info(`[Weekly KPI] Calculating weekly field KPI for period: ${startDate} to ${endDate}`);

    // Get all field employees' final KPI for the period
    const { rows: employeeKpis } = await query(
      `
        SELECT 
          user_id,
          final_kpi
        FROM field_employee_kpi_snapshots
        WHERE period_start = $1
          AND period_end = $2
          AND user_id IN (
            SELECT id FROM users 
            WHERE role = 'FIELD_EMPLOYEE' 
              AND is_active = TRUE
          )
      `,
      [startDate, endDate]
    );

    // Get all field managers' final KPI for the period
    const { rows: managerKpis } = await query(
      `
        SELECT 
          manager_id as user_id,
          final_kpi
        FROM manager_kpi_snapshots
        WHERE period_start = $1
          AND period_end = $2
          AND manager_id IN (
            SELECT id FROM users 
            WHERE role = 'FIELD_MANAGER' 
              AND is_active = TRUE
          )
      `,
      [startDate, endDate]
    );

    // Get total counts of active field users
    const { rows: userCounts } = await query(
      `
        SELECT 
          COUNT(CASE WHEN role = 'FIELD_EMPLOYEE' THEN 1 END) as total_employees,
          COUNT(CASE WHEN role = 'FIELD_MANAGER' THEN 1 END) as total_managers
        FROM users
        WHERE role IN ('FIELD_EMPLOYEE', 'FIELD_MANAGER')
          AND is_active = TRUE
      `
    );

    const totalFieldEmployees = parseInt(userCounts[0]?.total_employees || 0);
    const totalFieldManagers = parseInt(userCounts[0]?.total_managers || 0);
    const totalFieldUsers = totalFieldEmployees + totalFieldManagers;

    // Calculate sum of all KPIs
    let sumKpi = 0;
    let countKpi = 0;

    employeeKpis.forEach(row => {
      if (row.final_kpi !== null && !isNaN(row.final_kpi)) {
        sumKpi += parseFloat(row.final_kpi);
        countKpi++;
      }
    });

    managerKpis.forEach(row => {
      if (row.final_kpi !== null && !isNaN(row.final_kpi)) {
        sumKpi += parseFloat(row.final_kpi);
        countKpi++;
      }
    });

    // Calculate average
    // If we have KPI data, use the average of those with KPIs
    // Otherwise, if we have users but no KPIs, return 0
    let averageKpi = 0;
    if (countKpi > 0) {
      averageKpi = sumKpi / countKpi;
    } else if (totalFieldUsers > 0) {
      // If we have users but no KPI data, we could return 0 or null
      // For now, return 0 to indicate no data available
      logger.warn(`[Weekly KPI] No KPI data found for period ${startDate} to ${endDate}, but ${totalFieldUsers} field users exist`);
    }

    logger.info(`[Weekly KPI] Calculated average: ${averageKpi.toFixed(2)}, from ${countKpi} users with KPI data out of ${totalFieldUsers} total field users`);

    return {
      average_kpi_scores_of_field: Math.round(averageKpi * 100) / 100, // Round to 2 decimal places
      total_field_employees: totalFieldEmployees,
      total_field_managers: totalFieldManagers,
      users_with_kpi: countKpi,
      total_field_users: totalFieldUsers
    };
  } catch (error) {
    logger.error(`[Weekly KPI] Error calculating weekly field KPI:`, error);
    throw error;
  }
};

/**
 * Get the Monday of the current week
 * @returns {Date} - Monday of current week
 */
const getCurrentWeekMonday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(today);
  monday.setDate(diff);
  return monday;
};

/**
 * Get the Sunday of the current week
 * @returns {Date} - Sunday of current week
 */
const getCurrentWeekSunday = () => {
  const monday = getCurrentWeekMonday();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
};

/**
 * Record weekly KPI snapshot for the current week
 * @param {Date|string} weekStart - Optional: Start date of the week (defaults to current week Monday)
 * @param {Date|string} weekEnd - Optional: End date of the week (defaults to current week Sunday)
 * @returns {Promise<Object>} - Inserted/updated record
 */
const recordWeeklyKpiSnapshot = async (weekStart = null, weekEnd = null) => {
  try {
    const startDate = weekStart || getCurrentWeekMonday();
    const endDate = weekEnd || getCurrentWeekSunday();

    const startDateStr = startDate instanceof Date ? startDate.toISOString().slice(0, 10) : startDate;
    const endDateStr = endDate instanceof Date ? endDate.toISOString().slice(0, 10) : endDate;

    // Use Monday as the timestamp for the weekly snapshot
    const timestamp = startDateStr;

    logger.info(`[Weekly KPI] Recording weekly snapshot for week starting ${timestamp}`);

    // Calculate the average KPI
    const kpiData = await calculateWeeklyFieldKpi(startDateStr, endDateStr);

    // Insert or update the snapshot
    const { rows } = await query(
      `
        INSERT INTO weekly_kpi_snapshots_field (
          timestamp,
          average_kpi_scores_of_field,
          total_field_employees,
          total_field_managers
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (timestamp) 
        DO UPDATE SET
          average_kpi_scores_of_field = EXCLUDED.average_kpi_scores_of_field,
          total_field_employees = EXCLUDED.total_field_employees,
          total_field_managers = EXCLUDED.total_field_managers,
          updated_at = NOW()
        RETURNING *
      `,
      [
        timestamp,
        kpiData.average_kpi_scores_of_field,
        kpiData.total_field_employees,
        kpiData.total_field_managers
      ]
    );

    logger.info(`[Weekly KPI] Successfully recorded weekly snapshot for ${timestamp}: ${kpiData.average_kpi_scores_of_field}`);

    return {
      ...rows[0],
      users_with_kpi: kpiData.users_with_kpi,
      total_field_users: kpiData.total_field_users
    };
  } catch (error) {
    logger.error(`[Weekly KPI] Error recording weekly snapshot:`, error);
    throw error;
  }
};

/**
 * Get weekly KPI snapshots
 * @param {number} limit - Number of records to return (default: 30)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Array>} - Array of weekly KPI snapshots
 */
const getWeeklyKpiSnapshots = async (limit = 30, offset = 0) => {
  try {
    const { rows } = await query(
      `
        SELECT *
        FROM weekly_kpi_snapshots_field
        ORDER BY timestamp DESC
        LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    return rows;
  } catch (error) {
    logger.error(`[Weekly KPI] Error fetching weekly snapshots:`, error);
    throw error;
  }
};

/**
 * Get the latest weekly KPI snapshot
 * @returns {Promise<Object|null>} - Latest snapshot or null
 */
const getLatestWeeklyKpiSnapshot = async () => {
  try {
    const { rows } = await query(
      `
        SELECT *
        FROM weekly_kpi_snapshots_field
        ORDER BY timestamp DESC
        LIMIT 1
      `
    );

    return rows[0] || null;
  } catch (error) {
    logger.error(`[Weekly KPI] Error fetching latest snapshot:`, error);
    throw error;
  }
};

/**
 * Check if we need to record a new weekly snapshot
 * This should be called on server startup to ensure we have the current week's data
 * @returns {Promise<boolean>} - True if a new snapshot was created, false otherwise
 */
const checkAndRecordWeeklySnapshot = async () => {
  try {
    const currentWeekMonday = getCurrentWeekMonday();
    const currentWeekMondayStr = currentWeekMonday.toISOString().slice(0, 10);

    // Check if we already have a snapshot for this week
    const existing = await query(
      `SELECT id FROM weekly_kpi_snapshots_field WHERE timestamp = $1`,
      [currentWeekMondayStr]
    );

    if (existing.rows.length > 0) {
      logger.info(`[Weekly KPI] Snapshot already exists for week starting ${currentWeekMondayStr}`);
      return false;
    }

    // Record new snapshot
    await recordWeeklyKpiSnapshot();
    return true;
  } catch (error) {
    logger.error(`[Weekly KPI] Error checking/recording weekly snapshot:`, error);
    return false;
  }
};

module.exports = {
  calculateWeeklyFieldKpi,
  recordWeeklyKpiSnapshot,
  getWeeklyKpiSnapshots,
  getLatestWeeklyKpiSnapshot,
  checkAndRecordWeeklySnapshot,
  getCurrentWeekMonday,
  getCurrentWeekSunday
};

