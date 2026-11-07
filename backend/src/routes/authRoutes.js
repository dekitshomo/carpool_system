const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.get('/simulated-inbox/:email', authController.getSimulatedInbox);
router.get('/smtp-status', authController.getSmtpStatus);
router.post('/configure-smtp', authController.configureSmtp);
router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
