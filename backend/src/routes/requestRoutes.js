const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', requestController.createRequest);
router.get('/my-requests', requestController.getMyRequests);
router.post('/:id/accept', requestController.acceptRequest);
router.post('/:id/reject', requestController.rejectRequest);
router.post('/:id/cancel', requestController.cancelRequest);

module.exports = router;

