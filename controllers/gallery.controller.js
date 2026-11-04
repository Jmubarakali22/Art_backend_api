const { query } = require('../config/db');
const { uploadToImageKit } = require('../config/imagekit');

exports.getAll = async (req, res) => {
  try {
    const { category, is_visible } = req.query;
    let whereClauses = [];
    let params = [];

    if (category) {
      whereClauses.push('category = ?');
      params.push(category);
    }
    if (is_visible !== undefined && is_visible !== '') {
      whereClauses.push('is_visible = ?');
      params.push(is_visible === 'true' || is_visible === '1' ? 1 : 0);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM gallery ${whereSql} ORDER BY order_num ASC, id DESC`;
    const items = await query(sql, params);

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, caption, category = 'General', image_url, order_num = 0, is_visible = 1 } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    let img = '';
    if (req.file) {
      const targetFolder = req.body.folder || '/assets/gallery-full/test';
      const ikResult = await uploadToImageKit(req.file, { folder: targetFolder });
      img = ikResult.url;
    } else if (image_url) {
      img = image_url;
    } else {
      return res.status(400).json({ success: false, message: 'Please upload an image or provide an image URL.' });
    }

    const isVisibleVal = (is_visible === 'true' || is_visible === true || is_visible === 1 || is_visible === '1') ? 1 : 0;
    const sql = `
      INSERT INTO gallery (title, caption, category, image_url, order_num, is_visible)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      title,
      caption || null,
      category,
      img,
      parseInt(order_num || 0, 10),
      isVisibleVal
    ]);

    res.status(201).json({
      success: true,
      message: 'Photo added to gallery successfully',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, caption, category, image_url, order_num, is_visible } = req.body;

    const existing = await query('SELECT image_url FROM gallery WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    let img = existing[0].image_url;
    if (req.file) {
      const targetFolder = req.body.folder || '/assets/gallery-full/test';
      const ikResult = await uploadToImageKit(req.file, { folder: targetFolder });
      img = ikResult.url;
    } else if (image_url) {
      img = image_url;
    }

    const isVisibleVal = (is_visible === 'true' || is_visible === true || is_visible === 1 || is_visible === '1') ? 1 : 0;
    const sql = `
      UPDATE gallery 
      SET title = ?, caption = ?, category = ?, image_url = ?, order_num = ?, is_visible = ?
      WHERE id = ?
    `;

    await query(sql, [
      title,
      caption || null,
      category,
      img,
      parseInt(order_num || 0, 10),
      isVisibleVal,
      id
    ]);

    res.json({ success: true, message: 'Gallery item updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM gallery WHERE id = ?', [id]);
    res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
