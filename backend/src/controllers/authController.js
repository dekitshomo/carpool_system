const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');
const emailService = require('../services/emailService');
const smtpClient = require('../services/smtpClient');

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;

  try {
    const origin = new URL(req.get('origin'));
    if (
      ['http:', 'https:'].includes(origin.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
    ) {
      return origin.origin;
    }
  } catch (error) {
    // Requests without a valid local browser origin use the configured default.
  }

  return 'http://localhost:3000';
};

exports.register = async (req, res) => {
  try {
    const { 
      student_id, 
      name, 
      email, 
      password, 
      confirm_password, 
      phone, 
      role = 'passenger',
      department,
      license_number 
    } = req.body;

    // Common required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Please fill in all mandatory fields (Name, Email Account, Phone, Password)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Role validation
    const validRoles = ['driver', 'passenger'];
    const chosenRole = validRoles.includes((role || '').toLowerCase()) ? role.toLowerCase() : 'passenger';

    // Role-specific validations:
    // Drivers: NO student_id, NO department required. License number is REQUIRED.
    // Passengers: student_id is REQUIRED.
    if (chosenRole === 'passenger') {
      if (!student_id || !student_id.trim()) {
        return res.status(400).json({ success: false, message: 'Student ID is required for passenger registration' });
      }
    } else if (chosenRole === 'driver') {
      if (!license_number || !license_number.trim()) {
        return res.status(400).json({ success: false, message: 'Driving license number is required for driver registration' });
      }
    }

    // Normalize email & identifiers
    const cleanEmail = email.trim().toLowerCase();
    const cleanStudentId = student_id ? student_id.trim() : '';

    // Check existing confirmed user accounts
    const existingUser = db.prepare('SELECT id, email, student_id FROM Users WHERE email = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email account already exists. Please log in.' });
    }

    if (chosenRole === 'passenger' && cleanStudentId) {
      const existingStudent = db.prepare('SELECT id, student_id FROM Users WHERE student_id = ?').get(cleanStudentId);
      if (existingStudent) {
        return res.status(400).json({ success: false, message: 'An account with this student ID already exists' });
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Generate 6-Digit Email Verification Code and Token
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes expiry

    // Cryptographic hash storage for verification code
    const codeSalt = crypto.randomBytes(16).toString('hex');
    const codeHash = crypto.createHash('sha256').update(verificationCode + codeSalt).digest('hex');
    const nowIso = new Date().toISOString();

    // Generate unique driver identifier if registering as a driver without student ID
    const finalStudentId = chosenRole === 'driver' 
      ? (cleanStudentId || ('DRV-' + Math.floor(100000 + Math.random() * 900000))) 
      : cleanStudentId;

    // Check resend cooldown if an active pending registration already exists
    const existingPending = db.prepare('SELECT * FROM PendingRegistrations WHERE email = ?').get(cleanEmail);
    if (existingPending && existingPending.last_sent_at) {
      const elapsedSeconds = (Date.now() - new Date(existingPending.last_sent_at).getTime()) / 1000;
      if (elapsedSeconds < 60) {
        const waitTime = Math.ceil(60 - elapsedSeconds);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime}s before requesting a new verification code.`
        });
      }
    }

    // Clear any previous unverified pending registration for this email or student_id
    if (cleanStudentId && chosenRole === 'passenger') {
      db.prepare('DELETE FROM PendingRegistrations WHERE email = ? OR student_id = ?').run(cleanEmail, cleanStudentId);
    } else {
      db.prepare('DELETE FROM PendingRegistrations WHERE email = ?').run(cleanEmail);
    }

    // Store in PendingRegistrations with hashed code & rate limit counters - User is NOT yet in Users table!
    db.prepare(`
      INSERT INTO PendingRegistrations (
        email, name, student_id, password_hash, phone, role, department, license_number,
        verification_code, verification_token, code_hash, code_salt, failed_attempts, last_sent_at, resend_count, expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1, ?)
    `).run(
      cleanEmail,
      name.trim(),
      finalStudentId,
      passwordHash,
      phone.trim(),
      chosenRole,
      chosenRole === 'passenger' ? (department || null) : null,
      chosenRole === 'driver' ? license_number.trim() : null,
      verificationCode,
      verificationToken,
      codeHash,
      codeSalt,
      nowIso,
      verificationExpires
    );

    // Dispatch verification email to the user's email account
    const emailResult = await emailService.sendVerificationEmail({
      toEmail: cleanEmail,
      name: name.trim(),
      code: verificationCode,
      token: verificationToken,
      frontendUrl: getFrontendUrl(req)
    });

    // Surface email delivery failure to logs and developer
    if (!emailResult.live_sent) {
      console.error(`\n🚨 [EMAIL DISPATCH NOTICE] Live email could not be delivered to ${cleanEmail}`);
      console.error(`   Reason: ${emailResult.reason}`);
      console.error(`   Action: Set SMTP_USER & SMTP_PASS in backend/.env or use the in-app Gmail setup modal.\n`);

      // If credentials were provided in .env but failed (e.g. wrong password), return clear error
      if (process.env.SMTP_USER && process.env.SMTP_USER.trim()) {
        return res.status(502).json({
          success: false,
          message: `Unable to send verification email to ${cleanEmail}. Gmail SMTP error: ${emailResult.reason}`,
          error_code: 'EMAIL_DELIVERY_FAILED',
          reason: emailResult.reason
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: emailResult.live_sent 
        ? 'Verification email dispatched to your Gmail inbox! Enter the 6-digit code to complete account creation.'
        : 'Verification code dispatched to your email account! Enter the 6-digit code to complete account creation.',
      requires_email_verification: true,
      pending_email: cleanEmail,
      live_sent: emailResult.live_sent,
      smtp_reason: emailResult.reason
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration: ' + error.message });
  }
};

exports.verifyEmail = (req, res) => {
  try {
    const { email, code, token } = req.body;

    if (!email && !token) {
      return res.status(400).json({ success: false, message: 'Email account and verification code are required' });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanCode = code ? String(code).trim() : '';

    // 1. Check PendingRegistrations first (users who signed up but haven't verified yet)
    let pending = null;
    if (cleanEmail) {
      pending = db.prepare('SELECT * FROM PendingRegistrations WHERE email = ?').get(cleanEmail);
    } else if (token) {
      pending = db.prepare('SELECT * FROM PendingRegistrations WHERE verification_token = ?').get(token.trim());
    }

    if (pending) {
      // 1. Check max failed attempts (brute force protection)
      const MAX_ATTEMPTS = 5;
      if (pending.failed_attempts >= MAX_ATTEMPTS) {
        db.prepare('DELETE FROM PendingRegistrations WHERE id = ?').run(pending.id);
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. This code has been invalidated for security. Please sign up again.'
        });
      }

      // 2. Check expiration
      if (pending.expires_at && new Date() > new Date(pending.expires_at)) {
        return res.status(400).json({ success: false, message: 'Verification code has expired. Please click Resend Code to receive a new one.' });
      }

      // 3. Constant-time code verification against cryptographic hash
      let isCodeValid = false;
      if (cleanCode && pending.code_hash && pending.code_salt) {
        const computed = crypto.createHash('sha256').update(cleanCode + pending.code_salt).digest('hex');
        try {
          isCodeValid = crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(pending.code_hash, 'hex'));
        } catch (e) {
          isCodeValid = false;
        }
      } else if (cleanCode && pending.verification_code) {
        isCodeValid = (cleanCode === pending.verification_code);
      }

      const isTokenValid = token && pending.verification_token && pending.verification_token === token.trim();

      if (!isCodeValid && !isTokenValid) {
        // Increment failed attempts
        db.prepare('UPDATE PendingRegistrations SET failed_attempts = failed_attempts + 1 WHERE id = ?').run(pending.id);
        const remainingAttempts = MAX_ATTEMPTS - (pending.failed_attempts + 1);
        return res.status(400).json({ 
          success: false, 
          message: `Invalid 6-digit verification code. ${remainingAttempts} attempt(s) remaining.` 
        });
      }

      // NOW CREATE THE OFFICIAL ACCOUNT IN Users TABLE!
      const isVerifiedDriver = pending.role === 'driver' ? 0 : 1;
      const insertStmt = db.prepare(`
        INSERT INTO Users (
          student_id, name, email, password_hash, phone, role, department, 
          is_verified, email_verified, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
      `);

      const result = insertStmt.run(
        pending.student_id,
        pending.name,
        pending.email,
        pending.password_hash,
        pending.phone,
        pending.role,
        pending.department,
        isVerifiedDriver
      );
      const newUserId = Number(result.lastInsertRowid);

      // If driver, create driver verification entry
      if (pending.role === 'driver' && pending.license_number) {
        db.prepare(`
          INSERT INTO DriverVerifications (user_id, license_number, status, admin_notes)
          VALUES (?, ?, 'pending', 'Submitted during registration')
        `).run(newUserId, pending.license_number);
      }

      // Remove from PendingRegistrations
      db.prepare('DELETE FROM PendingRegistrations WHERE id = ?').run(pending.id);

      // Notification
      createNotification(
        newUserId,
        'Account Activated',
        `Welcome ${pending.name}! Your email account has been verified and your account is now fully active.`,
        'system'
      );

      const user = db.prepare(`
        SELECT id, student_id, name, email, phone, role, department, avatar_url, bio, emergency_contact_name, emergency_contact_phone, is_verified, email_verified, status, created_at
        FROM Users WHERE id = ?
      `).get(newUserId);

      let vehicle = null;
      let verification = null;
      if (user.role === 'driver') {
        vehicle = db.prepare('SELECT * FROM Vehicles WHERE user_id = ? AND is_active = 1 LIMIT 1').get(user.id) || null;
        verification = db.prepare('SELECT * FROM DriverVerifications WHERE user_id = ?').get(user.id) || null;
      }

      const authToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, email_verified: 1 },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Email account verified! Your account has been officially created.',
        token: authToken,
        user: {
          ...user,
          vehicle,
          verification
        }
      });
    }

    // 2. Check existing Users table (for legacy or seeded accounts)
    let user;
    if (cleanEmail) {
      user = db.prepare('SELECT * FROM Users WHERE email = ?').get(cleanEmail);
    } else if (token) {
      user = db.prepare('SELECT * FROM Users WHERE verification_token = ?').get(token.trim());
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: `No registration found for ${cleanEmail || 'this account'}. Please create your account on the Register page first.` 
      });
    }

    if (user.email_verified === 1) {
      const refreshedToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, email_verified: 1 },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      const { password_hash, verification_code, verification_token, ...safeUser } = user;
      return res.json({
        success: true,
        message: 'Your email account is already verified! Please log in.',
        already_verified: true,
        token: refreshedToken,
        user: safeUser
      });
    }

    // Check code or token match
    const isCodeValid = cleanCode && user.verification_code && user.verification_code === cleanCode;
    const isTokenValid = token && user.verification_token && user.verification_token === token.trim();

    if (!isCodeValid && !isTokenValid) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit verification code. Please check your email account.' });
    }

    // Mark user verified
    db.prepare(`
      UPDATE Users 
      SET email_verified = 1, verification_code = NULL, verification_token = NULL, verification_expires = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).run(user.id);

    const updatedUser = db.prepare(`
      SELECT id, student_id, name, email, phone, role, department, avatar_url, bio, emergency_contact_name, emergency_contact_phone, is_verified, email_verified, status, created_at
      FROM Users WHERE id = ?
    `).get(user.id);

    const refreshedToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, email_verified: 1 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Email account verified successfully!',
      token: refreshedToken,
      user: updatedUser
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify email' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    let targetEmail = email;

    if (!targetEmail && req.user) {
      targetEmail = req.user.email;
    }

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Email account is required to resend verification' });
    }

    const cleanEmail = targetEmail.trim().toLowerCase();

    // 1. Check PendingRegistrations
    const pending = db.prepare('SELECT * FROM PendingRegistrations WHERE email = ?').get(cleanEmail);
    if (pending) {
      // Enforce 60-second cooldown
      if (pending.last_sent_at) {
        const elapsedSec = (Date.now() - new Date(pending.last_sent_at).getTime()) / 1000;
        if (elapsedSec < 60) {
          const waitSec = Math.ceil(60 - elapsedSec);
          return res.status(429).json({
            success: false,
            message: `Please wait ${waitSec}s before requesting a new code.`
          });
        }
      }

      const newCode = crypto.randomInt(100000, 1000000).toString();
      const newToken = crypto.randomBytes(24).toString('hex');
      const newExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const newSalt = crypto.randomBytes(16).toString('hex');
      const newHash = crypto.createHash('sha256').update(newCode + newSalt).digest('hex');
      const nowIso = new Date().toISOString();

      db.prepare(`
        UPDATE PendingRegistrations 
        SET verification_code = ?, verification_token = ?, code_hash = ?, code_salt = ?, failed_attempts = 0, last_sent_at = ?, resend_count = resend_count + 1, expires_at = ?
        WHERE id = ?
      `).run(newCode, newToken, newHash, newSalt, nowIso, newExpires, pending.id);

      const emailResult = await emailService.sendVerificationEmail({
        toEmail: cleanEmail,
        name: pending.name,
        code: newCode,
        token: newToken,
        frontendUrl: getFrontendUrl(req)
      });

      if (!emailResult.live_sent && process.env.SMTP_USER && process.env.SMTP_USER.trim()) {
        return res.status(502).json({
          success: false,
          message: `Unable to resend verification email to ${cleanEmail}. Gmail SMTP error: ${emailResult.reason}`,
          error_code: 'EMAIL_DELIVERY_FAILED',
          reason: emailResult.reason
        });
      }

      return res.json({
        success: true,
        message: emailResult.live_sent 
          ? `A fresh 6-digit code has been sent directly to your Gmail inbox!`
          : `A fresh 6-digit code has been dispatched to ${cleanEmail}.`,
        live_sent: emailResult.live_sent
      });
    }

    // 2. Check Users table
    const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registration found for this email account. Please sign up first.' });
    }

    if (user.email_verified === 1) {
      return res.json({ success: true, message: 'Email account is already verified' });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newToken = crypto.randomBytes(24).toString('hex');
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE Users 
      SET verification_code = ?, verification_token = ?, verification_expires = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newCode, newToken, newExpires, user.id);

    const emailResult = await emailService.sendVerificationEmail({
      toEmail: cleanEmail,
      name: user.name,
      code: newCode,
      token: newToken,
      frontendUrl: getFrontendUrl(req)
    });

    return res.json({
      success: true,
      message: emailResult.live_sent 
        ? `A fresh 6-digit code has been sent directly to your Gmail inbox!`
        : `A fresh 6-digit code has been dispatched to ${cleanEmail}.`,
      live_sent: emailResult.live_sent
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend verification email' });
  }
};

exports.getSimulatedInbox = (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email parameter required' });
    }

    const emails = emailService.getInboxForEmail(email);
    return res.json({
      success: true,
      email,
      count: emails.length,
      emails
    });
  } catch (error) {
    console.error('Simulated inbox error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve mailbox' });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email account and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(cleanEmail);

    if (!user) {
      // Check if registration is still pending email verification
      const pending = db.prepare('SELECT * FROM PendingRegistrations WHERE email = ?').get(cleanEmail);
      if (pending) {
        return res.status(403).json({ 
          success: false, 
          is_pending_verification: true, 
          message: 'Your account has not been activated yet. Please verify your email account with the 6-digit code to complete registration.',
          email: cleanEmail
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid email account or password' });
    }

    // Verify password
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email account or password' });
    }

    // Enforce email verification - user CANNOT log in if not verified!
    if (user.email_verified !== 1) {
      return res.status(403).json({
        success: false,
        requires_email_verification: true,
        message: 'Your email account has not been verified yet. Please enter your verification code to access your account.',
        email: user.email
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: `Your account has been ${user.status}. Please contact an administrator.` });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, email_verified: user.email_verified },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Fetch vehicle if driver
    let vehicle = null;
    let verification = null;
    if (user.role === 'driver') {
      vehicle = db.prepare('SELECT * FROM Vehicles WHERE user_id = ? AND is_active = 1 LIMIT 1').get(user.id) || null;
      verification = db.prepare('SELECT * FROM DriverVerifications WHERE user_id = ?').get(user.id) || null;
    }

    const { password_hash, verification_code, verification_token, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        ...safeUser,
        vehicle,
        verification
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.getMe = (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, student_id, name, email, phone, role, department, avatar_url, bio, emergency_contact_name, emergency_contact_phone, is_verified, email_verified, status, created_at
      FROM Users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let vehicle = null;
    let verification = null;
    if (user.role === 'driver' || user.role === 'admin') {
      vehicle = db.prepare('SELECT * FROM Vehicles WHERE user_id = ? AND is_active = 1 LIMIT 1').get(user.id) || null;
      verification = db.prepare('SELECT * FROM DriverVerifications WHERE user_id = ?').get(user.id) || null;
    }

    return res.json({
      success: true,
      user: {
        ...user,
        vehicle,
        verification
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
};

exports.updateProfile = (req, res) => {
  try {
    const { name, phone, bio, department, emergency_contact_name, emergency_contact_phone, avatar_url } = req.body;

    const existingUser = db.prepare('SELECT * FROM Users WHERE id = ?').get(req.user.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updatedAvatar = avatar_url !== undefined ? avatar_url : existingUser.avatar_url;

    const stmt = db.prepare(`
      UPDATE Users 
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          bio = COALESCE(?, bio),
          department = COALESCE(?, department),
          emergency_contact_name = COALESCE(?, emergency_contact_name),
          emergency_contact_phone = COALESCE(?, emergency_contact_phone),
          avatar_url = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      name || null, 
      phone || null, 
      bio || null, 
      department || null, 
      emergency_contact_name || null, 
      emergency_contact_phone || null, 
      updatedAvatar, 
      req.user.id
    );

    const updatedUser = db.prepare(`
      SELECT id, student_id, name, email, phone, role, department, avatar_url, bio, emergency_contact_name, emergency_contact_phone, is_verified, email_verified, status, created_at
      FROM Users WHERE id = ?
    `).get(req.user.id);

    let vehicle = null;
    let verification = null;
    if (updatedUser.role === 'driver' || updatedUser.role === 'admin') {
      vehicle = db.prepare('SELECT * FROM Vehicles WHERE user_id = ? AND is_active = 1 LIMIT 1').get(req.user.id) || null;
      verification = db.prepare('SELECT * FROM DriverVerifications WHERE user_id = ?').get(req.user.id) || null;
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        vehicle,
        verification
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

exports.changePassword = (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    if (confirm_password && new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    const user = db.prepare('SELECT password_hash FROM Users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(new_password, salt);

    db.prepare("UPDATE Users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, req.user.id);

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

exports.getSmtpStatus = (req, res) => {
  try {
    const configured = smtpClient.isConfigured();
    const rawUser = process.env.SMTP_USER || '';
    const maskedUser = rawUser ? rawUser.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '***' + c) : '';
    return res.json({
      success: true,
      configured,
      user: maskedUser
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.configureSmtp = async (req, res) => {
  try {
    const { user, pass, test_email } = req.body;
    if (!user || !pass) {
      return res.status(400).json({ success: false, message: 'Gmail address and 16-character App Password are required' });
    }

    const cleanUser = user.trim();
    const cleanPass = pass.trim().replace(/\s+/g, '');

    // Set credentials in process.env
    process.env.SMTP_USER = cleanUser;
    process.env.SMTP_PASS = cleanPass;

    const targetTestEmail = (test_email && test_email.trim()) || cleanUser;

    // Send test email
    const testResult = await smtpClient.sendMail({
      to: targetTestEmail,
      subject: 'Carpool System verification email (Gmail Connected!)',
      html: `
        <div style="background:#edf5ee; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
          <div style="max-width:440px; margin:0 auto; background:#ffffff; border-radius:28px; padding:36px 32px; border:1px solid #e1ece2; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
            <h2 style="color:#1b4332; margin-top:0; font-size:24px;">Gmail Connected Successfully! 🎉</h2>
            <p style="color:#2d3748; font-size:15px; line-height:1.6;">
              Your Student Carpool platform is now connected to live Gmail SMTP. All future verification codes will be delivered directly to registered inboxes.
            </p>
            <div style="font-size:36px; font-weight:800; letter-spacing:8px; color:#1b4332; margin:24px 0;">
              8 8 9 9 1 1
            </div>
            <p style="color:#94a3b8; font-size:12px; margin-bottom:0;">
              Sent via authenticated Gmail SMTP from ${cleanUser}.
            </p>
          </div>
        </div>
      `
    });

    if (!testResult.sent) {
      return res.status(400).json({
        success: false,
        message: 'Google rejected the connection: ' + (testResult.reason || 'Check your Gmail address and 16-character App Password')
      });
    }

    // Persist to backend/.env file
    try {
      const envPath = path.resolve(__dirname, '..', '..', '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('SMTP_USER=')) {
          envContent = envContent.replace(/^SMTP_USER=.*$/m, `SMTP_USER=${cleanUser}`);
        } else {
          envContent += `\nSMTP_USER=${cleanUser}`;
        }
        if (envContent.includes('SMTP_PASS=')) {
          envContent = envContent.replace(/^SMTP_PASS=.*$/m, `SMTP_PASS=${cleanPass}`);
        } else {
          envContent += `\nSMTP_PASS=${cleanPass}`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (fsErr) {
      console.warn('Could not update .env file on disk:', fsErr.message);
    }

    return res.json({
      success: true,
      message: `Gmail connected successfully! A test verification email was sent to ${targetTestEmail}.`,
      delivered_to: targetTestEmail
    });
  } catch (error) {
    console.error('Configure SMTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to configure SMTP: ' + error.message });
  }
};
