const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Public route for public settings (UPI ID, trust info)
router.get('/public', settingsController.getAll);

// Protected routes for Admin panel
router.get('/', authMiddleware, settingsController.getAll);
router.post('/', authMiddleware, requireRole('superadmin', 'admin'), settingsController.update);
router.get('/activity-logs', authMiddleware, requireRole('superadmin'), settingsController.getActivityLogs);

module.exports = router;
