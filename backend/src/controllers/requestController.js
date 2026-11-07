const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

// Submit a ride request (Passenger)
exports.createRequest = (req, res) => {
  try {
    const passengerId = req.user.id;
    const { trip_id, seats_requested = 1, notes } = req.body;

    if (!trip_id) {
      return res.status(400).json({ success: false, message: 'Trip ID is required' });
    }

    const seats = parseInt(seats_requested, 10);
    if (isNaN(seats) || seats <= 0) {
      return res.status(400).json({ success: false, message: 'Requested seats must be at least 1' });
    }

    // Fetch trip
    const trip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Business Logic: Driver cannot request seat on their own trip
    if (trip.driver_id === passengerId) {
      return res.status(400).json({ success: false, message: 'Drivers cannot request seats on their own trips' });
    }

    // Business Logic: Trip status must be published
    if (trip.status !== 'published') {
      return res.status(400).json({ success: false, message: `This trip is ${trip.status} and cannot accept new requests` });
    }

    // Business Logic: Do not allow request for past trips
    const todayStr = new Date().toISOString().split('T')[0];
    if (trip.travel_date < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot request seats for past trips' });
    }

    // Business Logic: Passenger cannot request more seats than available
    if (seats > trip.available_seats) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${trip.available_seats} seat(s) currently available for this trip` 
      });
    }

    // Business Logic: Prevent duplicate active requests for the same trip
    const existing = db.prepare(`
      SELECT * FROM RideRequests 
      WHERE trip_id = ? AND passenger_id = ? AND status IN ('pending', 'accepted')
    `).get(trip_id, passengerId);

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: `You already have an active ${existing.status} request for this trip` 
      });
    }

    // Insert request
    const stmt = db.prepare(`
      INSERT INTO RideRequests (trip_id, passenger_id, seats_requested, notes, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(trip_id, passengerId, seats, notes ? notes.trim() : null);
    const requestId = Number(result.lastInsertRowid);

    // Notify Driver
    createNotification(
      trip.driver_id,
      'New Ride Request Received',
      `${req.user.name} has requested ${seats} seat(s) for your trip from ${trip.start_location} to ${trip.destination} on ${trip.travel_date}.`,
      'request_received',
      trip.id
    );

    return res.status(201).json({
      success: true,
      message: 'Ride request submitted successfully. The driver will review your request.',
      requestId
    });
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({ success: false, message: 'Server error while submitting request' });
  }
};

// Accept a ride request (Driver only, using ACID Transaction)
exports.acceptRequest = (req, res) => {
  try {
    const requestId = req.params.id;
    const driverId = req.user.id;

    // Begin atomic transaction to prevent race conditions & overbooking
    db.exec('BEGIN IMMEDIATE');

    try {
      // Find request and associated trip with lock
      const request = db.prepare(`
        SELECT r.*, t.driver_id, t.available_seats, t.total_seats, t.start_location, t.destination, t.travel_date, t.departure_time, t.status as trip_status
        FROM RideRequests r
        JOIN Trips t ON r.trip_id = t.id
        WHERE r.id = ?
      `).get(requestId);

      if (!request) {
        db.exec('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Ride request not found' });
      }

      // Authorization check
      if (request.driver_id !== driverId && req.user.role !== 'admin') {
        db.exec('ROLLBACK');
        return res.status(403).json({ success: false, message: 'Unauthorized: you are not the driver of this trip' });
      }

      if (request.status !== 'pending') {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
      }

      if (request.trip_status !== 'published') {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, message: `Trip is ${request.trip_status}` });
      }

      // Check available seats in transaction
      if (request.available_seats < request.seats_requested) {
        db.exec('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Not enough available seats. Only ${request.available_seats} remaining, requested: ${request.seats_requested}` 
        });
      }

      // Update request status to accepted
      db.prepare("UPDATE RideRequests SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(requestId);

      // Deduct available seats
      const newAvailableSeats = request.available_seats - request.seats_requested;
      db.prepare("UPDATE Trips SET available_seats = ?, updated_at = datetime('now') WHERE id = ?").run(newAvailableSeats, request.trip_id);

      db.exec('COMMIT');

      // Notify passenger
      createNotification(
        request.passenger_id,
        'Ride Request Accepted!',
        `Great news! Your request for ${request.seats_requested} seat(s) for the trip to ${request.destination} on ${request.travel_date} at ${request.departure_time} has been accepted!`,
        'request_accepted',
        request.trip_id
      );

      return res.json({
        success: true,
        message: 'Request accepted successfully. Seat count updated.',
        remainingSeats: newAvailableSeats
      });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing request acceptance' });
  }
};

// Reject a ride request (Driver only)
exports.rejectRequest = (req, res) => {
  try {
    const requestId = req.params.id;
    const driverId = req.user.id;
    const { reason } = req.body;

    const request = db.prepare(`
      SELECT r.*, t.driver_id, t.start_location, t.destination, t.travel_date
      FROM RideRequests r
      JOIN Trips t ON r.trip_id = t.id
      WHERE r.id = ?
    `).get(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Ride request not found' });
    }

    if (request.driver_id !== driverId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot reject request with status '${request.status}'` });
    }

    // Update request to rejected (does not affect seat availability)
    db.prepare(`
      UPDATE RideRequests 
      SET status = 'rejected', cancellation_reason = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).run(reason || 'Declined by driver', requestId);

    // Notify passenger
    createNotification(
      request.passenger_id,
      'Ride Request Declined',
      `Your ride request for the trip to ${request.destination} on ${request.travel_date} was not accepted by the driver.${reason ? ' Reason: ' + reason : ''}`,
      'request_rejected',
      request.trip_id
    );

    return res.json({
      success: true,
      message: 'Request has been rejected'
    });
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ success: false, message: 'Server error rejecting request' });
  }
};

// Cancel a ride request (Passenger cancels)
exports.cancelRequest = (req, res) => {
  try {
    const requestId = req.params.id;
    const passengerId = req.user.id;
    const { reason } = req.body;

    db.exec('BEGIN IMMEDIATE');
    try {
      const request = db.prepare(`
        SELECT r.*, t.driver_id, t.available_seats, t.total_seats, t.start_location, t.destination, t.travel_date, t.departure_time, t.status as trip_status
        FROM RideRequests r
        JOIN Trips t ON r.trip_id = t.id
        WHERE r.id = ?
      `).get(requestId);

      if (!request) {
        db.exec('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Ride request not found' });
      }

      if (request.passenger_id !== passengerId && req.user.role !== 'admin') {
        db.exec('ROLLBACK');
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this request' });
      }

      if (request.status === 'cancelled') {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Request is already cancelled' });
      }

      const prevStatus = request.status;

      // Update request to cancelled
      db.prepare(`
        UPDATE RideRequests 
        SET status = 'cancelled', cancellation_reason = ?, updated_at = datetime('now') 
        WHERE id = ?
      `).run(reason || 'Cancelled by passenger', requestId);

      // If it was accepted, restore seats (as long as trip has not passed)
      let restoredSeats = 0;
      if (prevStatus === 'accepted') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (request.travel_date >= todayStr) {
          const newSeats = Math.min(request.total_seats, request.available_seats + request.seats_requested);
          db.prepare("UPDATE Trips SET available_seats = ?, updated_at = datetime('now') WHERE id = ?").run(newSeats, request.trip_id);
          restoredSeats = request.seats_requested;
        }
      }

      db.exec('COMMIT');

      // Notify Driver
      createNotification(
        request.driver_id,
        'Ride Request Cancelled',
        `${req.user.name} has cancelled their ${prevStatus} request (${request.seats_requested} seats) for the trip to ${request.destination} on ${request.travel_date}.${restoredSeats > 0 ? ` Seats have been restored (${restoredSeats} seats).` : ''}`,
        'request_cancelled',
        request.trip_id
      );

      return res.json({
        success: true,
        message: 'Ride request cancelled successfully',
        restoredSeats
      });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (error) {
    console.error('Cancel request error:', error);
    return res.status(500).json({ success: false, message: 'Server error cancelling request' });
  }
};

// Get passenger requests (My Requests)
exports.getMyRequests = (req, res) => {
  try {
    const passengerId = req.user.id;

    const requests = db.prepare(`
      SELECT r.*, 
             t.start_location, t.destination, t.pickup_point, t.travel_date, t.departure_time, 
             t.available_seats, t.total_seats, t.status as trip_status,
             u.id as driver_id, u.name as driver_name, u.phone as driver_phone, 
             u.student_id as driver_student_id, u.avatar_url as driver_avatar,
             v.model as vehicle_model, v.registration_number, v.vehicle_type, v.color as vehicle_color
      FROM RideRequests r
      JOIN Trips t ON r.trip_id = t.id
      JOIN Users u ON t.driver_id = u.id
      JOIN Vehicles v ON t.vehicle_id = v.id
      WHERE r.passenger_id = ?
      ORDER BY r.created_at DESC
    `).all(passengerId);

    return res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving requests' });
  }
};

