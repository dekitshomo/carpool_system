const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/', authenticateToken, reportController.createReport);
router.get('/', authenticateToken, requireRole('admin'), reportController.getReports);
router.put('/:id', authenticateToken, requireRole('admin'), reportController.updateReport);

module.exports = router;

