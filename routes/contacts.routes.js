const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contacts.controller');
const { authMiddleware } = require('../middleware/auth');

// Public route for website contact form
router.post('/public/send', contactsController.create);

// Protected routes for Admin panel
router.get('/', authMiddleware, contactsController.getAll);
router.patch('/:id/status', authMiddleware, contactsController.updateStatus);
router.delete('/:id', authMiddleware, contactsController.delete);

module.exports = router;
