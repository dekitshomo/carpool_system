const db = require('../config/db');

function createNotification(userId, title, message, type = 'system', relatedTripId = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO Notifications (user_id, title, message, type, related_trip_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
    `);
    stmt.run(userId, title, message, type, relatedTripId);
    return true;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return false;
  }
}

module.exports = { createNotification };

