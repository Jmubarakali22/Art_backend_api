const { query } = require('../config/db');
const { uploadToImageKit } = require('../config/imagekit');
const fs = require('fs');

/**
 * Get all expenses with filtering, pagination, and category summary
 */
exports.getAll = async (req, res) => {
  try {
    const { category, search, from_date, to_date, payment_method, status, page, limit, sort } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let params = [];

    // Category filter
    if (category && category !== 'all' && category !== 'All') {
      const catLower = category.toLowerCase().trim();
      if (catLower === 'tailoring') {
        whereClauses.push('LOWER(category) LIKE ?');
        params.push('%tailor%');
      } else if (catLower === 'monthly ration kit' || catLower === 'monthly_ration_kit') {
        whereClauses.push('(LOWER(category) LIKE ? OR LOWER(category) LIKE ?)');
        params.push('%monthly%ration%', '%monthly%food%');
      } else if (catLower === 'ration kit' || catLower === 'rationkit' || catLower === 'ration_kit') {
        whereClauses.push('(LOWER(category) LIKE ? AND LOWER(category) NOT LIKE ?)');
        params.push('%ration%', '%monthly%');
      } else {
        whereClauses.push('LOWER(category) = LOWER(?)');
        params.push(category);
      }
    }

    // Search query
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      whereClauses.push('(title LIKE ? OR vendor_payee LIKE ? OR voucher_number LIKE ? OR notes LIKE ?)');
      params.push(s, s, s, s);
    }

    // Date range
    if (from_date) {
      whereClauses.push('expense_date >= ?');
      params.push(from_date);
    }
    if (to_date) {
      whereClauses.push('expense_date <= ?');
      params.push(to_date);
    }

    // Payment method
    if (payment_method && payment_method !== 'all') {
      whereClauses.push('LOWER(payment_method) = LOWER(?)');
      params.push(payment_method);
    }

    // Status
    if (status && status !== 'all') {
      whereClauses.push('LOWER(status) = LOWER(?)');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total filtered records
    const countSql = `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM expenses ${whereSql}`;
    const [countResult] = await query(countSql, params);
    const totalRecords = countResult.total || 0;
    const totalFilteredAmount = parseFloat(countResult.total_amount || 0);

    // Sorting
    let orderSql = 'ORDER BY expense_date DESC, id DESC';
    if (sort === 'oldest') orderSql = 'ORDER BY expense_date ASC, id ASC';
    if (sort === 'amount_high') orderSql = 'ORDER BY amount DESC';
    if (sort === 'amount_low') orderSql = 'ORDER BY amount ASC';

    // Fetch records
    const fetchSql = `SELECT * FROM expenses ${whereSql} ${orderSql} LIMIT ? OFFSET ?`;
    const expenses = await query(fetchSql, [...params, limitNum, offset]);

    // KPI & Summary Breakdown across all expenses
    const summaryRows = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as overall_total,
        COALESCE(SUM(CASE WHEN LOWER(category) LIKE '%tailor%' THEN amount ELSE 0 END), 0) as tailoring_total,
        COALESCE(SUM(CASE WHEN LOWER(category) LIKE '%ration%' AND LOWER(category) NOT LIKE '%monthly%' THEN amount ELSE 0 END), 0) as ration_kit_total,
        COALESCE(SUM(CASE WHEN LOWER(category) LIKE '%monthly%ration%' OR LOWER(category) LIKE '%monthly%food%' THEN amount ELSE 0 END), 0) as monthly_ration_kit_total,
        COALESCE(SUM(CASE WHEN MONTH(expense_date) = MONTH(CURRENT_DATE()) AND YEAR(expense_date) = YEAR(CURRENT_DATE()) THEN amount ELSE 0 END), 0) as current_month_total,
        COUNT(*) as total_count
      FROM expenses
    `);

    const summary = summaryRows[0] || {
      overall_total: 0,
      tailoring_total: 0,
      ration_kit_total: 0,
      monthly_ration_kit_total: 0,
      current_month_total: 0,
      total_count: 0
    };

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum) || 1,
        filtered_amount: totalFilteredAmount
      },
      summary: {
        overall_total: parseFloat(summary.overall_total),
        tailoring_total: parseFloat(summary.tailoring_total),
        ration_kit_total: parseFloat(summary.ration_kit_total),
        monthly_ration_kit_total: parseFloat(summary.monthly_ration_kit_total),
        current_month_total: parseFloat(summary.current_month_total),
        total_count: parseInt(summary.total_count, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get expense summary stats
 */
exports.getStats = async (req, res) => {
  try {
    const summaryRows = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as overall_total,
        COALESCE(SUM(CASE WHEN LOWER(category) LIKE '%tailor%' THEN amount ELSE 0 END), 0) as tailoring_total,
        COALESCE(SUM(CASE WHEN LOWER(category) LIKE '%ration%' AND LOWER(category) NOT LIKE '%monthly%' THEN amount ELSE 0 END), 0) as ration_kit_total,
        COALESCE(SUM(CASE WHEN LOWER(category) LIKE '%monthly%ration%' OR LOWER(category) LIKE '%monthly%food%' THEN amount ELSE 0 END), 0) as monthly_ration_kit_total,
        COALESCE(SUM(CASE WHEN MONTH(expense_date) = MONTH(CURRENT_DATE()) AND YEAR(expense_date) = YEAR(CURRENT_DATE()) THEN amount ELSE 0 END), 0) as current_month_total,
        COUNT(*) as total_count
      FROM expenses
    `);

    const byCategory = await query(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      GROUP BY category
      ORDER BY total_amount DESC
    `);

    res.json({
      success: true,
      data: {
        ...summaryRows[0],
        categories: byCategory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single expense by ID
 */
exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const results = await query('SELECT * FROM expenses WHERE id = ?', [id]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }
    res.json({ success: true, data: results[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create new expense
 */
exports.create = async (req, res) => {
  try {
    const { title, category, amount, expense_date, payment_method, vendor_payee, voucher_number, notes, status, receipt_url } = req.body;

    if (!title || !category || !amount || !expense_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, amount, and expense date are required.'
      });
    }

    let finalReceiptUrl = receipt_url || null;

    // Handle receipt file upload if present
    if (req.file) {
      try {
        const ikRes = await uploadToImageKit(
          req.file.path,
          `expense_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          '/assets/expenses'
        );
        finalReceiptUrl = ikRes.url;
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      } catch (uploadErr) {
        console.error('ImageKit expense upload error:', uploadErr);
      }
    }

    // Auto-generate sequential voucher number if not supplied (e.g. EXP-2026-0001)
    let finalVoucher = (voucher_number && voucher_number.trim()) ? voucher_number.trim() : null;
    if (!finalVoucher) {
      const year = new Date(expense_date).getFullYear() || new Date().getFullYear();
      const prefix = `EXP-${year}-`;
      const existingVouchers = await query('SELECT voucher_number FROM expenses WHERE voucher_number LIKE ?', [`${prefix}%`]);
      let maxNum = 0;
      if (Array.isArray(existingVouchers)) {
        for (const row of existingVouchers) {
          if (row.voucher_number && row.voucher_number.startsWith(prefix)) {
            const num = parseInt(row.voucher_number.replace(prefix, ''), 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
      finalVoucher = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
    }

    const recordedBy = req.user?.name || 'Super Admin';
    const finalStatus = (status && status.trim()) ? status.trim() : 'Paid';
    const finalMethod = (payment_method && payment_method.trim()) ? payment_method.trim() : 'Cash';

    const insertResult = await query(
      `INSERT INTO expenses (title, category, amount, expense_date, payment_method, vendor_payee, voucher_number, receipt_url, status, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        category.trim(),
        parseFloat(amount),
        expense_date,
        finalMethod,
        vendor_payee ? vendor_payee.trim() : null,
        finalVoucher,
        finalReceiptUrl,
        finalStatus,
        notes ? notes.trim() : null,
        recordedBy
      ]
    );

    // Activity log
    try {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
        [req.user?.id || 1, recordedBy, 'CREATE_EXPENSE', `Recorded expense "${title}" of ₹${amount} under ${category}`, req.ip || '127.0.0.1']
      );
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully.',
      id: insertResult.insertId,
      voucher_number: finalVoucher
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update existing expense
 */
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await query('SELECT * FROM expenses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }
    const current = existing[0];

    const { title, category, amount, expense_date, payment_method, vendor_payee, voucher_number, notes, status, receipt_url } = req.body;

    let finalReceiptUrl = receipt_url !== undefined ? receipt_url : current.receipt_url;

    if (req.file) {
      try {
        const ikRes = await uploadToImageKit(
          req.file.path,
          `expense_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          '/assets/expenses'
        );
        finalReceiptUrl = ikRes.url;
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      } catch (uploadErr) {
        console.error('ImageKit expense upload error:', uploadErr);
      }
    }

    const updatedTitle = title !== undefined ? title.trim() : current.title;
    const updatedCategory = category !== undefined ? category.trim() : current.category;
    const updatedAmount = amount !== undefined ? parseFloat(amount) : current.amount;
    const updatedDate = expense_date !== undefined ? expense_date : current.expense_date;
    const updatedMethod = payment_method !== undefined ? payment_method.trim() : current.payment_method;
    const updatedVendor = vendor_payee !== undefined ? (vendor_payee ? vendor_payee.trim() : null) : current.vendor_payee;
    const updatedVoucher = voucher_number !== undefined ? (voucher_number ? voucher_number.trim() : null) : current.voucher_number;
    const updatedStatus = status !== undefined ? status.trim() : current.status;
    const updatedNotes = notes !== undefined ? (notes ? notes.trim() : null) : current.notes;

    await query(
      `UPDATE expenses 
       SET title = ?, category = ?, amount = ?, expense_date = ?, payment_method = ?, vendor_payee = ?, voucher_number = ?, receipt_url = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        updatedTitle,
        updatedCategory,
        updatedAmount,
        updatedDate,
        updatedMethod,
        updatedVendor,
        updatedVoucher,
        finalReceiptUrl,
        updatedStatus,
        updatedNotes,
        id
      ]
    );

    // Activity log
    try {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
        [req.user?.id || 1, req.user?.name || 'Admin', 'UPDATE_EXPENSE', `Updated expense "${updatedTitle}" (ID: ${id})`, req.ip || '127.0.0.1']
      );
    } catch (e) {}

    res.json({
      success: true,
      message: 'Expense record updated successfully.'
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete expense
 */
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await query('SELECT * FROM expenses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    await query('DELETE FROM expenses WHERE id = ?', [id]);

    // Activity log
    try {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
        [req.user?.id || 1, req.user?.name || 'Admin', 'DELETE_EXPENSE', `Deleted expense ID ${id} ("${existing[0].title}")`, req.ip || '127.0.0.1']
      );
    } catch (e) {}

    res.json({ success: true, message: 'Expense record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
