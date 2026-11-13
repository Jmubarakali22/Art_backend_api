const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All role endpoints require authentication
router.use(authMiddleware);

// Get all roles
router.get('/', rolesController.getAllRoles);

// Get all users with their roles & permissions
router.get('/users', rolesController.getUsers);

// Create new role (Super Admin only)
router.post('/', requireRole('superadmin', 'Super Admin'), rolesController.createRole);

// Update role (Super Admin only)
router.put('/:id', requireRole('superadmin', 'Super Admin'), rolesController.updateRole);

// Delete custom role (Super Admin only)
router.delete('/:id', requireRole('superadmin', 'Super Admin'), rolesController.deleteRole);

// Assign role & permissions to a specific user (Super Admin only)
router.put('/assign-user/:id', requireRole('superadmin', 'Super Admin'), rolesController.assignUserAccess);

module.exports = router;
