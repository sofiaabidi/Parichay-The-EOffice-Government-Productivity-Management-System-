const { query, getClient } = require('../config/database');
const auditService = require('./auditService');
const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');

// Submit DPR review (called by manager) - applies to all employees in the project
const submitDprReview = async (managerId, projectId, reviewData) => {
  console.log(`[DPR Review] Submitting DPR review for project ${projectId} by manager ${managerId}`);
  console.log(`[DPR Review] Review data:`, reviewData);
  
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Verify manager has access to this project
    const verifySql = `
      SELECT id, created_by, dpr_deadline
      FROM projects
      WHERE id = $1 AND project_type = 'field'
    `;
    const { rows: verifyRows } = await client.query(verifySql, [projectId]);

    if (!verifyRows[0] || verifyRows[0].created_by !== managerId) {
      throw new Error('Project not found or unauthorized');
    }

    const deadline = verifyRows[0].dpr_deadline || reviewData.deadline;
    console.log(`[DPR Review] Project DPR deadline: ${deadline}`);

    // Get all employees in this project (all project members who are field employees)
    const employeesSql = `
      SELECT pm.user_id, u.role, u.name, u.email
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
        AND u.role = 'FIELD_EMPLOYEE'
        AND u.is_active = TRUE
        AND pm.user_id IS NOT NULL
        AND u.id IS NOT NULL
    `;
    const { rows: employeeRows } = await client.query(employeesSql, [projectId]);
    console.log(`[DPR Review] Field employees found in project:`, employeeRows);

    // Extract and validate user_ids - be very strict about validation
    const employeeIds = [];
    for (const row of employeeRows) {
      const userId = row.user_id;
      
      // Convert to integer and validate
      if (userId !== null && userId !== undefined) {
        const parsedId = parseInt(String(userId), 10);
        if (!isNaN(parsedId) && parsedId > 0 && isFinite(parsedId)) {
          employeeIds.push(parsedId);
          console.log(`[DPR Review] Valid employee ID found: ${parsedId} (${row.name || 'Unknown'})`);
        } else {
          console.error(`[DPR Review] Invalid user_id format: ${userId} (type: ${typeof userId}) for user: ${row.name}`);
        }
      } else {
        console.error(`[DPR Review] Null or undefined user_id in row:`, row);
      }
    }

    if (employeeIds.length === 0) {
      console.error(`[DPR Review] No valid FIELD_EMPLOYEE found in project ${projectId}`);
      console.error(`[DPR Review] Employee rows from query:`, employeeRows);
      await client.query('ROLLBACK');
      throw new Error('No field employees found in this project. Please add field employees to the project before reviewing DPR.');
    }

    console.log(`[DPR Review] Found ${employeeIds.length} valid employees in project:`, employeeIds);

    // Insert or update DPR review for each employee
    const upsertSql = `
      INSERT INTO dpr_reviews (
        project_id, reviewed_by, reviewed_for,
        actual_submission_date, deadline,
        authenticity_stars, data_correctness_stars,
        technical_correctness_stars, completeness_stars,
        tools_and_resources_stars, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (project_id, reviewed_for, reviewed_by)
      DO UPDATE SET
        actual_submission_date = EXCLUDED.actual_submission_date,
        deadline = EXCLUDED.deadline,
        authenticity_stars = EXCLUDED.authenticity_stars,
        data_correctness_stars = EXCLUDED.data_correctness_stars,
        technical_correctness_stars = EXCLUDED.technical_correctness_stars,
        completeness_stars = EXCLUDED.completeness_stars,
        tools_and_resources_stars = EXCLUDED.tools_and_resources_stars,
        remarks = EXCLUDED.remarks,
        updated_at = NOW()
      RETURNING *
    `;

    const reviewResults = [];
    const actualSubmissionDate = reviewData.actual_submission_date || new Date().toISOString().split('T')[0];

    for (const employeeId of employeeIds) {
      // Double-check employeeId is valid before inserting
      const validatedEmployeeId = parseInt(String(employeeId), 10);
      if (!validatedEmployeeId || isNaN(validatedEmployeeId) || validatedEmployeeId <= 0) {
        console.error(`[DPR Review] Invalid employeeId after validation: ${employeeId}, skipping...`);
        continue;
      }

      // Ensure all required values are present
      const insertValues = [
        projectId,
        managerId,
        validatedEmployeeId, // This is the reviewed_for - must be a valid integer
        actualSubmissionDate,
        deadline,
        reviewData.authenticity_stars || 0,
        reviewData.data_correctness_stars || 0,
        reviewData.technical_correctness_stars || 0,
        reviewData.completeness_stars || 0,
        reviewData.tools_and_resources_stars || 0,
        reviewData.remarks || null,
      ];

      // Validate all values before inserting
      if (insertValues[2] === null || insertValues[2] === undefined) {
        console.error(`[DPR Review] CRITICAL: reviewed_for (employeeId) is null/undefined! Values:`, insertValues);
        throw new Error(`Invalid employeeId: ${validatedEmployeeId}. Cannot insert DPR review with null reviewed_for.`);
      }

      console.log(`[DPR Review] Inserting review for employee ${validatedEmployeeId} with values:`, {
        projectId: insertValues[0],
        managerId: insertValues[1],
        reviewed_for: insertValues[2], // This should never be null
        actualSubmissionDate: insertValues[3],
        deadline: insertValues[4],
        authenticity_stars: insertValues[5],
        data_correctness_stars: insertValues[6],
        technical_correctness_stars: insertValues[7],
        completeness_stars: insertValues[8],
        tools_and_resources_stars: insertValues[9],
      });

      try {
        const { rows } = await client.query(upsertSql, insertValues);
        
        if (rows && rows.length > 0 && rows[0]) {
          reviewResults.push(rows[0]);
          console.log(`[DPR Review] Successfully created/updated DPR review for employee ${validatedEmployeeId}, review ID: ${rows[0].id}`);
        } else {
          console.error(`[DPR Review] No rows returned for employee ${validatedEmployeeId}`);
          throw new Error(`Failed to create DPR review for employee ${validatedEmployeeId}`);
        }
      } catch (insertError) {
        console.error(`[DPR Review] Error inserting review for employee ${validatedEmployeeId}:`, insertError);
        console.error(`[DPR Review] Insert values were:`, insertValues);
        throw insertError;
      }
    }

    // Ensure we created at least one review
    if (reviewResults.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('Failed to create DPR reviews. No valid employees found or all insertions failed.');
    }

    await client.query('COMMIT');

    console.log(`[DPR Review] Successfully saved DPR reviews for ${reviewResults.length} employees`);
    console.log(`[DPR Review] Ratings - Authenticity: ${reviewData.authenticity_stars}, Data Correctness: ${reviewData.data_correctness_stars}, Technical: ${reviewData.technical_correctness_stars}, Completeness: ${reviewData.completeness_stars}, Tools: ${reviewData.tools_and_resources_stars}`);

    // Recalculate KPI for all employees (async, don't wait)
    console.log(`[DPR Review] Triggering KPI recalculation for ${employeeIds.length} employees`);
    const kpiPromises = employeeIds.map(employeeId => 
      fieldEmployeeKpiService.computeFieldEmployeeKpis(employeeId, null, null, { persist: true })
        .then(result => {
          console.log(`[DPR Review] Successfully recalculated KPI for employee ${employeeId}:`, {
            dprKpi: result.dprKpi,
            finalKpi: result.finalKpi
          });
        })
        .catch(err => {
          console.error(`[DPR Review] Error recalculating KPI after DPR review for employee ${employeeId}:`, err);
        })
    );

    // Wait for all KPI recalculations to complete, then trigger promotion score recalculation
    // Note: KPI recalculation already triggers promotion score recalculation for all employees,
    // but we also trigger it here explicitly after DPR review to ensure stars are updated
    Promise.all(kpiPromises).then(() => {
      console.log(`[DPR Review] Completed KPI recalculation for all ${employeeIds.length} employees`);
      
      // Trigger promotion score recalculation for ALL employees
      // DPR review affects stars, which changes normalization for all employees
      console.log(`[Promotion Score Trigger] ========================================`);
      console.log(`[Promotion Score Trigger] DPR REVIEW SUBMITTED - Triggering Promotion Score Recalculation`);
      console.log(`[Promotion Score Trigger] Project ID: ${projectId}`);
      console.log(`[Promotion Score Trigger] Affected Employees: ${employeeIds.join(', ')}`);
      console.log(`[Promotion Score Trigger] Stars changed, affecting normalization - Recalculating all promotion scores...`);
      console.log(`[Promotion Score Trigger] ========================================`);
      
      const promotionScoreService = require('./promotionScoreService');
      promotionScoreService.calculateAndStorePromotionScores()
        .then(results => {
          console.log(`[Promotion Score Trigger] ✅ Successfully recalculated promotion scores for all ${results.length} employees after DPR review`);
          console.log(`[Promotion Score Trigger] ========================================`);
        })
        .catch(err => {
          console.error(`[Promotion Score Trigger] ❌ Error recalculating all promotion scores after DPR review:`, err);
          console.error(`[Promotion Score Trigger] Error stack:`, err.stack);
          console.log(`[Promotion Score Trigger] ========================================`);
        });
    }).catch(err => {
      console.error(`[DPR Review] Error in KPI recalculation promises:`, err);
      // Still try to recalculate promotion scores even if KPI recalculation had errors
      console.log(`[Promotion Score Trigger] Attempting promotion score recalculation despite KPI errors...`);
      const promotionScoreService = require('./promotionScoreService');
      promotionScoreService.calculateAndStorePromotionScores()
        .catch(psErr => {
          console.error(`[Promotion Score Trigger] Failed to recalculate promotion scores:`, psErr);
        });
    });

    // Log audit action for the first review (representative)
    if (reviewResults.length > 0) {
      await auditService.logAction(managerId, 'DPR_REVIEW_SUBMITTED', 'dpr_reviews', reviewResults[0].id, {
        projectId,
        employeeCount: employeeIds.length,
        employeeIds,
      });
    }

    return {
      projectId,
      employeeCount: employeeIds.length,
      reviews: reviewResults,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get DPR reviews for a project
const getDprReviews = async (projectId) => {
  const sql = `
    SELECT 
      dr.*,
      u1.name as reviewed_by_name,
      u2.name as reviewed_for_name
    FROM dpr_reviews dr
    JOIN users u1 ON u1.id = dr.reviewed_by
    JOIN users u2 ON u2.id = dr.reviewed_for
    WHERE dr.project_id = $1
    ORDER BY dr.created_at DESC
  `;
  const { rows } = await query(sql, [projectId]);
  return rows;
};

module.exports = {
  submitDprReview,
  getDprReviews,
};

