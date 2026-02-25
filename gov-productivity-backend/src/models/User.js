const { query } = require('../config/database');

const baseSelect = `
  id, name, email, password_hash, role, department, designation,
  is_active, created_at, updated_at
`;

const User = {
  async createUser(payload) {
    const sql = `
      INSERT INTO users (name, email, password_hash, role, department, designation, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, TRUE))
      RETURNING ${baseSelect.replace('password_hash, ', '')}
    `;
    const values = [
      payload.name,
      payload.email,
      payload.password_hash,
      payload.role,
      payload.department || null,
      payload.designation || null,
      payload.is_active,
    ];
    const { rows } = await query(sql, values);
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await query(`SELECT ${baseSelect} FROM users WHERE email = $1`, [email]);
    return rows[0];
  },

  async findById(id) {
    const { rows } = await query(`SELECT ${baseSelect} FROM users WHERE id = $1`, [id]);
    return rows[0];
  },

  async listByTeam(teamId) {
    const sql = `
      SELECT u.id, u.name, u.email, u.role, u.department, u.designation, tm.team_id
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = $1
    `;
    const { rows } = await query(sql, [teamId]);
    return rows;
  },

  async listTeamMembersByManager(managerId) {
    // Get manager's role first
    const { rows: managerRow } = await query(
      `SELECT department, role FROM users WHERE id = $1 AND role IN ('MANAGER', 'FIELD_MANAGER')`,
      [managerId]
    );
    
    if (!managerRow[0]) {
      return [];
    }

    const managerRole = managerRow[0].role;
    const isFieldManager = managerRole === 'FIELD_MANAGER';
    const expectedEmployeeRole = isFieldManager ? 'FIELD_EMPLOYEE' : 'EMPLOYEE';
    
    // Priority 1: Get team members from actual team assignments (team_members table)
    const teamBasedSql = `
      SELECT u.id, u.name, u.email, u.role, u.department, u.designation, t.id as team_id, t.name as team_name
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      JOIN users u ON u.id = tm.user_id
      WHERE t.manager_id = $1
        AND u.role = $2
        AND u.is_active = TRUE
      ORDER BY u.name ASC
    `;
    const { rows: teamRows } = await query(teamBasedSql, [managerId, expectedEmployeeRole]);
    
    // If we have team members from assignments, return them
    if (teamRows.length > 0) {
      return teamRows;
    }
    
    // Priority 2: Fallback to department-based filtering (for backward compatibility)
    if (managerRow[0].department) {
      const sql = `
        SELECT u.id, u.name, u.email, u.role, u.department, u.designation, 
               (SELECT id FROM teams WHERE manager_id = $1 LIMIT 1) as team_id,
               (SELECT name FROM teams WHERE manager_id = $1 LIMIT 1) as team_name
        FROM users u
        WHERE u.department = $2 
          AND u.role = $3
          AND u.is_active = TRUE
          AND NOT EXISTS (
            SELECT 1 FROM team_members tm 
            JOIN teams t ON t.id = tm.team_id 
            WHERE tm.user_id = u.id
          )
        ORDER BY u.name ASC
      `;
      const { rows } = await query(sql, [managerId, managerRow[0].department, expectedEmployeeRole]);
      return rows;
    }
    
    return [];
  },
};

module.exports = User;