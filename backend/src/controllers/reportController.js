const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

exports.createReport = (req, res) => {
  try {
    const reporterId = req.user.id;
    const { reported_user_id, trip_id, reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ success: false, message: 'Reason and description are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO Reports (reporter_id, reported_user_id, trip_id, reason, description, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);

    stmt.run(
      reporterId,
      reported_user_id ? parseInt(reported_user_id, 10) : null,
      trip_id ? parseInt(trip_id, 10) : null,
      reason.trim(),
      description.trim()
    );

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our safety team will review it.'
    });
  } catch (error) {
    console.error('Create report error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting report' });
  }
};

exports.getReports = (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT rep.*, 
             u1.name as reporter_name, u1.email as reporter_email,
             u2.name as reported_user_name, u2.email as reported_user_email, u2.role as reported_user_role,
             t.start_location, t.destination, t.travel_date
      FROM Reports rep
      JOIN Users u1 ON rep.reporter_id = u1.id
      LEFT JOIN Users u2 ON rep.reported_user_id = u2.id
      LEFT JOIN Trips t ON rep.trip_id = t.id
      ORDER BY rep.created_at DESC
    `).all();

    return res.json({ success: true, reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving reports' });
  }
};

exports.updateReport = (req, res) => {
  try {
    const reportId = req.params.id;
    const { status, admin_notes } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    db.prepare(`
      UPDATE Reports 
      SET status = ?, admin_notes = ? 
      WHERE id = ?
    `).run(status, admin_notes || null, reportId);

    return res.json({ success: true, message: 'Report updated successfully' });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating report' });
  }
};

