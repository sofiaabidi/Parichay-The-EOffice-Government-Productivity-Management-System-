const { query } = require('../config/database');

const mapRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  title: row.title,
  body: row.body,
  metadata: row.metadata,
  isRead: row.is_read,
  createdAt: row.created_at,
});

const createNotification = async (userId, notification) => {
  if (!userId) {
    throw new Error('userId is required to create notifications');
  }
  const { rows } = await query(
    `
      INSERT INTO notifications (user_id, type, title, body, metadata)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `,
    [
      userId,
      notification.type || 'GENERAL',
      notification.title || 'Update',
      notification.body || null,
      notification.metadata ? JSON.stringify(notification.metadata) : null,
    ],
  );
  return mapRow(rows[0]);
};

const listNotifications = async (userId, { unreadOnly = false, limit = 20 } = {}) => {
  const appliedLimit = Number.isFinite(limit) ? limit : 20;
  const { rows } = await query(
    `
      SELECT *
      FROM notifications
      WHERE user_id = $1
        AND ($2::boolean = FALSE OR is_read = FALSE)
      ORDER BY created_at DESC
      LIMIT $3
    `,
    [userId, unreadOnly, appliedLimit],
  );
  return rows.map(mapRow);
};

const markAsRead = async (userId, notificationIds) => {
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return { updated: 0 };
  }
  const { rowCount } = await query(
    `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
        AND id = ANY($2::int[])
    `,
    [userId, notificationIds],
  );
  return { updated: rowCount };
};

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
};

