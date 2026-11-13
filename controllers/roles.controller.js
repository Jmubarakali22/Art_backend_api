const { query } = require('../config/db');

// Standard available system pages
const AVAILABLE_PAGES = [
  { key: 'dashboard', name: 'Dashboard', description: 'Overview statistics, metric cards, recent donations' },
  { key: 'donations', name: 'Donations & Receipts', description: 'Donation tracking, receipt voucher printing & WhatsApp dispatch' },
  { key: 'causes', name: 'Causes & Programs', description: 'Charity causes, goal amounts, and relief projects' },
  { key: 'gallery', name: 'Photo Gallery', description: 'Relief event photos, activities, and community outreach images' },
  { key: 'volunteers', name: 'Volunteers', description: 'Volunteer registrations, applications, and status' },
  { key: 'inquiries', name: 'Contact Inquiries', description: 'Public inquiries, feedback, and support tickets' },
  { key: 'settings', name: 'Trust Settings', description: 'Charity identity, UPI ID, contact details, auto-logout' },
  { key: 'admins', name: 'Admin Accounts', description: 'Manage staff admin accounts, passwords, and user records' },
  { key: 'roles', name: 'Roles & Access Control', description: 'Configure roles and assign user page access permissions' }
];

/**
 * Get all roles with admin counts and available pages definition
 */
exports.getAllRoles = async (req, res) => {
  try {
    let roles = await query('SELECT * FROM roles ORDER BY is_system DESC, id ASC');

    if (!Array.isArray(roles) || roles.length === 0) {
      // Seed default system roles if table is empty
      const defaultRoles = [
        { name: 'Super Admin', description: 'Full unconstrained administrative access across all modules and accounts', permissions: ['*'], is_system: 1 },
        { name: 'Managing Trustee', description: 'Full management access to operations, finances, causes, and public media', permissions: ['dashboard', 'donations', 'causes', 'gallery', 'volunteers', 'inquiries', 'settings'], is_system: 0 },
        { name: 'Finance / Accountant', description: 'Access to financial donation records, receipt vouchers, and revenue stats', permissions: ['dashboard', 'donations'], is_system: 0 },
        { name: 'Welfare Coordinator', description: 'Management of charity causes, ration kits, relief programs, and inquiries', permissions: ['dashboard', 'causes', 'volunteers', 'inquiries'], is_system: 0 },
        { name: 'Media & Communications', description: 'Responsible for public photo gallery, relief events, and inquiry responses', permissions: ['gallery', 'inquiries'], is_system: 0 }
      ];
      for (const d of defaultRoles) {
        try {
          await query(
            'INSERT IGNORE INTO roles (name, description, permissions, is_system) VALUES (?, ?, ?, ?)',
            [d.name, d.description, JSON.stringify(d.permissions), d.is_system]
          );
        } catch (e) {}
      }
      roles = await query('SELECT * FROM roles ORDER BY is_system DESC, id ASC');
    }

    const adminCounts = await query('SELECT role, COUNT(*) as count FROM admins GROUP BY role');

    const countMap = {};
    if (Array.isArray(adminCounts)) {
      for (const c of adminCounts) {
        if (c && c.role) {
          countMap[c.role] = c.count || 0;
        }
      }
    }

    const formatted = (Array.isArray(roles) ? roles : []).map(r => {
      let perms = [];
      try {
        perms = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || []);
      } catch (e) {
        perms = [];
      }
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: Array.isArray(perms) ? perms : [],
        is_system: !!r.is_system,
        user_count: countMap[r.name] || countMap[(r.name || '').toLowerCase().replace(/\s+/g, '')] || 0,
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    });

    res.json({
      success: true,
      roles: formatted,
      available_pages: AVAILABLE_PAGES
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new custom role
 */
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required.' });
    }

    const existing = await query('SELECT id FROM roles WHERE LOWER(name) = LOWER(?)', [name.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A role with this name already exists.' });
    }

    const permsArray = Array.isArray(permissions) ? permissions : [];
    const result = await query(
      'INSERT INTO roles (name, description, permissions, is_system) VALUES (?, ?, ?, 0)',
      [name.trim(), description || '', JSON.stringify(permsArray)]
    );

    res.status(201).json({
      success: true,
      message: 'Role created successfully.',
      role: {
        id: result.insertId,
        name: name.trim(),
        description: description || '',
        permissions: permsArray,
        is_system: false,
        user_count: 0
      }
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update an existing role
 */
exports.updateRole = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, permissions } = req.body;

    const existing = await query('SELECT * FROM roles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    const role = existing[0];
    const newName = role.is_system ? role.name : (name && name.trim() ? name.trim() : role.name);
    const permsArray = Array.isArray(permissions) ? permissions : (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : []);

    await query(
      'UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?',
      [newName, description !== undefined ? description : role.description, JSON.stringify(permsArray), id]
    );

    res.json({
      success: true,
      message: 'Role updated successfully.',
      role: {
        id,
        name: newName,
        description: description !== undefined ? description : role.description,
        permissions: permsArray,
        is_system: !!role.is_system
      }
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a custom role
 */
exports.deleteRole = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await query('SELECT * FROM roles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    const role = existing[0];
    if (role.is_system) {
      return res.status(400).json({ success: false, message: 'System standard roles cannot be deleted.' });
    }

    // Check if any admin currently uses this role name
    const activeAdmins = await query('SELECT id, name FROM admins WHERE role = ? OR role = ?', [role.name, role.name.toLowerCase()]);
    if (activeAdmins.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role "${role.name}" because it is currently assigned to ${activeAdmins.length} user(s). Please reassign them first.`
      });
    }

    await query('DELETE FROM roles WHERE id = ?', [id]);
    res.json({ success: true, message: `Role "${role.name}" deleted successfully.` });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all users with their current roles and permissions
 */
exports.getUsers = async (req, res) => {
  try {
    const admins = await query('SELECT id, username, email, name, role, permissions, avatar, created_at FROM admins ORDER BY id ASC');
    const roles = await query('SELECT * FROM roles');

    // Build role permissions lookup map
    const rolePermsMap = {};
    for (const r of roles) {
      let p = [];
      try {
        p = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || []);
      } catch (e) {
        p = [];
      }
      rolePermsMap[r.name] = p;
      rolePermsMap[r.name.toLowerCase()] = p;
      rolePermsMap[r.name.toLowerCase().replace(/\s+/g, '')] = p;
    }

    const formatted = admins.map(a => {
      let userCustomPerms = null;
      if (a.permissions) {
        try {
          userCustomPerms = typeof a.permissions === 'string' ? JSON.parse(a.permissions) : a.permissions;
        } catch (e) {
          userCustomPerms = null;
        }
      }

      // If user is superadmin, they get all permissions
      const isSuper = (a.role === 'superadmin' || a.role === 'Super Admin');
      const effectivePerms = isSuper ? ['*'] : (userCustomPerms || rolePermsMap[a.role] || ['dashboard']);

      return {
        id: a.id,
        name: a.name,
        username: a.username,
        email: a.email,
        role: a.role,
        avatar: a.avatar,
        custom_permissions: userCustomPerms,
        effective_permissions: effectivePerms,
        is_superadmin: isSuper,
        created_at: a.created_at
      };
    });

    res.json({
      success: true,
      users: formatted,
      available_pages: AVAILABLE_PAGES
    });
  } catch (error) {
    console.error('Error fetching users for roles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Assign role and/or custom page permissions to a user
 */
exports.assignUserAccess = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role, permissions } = req.body;

    const existing = await query('SELECT * FROM admins WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found.' });
    }

    const admin = existing[0];

    // Prevent removing superadmin status from own account
    if (admin.id === req.user.id && admin.role === 'superadmin' && role && role !== 'superadmin' && role !== 'Super Admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot revoke your own Super Admin access.'
      });
    }

    const targetRole = role !== undefined ? role : admin.role;
    const permsVal = permissions !== undefined
      ? (permissions === null ? null : JSON.stringify(Array.isArray(permissions) ? permissions : []))
      : admin.permissions;

    await query('UPDATE admins SET role = ?, permissions = ? WHERE id = ?', [targetRole, permsVal, userId]);

    // Log the assignment
    try {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, req.user.name, 'ROLE_ASSIGN', `Assigned role "${targetRole}" to ${admin.name} (${admin.email})`, req.ip || '127.0.0.1']
      );
    } catch (e) {}

    res.json({
      success: true,
      message: `Access permissions for ${admin.name} updated successfully.`,
      user: {
        id: userId,
        role: targetRole,
        permissions: permissions
      }
    });
  } catch (error) {
    console.error('Error assigning user access:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
