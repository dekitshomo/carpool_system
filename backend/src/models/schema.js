const db = require('../config/db');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('driver', 'passenger', 'admin')),
      avatar_url TEXT,
      bio TEXT,
      department TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      is_verified INTEGER DEFAULT 0,
      email_verified INTEGER DEFAULT 0,
      verification_code TEXT,
      verification_token TEXT,
      verification_expires DATETIME,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deactivated')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS SentEmails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      verification_code TEXT,
      status TEXT DEFAULT 'delivered',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS PendingRegistrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      student_id TEXT,
      password_hash TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('driver', 'passenger')),
      department TEXT,
      license_number TEXT,
      verification_code TEXT,
      verification_token TEXT,
      code_hash TEXT,
      code_salt TEXT,
      failed_attempts INTEGER DEFAULT 0,
      last_sent_at DATETIME,
      resend_count INTEGER DEFAULT 1,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      model TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      color TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS DriverVerifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      license_number TEXT NOT NULL,
      student_card_doc TEXT,
      license_doc TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      admin_notes TEXT,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      vehicle_id INTEGER NOT NULL REFERENCES Vehicles(id),
      start_location TEXT NOT NULL,
      destination TEXT NOT NULL,
      pickup_point TEXT NOT NULL,
      travel_date TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      total_seats INTEGER NOT NULL,
      available_seats INTEGER NOT NULL,
      estimated_duration TEXT,
      notes TEXT,
      status TEXT DEFAULT 'published' CHECK(status IN ('published', 'in_progress', 'completed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS RideRequests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES Trips(id) ON DELETE CASCADE,
      passenger_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      seats_requested INTEGER NOT NULL,
      notes TEXT,
      cancellation_reason TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      related_trip_id INTEGER,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      reported_user_id INTEGER REFERENCES Users(id) ON DELETE SET NULL,
      trip_id INTEGER REFERENCES Trips(id) ON DELETE SET NULL,
      reason TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'dismissed')),
      admin_action TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES Trips(id) ON DELETE CASCADE,
      reviewer_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      reviewee_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indices for high performance lookups
    CREATE INDEX IF NOT EXISTS idx_trips_search ON Trips(start_location, destination, travel_date, status);
    CREATE INDEX IF NOT EXISTS idx_trips_driver ON Trips(driver_id);
    CREATE INDEX IF NOT EXISTS idx_requests_trip ON RideRequests(trip_id);
    CREATE INDEX IF NOT EXISTS idx_requests_passenger ON RideRequests(passenger_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON Notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_emails_to ON SentEmails(to_email);
    CREATE INDEX IF NOT EXISTS idx_pending_email ON PendingRegistrations(email);
    CREATE INDEX IF NOT EXISTS idx_pending_token ON PendingRegistrations(verification_token);
  `);

  // Non-destructive column additions for existing databases
  try { db.exec('ALTER TABLE Users ADD COLUMN email_verified INTEGER DEFAULT 0;'); } catch (e) {}
  try { db.exec('ALTER TABLE Users ADD COLUMN verification_code TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE Users ADD COLUMN verification_token TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE Users ADD COLUMN verification_expires DATETIME;'); } catch (e) {}
  try { db.exec('ALTER TABLE Notifications ADD COLUMN related_trip_id INTEGER;'); } catch (e) {}
  try { db.exec('ALTER TABLE Notifications ADD COLUMN related_id INTEGER;'); } catch (e) {}
  try { db.exec('ALTER TABLE RideRequests ADD COLUMN cancellation_reason TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE PendingRegistrations ADD COLUMN code_hash TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE PendingRegistrations ADD COLUMN code_salt TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE PendingRegistrations ADD COLUMN failed_attempts INTEGER DEFAULT 0;'); } catch (e) {}
  try { db.exec('ALTER TABLE PendingRegistrations ADD COLUMN last_sent_at DATETIME;'); } catch (e) {}
  try { db.exec('ALTER TABLE PendingRegistrations ADD COLUMN resend_count INTEGER DEFAULT 1;'); } catch (e) {}
}

module.exports = { initSchema };
