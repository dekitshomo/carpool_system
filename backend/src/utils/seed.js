const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { initSchema } = require('../models/schema');

function seed() {
  console.log('--- Initializing database schema ---');
  initSchema();

  console.log('--- Seeding database with realistic sample data ---');

  // Clear existing data for clean seed
  db.exec(`
    DELETE FROM SentEmails;
    DELETE FROM Reviews;
    DELETE FROM Reports;
    DELETE FROM Notifications;
    DELETE FROM RideRequests;
    DELETE FROM Trips;
    DELETE FROM DriverVerifications;
    DELETE FROM Vehicles;
    DELETE FROM Users;
  `);

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Insert Users (All seeded demo users have email_verified = 1)
  const insertUser = db.prepare(`
    INSERT INTO Users (student_id, name, email, password_hash, phone, role, department, is_verified, email_verified, status, bio, emergency_contact_name, emergency_contact_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);

  // Admin
  const adminId = Number(insertUser.run(
    'ADMIN001', 'Sherubtse Admin Safety', 'admin@college.edu', passwordHash, '+975-17123456',
    'admin', 'Campus Administration', 1, 'active', 'Official Student Carpool & Campus Transport Administrator', 'Campus Security', '+975-04-535100'
  ).lastInsertRowid);

  // Driver 1 (Verified)
  const driver1Id = Number(insertUser.run(
    'STD2023001', 'Tashi Dorji', 'driver1@college.edu', passwordHash, '+975-17889900',
    'driver', 'Computer Science', 1, 'active', 'Final year CS student. Commute regularly between Trashigang and Kanglung campus.', 'Uncle Dorji', '+975-17112233'
  ).lastInsertRowid);

  // Driver 2 (Verified)
  const driver2Id = Number(insertUser.run(
    'STD2023002', 'Sonam Pelden', 'driver2@college.edu', passwordHash, '+975-17665544',
    'driver', 'Life Sciences', 1, 'active', 'Safe driver, punctual, and always willing to help fellow campus students share rides.', 'Sister Dechen', '+975-17998877'
  ).lastInsertRowid);

  // Driver 3 (Verified)
  const driver3Id = Number(insertUser.run(
    'STD2023003', 'Karma Wangchuk', 'driver3@college.edu', passwordHash, '+975-17334455',
    'driver', 'Economics & Management', 1, 'active', 'Weekend commuter between Trashigang town and Kanglung.', 'Father Wangchuk', '+975-17223344'
  ).lastInsertRowid);

  // Driver 4 (Pending Verification)
  const driver4Id = Number(insertUser.run(
    'STD2023004', 'Dechen Zangmo', 'pendingdriver@college.edu', passwordHash, '+975-17556677',
    'driver', 'Arts & Humanities', 0, 'active', 'New student driver requesting verification for carpooling.', 'Mother Lhamo', '+975-17445566'
  ).lastInsertRowid);

  // Passenger 1
  const pass1Id = Number(insertUser.run(
    'STD2024010', 'Pema Wangmo', 'passenger1@college.edu', passwordHash, '+975-17991122',
    'passenger', 'Computer Science', 1, 'active', '2nd year CS student looking for reliable campus commute rides.', 'Brother Pema', '+975-17880011'
  ).lastInsertRowid);

  // Passenger 2
  const pass2Id = Number(insertUser.run(
    'STD2024011', 'Kinley Tshering', 'passenger2@college.edu', passwordHash, '+975-17772233',
    'passenger', 'Mathematics & Stats', 1, 'active', 'Daily commuter from Trashigang town to Kanglung main gate.', 'Sister Yangchen', '+975-17661122'
  ).lastInsertRowid);

  // Passenger 3
  const pass3Id = Number(insertUser.run(
    'STD2024012', 'Sangay Dema', 'passenger3@college.edu', passwordHash, '+975-17449988',
    'passenger', 'Physics & Chemistry', 1, 'active', 'Student seeking weekend rides back home.', 'Father Sangay', '+975-17550099'
  ).lastInsertRowid);

  // 2. Insert Vehicles
  const insertVehicle = db.prepare(`
    INSERT INTO Vehicles (user_id, model, registration_number, vehicle_type, capacity, color, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const v1 = Number(insertVehicle.run(driver1Id, 'Toyota Prius (Hybrid)', 'BP-1-A1234', 'Sedan', 4, 'Silver Metallic').lastInsertRowid);
  const v2 = Number(insertVehicle.run(driver2Id, 'Hyundai Creta', 'BP-2-B5678', 'SUV', 4, 'Polar White').lastInsertRowid);
  const v3 = Number(insertVehicle.run(driver3Id, 'Maruti Swift Dzire', 'BP-1-C9988', 'Sedan', 3, 'Midnight Blue').lastInsertRowid);
  const v4 = Number(insertVehicle.run(driver4Id, 'Kia Seltos', 'BP-3-D4455', 'SUV', 4, 'Gravity Grey').lastInsertRowid);

  // 3. Driver Verifications
  const insertVerif = db.prepare(`
    INSERT INTO DriverVerifications (user_id, license_number, status, admin_notes, verified_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertVerif.run(driver1Id, 'DL-BTN-2021-9981', 'approved', 'Verified valid college registration and driver license.', "2026-01-10 10:00:00");
  insertVerif.run(driver2Id, 'DL-BTN-2022-4412', 'approved', 'Documents authenticated and verified.', "2026-02-15 14:30:00");
  insertVerif.run(driver3Id, 'DL-BTN-2023-7721', 'approved', 'All driving records clean and verified.', "2026-03-01 09:15:00");
  insertVerif.run(driver4Id, 'DL-BTN-2024-1189', 'pending', 'Submitted driver license photo and student ID card for verification.', null);

  // 4. Trips
  const insertTrip = db.prepare(`
    INSERT INTO Trips (driver_id, vehicle_id, start_location, destination, pickup_point, travel_date, departure_time, total_seats, available_seats, estimated_duration, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Today and upcoming dates
  const today = new Date();
  const formatDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const trip1 = Number(insertTrip.run(
    driver1Id, v1, 'Trashigang Town', 'Kanglung (Sherubtse Campus)',
    'Trashigang Main Taxi Stand', formatDate(1), '08:30', 3, 2, '35 mins',
    'Travelling to morning 9:00 AM classes. Ample boot space for backpacks. Strictly non-smoking.', 'published'
  ).lastInsertRowid);

  const trip2 = Number(insertTrip.run(
    driver2Id, v2, 'Kanglung Campus', 'Trashigang Town',
    'Main College Gate / Library Point', formatDate(1), '16:45', 4, 3, '40 mins',
    'Returning after afternoon lectures. Drop-offs along the highway or town center.', 'published'
  ).lastInsertRowid);

  const trip3 = Number(insertTrip.run(
    driver3Id, v3, 'Trashigang Town', 'Kanglung (Sherubtse Campus)',
    'Near Hotel Druk Deothang', formatDate(2), '08:15', 3, 3, '35 mins',
    'Morning lecture commute. Friendly and quiet ride.', 'published'
  ).lastInsertRowid);

  const trip4 = Number(insertTrip.run(
    driver1Id, v1, 'Kanglung Campus', 'Ranjung High School Junction',
    'Hostel B Parking Lot', formatDate(3), '14:00', 3, 3, '50 mins',
    'Weekend visit to relatives. Can drop students heading to Ranjung or Phongmey.', 'published'
  ).lastInsertRowid);

  const trip5 = Number(insertTrip.run(
    driver2Id, v2, 'Trashigang Town', 'Mongar Town',
    'Trashigang Bridge Checkpoint', formatDate(5), '07:00', 4, 4, '3 hours',
    'Weekend holiday trip towards Mongar. Sharing fuel expense socially, comfortable SUV.', 'published'
  ).lastInsertRowid);

  // 5. Ride Requests
  const insertReq = db.prepare(`
    INSERT INTO RideRequests (trip_id, passenger_id, seats_requested, notes, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  // On Trip 1: Pema Wangmo has an accepted seat (leaving 2 seats available out of 3)
  insertReq.run(trip1, pass1Id, 1, 'Good morning! Have a lecture at 9:15 AM at Block C. Please accept.', 'accepted');

  // On Trip 1: Kinley has a pending request
  insertReq.run(trip1, pass2Id, 1, 'Waiting at lower taxi stand. Can you pick me up there?', 'pending');

  // On Trip 2: Sangay has an accepted seat
  insertReq.run(trip2, pass3Id, 1, 'Need a ride back home after lab exam.', 'accepted');

  // 6. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO Notifications (user_id, title, message, type, related_trip_id, is_read)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(driver1Id, 'New Ride Request', 'Kinley Tshering requested 1 seat for your trip from Trashigang Town to Kanglung.', 'request_received', trip1, 0);
  insertNotif.run(pass1Id, 'Ride Request Accepted!', 'Your ride request for Trashigang Town to Kanglung has been accepted by Tashi Dorji.', 'request_accepted', trip1, 1);
  insertNotif.run(pass3Id, 'Ride Request Accepted!', 'Your ride request from Kanglung Campus to Trashigang Town was accepted by Sonam Pelden.', 'request_accepted', trip2, 1);

  // 7. Reviews
  const insertReview = db.prepare(`
    INSERT INTO Reviews (trip_id, reviewer_id, reviewee_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertReview.run(trip1, pass1Id, driver1Id, 5, 'Very punctual driver, clean car and great driving etiquette.');
  insertReview.run(trip2, pass3Id, driver2Id, 5, 'Sonam was super polite and arrived right on time at the main college gate.');

  // 8. Safety Report sample
  const insertReport = db.prepare(`
    INSERT INTO Reports (reporter_id, reported_user_id, trip_id, reason, description, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertReport.run(
    pass2Id, driver3Id, trip3, 'Schedule change inquiry',
    'Driver moved departure time by 10 minutes without prior update in description. Resolved amicably.', 'resolved'
  );

  console.log('Database seeded successfully!');
  console.log('Sample Accounts:');
  console.log(' - Admin: admin@college.edu / password123');
  console.log(' - Driver 1 (Verified): driver1@college.edu / password123');
  console.log(' - Driver 2 (Verified): driver2@college.edu / password123');
  console.log(' - Driver (Pending): pendingdriver@college.edu / password123');
  console.log(' - Passenger 1: passenger1@college.edu / password123');
  console.log(' - Passenger 2: passenger2@college.edu / password123');
}

if (require.main === module) {
  seed();
}

module.exports = { seed };

