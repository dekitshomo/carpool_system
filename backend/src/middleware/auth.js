const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'student-carpool-secret-key-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    // Verify user exists and is active
    const stmt = db.prepare('SELECT id, student_id, name, email, phone, role, is_verified, status FROM Users WHERE id = ?');
    const dbUser = stmt.get(user.id);

    if (!dbUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    if (dbUser.status !== 'active') {
      return res.status(403).json({ success: false, message: `Account is ${dbUser.status}. Please contact administrator.` });
    }

    req.user = dbUser;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (!roleList.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: requires ${roleList.join(' or ')} privileges` 
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};

