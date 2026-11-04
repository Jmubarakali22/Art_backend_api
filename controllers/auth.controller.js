const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required.'
      });
    }

    const admins = await query(
      'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1',
      [username, username]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        name: admin.name
      },
      process.env.JWT_SECRET || 'ar_rahman_trust_jwt_super_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log login activity
    try {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
        [admin.id, admin.name, 'LOGIN', 'Admin logged into portal', req.ip || '127.0.0.1']
      );
    } catch (e) {
      // non-blocking
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while logging in.'
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const admins = await query(
      'SELECT id, username, email, name, role, avatar, created_at FROM admins WHERE id = ?',
      [req.user.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    res.json({ success: true, admin: admins[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    const admins = await query('SELECT * FROM admins WHERE id = ?', [adminId]);
    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    const admin = admins[0];

    // If changing password, verify old password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set new password.' });
      }
      const match = await bcrypt.compare(currentPassword, admin.password);
      if (!match) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await query('UPDATE admins SET password = ? WHERE id = ?', [hashed, adminId]);
    }

    const updatedName = name || admin.name;
    const updatedEmail = email || admin.email;
    const avatar = req.file ? `/uploads/${req.file.filename}` : admin.avatar;

    await query(
      'UPDATE admins SET name = ?, email = ?, avatar = ? WHERE id = ?',
      [updatedName, updatedEmail, avatar, adminId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        id: adminId,
        username: admin.username,
        email: updatedEmail,
        name: updatedName,
        role: admin.role,
        avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await query(
      'SELECT id, username, email, name, role, avatar, created_at FROM admins ORDER BY id ASC'
    );
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existing = await query('SELECT id FROM admins WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role || 'admin';

    const result = await query(
      'INSERT INTO admins (username, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, name, assignedRole]
    );

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      adminId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (targetId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await query('DELETE FROM admins WHERE id = ?', [targetId]);
    res.json({ success: true, message: 'Admin deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
