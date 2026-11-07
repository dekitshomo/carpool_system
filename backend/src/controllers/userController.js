const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

// Save or Update Vehicle Information (Driver)
exports.saveVehicle = (req, res) => {
  try {
    const userId = req.user.id;
    const { model, registration_number, vehicle_type, capacity, color } = req.body;

    if (!model || !registration_number || !vehicle_type || !capacity) {
      return res.status(400).json({ success: false, message: 'Model, registration number, type, and capacity are required' });
    }

    const capInt = parseInt(capacity, 10);
    if (isNaN(capInt) || capInt <= 0 || capInt > 20) {
      return res.status(400).json({ success: false, message: 'Capacity must be a positive number between 1 and 20' });
    }

    const existing = db.prepare('SELECT id FROM Vehicles WHERE user_id = ? AND is_active = 1').get(userId);

    if (existing) {
      db.prepare(`
        UPDATE Vehicles 
        SET model = ?, registration_number = ?, vehicle_type = ?, capacity = ?, color = ?
        WHERE id = ?
      `).run(model.trim(), registration_number.trim(), vehicle_type.trim(), capInt, color ? color.trim() : null, existing.id);

      const updated = db.prepare('SELECT * FROM Vehicles WHERE id = ?').get(existing.id);
      return res.json({ success: true, message: 'Vehicle updated successfully', vehicle: updated });
    } else {
      const result = db.prepare(`
        INSERT INTO Vehicles (user_id, model, registration_number, vehicle_type, capacity, color, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(userId, model.trim(), registration_number.trim(), vehicle_type.trim(), capInt, color ? color.trim() : null);

      const newVehicle = db.prepare('SELECT * FROM Vehicles WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json({ success: true, message: 'Vehicle registered successfully', vehicle: newVehicle });
    }
  } catch (error) {
    console.error('Save vehicle error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving vehicle' });
  }
};

// Request Driver Verification (Driver)
exports.requestVerification = (req, res) => {
  try {
    const userId = req.user.id;
    const { license_number, student_card_doc, license_doc } = req.body;

    if (!license_number) {
      return res.status(400).json({ success: false, message: 'Driver license number is required' });
    }

    const existing = db.prepare('SELECT * FROM DriverVerifications WHERE user_id = ?').get(userId);

    if (existing) {
      db.prepare(`
        UPDATE DriverVerifications
        SET license_number = ?, 
            student_card_doc = COALESCE(?, student_card_doc),
            license_doc = COALESCE(?, license_doc),
            status = 'pending',
            admin_notes = 'Re-submitted for review'
        WHERE user_id = ?
      `).run(license_number.trim(), student_card_doc || null, license_doc || null, userId);
    } else {
      db.prepare(`
        INSERT INTO DriverVerifications (user_id, license_number, student_card_doc, license_doc, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(userId, license_number.trim(), student_card_doc || null, license_doc || null);
    }

    createNotification(
      userId,
      'Verification Under Review',
      'Your driver verification request has been submitted to administrators for approval.',
      'system'
    );

    return res.json({
      success: true,
      message: 'Driver verification request submitted successfully'
    });
  } catch (error) {
    console.error('Request verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting verification' });
  }
};

// Get Public User Profile
exports.getUserProfile = (req, res) => {
  try {
    const userId = req.params.id;

    const user = db.prepare(`
      SELECT id, student_id, name, role, department, avatar_url, bio, is_verified, created_at
      FROM Users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let vehicle = null;
    let reviews = [];
    let stats = { totalTrips: 0, completedTrips: 0, averageRating: 5.0 };

    if (user.role === 'driver') {
      vehicle = db.prepare('SELECT model, vehicle_type, capacity, color FROM Vehicles WHERE user_id = ? AND is_active = 1').get(userId) || null;
      
      const tripStats = db.prepare(`
        SELECT COUNT(*) as totalTrips, 
               SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTrips
        FROM Trips WHERE driver_id = ?
      `).get(userId);

      stats.totalTrips = tripStats.totalTrips || 0;
      stats.completedTrips = tripStats.completedTrips || 0;
    }

    reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM Reviews r
      JOIN Users u ON r.reviewer_id = u.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC LIMIT 10
    `).all(userId);

    const avgRating = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM Reviews WHERE reviewee_id = ?').get(userId);
    stats.averageRating = avgRating && avgRating.avg ? Number(avgRating.avg.toFixed(1)) : 5.0;
    stats.reviewCount = avgRating ? avgRating.count : 0;

    return res.json({
      success: true,
      profile: {
        ...user,
        vehicle,
        stats,
        reviews
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

// Add Review (Passenger reviews driver, or driver reviews passenger)
exports.addReview = (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { trip_id, reviewee_id, rating, comment } = req.body;

    if (!trip_id || !reviewee_id || !rating) {
      return res.status(400).json({ success: false, message: 'Trip ID, reviewee ID, and rating (1-5) are required' });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }

    // Verify trip exists
    const trip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Prevent duplicate reviews
    const existing = db.prepare('SELECT id FROM Reviews WHERE trip_id = ? AND reviewer_id = ? AND reviewee_id = ?').get(trip_id, reviewerId, reviewee_id);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this trip' });
    }

    db.prepare(`
      INSERT INTO Reviews (trip_id, reviewer_id, reviewee_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(trip_id, reviewerId, reviewee_id, ratingNum, comment ? comment.trim() : null);

    createNotification(
      reviewee_id,
      'New Rating & Review',
      `${req.user.name} left you a ${ratingNum}-star review!`,
      'system',
      trip_id
    );

    return res.status(201).json({ success: true, message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting review' });
  }
};

