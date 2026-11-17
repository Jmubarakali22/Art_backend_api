const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students.controller');
const { authMiddleware } = require('../middleware/auth');

// Public route for Google Forms / Website registration form webhook
router.post('/public', studentsController.createPublic);

// Protected routes for Admin panel
router.get('/', authMiddleware, studentsController.getAll);
router.get('/stats', authMiddleware, studentsController.getStats);
router.get('/:id', authMiddleware, studentsController.getById);
router.post('/', authMiddleware, studentsController.create);
router.patch('/:id/status', authMiddleware, studentsController.updateStatus);
router.put('/:id', authMiddleware, studentsController.update);
router.delete('/:id', authMiddleware, studentsController.delete);

module.exports = router;
