const { query } = require('../config/db');
const { uploadToImageKit, deleteFromImageKit } = require('../config/imagekit');

/**
 * Resolves the destination folder in ImageKit based on category.
 * Rules:
 * - Food Distribution(Ration Kits) -> /assets/gallery-full/ration-kit-food-dist
 * - Education & Skill (Tailoring Classes) -> /assets/gallery-full/tailoring-class
 * - Healthcare (Free Medicine & Medical Camps) -> /assets/gallery-full/medical-help
 * - Any other / new category -> /assets/gallery-full/<sanitized-category-slug>
 */
function resolveGalleryFolder(category, requestedFolder) {
  if (requestedFolder && typeof requestedFolder === 'string') {
    const rf = requestedFolder.trim();
    if (rf && rf.toLowerCase() !== '/assets/gallery-full/test' && rf.toLowerCase() !== '/assets/gallery-full/test/') {
      return rf.startsWith('/') ? rf : `/${rf}`;
    }
  }

  const catLower = (category || '').toLowerCase().trim();
  if (catLower.includes('food') || catLower.includes('ration')) {
    return '/assets/gallery-full/ration-kit-food-dist';
  }
  if (catLower.includes('tailor') || catLower.includes('skill') || catLower.includes('education')) {
    return '/assets/gallery-full/tailoring-class';
  }
  if (catLower.includes('health') || catLower.includes('medic') || catLower.includes('camp')) {
    return '/assets/gallery-full/medical-help';
  }

  const slug = catLower
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';

  return `/assets/gallery-full/${slug}`;
}

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
      const targetFolder = resolveGalleryFolder(category, req.body.folder);
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
      const targetFolder = resolveGalleryFolder(category, req.body.folder);
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
    const existing = await query('SELECT image_url FROM gallery WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    const imageUrl = existing[0].image_url;

    await query('DELETE FROM gallery WHERE id = ?', [id]);

    if (imageUrl) {
      const shared = await query('SELECT COUNT(*) as count FROM gallery WHERE image_url = ?', [imageUrl]);
      if (shared[0].count === 0) {
        try {
          await deleteFromImageKit(imageUrl);
        } catch (ikErr) {
          console.warn('[Gallery Warning] Could not delete image from ImageKit:', ikErr.message);
        }
      }
    }

    res.json({ success: true, message: 'Gallery item and photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
