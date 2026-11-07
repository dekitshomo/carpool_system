const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticateToken } = require('../middleware/auth');

// Public or optionally authenticated search for available trips
router.get('/', tripController.getAvailableTrips);

// Authenticated trips routes
router.get('/my-trips', authenticateToken, tripController.getMyTrips);

// Get trip by id (optional token parsing to show user request status)
router.get('/:id', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.split(' ')[1]) {
    authenticateToken(req, res, next);
  } else {
    req.user = null;
    next();
  }
}, tripController.getTripById);

router.post('/', authenticateToken, tripController.createTrip);
router.put('/:id', authenticateToken, tripController.updateTrip);
router.post('/:id/cancel', authenticateToken, tripController.cancelTrip);

module.exports = router;

