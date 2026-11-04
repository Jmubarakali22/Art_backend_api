const express = require('express');
const router = express.Router();
const causesController = require('../controllers/causes.controller');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route for frontend website
router.get('/public', causesController.getAll);

// Protected routes for Admin panel
router.get('/', authMiddleware, causesController.getAll);
router.get('/:id', authMiddleware, causesController.getById);
router.post('/', authMiddleware, upload.single('image'), causesController.create);
router.put('/:id', authMiddleware, upload.single('image'), causesController.update);
router.delete('/:id', authMiddleware, causesController.delete);

module.exports = router;
