const db = require('../config/db');

exports.getMyNotifications = (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = db.prepare(`
      SELECT * FROM Notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC LIMIT 50
    `).all(userId);

    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND is_read = 0').get(userId).count;

    return res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving notifications' });
  }
};

exports.markAsRead = (req, res) => {
  try {
    const notifId = req.params.id;
    const userId = req.user.id;

    db.prepare('UPDATE Notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notifId, userId);

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markAllAsRead = (req, res) => {
  try {
    const userId = req.user.id;
    db.prepare('UPDATE Notifications SET is_read = 1 WHERE user_id = ?').run(userId);

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

