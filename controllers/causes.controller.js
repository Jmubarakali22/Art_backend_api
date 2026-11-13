const { query } = require('../config/db');
const { uploadToImageKit, deleteFromImageKit } = require('../config/imagekit');
const fs = require('fs');

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
      whereClauses.push('(title LIKE ? OR category LIKE ? OR description LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM causes ${whereSql} ORDER BY featured DESC, id DESC`;
    const causes = await query(sql, params);

    res.json({ success: true, data: causes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const causes = await query('SELECT * FROM causes WHERE id = ?', [id]);
    if (causes.length === 0) {
      return res.status(404).json({ success: false, message: 'Cause not found' });
    }
    res.json({ success: true, data: causes[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, category, description, target_amount, raised_amount, image_url, status = 'active', featured = 0 } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ success: false, message: 'Title, category, and description are required.' });
    }

    let img = image_url || 'https://ik.imagekit.io/baaidzoik/assets/causes/Monthly%20ration%20kit01.jpg';
    if (req.file) {
      const targetFolder = req.body.folder || '/assets/causes';
      const ikResult = await uploadToImageKit(req.file, { folder: targetFolder });
      img = ikResult.url;
      try {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.warn('Could not remove temp uploaded file:', err.message);
      }
    }

    const sql = `
      INSERT INTO causes (title, category, description, target_amount, raised_amount, image_url, status, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      title,
      category,
      description,
      parseFloat(target_amount || 0),
      parseFloat(raised_amount || 0),
      img,
      status,
      (featured === true || featured === '1' || featured === 1) ? 1 : 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Cause created successfully',
      id: result.insertId,
      image_url: img
    });
  } catch (error) {
    console.error('Error creating cause:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, category, description, target_amount, raised_amount, image_url, status, featured } = req.body;

    const existing = await query('SELECT * FROM causes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cause not found' });
    }

    const oldImageUrl = existing[0].image_url;
    let img = oldImageUrl;
    let imageChanged = false;

    if (req.file) {
      const targetFolder = req.body.folder || '/assets/causes';
      const ikResult = await uploadToImageKit(req.file, { folder: targetFolder });
      img = ikResult.url;
      imageChanged = true;
      try {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.warn('Could not remove temp uploaded file:', err.message);
      }
    } else if (image_url !== undefined && image_url !== oldImageUrl) {
      img = image_url;
      imageChanged = true;
    }

    const sql = `
      UPDATE causes 
      SET title = ?, category = ?, description = ?, target_amount = ?, 
          raised_amount = ?, image_url = ?, status = ?, featured = ?
      WHERE id = ?
    `;

    await query(sql, [
      title || existing[0].title,
      category || existing[0].category,
      description || existing[0].description,
      target_amount !== undefined ? parseFloat(target_amount || 0) : existing[0].target_amount,
      raised_amount !== undefined ? parseFloat(raised_amount || 0) : existing[0].raised_amount,
      img,
      status || existing[0].status,
      featured !== undefined ? ((featured === true || featured === '1' || featured === 1) ? 1 : 0) : existing[0].featured,
      id
    ]);

    // If image was replaced or deleted, remove the old image from ImageKit
    if (imageChanged && oldImageUrl && oldImageUrl !== img) {
      const shared = await query('SELECT COUNT(*) as count FROM causes WHERE image_url = ?', [oldImageUrl]);
      if (shared[0].count === 0) {
        try {
          await deleteFromImageKit(oldImageUrl);
        } catch (ikErr) {
          console.warn('[Causes Warning] Could not delete old image from ImageKit:', ikErr.message);
        }
      }
    }

    res.json({ success: true, message: 'Cause updated successfully', image_url: img });
  } catch (error) {
    console.error('Error updating cause:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await query('SELECT image_url FROM causes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Cause not found' });
    }

    const imageUrl = existing[0].image_url;

    // Delete record from causes table
    await query('DELETE FROM causes WHERE id = ?', [id]);

    // Check if the image on ImageKit is used by any other causes; if not, delete from ImageKit
    if (imageUrl) {
      const shared = await query('SELECT COUNT(*) as count FROM causes WHERE image_url = ?', [imageUrl]);
      if (shared[0].count === 0) {
        try {
          await deleteFromImageKit(imageUrl);
        } catch (ikErr) {
          console.warn('[Causes Warning] Could not delete image from ImageKit:', ikErr.message);
        }
      } else {
        console.log(`[Causes] Image ${imageUrl} is shared by ${shared[0].count} other cause(s); preserving on ImageKit.`);
      }
    }

    res.json({ success: true, message: 'Cause and associated ImageKit photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting cause:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
