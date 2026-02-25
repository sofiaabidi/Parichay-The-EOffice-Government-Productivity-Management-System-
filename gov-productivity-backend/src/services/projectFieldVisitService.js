const { query, getClient } = require('../config/database');
const auditService = require('./auditService');
const fieldEmployeeKpiService = require('./fieldEmployeeKpiService');

// Create project field visit with technical compliance ratings
const createProjectFieldVisit = async (managerId, visitData) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Verify manager owns this project
    const verifySql = `
      SELECT id FROM projects WHERE id = $1 AND created_by = $2 AND project_type = 'field'
    `;
    const { rows: verifyRows } = await client.query(verifySql, [visitData.project_id, managerId]);
    if (!verifyRows[0]) {
      throw new Error('Project not found or unauthorized');
    }
    
    // Create field visit
    const visitSql = `
      INSERT INTO field_visits (visit_type, project_id, visited_by, visit_date, notes, status)
      VALUES ('project', $1, $2, $3, $4, 'completed')
      RETURNING id
    `;
    const { rows: visitRows } = await client.query(visitSql, [
      visitData.project_id,
      managerId,
      visitData.visit_date || new Date().toISOString().split('T')[0],
      visitData.notes || null,
    ]);
    const visitId = visitRows[0].id;
    
    // Store individual employee technical compliance ratings
    const employeeIds = [];
    if (visitData.ratings && visitData.ratings.length > 0) {
      for (const rating of visitData.ratings) {
        const techRating = parseFloat(rating.technical_compliance || rating.rating || 0);
        
        // Validate rating is between 0 and 10
        if (techRating < 0 || techRating > 10) {
          throw new Error(`Technical compliance rating must be between 0 and 10, got ${techRating}`);
        }
        
        // Verify employee is assigned to this project
        const employeesSql = `
          SELECT pm.user_id
          FROM project_members pm
          WHERE pm.project_id = $1 AND pm.user_id = $2
        `;
        const { rows: empRows } = await client.query(employeesSql, [
          visitData.project_id,
          rating.employee_id
        ]);
        
        if (empRows.length > 0) {
          // Store individual employee rating
          const ratingSql = `
            INSERT INTO project_field_visit_ratings (field_visit_id, employee_id, technical_compliance, remarks)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (field_visit_id, employee_id) 
            DO UPDATE SET 
              technical_compliance = EXCLUDED.technical_compliance,
              remarks = EXCLUDED.remarks,
              created_at = NOW()
          `;
          await client.query(ratingSql, [
            visitId,
            rating.employee_id,
            techRating,
            rating.remarks || null
          ]);
          
          employeeIds.push(rating.employee_id);
        }
      }
      
      // Also update project_evaluations with average for backward compatibility
      // Calculate average technical compliance for the project evaluation
      let totalRating = 0;
      let ratingCount = 0;
      for (const rating of visitData.ratings) {
        const techRating = parseFloat(rating.technical_compliance || rating.rating || 0);
        if (techRating > 0) {
          totalRating += techRating;
          ratingCount++;
        }
      }
      
      if (ratingCount > 0) {
        const avgTechnicalCompliance = totalRating / ratingCount;
        const evalSql = `
          INSERT INTO project_evaluations (project_id, evaluated_by, technical_compliance, quality_score, remarks)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (project_id, evaluated_by)
          DO UPDATE SET
            technical_compliance = EXCLUDED.technical_compliance,
            quality_score = COALESCE(EXCLUDED.quality_score, project_evaluations.quality_score),
            remarks = EXCLUDED.remarks,
            updated_at = NOW()
        `;
        await client.query(evalSql, [
          visitData.project_id,
          managerId,
          avgTechnicalCompliance,
          null, // quality_score can be set separately
          visitData.notes || null,
        ]);
      }
    }
    
    await client.query('COMMIT');
    
    // Recalculate KPIs for all employees who received ratings (async, don't wait)
    const uniqueEmployeeIds = [...new Set(employeeIds)];
    for (const empId of uniqueEmployeeIds) {
      fieldEmployeeKpiService.computeFieldEmployeeKpis(
        empId,
        null,
        null,
        { persist: true }
      ).catch(err => console.error(`Error recalculating KPI for employee ${empId} after project field visit:`, err));
    }
    
    await auditService.logAction(managerId, 'PROJECT_FIELD_VISIT_CREATED', 'field_visits', visitId, {
      projectId: visitData.project_id,
      employeeCount: uniqueEmployeeIds.length,
    });
    
    return { id: visitId, project_id: visitData.project_id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createProjectFieldVisit,
};

