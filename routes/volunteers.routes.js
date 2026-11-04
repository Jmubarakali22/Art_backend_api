const express = require('express');
const router = express.Router();
const volunteersController = require('../controllers/volunteers.controller');
const { authMiddleware } = require('../middleware/auth');

// Public route for volunteers to sign up on website
router.post('/public/join', volunteersController.create);

// Protected routes for Admin panel
router.get('/', authMiddleware, volunteersController.getAll);
router.post('/', authMiddleware, volunteersController.create);
router.patch('/:id/status', authMiddleware, volunteersController.updateStatus);
router.delete('/:id', authMiddleware, volunteersController.delete);

module.exports = router;
