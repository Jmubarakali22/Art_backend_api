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
      whereClauses.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM contact_inquiries ${whereSql} ORDER BY id DESC`;
    const inquiries = await query(sql, params);

    res.json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    const sql = `
      INSERT INTO contact_inquiries (name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'unread')
    `;
    const result = await query(sql, [name, email, phone || null, subject || null, message]);

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been sent successfully. Thank you for contacting Ar Rahman Trust.',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, admin_notes } = req.body;

    let sql = 'UPDATE contact_inquiries SET status = ?';
    let params = [status || 'read'];

    if (admin_notes !== undefined) {
      sql += ', admin_notes = ?';
      params.push(admin_notes);
    }
    sql += ' WHERE id = ?';
    params.push(id);

    await query(sql, params);
    res.json({ success: true, message: 'Inquiry status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM contact_inquiries WHERE id = ?', [id]);
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
