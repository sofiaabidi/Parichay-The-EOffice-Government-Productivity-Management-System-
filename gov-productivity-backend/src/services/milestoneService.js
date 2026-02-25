const { query, getClient } = require('../config/database');
const auditService = require('./auditService');

// Create milestone for a project
const createMilestone = async (projectId, milestoneData, managerId) => {
  if (!milestoneData.name) {
    throw new Error('Milestone name is required');
  }
  
  const sql = `
    INSERT INTO project_milestones (
      project_id, name, description, deadline, budget, expected_output, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  console.log('Inserting milestone with data:', {
    projectId,
    name: milestoneData.name,
    description: milestoneData.description,
    deadline: milestoneData.deadline,
    budget: milestoneData.budget,
    expectedOutput: milestoneData.expectedOutput
  });
  
  const { rows } = await query(sql, [
    projectId,
    milestoneData.name,
    milestoneData.description || null,
    milestoneData.deadline || null,
    milestoneData.budget || null,
    milestoneData.expectedOutput || null,
    milestoneData.status || 'pending',
  ]);
  
  console.log('Milestone inserted successfully, ID:', rows[0].id);
  
  await auditService.logAction(managerId, 'MILESTONE_CREATED', 'project_milestones', rows[0].id, milestoneData);
  return rows[0];
};

// Update milestone
const updateMilestone = async (milestoneId, milestoneData, managerId) => {
  const sql = `
    UPDATE project_milestones
    SET name = COALESCE($2, name),
        description = COALESCE($3, description),
        deadline = COALESCE($4, deadline),
        budget = COALESCE($5, budget),
        expected_output = COALESCE($6, expected_output),
        status = COALESCE($7, status),
        progress_percent = COALESCE($8, progress_percent),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  
  const { rows } = await query(sql, [
    milestoneId,
    milestoneData.name || null,
    milestoneData.description || null,
    milestoneData.deadline || null,
    milestoneData.budget || null,
    milestoneData.expectedOutput || null,
    milestoneData.status || null,
    milestoneData.progressPercent || null,
  ]);
  
  if (!rows.length) {
    const error = new Error('Milestone not found');
    error.statusCode = 404;
    throw error;
  }
  
  await auditService.logAction(managerId, 'MILESTONE_UPDATED', 'project_milestones', milestoneId, milestoneData);
  return rows[0];
};

// Get milestones for a project
const getMilestonesByProject = async (projectId) => {
  const sql = `
    SELECT 
      pm.id,
      pm.project_id,
      pm.name,
      pm.description,
      pm.status,
      pm.deadline,
      pm.budget,
      pm.expected_output,
      pm.progress_percent,
      pm.created_at,
      pm.updated_at,
      COUNT(DISTINCT t.id)::int as total_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)::int as completed_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'awaiting-review' THEN t.id END)::int as pending_tasks
    FROM project_milestones pm
    LEFT JOIN tasks t ON t.milestone_id = pm.id
    WHERE pm.project_id = $1
    GROUP BY pm.id, pm.project_id, pm.name, pm.description, pm.status, pm.deadline, pm.budget, pm.expected_output, pm.progress_percent, pm.created_at, pm.updated_at
    ORDER BY pm.deadline ASC NULLS LAST, pm.created_at ASC
  `;
  
  const { rows } = await query(sql, [projectId]);
  console.log(`getMilestonesByProject(${projectId}): Found ${rows ? rows.length : 0} milestones`);
  if (rows && rows.length > 0) {
    console.log('Milestone names:', rows.map(r => r.name));
  }
  return rows || [];
};

// Delete milestone
const deleteMilestone = async (milestoneId, managerId) => {
  const sql = `DELETE FROM project_milestones WHERE id = $1 RETURNING *`;
  const { rows } = await query(sql, [milestoneId]);
  
  if (!rows.length) {
    const error = new Error('Milestone not found');
    error.statusCode = 404;
    throw error;
  }
  
  await auditService.logAction(managerId, 'MILESTONE_DELETED', 'project_milestones', milestoneId, {});
  return rows[0];
};

module.exports = {
  createMilestone,
  updateMilestone,
  getMilestonesByProject,
  deleteMilestone,
};
