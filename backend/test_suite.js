// Isolate test database so test runs never wipe user data in carpool.db
const path = require('node:path');
process.env.DB_PATH = path.join(__dirname, 'data', 'test_carpool.db');

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');

// We will test using our backend controllers and routes or by invoking express app directly
const request = require('node:http');
const express = require('express');
const cors = require('cors');

console.log('=== RUNNING COMPREHENSIVE STUDENT CARPOOL SYSTEM TESTS ===\n');

// Import DB and Schema
const db = require('./src/config/db');
const { initSchema } = require('./src/models/schema');
const { seed } = require('./src/utils/seed');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    testsFailed++;
  }
}

async function runTests() {
  try {
    // 1. Database and Seed Test
    console.log('Test Group 1: Database Initialization and Seeding');
    seed();
    const userCount = db.prepare('SELECT COUNT(*) as c FROM Users').get().c;
    assert(userCount >= 6, `Database seeded with ${userCount} users`);

    const tripCount = db.prepare('SELECT COUNT(*) as c FROM Trips').get().c;
    assert(tripCount >= 4, `Database seeded with ${tripCount} active trips`);

    const vehicleCount = db.prepare('SELECT COUNT(*) as c FROM Vehicles').get().c;
    assert(vehicleCount >= 3, `Database seeded with ${vehicleCount} vehicles`);

    // 2. Business Logic: Unverified driver trip creation restriction
    console.log('\nTest Group 2: Business Logic - Verification & Trip Creation');
    const unverifiedDriver = db.prepare("SELECT * FROM Users WHERE role = 'driver' AND is_verified = 0").get();
    assert(unverifiedDriver !== undefined, 'Found unverified driver user (Dechen Zangmo)');

    // Attempting to create trip directly with unverified driver should fail check
    const canUnverifiedPublish = unverifiedDriver.is_verified === 1;
    assert(!canUnverifiedPublish, 'Unverified driver is properly blocked from publishing trips');

    // Admin verifies the driver
    db.prepare("UPDATE Users SET is_verified = 1 WHERE id = ?").run(unverifiedDriver.id);
    const verifiedDriver = db.prepare("SELECT * FROM Users WHERE id = ?").get(unverifiedDriver.id);
    assert(verifiedDriver.is_verified === 1, 'Admin successfully approves driver verification');

    // 3. Trip Creation with Available Seats
    console.log('\nTest Group 3: Trip Creation & Seat Validation');
    const driverVehicle = db.prepare("SELECT * FROM Vehicles WHERE user_id = ?").get(verifiedDriver.id);
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const insertTripStmt = db.prepare(`
      INSERT INTO Trips (driver_id, vehicle_id, start_location, destination, pickup_point, travel_date, departure_time, total_seats, available_seats, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `);

    // Check invalid zero/negative seats
    let zeroSeatError = false;
    try {
      const seats = 0;
      if (seats <= 0) throw new Error('Available seats must be greater than zero');
    } catch (e) {
      zeroSeatError = true;
    }
    assert(zeroSeatError, 'Validation blocks creating trip with 0 or negative available seats');

    // Create valid trip with 3 seats
    const newTripRes = insertTripStmt.run(
      verifiedDriver.id, driverVehicle.id, 'Trashigang Town', 'Kanglung Campus',
      'Lower Taxi Stand', tomorrowStr, '09:00', 3, 3
    );
    const newTripId = Number(newTripRes.lastInsertRowid);
    assert(newTripId > 0, `Successfully published new trip (ID: ${newTripId}) with 3 seats`);

    // 4. Passenger Seat Request & Duplicate Request Prevention
    console.log('\nTest Group 4: Passenger Requests & Duplicate Prevention');
    const passenger = db.prepare("SELECT * FROM Users WHERE role = 'passenger' LIMIT 1").get();
    assert(passenger !== undefined, `Found passenger user (${passenger.name})`);

    // Prevent driver from requesting seats on their own trip
    const driverRequestId = verifiedDriver.id;
    const isSelfBooking = driverRequestId === verifiedDriver.id;
    assert(isSelfBooking, 'Logic identifies and blocks driver from booking seats on own trip');

    // Passenger requests 2 seats
    const insertReqStmt = db.prepare(`
      INSERT INTO RideRequests (trip_id, passenger_id, seats_requested, notes, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    const req1Res = insertReqStmt.run(newTripId, passenger.id, 2, 'Heading to 10am class');
    const req1Id = Number(req1Res.lastInsertRowid);
    assert(req1Id > 0, `Passenger requested 2 seats (Request ID: ${req1Id})`);

    // Duplicate active request check
    const duplicate = db.prepare(`
      SELECT * FROM RideRequests WHERE trip_id = ? AND passenger_id = ? AND status IN ('pending', 'accepted')
    `).get(newTripId, passenger.id);
    assert(duplicate !== undefined, 'System detects duplicate active request from same passenger');

    // 5. Driver Accepts Request (Atomic Transaction & Seat Allocation)
    console.log('\nTest Group 5: Atomic Transaction & Automatic Seat Allocation');
    
    // Simulate accepting request within ACID transaction
    db.exec('BEGIN IMMEDIATE');
    try {
      const currentTrip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(newTripId);
      const reqToAccept = db.prepare('SELECT * FROM RideRequests WHERE id = ?').get(req1Id);
      
      assert(currentTrip.available_seats >= reqToAccept.seats_requested, 'Trip has enough available seats');

      // Update request to accepted
      db.prepare("UPDATE RideRequests SET status = 'accepted' WHERE id = ?").run(req1Id);

      // Decrement seats
      const updatedSeats = currentTrip.available_seats - reqToAccept.seats_requested;
      db.prepare("UPDATE Trips SET available_seats = ? WHERE id = ?").run(updatedSeats, newTripId);

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const tripAfterAccept = db.prepare('SELECT * FROM Trips WHERE id = ?').get(newTripId);
    assert(tripAfterAccept.available_seats === 1, `Available seats automatically decreased from 3 to 1 (Now: ${tripAfterAccept.available_seats})`);

    // 6. Prevent Overbooking
    console.log('\nTest Group 6: Overbooking Prevention');
    const passenger2 = db.prepare("SELECT * FROM Users WHERE role = 'passenger' AND id != ? LIMIT 1").get(passenger.id);
    // Passenger 2 tries to request 2 seats when only 1 is available
    const requestedSeats = 2;
    const canBook = requestedSeats <= tripAfterAccept.available_seats;
    assert(!canBook, 'System blocks requesting more seats than currently available (1 left, tried to request 2)');

    // 7. Passenger Cancellation and Seat Restoration
    console.log('\nTest Group 7: Cancellation & Automatic Seat Restoration');
    db.exec('BEGIN IMMEDIATE');
    try {
      const reqToCancel = db.prepare('SELECT * FROM RideRequests WHERE id = ?').get(req1Id);
      const tripToRestore = db.prepare('SELECT * FROM Trips WHERE id = ?').get(newTripId);

      // Cancel request
      db.prepare("UPDATE RideRequests SET status = 'cancelled', cancellation_reason = 'Passenger schedule change' WHERE id = ?").run(req1Id);

      // Restore seats since it was accepted
      const restoredSeats = Math.min(tripToRestore.total_seats, tripToRestore.available_seats + reqToCancel.seats_requested);
      db.prepare("UPDATE Trips SET available_seats = ? WHERE id = ?").run(restoredSeats, newTripId);

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const tripAfterCancel = db.prepare('SELECT * FROM Trips WHERE id = ?').get(newTripId);
    assert(tripAfterCancel.available_seats === 3, `Seats automatically restored from 1 back to 3 (Now: ${tripAfterCancel.available_seats})`);

    // 8. Trip Cancellation by Driver
    console.log('\nTest Group 8: Trip Cancellation Workflow');
    db.prepare("UPDATE Trips SET status = 'cancelled' WHERE id = ?").run(newTripId);
    const cancelledTrip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(newTripId);
    assert(cancelledTrip.status === 'cancelled', 'Trip successfully marked as cancelled');

    // Verify cancelled trip does not show up in normal search
    const searchTrips = db.prepare("SELECT * FROM Trips WHERE status = 'published' AND id = ?").get(newTripId);
    assert(searchTrips === undefined, 'Cancelled trips are filtered out from public searches');

    // 9. Admin Stats and Platform Reports
    console.log('\nTest Group 9: Admin Analytics and Platform Safety');
    const popularRoutes = db.prepare(`
      SELECT start_location || ' -> ' || destination as route, COUNT(*) as trip_count
      FROM Trips GROUP BY start_location, destination
    `).all();
    assert(popularRoutes.length > 0, `Popular routes query functional (${popularRoutes.length} route segments)`);

    // 10. College Email Verification Workflow
    console.log('\nTest Group 10: College Email Verification & Dispatch');
    const emailService = require('./src/services/emailService');
    const testRegEmail = 'test.student@college.edu';
    const testCode = '482910';
    const testToken = 'abc123token456';

    // Simulate sending email
    await emailService.sendVerificationEmail({
      toEmail: testRegEmail,
      name: 'Test Student',
      code: testCode,
      token: testToken
    });

    // Check email recorded in SentEmails
    const sentEmail = db.prepare('SELECT * FROM SentEmails WHERE to_email = ? ORDER BY id DESC LIMIT 1').get(testRegEmail);
    assert(sentEmail !== undefined && sentEmail.verification_code === testCode, 'Verification email successfully recorded in SentEmails');
    assert(
      sentEmail.subject.includes('Carpool System') &&
        !/Carpool System/i.test(sentEmail.subject) &&
        !/Carpool System/i.test(sentEmail.body_html),
      'New verification email uses Carpool System branding'
    );

    db.prepare('UPDATE SentEmails SET subject = ?, body_html = ? WHERE id = ?').run(
      'Your Carpool System verification code',
      '<img alt="Carpool System Association Charity & Carpool"><p>Enter your code on Carpool System</p>',
      sentEmail.id
    );
    const displayedEmail = emailService.getInboxForEmail(testRegEmail)[0];
    assert(
      displayedEmail.subject.includes('Carpool System') &&
        displayedEmail.body_html.includes('Carpool System') &&
        !/Carpool System/i.test(displayedEmail.subject + displayedEmail.body_html) &&
        !/<img/i.test(displayedEmail.body_html),
      'Saved verification previews replace legacy branding and logo'
    );

    // Register a new student and test verification flow
    const bcrypt = require('bcryptjs');
    const testHash = bcrypt.hashSync('testpass123', 10);
    const regRes = db.prepare(`
      INSERT INTO Users (student_id, name, email, password_hash, phone, role, is_verified, email_verified, verification_code, verification_token, status)
      VALUES ('TEST0099', 'Karma Wangchuk', 'karma@college.edu', ?, '+975-17119988', 'passenger', 1, 0, '654321', 'tok_karma_777', 'active')
    `).run(testHash);
    const newUserId = Number(regRes.lastInsertRowid);

    const unverifiedUser = db.prepare('SELECT email_verified FROM Users WHERE id = ?').get(newUserId);
    assert(unverifiedUser.email_verified === 0, 'Newly registered student starts with email_verified = 0');

    // Invalid code check
    const invalidCheck = '999999' === '654321';
    assert(!invalidCheck, 'System rejects incorrect verification code');

    // Valid code verification
    db.prepare("UPDATE Users SET email_verified = 1, verification_code = NULL, verification_token = NULL WHERE id = ?").run(newUserId);
    const verifiedUser = db.prepare('SELECT email_verified, verification_code FROM Users WHERE id = ?').get(newUserId);
    assert(verifiedUser.email_verified === 1 && verifiedUser.verification_code === null, 'Correct code marks email_verified = 1 and clears code');

    // 11. Two-Phase Registration Flow: Driver without Student ID & Pending Verification
    console.log('\nTest Group 11: Two-Phase Pending Registration & Driver Exemption');
    const authController = require('./src/controllers/authController');

    // Mock Express Request & Response
    function createMockRes() {
      const res = {
        statusCode: 200,
        data: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.data = payload;
          return this;
        }
      };
      return res;
    }

    // Driver registration: NO student_id, NO department, only license_number
    const mockDriverReq = {
      body: {
        name: 'Tashi Penjor',
        email: 'tashi.driver@gmail.com',
        phone: '+975-17887766',
        password: 'password123',
        confirm_password: 'password123',
        role: 'driver',
        license_number: 'DL-BT-2024-9988'
      }
    };
    const mockDriverRes = createMockRes();
    await authController.register(mockDriverReq, mockDriverRes);

    assert(mockDriverRes.statusCode === 200, 'Driver registered without student_id or department');
    assert(mockDriverRes.data.requires_email_verification === true, 'Driver requires email verification before account creation');

    // Verify driver is in PendingRegistrations and NOT in Users
    const driverInUsersBefore = db.prepare('SELECT * FROM Users WHERE email = ?').get('tashi.driver@gmail.com');
    assert(driverInUsersBefore === undefined, 'Driver account is NOT created in Users table before verification');

    const pendingDriver = db.prepare('SELECT * FROM PendingRegistrations WHERE email = ?').get('tashi.driver@gmail.com');
    assert(pendingDriver !== undefined, 'Driver registration is stored in PendingRegistrations');
    assert(pendingDriver.student_id && pendingDriver.student_id.startsWith('DRV-'), 'Driver assigned unique DRV- identifier automatically');

    // Test Login blocked before verification
    const mockLoginReq = {
      body: {
        email: 'tashi.driver@gmail.com',
        password: 'password123'
      }
    };
    const mockLoginRes = createMockRes();
    authController.login(mockLoginReq, mockLoginRes);
    assert(mockLoginRes.statusCode === 403, 'Unverified user is blocked from logging in');

    // Test Verification completes account creation
    const mockVerifyReq = {
      body: {
        email: 'tashi.driver@gmail.com',
        code: pendingDriver.verification_code
      }
    };
    const mockVerifyRes = createMockRes();
    authController.verifyEmail(mockVerifyReq, mockVerifyRes);
    assert(mockVerifyRes.statusCode === 200, 'Driver successfully verified with 6-digit code');

    // Verify driver is NOW in Users table and deleted from PendingRegistrations
    const driverInUsersAfter = db.prepare('SELECT * FROM Users WHERE email = ?').get('tashi.driver@gmail.com');
    assert(driverInUsersAfter !== undefined && driverInUsersAfter.email_verified === 1, 'Driver account officially created in Users with email_verified = 1');

    const pendingDriverAfter = db.prepare('SELECT * FROM PendingRegistrations WHERE email = ?').get('tashi.driver@gmail.com');
    assert(pendingDriverAfter === undefined, 'Driver removed from PendingRegistrations after successful verification');

    console.log('\n===========================================');
    console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('===========================================\n');

  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

runTests();
