const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery.controller');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route for frontend website
router.get('/public', galleryController.getAll);

// Protected routes for Admin panel
router.get('/', authMiddleware, galleryController.getAll);
router.post('/', authMiddleware, upload.single('image'), galleryController.create);
router.put('/:id', authMiddleware, upload.single('image'), galleryController.update);
router.delete('/:id', authMiddleware, galleryController.delete);

module.exports = router;
