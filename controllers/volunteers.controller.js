const { query } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { status, search } = req.query;
    let whereClauses = [];
    let params = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    if (search) {
      whereClauses.push('(name LIKE ? OR phone LIKE ? OR email LIKE ? OR occupation LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM volunteers ${whereSql} ORDER BY id DESC`;
    const volunteers = await query(sql, params);

    res.json({ success: true, data: volunteers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, email, address, occupation, availability, notes, status = 'pending' } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    const sql = `
      INSERT INTO volunteers (name, phone, email, address, occupation, availability, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      name,
      phone,
      email || null,
      address || null,
      occupation || null,
      availability || 'Weekends',
      notes || null,
      status
    ]);

    res.status(201).json({
      success: true,
      message: 'Volunteer application submitted successfully',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, notes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    let sql = 'UPDATE volunteers SET status = ?';
    let params = [status];
    if (notes !== undefined) {
      sql += ', notes = ?';
      params.push(notes);
    }
    sql += ' WHERE id = ?';
    params.push(id);

    await query(sql, params);
    res.json({ success: true, message: `Volunteer status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM volunteers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Volunteer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
