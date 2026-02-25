const { query } = require('../config/database');

const AuditLog = {
  async logAction({ userId, action, entityType, entityId, metadata }) {
    const sql = `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `;
    const values = [
      userId || null,
      action,
      entityType || null,
      entityId || null,
      metadata ? JSON.stringify(metadata) : null,
    ];
    const { rows } = await query(sql, values);
    return rows[0];
  },

  async listRecent(limit = 50) {
    const { rows } = await query(
      `
        SELECT id, user_id, action, entity_type, entity_id, metadata, created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return rows;
  },
};

module.exports = AuditLog;
