const { query } = require('../config/db');

// Helper to calculate age from date of birth (e.g. 16/04/2002 or 2002-04-16)
function calculateAgeFromDob(dobStr) {
  if (!dobStr) return null;
  const s = String(dobStr).trim();
  let birthDate = null;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split('/');
    birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    birthDate = new Date(s);
  }
  if (birthDate && !isNaN(birthDate.getTime())) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 && age < 120 ? age : null;
  }
  return null;
}

// Helper to generate unique student code like STU20260001
async function generateStudentCode() {
  const currentYear = new Date().getFullYear();
  const prefix = `STU${currentYear}`;
  const rows = await query(
    `SELECT student_code FROM tailoring_students WHERE student_code LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSeq = 1;
  if (rows && rows.length > 0 && rows[0].student_code) {
    const lastCode = rows[0].student_code;
    const numPart = parseInt(lastCode.replace(prefix, ''), 10);
    if (!isNaN(numPart)) {
      nextSeq = numPart + 1;
    }
  }
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Public Endpoint: For Google Form Apps Script Webhook or Website Registration Form
 * POST /api/students/public
 */
exports.createPublic = async (req, res) => {
  try {
    const {
      full_name,
      name,
      phone,
      mobile,
      whatsapp_number,
      whatsapp,
      age,
      dob,
      date_of_birth,
      email,
      marital_status,
      father_name,
      mother_name,
      spouse_name,
      father_spouse_occupation,
      occupation,
      aadhar_card_url,
      aadhar_card,
      address,
      village,
      qualification,
      education,
      batch_preference,
      batch,
      has_prior_experience,
      family_income,
      guardian_name,
      notes,
      source = 'google_form'
    } = req.body;

    const studentName = full_name || name;
    const studentPhone = phone || mobile;

    if (!studentName || !studentPhone) {
      return res.status(400).json({
        success: false,
        message: 'Student name and phone number are required.'
      });
    }

    const studentCode = await generateStudentCode();
    const cleanPhone = String(studentPhone).replace(/[^0-9+]/g, '');
    const cleanWa = whatsapp_number || whatsapp ? String(whatsapp_number || whatsapp).replace(/[^0-9+]/g, '') : cleanPhone;
    const finalDob = dob || date_of_birth || null;
    const cleanAge = age ? parseInt(age, 10) : calculateAgeFromDob(finalDob);
    const finalAddress = address || village || null;
    const finalQual = qualification || education || null;
    const finalBatch = batch_preference || batch || 'Morning';
    const finalOcc = father_spouse_occupation || occupation || null;
    const finalAadhar = aadhar_card_url || aadhar_card || null;

    const insertSql = `
      INSERT INTO tailoring_students (
        student_code, full_name, phone, whatsapp_number, email, age, dob,
        marital_status, father_name, mother_name, spouse_name, father_spouse_occupation, aadhar_card_url,
        address, qualification, batch_preference, has_prior_experience,
        family_income, guardian_name, notes, source, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'applied')
    `;

    const result = await query(insertSql, [
      studentCode,
      studentName.trim(),
      cleanPhone,
      cleanWa,
      email || null,
      cleanAge,
      finalDob,
      marital_status || null,
      father_name || null,
      mother_name || null,
      spouse_name || null,
      finalOcc,
      finalAadhar,
      finalAddress,
      finalQual,
      finalBatch,
      has_prior_experience || 'No',
      family_income || null,
      guardian_name || null,
      notes || null,
      source
    ]);

    res.status(201).json({
      success: true,
      message: 'Tailoring student application submitted successfully.',
      data: {
        id: result.insertId,
        student_code: studentCode,
        full_name: studentName,
        status: 'applied'
      }
    });
  } catch (error) {
    console.error('[StudentsController] createPublic error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Get all students with filters
 * GET /api/students
 */
exports.getAll = async (req, res) => {
  try {
    const { status, batch, search } = req.query;
    let whereClauses = [];
    let params = [];

    if (status && status !== 'all') {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (batch && batch !== 'all') {
      whereClauses.push('batch_preference = ?');
      params.push(batch);
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      whereClauses.push('(student_code LIKE ? OR full_name LIKE ? OR phone LIKE ? OR whatsapp_number LIKE ? OR address LIKE ?)');
      params.push(s, s, s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM tailoring_students ${whereSql} ORDER BY id DESC`;
    const students = await query(sql, params);

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('[StudentsController] getAll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Get single student by ID
 * GET /api/students/:id
 */
exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await query('SELECT * FROM tailoring_students WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Summary statistics
 * GET /api/students/stats
 */
exports.getStats = async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) AS applied,
        SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END) AS selected,
        SUM(CASE WHEN status = 'in_training' THEN 1 ELSE 0 END) AS in_training,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
      FROM tailoring_students
    `);

    const stats = rows[0] || {};
    res.json({
      success: true,
      data: {
        total: Number(stats.total) || 0,
        applied: Number(stats.applied) || 0,
        selected: Number(stats.selected) || 0,
        in_training: Number(stats.in_training) || 0,
        completed: Number(stats.completed) || 0,
        rejected: Number(stats.rejected) || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Create student manually (walk-in)
 * POST /api/students
 */
exports.create = async (req, res) => {
  try {
    const {
      full_name,
      phone,
      whatsapp_number,
      age,
      dob,
      email,
      marital_status,
      father_name,
      mother_name,
      spouse_name,
      father_spouse_occupation,
      aadhar_card_url,
      address,
      qualification,
      batch_preference = 'Morning',
      has_prior_experience = 'No',
      family_income,
      guardian_name,
      status = 'applied',
      notes,
      source = 'admin'
    } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
    }

    const studentCode = await generateStudentCode();
    const cleanPhone = String(phone).replace(/[^0-9+]/g, '');
    const cleanWa = whatsapp_number ? String(whatsapp_number).replace(/[^0-9+]/g, '') : cleanPhone;
    const cleanAge = age ? parseInt(age, 10) : calculateAgeFromDob(dob);
    const selectedDate = status === 'selected' ? new Date() : null;

    const sql = `
      INSERT INTO tailoring_students (
        student_code, full_name, phone, whatsapp_number, email, age, dob,
        marital_status, father_name, mother_name, spouse_name, father_spouse_occupation, aadhar_card_url,
        address, qualification, batch_preference, has_prior_experience,
        family_income, guardian_name, status, selected_date, notes, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      studentCode,
      full_name.trim(),
      cleanPhone,
      cleanWa,
      email || null,
      cleanAge,
      dob || null,
      marital_status || null,
      father_name || null,
      mother_name || null,
      spouse_name || null,
      father_spouse_occupation || null,
      aadhar_card_url || null,
      address || null,
      qualification || null,
      batch_preference,
      has_prior_experience,
      family_income || null,
      guardian_name || null,
      status,
      selectedDate,
      notes || null,
      source
    ]);

    res.status(201).json({
      success: true,
      message: 'Student added successfully.',
      data: { id: result.insertId, student_code: studentCode }
    });
  } catch (error) {
    console.error('[StudentsController] create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Quick status update (e.g. mark as selected)
 * PATCH /api/students/:id/status
 */
exports.updateStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, notes } = req.body;

    const validStatuses = ['applied', 'selected', 'in_training', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    let extraSet = '';
    let params = [status];

    if (status === 'selected') {
      extraSet = ', selected_date = COALESCE(selected_date, NOW())';
    } else if (status === 'completed') {
      extraSet = ', completed_date = COALESCE(completed_date, NOW())';
    }

    if (notes !== undefined) {
      extraSet += ', notes = ?';
      params.push(notes);
    }

    params.push(id);
    const sql = `UPDATE tailoring_students SET status = ? ${extraSet} WHERE id = ?`;
    await query(sql, params);

    res.json({ success: true, message: `Student status updated to "${status}".` });
  } catch (error) {
    console.error('[StudentsController] updateStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Update full student details
 * PUT /api/students/:id
 */
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      full_name,
      phone,
      whatsapp_number,
      age,
      dob,
      email,
      marital_status,
      father_name,
      mother_name,
      spouse_name,
      father_spouse_occupation,
      aadhar_card_url,
      address,
      qualification,
      batch_preference,
      has_prior_experience,
      family_income,
      guardian_name,
      status,
      notes
    } = req.body;

    const cleanAge = age ? parseInt(age, 10) : calculateAgeFromDob(dob);

    const sql = `
      UPDATE tailoring_students SET
        full_name = ?,
        phone = ?,
        whatsapp_number = ?,
        email = ?,
        age = ?,
        dob = ?,
        marital_status = ?,
        father_name = ?,
        mother_name = ?,
        spouse_name = ?,
        father_spouse_occupation = ?,
        aadhar_card_url = ?,
        address = ?,
        qualification = ?,
        batch_preference = ?,
        has_prior_experience = ?,
        family_income = ?,
        guardian_name = ?,
        status = ?,
        notes = ?
      WHERE id = ?
    `;

    await query(sql, [
      full_name ? full_name.trim() : null,
      phone,
      whatsapp_number,
      email || null,
      cleanAge,
      dob || null,
      marital_status || null,
      father_name || null,
      mother_name || null,
      spouse_name || null,
      father_spouse_occupation || null,
      aadhar_card_url || null,
      address,
      qualification,
      batch_preference,
      has_prior_experience,
      family_income,
      guardian_name,
      status,
      notes,
      id
    ]);

    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (error) {
    console.error('[StudentsController] update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete student
 * DELETE /api/students/:id
 */
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM tailoring_students WHERE id = ?', [id]);
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
