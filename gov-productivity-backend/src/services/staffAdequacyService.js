const { query } = require('../config/database');
const logger = require('../utils/logger');
const axios = require('axios');

/**
 * Update staff adequacy metrics for all field teams
 * This should be called at midnight to recalculate team_util for the current day
 * @param {string} targetDate - Date in YYYY-MM-DD format (defaults to CURRENT_DATE)
 * @returns {Promise<Object>} Result with updated teams count
 */
const updateAllStaffAdequacy = async (targetDate = null) => {
  try {
    logger.info('[Staff Adequacy] Starting update for all field teams...');
    
    // Use the database function to update all teams
    const dateToUse = targetDate || new Date().toISOString().slice(0, 10);
    const sql = `
      SELECT update_all_staff_adequency_field($1::DATE)
    `;
    
    await query(sql, [dateToUse]);
    
    // Get count of updated teams
    const { rows: countRows } = await query(`
      SELECT COUNT(*) as count
      FROM staff_adequency_field
    `);
    
    const updatedCount = countRows[0]?.count || 0;
    logger.info(`[Staff Adequacy] Successfully updated ${updatedCount} field teams`);
    
    return {
      success: true,
      updatedTeams: parseInt(updatedCount, 10),
      targetDate: targetDate || new Date().toISOString().slice(0, 10),
    };
  } catch (error) {
    logger.error('[Staff Adequacy] Error updating staff adequacy:', error);
    throw error;
  }
};

/**
 * Get staff adequacy data for a specific team
 * @param {number} teamId - Team ID
 * @returns {Promise<Object|null>} Staff adequacy data
 */
const getStaffAdequacyByTeam = async (teamId) => {
  try {
    const { rows } = await query(
      `SELECT * FROM staff_adequency_field WHERE team_id = $1`,
      [teamId]
    );
    return rows[0] || null;
  } catch (error) {
    logger.error(`[Staff Adequacy] Error getting data for team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Get staff adequacy data for all field teams
 * @returns {Promise<Array>} Array of staff adequacy data
 */
const getAllStaffAdequacy = async () => {
  try {
    const { rows } = await query(`
      SELECT 
        saf.*,
        t.name as team_name,
        u.name as manager_name
      FROM staff_adequency_field saf
      JOIN teams t ON t.id = saf.team_id
      JOIN users u ON u.id = t.manager_id
      ORDER BY t.name
    `);
    return rows;
  } catch (error) {
    logger.error('[Staff Adequacy] Error getting all staff adequacy data:', error);
    throw error;
  }
};

/**
 * Manually update staff adequacy for a specific team
 * @param {number} teamId - Team ID
 * @param {string} targetDate - Date in YYYY-MM-DD format (defaults to CURRENT_DATE)
 * @returns {Promise<Object>} Updated staff adequacy data
 */
const updateStaffAdequacyByTeam = async (teamId, targetDate = null) => {
  try {
    const dateParam = targetDate || new Date().toISOString().slice(0, 10);
    await query(
      `SELECT update_staff_adequency_field($1, $2::DATE)`,
      [teamId, dateParam]
    );
    
    return await getStaffAdequacyByTeam(teamId);
  } catch (error) {
    logger.error(`[Staff Adequacy] Error updating team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Predict required people and update status for a specific team using XGBoost model
 * This calls the FastAPI service to get predictions
 * @param {number} teamId - Team ID
 * @returns {Promise<Object>} Updated staff adequacy data with predictions
 */
const predictAndUpdateTeamStatus = async (teamId) => {
  try {
    // First, ensure the team has updated metrics
    await updateStaffAdequacyByTeam(teamId);
    
    // Get current staff adequacy data
    const teamData = await getStaffAdequacyByTeam(teamId);
    if (!teamData) {
      throw new Error(`Team ${teamId} not found in staff_adequency_field`);
    }
    
    // Call FastAPI to get prediction
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
    try {
      const response = await axios.post(
        `${fastApiUrl}/api/v1/staff-adequacy/predict`,
        {
          team_util: parseFloat(teamData.team_util) || 0,
          otm: parseFloat(teamData.otm) || 0,
          cto: parseFloat(teamData.cto) || 0,
          current_team_size: parseInt(teamData.current_team_size) || 0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const predictionResult = response.data;
    const { required_ppl, staff_gap, status } = predictionResult;
    
    // Update the database with predictions and status
    await query(
      `
        UPDATE staff_adequency_field
        SET 
          required_ppl = $1,
          status = $2
        WHERE team_id = $3
      `,
      [required_ppl, status, teamId]
    );
    
    logger.info(`[Staff Adequacy] Updated predictions for team ${teamId}: required_ppl=${required_ppl}, status=${status}`);
    
    // Return updated data
    return await getStaffAdequacyByTeam(teamId);
    } catch (axiosError) {
      if (axiosError.response) {
        const errorData = axiosError.response.data || {};
        throw new Error(errorData.detail || `FastAPI error: ${axiosError.response.statusText}`);
      }
      throw new Error(`FastAPI connection error: ${axiosError.message}`);
    }
  } catch (error) {
    logger.error(`[Staff Adequacy] Error predicting for team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Predict and update status for all field teams
 * @returns {Promise<Object>} Result with updated teams count and overall status
 */
const predictAndUpdateAllTeams = async () => {
  try {
    logger.info('[Staff Adequacy] Starting prediction for all field teams...');
    
    // Get all field teams
    const allTeams = await getAllStaffAdequacy();
    
    let overstaffedGapSum = 0;
    let understaffedGapSum = 0;
    let overstaffedCount = 0;
    let understaffedCount = 0;
    let balancedCount = 0;
    
    // Predict for each team
    for (const team of allTeams) {
      try {
        await predictAndUpdateTeamStatus(team.team_id);
        
        // Get updated data to calculate gaps
        const updatedTeam = await getStaffAdequacyByTeam(team.team_id);
        if (updatedTeam && updatedTeam.status) {
          const staffGap = updatedTeam.current_team_size - (updatedTeam.required_ppl || 0);
          
          if (updatedTeam.status === 'overstaffed') {
            overstaffedGapSum += Math.abs(staffGap);
            overstaffedCount++;
          } else if (updatedTeam.status === 'understaffed') {
            understaffedGapSum += Math.abs(staffGap);
            understaffedCount++;
          } else {
            balancedCount++;
          }
        }
      } catch (error) {
        logger.error(`[Staff Adequacy] Error predicting for team ${team.team_id}:`, error);
        // Continue with other teams
      }
    }
    
    // Check if overall staffing is unbalanced
    const gapDifference = Math.abs(overstaffedGapSum - understaffedGapSum);
    const isUnbalanced = gapDifference > 2;
    
    logger.info(`[Staff Adequacy] Prediction completed: ${overstaffedCount} overstaffed, ${understaffedCount} understaffed, ${balancedCount} balanced`);
    logger.info(`[Staff Adequacy] Overall status: ${isUnbalanced ? 'Unbalanced' : 'Balanced'} (gap difference: ${gapDifference})`);
    
    return {
      success: true,
      updatedTeams: allTeams.length,
      overstaffed: overstaffedCount,
      understaffed: understaffedCount,
      balanced: balancedCount,
      isUnbalanced,
      gapDifference,
    };
  } catch (error) {
    logger.error('[Staff Adequacy] Error predicting for all teams:', error);
    throw error;
  }
};

/**
 * Get staffing overview statistics
 * @returns {Promise<Object>} Statistics for StaffingOverview component
 */
const getStaffingOverview = async () => {
  try {
    // Check if status column exists, if not return default values
    let hasStatusColumn = true;
    try {
      await query(`
        SELECT status FROM staff_adequency_field LIMIT 1
      `);
    } catch (err) {
      // Column doesn't exist, return default values
      hasStatusColumn = false;
      logger.warn('[Staff Adequacy] Status column does not exist yet. Run migration 026_add_staff_adequacy_prediction_fields.sql');
    }
    
    let understaffed = 0;
    let overstaffed = 0;
    let balanced = 0;
    let total = 0;
    let isUnbalanced = false;
    let gapDifference = 0;
    
    if (hasStatusColumn) {
      // Get all teams with their status for debugging
      const { rows: allTeams } = await query(`
        SELECT team_id, status, current_team_size, required_ppl,
               (current_team_size - COALESCE(required_ppl, current_team_size)) as staff_gap
        FROM staff_adequency_field
        ORDER BY team_id
      `);
      
      // Log team 4 specifically if it exists
      const team4 = allTeams.find(t => t.team_id === 4);
      if (team4) {
        logger.info(`[Staff Adequacy] Team 4 details:`, {
          team_id: team4.team_id,
          status: team4.status,
          current_team_size: team4.current_team_size,
          required_ppl: team4.required_ppl,
          staff_gap: team4.staff_gap
        });
      }
      
      logger.info(`[Staff Adequacy] Found ${allTeams.length} teams. Status breakdown:`, 
        allTeams.map(t => ({ 
          team_id: t.team_id, 
          status: t.status, 
          current: t.current_team_size, 
          required: t.required_ppl,
          gap: t.staff_gap
        }))
      );
      
      const { rows } = await query(`
        SELECT 
          COUNT(CASE WHEN status = 'understaffed' THEN 1 END) as understaffed_count,
          COUNT(CASE WHEN status = 'overstaffed' THEN 1 END) as overstaffed_count,
          COUNT(CASE WHEN status = 'balanced' THEN 1 END) as balanced_count,
          COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_count,
          COUNT(*) as total_teams
        FROM staff_adequency_field
      `);
      
      const stats = rows[0] || {};
      understaffed = parseInt(stats.understaffed_count || 0, 10);
      overstaffed = parseInt(stats.overstaffed_count || 0, 10);
      balanced = parseInt(stats.balanced_count || 0, 10);
      const nullStatus = parseInt(stats.null_status_count || 0, 10);
      total = parseInt(stats.total_teams || 0, 10);
      
      logger.info(`[Staff Adequacy] Status counts - Understaffed: ${understaffed}, Overstaffed: ${overstaffed}, Balanced: ${balanced}, Null: ${nullStatus}, Total: ${total}`);
      
      // If there are teams without status, trigger predictions for them
      if (nullStatus > 0) {
        logger.info(`[Staff Adequacy] Found ${nullStatus} teams without status. Triggering predictions...`);
        try {
          // Run predictions for teams without status
          const teamsWithoutStatus = allTeams.filter(t => !t.status);
          for (const team of teamsWithoutStatus) {
            try {
              await predictAndUpdateTeamStatus(team.team_id);
            } catch (err) {
              logger.error(`[Staff Adequacy] Error predicting for team ${team.team_id}:`, err);
            }
          }
          
          // Re-fetch stats after predictions
          const { rows: updatedRows } = await query(`
            SELECT 
              COUNT(CASE WHEN status = 'understaffed' THEN 1 END) as understaffed_count,
              COUNT(CASE WHEN status = 'overstaffed' THEN 1 END) as overstaffed_count,
              COUNT(CASE WHEN status = 'balanced' THEN 1 END) as balanced_count,
              COUNT(*) as total_teams
            FROM staff_adequency_field
          `);
          
          const updatedStats = updatedRows[0] || {};
          understaffed = parseInt(updatedStats.understaffed_count || 0, 10);
          overstaffed = parseInt(updatedStats.overstaffed_count || 0, 10);
          balanced = parseInt(updatedStats.balanced_count || 0, 10);
          total = parseInt(updatedStats.total_teams || 0, 10);
          
          logger.info(`[Staff Adequacy] Updated status counts after predictions - Understaffed: ${understaffed}, Overstaffed: ${overstaffed}, Balanced: ${balanced}`);
        } catch (err) {
          logger.error('[Staff Adequacy] Error running predictions for teams without status:', err);
        }
      }
      
      // Calculate gap sums to determine if unbalanced
      const { rows: gapRows } = await query(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'overstaffed' THEN ABS(current_team_size - COALESCE(required_ppl, current_team_size)) ELSE 0 END), 0) as overstaffed_gap_sum,
          COALESCE(SUM(CASE WHEN status = 'understaffed' THEN ABS(current_team_size - COALESCE(required_ppl, current_team_size)) ELSE 0 END), 0) as understaffed_gap_sum
        FROM staff_adequency_field
      `);
      
      const overstaffedGapSum = parseFloat(gapRows[0]?.overstaffed_gap_sum || 0);
      const understaffedGapSum = parseFloat(gapRows[0]?.understaffed_gap_sum || 0);
      gapDifference = Math.abs(overstaffedGapSum - understaffedGapSum);
      isUnbalanced = gapDifference > 2;
    } else {
      // If status column doesn't exist, just get total teams
      const { rows } = await query(`
        SELECT COUNT(*) as total_teams
        FROM staff_adequency_field
      `);
      total = parseInt(rows[0]?.total_teams || 0, 10);
      balanced = total; // All teams are balanced if status doesn't exist
    }
    
    // Get team names grouped by status
    let teamsByStatus = {
      understaffed: [],
      overstaffed: [],
      balanced: []
    };
    
    if (hasStatusColumn) {
      try {
        const { rows: teamRows } = await query(`
          SELECT 
            saf.team_id,
            saf.status,
            saf.current_team_size,
            saf.required_ppl,
            t.name as team_name
          FROM staff_adequency_field saf
          JOIN teams t ON t.id = saf.team_id
          WHERE saf.status IS NOT NULL
          ORDER BY t.name
        `);
        
        teamsByStatus = {
          understaffed: teamRows.filter(t => t.status === 'understaffed').map(t => ({
            team_id: t.team_id,
            team_name: t.team_name,
            current_team_size: t.current_team_size,
            required_ppl: t.required_ppl
          })),
          overstaffed: teamRows.filter(t => t.status === 'overstaffed').map(t => ({
            team_id: t.team_id,
            team_name: t.team_name,
            current_team_size: t.current_team_size,
            required_ppl: t.required_ppl
          })),
          balanced: teamRows.filter(t => t.status === 'balanced').map(t => ({
            team_id: t.team_id,
            team_name: t.team_name,
            current_team_size: t.current_team_size,
            required_ppl: t.required_ppl
          }))
        };
      } catch (err) {
        logger.warn('[Staff Adequacy] Error getting team names:', err);
      }
    }
    
    // Get total active projects count
    let totalProjects = 0;
    try {
      const { rows: projectRows } = await query(`
        SELECT COUNT(*) as count
        FROM projects
        WHERE status = 'active'
          AND project_type = 'field'
      `);
      totalProjects = parseInt(projectRows[0]?.count || 0, 10);
    } catch (err) {
      logger.warn('[Staff Adequacy] Error getting project count:', err);
      totalProjects = 0;
    }
    
    return {
      understaffed,
      overstaffed,
      balanced,
      total,
      isUnbalanced,
      gapDifference,
      totalProjects,
      teamsByStatus,
    };
  } catch (error) {
    logger.error('[Staff Adequacy] Error getting staffing overview:', error);
    // Return default values instead of throwing to prevent 500 error
    return {
      understaffed: 0,
      overstaffed: 0,
      balanced: 0,
      total: 0,
      isUnbalanced: false,
      gapDifference: 0,
      totalProjects: 0,
    };
  }
};

module.exports = {
  updateAllStaffAdequacy,
  getStaffAdequacyByTeam,
  getAllStaffAdequacy,
  updateStaffAdequacyByTeam,
  predictAndUpdateTeamStatus,
  predictAndUpdateAllTeams,
  getStaffingOverview,
};

