const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.post('/vehicle', authenticateToken, userController.saveVehicle);
router.post('/verification', authenticateToken, userController.requestVerification);
router.post('/reviews', authenticateToken, userController.addReview);
router.get('/profile/:id', userController.getUserProfile);

module.exports = router;

