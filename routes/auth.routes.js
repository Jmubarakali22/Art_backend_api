const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.post('/login', authController.login);

// Protected (Any authenticated admin)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), authController.updateProfile);

// Protected (Superadmin only)
router.get('/all', authMiddleware, requireRole('superadmin'), authController.getAllAdmins);
router.post('/create', authMiddleware, requireRole('superadmin'), authController.createAdmin);
router.delete('/:id', authMiddleware, requireRole('superadmin'), authController.deleteAdmin);

module.exports = router;
