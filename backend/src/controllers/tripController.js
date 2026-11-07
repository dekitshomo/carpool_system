const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

// Create a new trip (Driver only)
exports.createTrip = (req, res) => {
  try {
    const driverId = req.user.id;

    // Check if user is a driver
    if (req.user.role !== 'driver' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only registered drivers can offer rides' });
    }

    // Check driver verification
    if (!req.user.is_verified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your driver account is pending verification by an administrator. You will be able to publish trips once approved.' 
      });
    }

    // Check vehicle
    const vehicle = db.prepare('SELECT * FROM Vehicles WHERE user_id = ? AND is_active = 1 LIMIT 1').get(driverId);
    if (!vehicle) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please register your vehicle details in your profile before publishing a trip' 
      });
    }

    const {
      start_location,
      destination,
      pickup_point,
      travel_date,
      departure_time,
      available_seats,
      estimated_duration,
      notes
    } = req.body;

    // Validation
    if (!start_location || !destination || !pickup_point || !travel_date || !departure_time || available_seats === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required trip fields' });
    }

    const seatCount = parseInt(available_seats, 10);
    if (isNaN(seatCount) || seatCount <= 0) {
      return res.status(400).json({ success: false, message: 'Available seats must be greater than zero' });
    }

    if (seatCount > vehicle.capacity) {
      return res.status(400).json({ 
        success: false, 
        message: `Available seats cannot exceed vehicle capacity of ${vehicle.capacity}` 
      });
    }

    // Check date isn't in the past
    const tripDateTimeStr = `${travel_date}T${departure_time}`;
    const tripDateTime = new Date(tripDateTimeStr);
    const now = new Date();
    // Allow small margin or check date
    const todayStr = new Date().toISOString().split('T')[0];
    if (travel_date < todayStr) {
      return res.status(400).json({ success: false, message: 'Travel date cannot be in the past' });
    }

    const stmt = db.prepare(`
      INSERT INTO Trips (
        driver_id, vehicle_id, start_location, destination, pickup_point,
        travel_date, departure_time, total_seats, available_seats, estimated_duration, notes, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `);

    const result = stmt.run(
      driverId,
      vehicle.id,
      start_location.trim(),
      destination.trim(),
      pickup_point.trim(),
      travel_date,
      departure_time,
      seatCount,
      seatCount,
      estimated_duration ? estimated_duration.trim() : null,
      notes ? notes.trim() : null
    );

    const tripId = Number(result.lastInsertRowid);

    createNotification(
      driverId,
      'Trip Published Successfully',
      `Your trip from ${start_location} to ${destination} on ${travel_date} at ${departure_time} is now live!`,
      'system',
      tripId
    );

    const trip = db.prepare(`
      SELECT t.*, v.model as vehicle_model, v.registration_number, v.vehicle_type, v.color as vehicle_color,
             u.name as driver_name, u.phone as driver_phone, u.avatar_url as driver_avatar
      FROM Trips t
      JOIN Vehicles v ON t.vehicle_id = v.id
      JOIN Users u ON t.driver_id = u.id
      WHERE t.id = ?
    `).get(tripId);

    return res.status(201).json({
      success: true,
      message: 'Trip published successfully',
      trip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating trip' });
  }
};

// Search / list available trips (For Passengers / Public search)
exports.getAvailableTrips = (req, res) => {
  try {
    const { start_location, destination, travel_date, time_after, min_seats = 1, sort_by = 'date' } = req.query;

    let query = `
      SELECT t.*, 
             u.name as driver_name, u.student_id as driver_student_id, u.phone as driver_phone, 
             u.avatar_url as driver_avatar, u.department as driver_department,
             v.model as vehicle_model, v.registration_number, v.vehicle_type, v.color as vehicle_color, v.capacity as vehicle_capacity,
             (SELECT COUNT(*) FROM RideRequests WHERE trip_id = t.id AND status = 'accepted') as accepted_requests_count,
             (SELECT AVG(rating) FROM Reviews WHERE reviewee_id = u.id) as driver_rating
      FROM Trips t
      JOIN Users u ON t.driver_id = u.id
      JOIN Vehicles v ON t.vehicle_id = v.id
      WHERE t.status = 'published' AND t.available_seats >= ?
    `;

    const params = [parseInt(min_seats, 10) || 1];

    if (start_location && start_location.trim() !== '') {
      query += ` AND LOWER(t.start_location) LIKE LOWER(?)`;
      params.push(`%${start_location.trim()}%`);
    }

    if (destination && destination.trim() !== '') {
      query += ` AND LOWER(t.destination) LIKE LOWER(?)`;
      params.push(`%${destination.trim()}%`);
    }

    if (travel_date && travel_date.trim() !== '') {
      query += ` AND t.travel_date = ?`;
      params.push(travel_date.trim());
    } else {
      // By default do not show trips from past dates
      const today = new Date().toISOString().split('T')[0];
      query += ` AND t.travel_date >= ?`;
      params.push(today);
    }

    if (time_after && time_after.trim() !== '') {
      query += ` AND t.departure_time >= ?`;
      params.push(time_after.trim());
    }

    // Sorting
    if (sort_by === 'seats_desc') {
      query += ` ORDER BY t.available_seats DESC, t.travel_date ASC, t.departure_time ASC`;
    } else if (sort_by === 'time_asc') {
      query += ` ORDER BY t.travel_date ASC, t.departure_time ASC`;
    } else {
      query += ` ORDER BY t.travel_date ASC, t.departure_time ASC`;
    }

    const trips = db.prepare(query).all(...params);

    return res.json({
      success: true,
      count: trips.length,
      trips
    });
  } catch (error) {
    console.error('Get available trips error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving trips' });
  }
};

// Get single trip details
exports.getTripById = (req, res) => {
  try {
    const tripId = req.params.id;

    const trip = db.prepare(`
      SELECT t.*, 
             u.id as driver_id, u.name as driver_name, u.student_id as driver_student_id, 
             u.phone as driver_phone, u.email as driver_email, u.avatar_url as driver_avatar, 
             u.bio as driver_bio, u.department as driver_department,
             v.model as vehicle_model, v.registration_number, v.vehicle_type, v.color as vehicle_color, v.capacity as vehicle_capacity,
             (SELECT AVG(rating) FROM Reviews WHERE reviewee_id = u.id) as driver_rating,
             (SELECT COUNT(*) FROM Reviews WHERE reviewee_id = u.id) as driver_reviews_count
      FROM Trips t
      JOIN Users u ON t.driver_id = u.id
      JOIN Vehicles v ON t.vehicle_id = v.id
      WHERE t.id = ?
    `).get(tripId);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Get accepted passengers for this trip
    const acceptedPassengers = db.prepare(`
      SELECT r.id as request_id, r.seats_requested, r.notes, r.created_at,
             u.id as passenger_id, u.name as passenger_name, u.phone as passenger_phone, 
             u.student_id as passenger_student_id, u.avatar_url as passenger_avatar, u.department as passenger_department
      FROM RideRequests r
      JOIN Users u ON r.passenger_id = u.id
      WHERE r.trip_id = ? AND r.status = 'accepted'
    `).all(tripId);

    // If user is authenticated, check their request status for this trip
    let userRequest = null;
    let allRequests = [];

    if (req.user) {
      userRequest = db.prepare(`
        SELECT * FROM RideRequests 
        WHERE trip_id = ? AND passenger_id = ? 
        ORDER BY created_at DESC LIMIT 1
      `).get(tripId, req.user.id);

      // If the current user is the driver of the trip or admin, they can view ALL requests
      if (req.user.id === trip.driver_id || req.user.role === 'admin') {
        allRequests = db.prepare(`
          SELECT r.*, 
                 u.name as passenger_name, u.student_id as passenger_student_id, 
                 u.phone as passenger_phone, u.avatar_url as passenger_avatar, u.department as passenger_department
          FROM RideRequests r
          JOIN Users u ON r.passenger_id = u.id
          WHERE r.trip_id = ?
          ORDER BY r.created_at DESC
        `).all(tripId);
      }
    }

    return res.json({
      success: true,
      trip: {
        ...trip,
        acceptedPassengers,
        userRequest,
        requests: allRequests
      }
    });
  } catch (error) {
    console.error('Get trip details error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving trip details' });
  }
};

// Driver's published trips (My Trips)
exports.getMyTrips = (req, res) => {
  try {
    const driverId = req.user.id;

    const trips = db.prepare(`
      SELECT t.*, 
             v.model as vehicle_model, v.registration_number, v.vehicle_type, v.capacity as vehicle_capacity,
             (SELECT COUNT(*) FROM RideRequests WHERE trip_id = t.id AND status = 'pending') as pending_requests_count,
             (SELECT COUNT(*) FROM RideRequests WHERE trip_id = t.id AND status = 'accepted') as accepted_requests_count
      FROM Trips t
      JOIN Vehicles v ON t.vehicle_id = v.id
      WHERE t.driver_id = ?
      ORDER BY t.travel_date DESC, t.departure_time DESC
    `).all(driverId);

    // Attach passenger requests for each trip
    const tripsWithRequests = trips.map(trip => {
      const requests = db.prepare(`
        SELECT r.*, 
               u.name as passenger_name, u.student_id as passenger_student_id, 
               u.phone as passenger_phone, u.avatar_url as passenger_avatar, u.department as passenger_department
        FROM RideRequests r
        JOIN Users u ON r.passenger_id = u.id
        WHERE r.trip_id = ?
        ORDER BY r.created_at DESC
      `).all(trip.id);

      return {
        ...trip,
        requests
      };
    });

    return res.json({
      success: true,
      trips: tripsWithRequests
    });
  } catch (error) {
    console.error('Get my trips error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving your trips' });
  }
};

// Cancel trip (Driver or Admin)
exports.cancelTrip = (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const trip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.driver_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized: you are not the driver of this trip' });
    }

    if (trip.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Trip is already cancelled' });
    }

    // Begin atomic transaction
    db.exec('BEGIN IMMEDIATE');
    try {
      // Mark trip as cancelled
      db.prepare("UPDATE Trips SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(tripId);

      // Cancel all pending and accepted requests
      const affectedRequests = db.prepare(`
        SELECT r.*, u.id as passenger_user_id, u.name as passenger_name
        FROM RideRequests r
        JOIN Users u ON r.passenger_id = u.id
        WHERE r.trip_id = ? AND r.status IN ('pending', 'accepted')
      `).all(tripId);

      db.prepare(`
        UPDATE RideRequests 
        SET status = 'cancelled', cancellation_reason = 'Trip was cancelled by driver', updated_at = datetime('now')
        WHERE trip_id = ? AND status IN ('pending', 'accepted')
      `).run(tripId);

      db.exec('COMMIT');

      // Notify affected passengers
      affectedRequests.forEach(reqItem => {
        createNotification(
          reqItem.passenger_user_id,
          'Trip Cancelled',
          `The trip from ${trip.start_location} to ${trip.destination} on ${trip.travel_date} has been cancelled by the driver.`,
          'trip_cancelled',
          tripId
        );
      });

      return res.json({
        success: true,
        message: 'Trip has been cancelled and passengers notified'
      });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (error) {
    console.error('Cancel trip error:', error);
    return res.status(500).json({ success: false, message: 'Server error cancelling trip' });
  }
};

// Update trip details (Driver only - notes, pickup point)
exports.updateTrip = (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;

    const trip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.driver_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (trip.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot edit a cancelled trip' });
    }

    const { pickup_point, departure_time, notes } = req.body;

    db.prepare(`
      UPDATE Trips 
      SET pickup_point = COALESCE(?, pickup_point),
          departure_time = COALESCE(?, departure_time),
          notes = COALESCE(?, notes),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(pickup_point || null, departure_time || null, notes || null, tripId);

    // Notify accepted passengers of trip updates
    const passengers = db.prepare("SELECT passenger_id FROM RideRequests WHERE trip_id = ? AND status = 'accepted'").all(tripId);
    passengers.forEach(p => {
      createNotification(
        p.passenger_id,
        'Trip Details Updated',
        `The driver has updated trip details for ${trip.start_location} to ${trip.destination}. Check your upcoming trip for details.`,
        'system',
        tripId
      );
    });

    return res.json({ success: true, message: 'Trip updated successfully' });
  } catch (error) {
    console.error('Update trip error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating trip' });
  }
};

