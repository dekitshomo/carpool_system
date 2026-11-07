const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

// Admin Analytics and Overview Stats
exports.getStats = (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM Users').get().count;
    const totalDrivers = db.prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'driver'").get().count;
    const totalPassengers = db.prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'passenger'").get().count;
    const activeDrivers = db.prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'driver' AND is_verified = 1 AND status = 'active'").get().count;

    const totalTrips = db.prepare('SELECT COUNT(*) as count FROM Trips').get().count;
    const activeTrips = db.prepare("SELECT COUNT(*) as count FROM Trips WHERE status = 'published'").get().count;
    const completedTrips = db.prepare("SELECT COUNT(*) as count FROM Trips WHERE status = 'completed'").get().count;
    const cancelledTrips = db.prepare("SELECT COUNT(*) as count FROM Trips WHERE status = 'cancelled'").get().count;

    const totalRequests = db.prepare('SELECT COUNT(*) as count FROM RideRequests').get().count;
    const pendingRequests = db.prepare("SELECT COUNT(*) as count FROM RideRequests WHERE status = 'pending'").get().count;
    const acceptedRequests = db.prepare("SELECT COUNT(*) as count FROM RideRequests WHERE status = 'accepted'").get().count;

    const pendingVerifications = db.prepare("SELECT COUNT(*) as count FROM DriverVerifications WHERE status = 'pending'").get().count;
    const pendingReports = db.prepare("SELECT COUNT(*) as count FROM Reports WHERE status = 'pending'").get().count;

    // Most popular routes
    const popularRoutes = db.prepare(`
      SELECT start_location || ' -> ' || destination as route, 
             start_location, destination,
             COUNT(*) as trip_count,
             SUM(total_seats) as total_seats_offered,
             (SELECT COUNT(*) FROM RideRequests r JOIN Trips t2 ON r.trip_id = t2.id 
              WHERE t2.start_location = Trips.start_location AND t2.destination = Trips.destination) as total_requests
      FROM Trips
      GROUP BY start_location, destination
      ORDER BY trip_count DESC
      LIMIT 6
    `).all();

    // Monthly registrations (last 6 months or group by YYYY-MM)
    const monthlyRegistrations = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
             COUNT(*) as total,
             SUM(CASE WHEN role = 'driver' THEN 1 ELSE 0 END) as drivers,
             SUM(CASE WHEN role = 'passenger' THEN 1 ELSE 0 END) as passengers
      FROM Users
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 6
    `).all().reverse();

    // Trips by status breakdown
    const tripsByStatus = [
      { label: 'Published / Active', count: activeTrips, color: '#3B82F6' },
      { label: 'Completed', count: completedTrips, color: '#10B981' },
      { label: 'Cancelled', count: cancelledTrips, color: '#EF4444' }
    ];

    // Recent activity feed
    const recentTrips = db.prepare(`
      SELECT t.*, u.name as driver_name, u.student_id as driver_student_id
      FROM Trips t
      JOIN Users u ON t.driver_id = u.id
      ORDER BY t.created_at DESC LIMIT 5
    `).all();

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalDrivers,
        totalPassengers,
        activeDrivers,
        totalTrips,
        activeTrips,
        completedTrips,
        cancelledTrips,
        totalRequests,
        pendingRequests,
        acceptedRequests,
        pendingVerifications,
        pendingReports,
        popularRoutes,
        monthlyRegistrations,
        tripsByStatus,
        recentTrips
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving statistics' });
  }
};

// Get Pending Driver Verifications
exports.getPendingVerifications = (req, res) => {
  try {
    const list = db.prepare(`
      SELECT dv.*, 
             u.name as driver_name, u.email as driver_email, u.phone as driver_phone, 
             u.student_id as driver_student_id, u.department, u.avatar_url,
             v.model as vehicle_model, v.registration_number, v.vehicle_type, v.capacity as vehicle_capacity, v.color as vehicle_color
      FROM DriverVerifications dv
      JOIN Users u ON dv.user_id = u.id
      LEFT JOIN Vehicles v ON v.user_id = u.id AND v.is_active = 1
      ORDER BY dv.created_at DESC
    `).all();

    return res.json({
      success: true,
      verifications: list
    });
  } catch (error) {
    console.error('Get verifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving verifications' });
  }
};

// Approve or Reject Driver Verification
exports.handleVerification = (req, res) => {
  try {
    const verificationId = req.params.id;
    const { action, admin_notes } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" });
    }

    const verification = db.prepare('SELECT * FROM DriverVerifications WHERE id = ?').get(verificationId);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification record not found' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const isVerifiedVal = action === 'approve' ? 1 : 0;

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`
        UPDATE DriverVerifications 
        SET status = ?, admin_notes = ?, verified_at = datetime('now')
        WHERE id = ?
      `).run(newStatus, admin_notes || null, verificationId);

      db.prepare("UPDATE Users SET is_verified = ?, updated_at = datetime('now') WHERE id = ?").run(isVerifiedVal, verification.user_id);

      db.exec('COMMIT');

      // Send notification to the driver
      if (action === 'approve') {
        createNotification(
          verification.user_id,
          'Driver Verification Approved!',
          'Congratulations! Your driver account has been verified. You can now publish carpool trips and offer rides to other students.',
          'driver_verified'
        );
      } else {
        createNotification(
          verification.user_id,
          'Driver Verification Rejected',
          `Your driver verification request was not approved.${admin_notes ? ' Reason: ' + admin_notes : ' Please check your vehicle and license details.'}`,
          'driver_rejected'
        );
      }

      return res.json({
        success: true,
        message: `Driver verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (error) {
    console.error('Handle verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error handling verification' });
  }
};

// Get All Users (with filters & search)
exports.getUsers = (req, res) => {
  try {
    const { role, status, search } = req.query;

    let query = `
      SELECT u.id, u.student_id, u.name, u.email, u.phone, u.role, u.department, 
             u.is_verified, u.status, u.created_at,
             (SELECT COUNT(*) FROM Trips WHERE driver_id = u.id) as trips_count,
             (SELECT COUNT(*) FROM RideRequests WHERE passenger_id = u.id) as requests_count,
             v.model as vehicle_model, v.registration_number
      FROM Users u
      LEFT JOIN Vehicles v ON v.user_id = u.id AND v.is_active = 1
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (LOWER(u.name) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?) OR LOWER(u.student_id) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC`;

    const users = db.prepare(query).all(...params);

    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving users' });
  }
};

// Update User Status (Suspend, Deactivate, Activate, Verify)
exports.updateUserStatus = (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { status, is_verified, role } = req.body;

    const user = db.prepare('SELECT * FROM Users WHERE id = ?').get(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Do not allow suspending oneself
    if (user.id === req.user.id && status && status !== 'active') {
      return res.status(400).json({ success: false, message: 'You cannot suspend or deactivate your own admin account' });
    }

    db.prepare(`
      UPDATE Users
      SET status = COALESCE(?, status),
          is_verified = COALESCE(?, is_verified),
          role = COALESCE(?, role),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(status || null, is_verified !== undefined ? is_verified : null, role || null, targetUserId);

    if (status) {
      createNotification(
        targetUserId,
        `Account Status: ${status.toUpperCase()}`,
        `Your account status has been changed to ${status} by an administrator.`,
        'system'
      );
    }

    return res.json({
      success: true,
      message: 'User account updated successfully'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating user' });
  }
};

// Get All Trips (Admin management)
exports.getAllTrips = (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT t.*, 
             u.name as driver_name, u.student_id as driver_student_id, u.phone as driver_phone,
             v.model as vehicle_model, v.registration_number,
             (SELECT COUNT(*) FROM RideRequests WHERE trip_id = t.id) as total_requests,
             (SELECT COUNT(*) FROM RideRequests WHERE trip_id = t.id AND status = 'accepted') as accepted_requests
      FROM Trips t
      JOIN Users u ON t.driver_id = u.id
      JOIN Vehicles v ON t.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (LOWER(t.start_location) LIKE LOWER(?) OR LOWER(t.destination) LIKE LOWER(?) OR LOWER(u.name) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.created_at DESC`;

    const trips = db.prepare(query).all(...params);

    return res.json({
      success: true,
      count: trips.length,
      trips
    });
  } catch (error) {
    console.error('Get all trips error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving trips' });
  }
};

// Remove / Cancel inappropriate or suspicious trip
exports.removeTrip = (req, res) => {
  try {
    const tripId = req.params.id;
    const { reason } = req.body;

    const trip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare("UPDATE Trips SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(tripId);

      // Cancel passenger requests
      db.prepare(`
        UPDATE RideRequests 
        SET status = 'cancelled', cancellation_reason = 'Trip removed by administrator for policy violation'
        WHERE trip_id = ? AND status IN ('pending', 'accepted')
      `).run(tripId);

      db.exec('COMMIT');

      // Notify driver
      createNotification(
        trip.driver_id,
        'Trip Removed by Administrator',
        `Your trip from ${trip.start_location} to ${trip.destination} has been removed by platform moderation.${reason ? ' Reason: ' + reason : ''}`,
        'system',
        tripId
      );

      return res.json({
        success: true,
        message: 'Trip removed successfully by administrator'
      });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (error) {
    console.error('Remove trip error:', error);
    return res.status(500).json({ success: false, message: 'Server error removing trip' });
  }
};

