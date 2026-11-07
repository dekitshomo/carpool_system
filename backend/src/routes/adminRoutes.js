const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/verifications', adminController.getPendingVerifications);
router.post('/verifications/:id', adminController.handleVerification);
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/trips', adminController.getAllTrips);
router.post('/trips/:id/remove', adminController.removeTrip);

module.exports = router;

