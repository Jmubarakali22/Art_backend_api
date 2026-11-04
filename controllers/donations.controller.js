const { query } = require('../config/db');
const emailService = require('../services/email.service');
const PDFDocument = require('pdfkit');

// Cache trust logo buffer for PDF generation
let cachedLogoBuffer = null;
fetch('https://ik.imagekit.io/baaidzoik/assets/header-logo/ar_logo_1.png')
  .then(res => res.arrayBuffer())
  .then(buf => { cachedLogoBuffer = Buffer.from(buf); })
  .catch(err => console.error('Logo cache notice:', err.message));

exports.getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const validSortCols = ['id', 'donor_name', 'amount', 'donation_type', 'created_at', 'status'];
    const col = validSortCols.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('(donor_name LIKE ? OR donor_phone LIKE ? OR donor_email LIKE ? OR transaction_id LIKE ? OR receipt_number LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (type) {
      whereClauses.push('donation_type = ?');
      params.push(type);
    }

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM donations ${whereSql}`;
    const [countResult] = await query(countSql, params);
    const total = countResult ? countResult.total : 0;

    const dataSql = `
      SELECT id, donor_name, donor_email, donor_phone, amount, donation_type, 
             payment_method, transaction_id, status, notes, receipt_number, created_at 
      FROM donations 
      ${whereSql} 
      ORDER BY ${col} ${order} 
      LIMIT ${parseInt(limit, 10)} OFFSET ${offset}
    `;
    const donations = await query(dataSql, params);

    res.json({
      success: true,
      data: donations,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Get all donations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const donations = await query('SELECT * FROM donations WHERE id = ?', [id]);
    if (donations.length === 0) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }
    res.json({ success: true, donation: donations[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      donor_name,
      donor_email,
      donor_phone,
      amount,
      donation_type = 'sadaqah',
      payment_method = 'upi',
      transaction_id,
      status = 'verified',
      notes
    } = req.body;

    if (!donor_name || !donor_phone || !amount) {
      return res.status(400).json({ success: false, message: 'Donor name, phone and amount are required.' });
    }

    // Auto-generate receipt number
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receipt_number = `ART-${year}-${randomSuffix}`;

    const sql = `
      INSERT INTO donations (donor_name, donor_email, donor_phone, amount, donation_type, payment_method, transaction_id, status, notes, receipt_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      donor_name,
      donor_email || null,
      donor_phone,
      parseFloat(amount),
      donation_type,
      payment_method,
      transaction_id || `TXN-${Date.now()}`,
      status,
      notes || null,
      receipt_number
    ]);

    // Log activity
    if (req.user) {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details) VALUES (?, ?, ?, ?)',
        [req.user.id, req.user.name, 'ADD_DONATION', `Added donation of ₹${amount} from ${donor_name}`]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      id: result.insertId,
      receipt_number
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { donor_name, donor_email, donor_phone, amount, donation_type, payment_method, transaction_id, status, notes } = req.body;

    const sql = `
      UPDATE donations 
      SET donor_name = ?, donor_email = ?, donor_phone = ?, amount = ?, donation_type = ?, 
          payment_method = ?, transaction_id = ?, status = ?, notes = ?
      WHERE id = ?
    `;

    await query(sql, [
      donor_name,
      donor_email || null,
      donor_phone,
      parseFloat(amount),
      donation_type,
      payment_method,
      transaction_id,
      status,
      notes || null,
      id
    ]);

    if (req.user) {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details) VALUES (?, ?, ?, ?)',
        [req.user.id, req.user.name, 'UPDATE_DONATION', `Updated donation #${id} for ${donor_name}`]
      );
    }

    res.json({ success: true, message: 'Donation updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM donations WHERE id = ?', [id]);

    if (req.user) {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details) VALUES (?, ?, ?, ?)',
        [req.user.id, req.user.name, 'DELETE_DONATION', `Deleted donation #${id}`]
      );
    }

    res.json({ success: true, message: 'Donation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendReceiptEmail = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const donations = await query('SELECT * FROM donations WHERE id = ?', [id]);
    if (!donations || donations.length === 0) {
      return res.status(404).json({ success: false, message: 'Donation record not found' });
    }
    const donation = donations[0];

    const recipientEmail = (req.body && req.body.email && req.body.email.trim()) || donation.donor_email;
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'No recipient email address found. Please enter an email to send the receipt.'
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.'
      });
    }

    // Check if SMTP credentials are configured in backend/.env
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').trim();
    if (!smtpUser || !smtpPass) {
      return res.status(400).json({
        success: false,
        needsConfig: true,
        message: 'SMTP credentials missing in backend/.env. Please configure SMTP_USER and SMTP_PASS (Gmail App Password) to deliver receipts to donor inboxes.'
      });
    }

    // Update donor email in database if newly provided or updated
    if (req.body && req.body.email && req.body.email.trim() !== donation.donor_email) {
      donation.donor_email = req.body.email.trim();
      await query('UPDATE donations SET donor_email = ? WHERE id = ?', [donation.donor_email, id]);
    }

    const emailResult = await emailService.sendDonationReceipt(donation, recipientEmail);

    if (req.user) {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details) VALUES (?, ?, ?, ?)',
        [
          req.user.id,
          req.user.name,
          'SEND_RECEIPT_EMAIL',
          `Sent donation receipt #${donation.receipt_number || donation.id} to ${recipientEmail}`
        ]
      );
    }

    res.json({
      success: true,
      message: `Donation receipt successfully delivered to ${recipientEmail}`,
      messageId: emailResult.messageId
    });
  } catch (error) {
    console.error('Send receipt email error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send receipt email' });
  }
};

exports.getPublicReceipt = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const donations = await query('SELECT * FROM donations WHERE id = ?', [id]);
    if (!donations || donations.length === 0) {
      return res.status(404).send('<div style="font-family:sans-serif; text-align:center; padding:50px;"><h2>Receipt Not Found</h2><p>This donation receipt record does not exist or has been removed.</p></div>');
    }
    const donation = donations[0];

    const receiptNo = donation.receipt_number || `ART-${donation.id}`;
    const formattedAmount = Number(donation.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const dateStr = donation.created_at
      ? new Date(donation.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n) => {
      let str = '';
      if (n >= 10000000) { str += inWords(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
      if (n >= 100000) { str += inWords(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
      if (n >= 1000) { str += inWords(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
      if (n >= 100) { str += inWords(Math.floor(n / 100)) + ' Hundred '; n %= 100; }
      if (n > 0) {
        if (str !== '') str += 'and ';
        if (n < 20) str += a[n] + ' ';
        else str += b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
      }
      return str.trim();
    };
    const words = inWords(Math.floor(donation.amount)) + ' Rupees Only';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Receipt ${receiptNo} - Ar Rahman Trust</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <link rel="icon" type="image/png" href="https://ik.imagekit.io/baaidzoik/assets/header-logo/ar_logo_1.png">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    body { 
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
      background: #f1f5f9; 
      padding: 20px 10px; 
      margin: 0; 
      color: #1e293b;
    }
    .receipt-container {
      max-width: 760px;
      margin: 0 auto;
    }
    .receipt-card { 
      background: #ffffff; 
      border: 2px solid #0F3D63; 
      border-radius: 12px; 
      padding: 28px; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
      box-sizing: border-box;
      width: 100%;
    }
    @media (max-width: 576px) {
      body { padding: 10px 6px; }
      .receipt-card { 
        padding: 14px !important; 
        border-width: 1.5px !important; 
        border-radius: 8px !important; 
      }
      .actions-bar { flex-direction: column !important; width: 100%; }
      .actions-bar .btn { width: 100%; margin-bottom: 6px; }
    }
    @media print {
      body { background: #fff !important; padding: 0 !important; }
      body * { visibility: hidden !important; }
      .receipt-card, .receipt-card * { visibility: visible !important; }
      .receipt-card { 
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        border: 2px solid #0F3D63 !important; 
        box-shadow: none !important; 
        max-width: 100% !important; 
        width: 100% !important;
        margin: 0 !important; 
        padding: 20px !important;
      }
      .no-print { display: none !important; }
      @page { size: A4 portrait; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="d-flex justify-content-between align-items-center mb-3 no-print actions-bar gap-2">
      <a href="http://localhost:4200" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-arrow-left me-1"></i> Ar Rahman Trust Portal
      </a>
      <div class="d-flex gap-2">
        <button class="btn btn-danger btn-sm px-3" onclick="downloadPdf()">
          <i class="bi bi-file-earmark-pdf-fill me-1"></i> Download PDF
        </button>
        <button class="btn btn-outline-secondary btn-sm px-3" onclick="window.print()">
          <i class="bi bi-printer me-1"></i> Print
        </button>
      </div>
    </div>

    <div id="receiptContent" class="receipt-card">
      <!-- Trust Header Branding -->
      <div class="text-center pb-3 border-bottom mb-3" style="border-bottom: 2px solid #e2e8f0 !important;">
        <img src="https://ik.imagekit.io/baaidzoik/assets/header-logo/ar_logo_1.png" alt="Ar Rahman Trust" height="54" class="mb-2" crossorigin="anonymous">
        <h2 class="fw-bold mb-0" style="color: #0F3D63; letter-spacing: 0.5px; font-size: clamp(19px, 4.5vw, 24px);">AR RAHMAN TRUST</h2>
        <div class="small fw-semibold mt-1" style="color: #475569; font-size: clamp(11px, 2.5vw, 13px);">Helping Needy People &bull; Pernambut &amp; Surrounding Rural Villages</div>
        <div class="small text-muted mt-1" style="font-size: clamp(9.5px, 2.2vw, 11px);">
          Registered Charity No. <strong style="color: #0F3D63;">04/16/2020</strong> &bull; 112, Small Mosque Street, Pernambut, Vellore Dist., Tamil Nadu - 635810
        </div>
        <div class="d-inline-block mt-2 px-3 py-1 text-uppercase fw-bold" style="background: #e8f5e9; color: #166534; font-size: 11px; border-radius: 20px; border: 1px solid #bbf7d0; letter-spacing: 0.5px;">
          Official Donation &amp; Zakat Receipt
        </div>
      </div>

      <!-- Receipt Meta Bar (Responsive 3-Column / Mobile Stack) -->
      <div class="row g-2 mb-3 p-2 rounded-2" style="background: #f8fafc; font-size: 13px; border: 1px solid #e2e8f0;">
        <div class="col-12 col-sm-4 text-center text-sm-start mb-1 mb-sm-0">
          <span class="text-muted" style="font-size: 11px;">Receipt Number:</span><br>
          <strong class="font-monospace text-primary fs-6">${receiptNo}</strong>
        </div>
        <div class="col-12 col-sm-4 text-center mb-1 mb-sm-0">
          <span class="text-muted" style="font-size: 11px;">Date of Contribution:</span><br>
          <strong class="text-dark">${dateStr}</strong>
        </div>
        <div class="col-12 col-sm-4 text-center text-sm-end">
          <span class="text-muted" style="font-size: 11px;">Financial Year:</span><br>
          <strong class="text-dark">2026 - 2027</strong>
        </div>
      </div>

      <!-- Donor Information Box (Responsive Columns) -->
      <div class="p-3 rounded-3 mb-3" style="background: #ffffff; border: 1px solid #cbd5e1;">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-sm-7 text-center text-sm-start">
            <div class="small text-muted text-uppercase fw-bold" style="font-size: 11px; letter-spacing: 0.5px;">Received with thanks from:</div>
            <div class="fw-bold fs-5 text-dark mt-1">${donation.donor_name}</div>
            <div class="small text-secondary"><i class="bi bi-telephone me-1"></i> ${donation.donor_phone}</div>
            ${donation.donor_email ? `<div class="small text-muted"><i class="bi bi-envelope me-1"></i> ${donation.donor_email}</div>` : ''}
          </div>
          <div class="col-12 col-sm-5 text-center text-sm-end mt-2 mt-sm-0">
            <div class="small text-muted text-uppercase fw-bold" style="font-size: 11px; letter-spacing: 0.5px;">Contribution Purpose:</div>
            <span class="badge text-uppercase fs-6 px-3 py-1 mt-1 bg-success">
              ${(donation.donation_type || 'General').toUpperCase()} DONATION
            </span>
            <div class="small text-muted mt-2">Mode: <strong class="text-uppercase text-dark">${(donation.payment_method || 'UPI').toUpperCase()}</strong></div>
            <div class="small font-monospace text-muted">Ref/UTR: ${donation.transaction_id || 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Amount Box (Fluid Typography for Mobile & Desktop) -->
      <div class="p-3 rounded-3 mb-3 text-center" style="background: #f0fdf4; border: 2px dashed #22c55e;">
        <div class="small text-uppercase fw-bold" style="color: #166534; font-size: 11px; letter-spacing: 0.5px;">Total Amount Received</div>
        <div class="fw-bold text-success my-1" style="font-size: clamp(24px, 5.5vw, 32px);">
          ₹${formattedAmount}
        </div>
        <div class="small fw-semibold text-uppercase" style="color: #15803d; letter-spacing: 0.5px; font-size: clamp(10px, 2.5vw, 12px);">
          ${words}
        </div>
      </div>

      <!-- Islamic Blessing -->
      <div class="p-2 mb-3 text-center rounded-2" style="background: #f8fafc; border-left: 4px solid #0F3D63; font-size: clamp(11px, 2.3vw, 12px); color: #334155; font-style: italic;">
        "May Allah (SWT) accept your noble donation, multiply your reward manifold, and grant continuous barakah in your wealth, health, and family. Jazakallahu Khairan."
      </div>

      <!-- Official Stamp & Signatory Footer (Responsive Row) -->
      <div class="row pt-3 border-top align-items-center" style="border-top: 1px solid #e2e8f0 !important;">
        <div class="col-12 col-sm-6 d-flex justify-content-center justify-content-sm-start mb-3 mb-sm-0">
          <div class="d-flex align-items-center gap-2">
            <div class="rounded-circle d-flex align-items-center justify-content-center text-success border border-2 border-success" style="width: 44px; height: 44px; background: #ecfdf5;">
              <i class="bi bi-shield-check fs-4"></i>
            </div>
            <div class="text-start">
              <div class="fw-bold text-success text-uppercase" style="font-size: 11px;">Verified &amp; Credited</div>
              <div class="text-muted" style="font-size: 10px;">Official Seal &bull; Regd. 04/16/2020</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 text-center text-sm-end">
          <div class="fw-bold" style="color: #0F3D63; font-size: 13px;">Authorized Signatory</div>
          <div class="text-muted small">Managing Trustee &bull; Pernambut</div>
          <div class="text-secondary" style="font-size: 10px;">Ar Rahman Trust, Vellore Dist.</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function downloadPdf() {
      const el = document.getElementById('receiptContent');
      const opt = {
        margin: [8, 8, 8, 8],
        filename: 'Ar_Rahman_Trust_Receipt_${receiptNo}.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(el).save().catch(function() {
        window.location.href = '/api/donations/${donation.id}/pdf';
      });
    }
  </script>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Get public receipt error:', error);
    res.status(500).send('<h2>Failed to generate receipt</h2>');
  }
};

exports.downloadReceiptPdf = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const donations = await query('SELECT * FROM donations WHERE id = ?', [id]);
    if (!donations || donations.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    const donation = donations[0];
    const receiptNo = donation.receipt_number || `ART-${donation.id}`;
    const fileName = `Ar_Rahman_Trust_Receipt_${receiptNo}.pdf`;
    const formattedAmount = Number(donation.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const dateStr = donation.created_at
      ? new Date(donation.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    // Number to words
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n) => {
      let str = '';
      if (n >= 10000000) { str += inWords(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
      if (n >= 100000) { str += inWords(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
      if (n >= 1000) { str += inWords(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
      if (n >= 100) { str += inWords(Math.floor(n / 100)) + ' Hundred '; n %= 100; }
      if (n > 0) {
        if (str !== '') str += 'and ';
        if (n < 20) str += a[n] + ' ';
        else str += b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
      }
      return str.trim();
    };
    const words = inWords(Math.floor(donation.amount || 0)) + ' Rupees Only';

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    doc.pipe(res);

    // Outer border
    doc.lineWidth(2).strokeColor('#0F3D63').rect(30, 30, 535, 782).stroke();
    doc.lineWidth(0.5).strokeColor('#cbd5e1').rect(34, 34, 527, 774).stroke();

    // Trust Logo
    if (cachedLogoBuffer) {
      try {
        doc.image(cachedLogoBuffer, 268, 45, { height: 46 });
        doc.y = 96;
      } catch (e) {
        doc.y = 55;
      }
    } else {
      doc.y = 55;
    }

    // Trust Header
    doc.fillColor('#0F3D63').fontSize(22).font('Helvetica-Bold').text('AR RAHMAN TRUST', 40, doc.y, { align: 'center' });
    doc.fillColor('#475569').fontSize(11).font('Helvetica').text('Helping Needy People • Pernambut & Surrounding Rural Villages', { align: 'center' });
    doc.fontSize(9).fillColor('#64748b').text('Registered Charity No. 04/16/2020  •  112, Small Mosque Street, Pernambut, Vellore Dist., Tamil Nadu - 635810', { align: 'center' });
    doc.moveDown(0.6);

    // Pill badge: Official Receipt
    doc.rect(170, doc.y, 255, 22).fillAndStroke('#e8f5e9', '#86efac');
    doc.fillColor('#166534').fontSize(10).font('Helvetica-Bold').text('OFFICIAL DONATION & ZAKAT RECEIPT', 170, doc.y - 17, { width: 255, align: 'center' });
    doc.moveDown(1.5);

    // Divider
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    // Receipt Meta Row
    const metaY = doc.y;
    doc.rect(50, metaY, 495, 36).fillAndStroke('#f8fafc', '#e2e8f0');
    
    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Receipt Number:', 65, metaY + 6);
    doc.fillColor('#0F3D63').fontSize(11).font('Helvetica-Bold').text(receiptNo, 65, metaY + 18);

    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Date of Contribution:', 240, metaY + 6);
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(dateStr, 240, metaY + 18);

    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Financial Year:', 430, metaY + 6);
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('2026 - 2027', 430, metaY + 18);

    doc.y = metaY + 48;

    // Donor & Purpose Box
    const donorY = doc.y;
    doc.rect(50, donorY, 495, 110).fillAndStroke('#ffffff', '#cbd5e1');

    doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('RECEIVED WITH THANKS FROM:', 65, donorY + 12);
    doc.fillColor('#0F3D63').fontSize(15).font('Helvetica-Bold').text(donation.donor_name || 'Anonymous Donor', 65, donorY + 28);
    doc.fillColor('#475569').fontSize(10).font('Helvetica').text(`Mobile: ${donation.donor_phone || 'N/A'}`, 65, donorY + 52);
    if (donation.donor_email) {
      doc.text(`Email: ${donation.donor_email}`, 65, donorY + 68);
    }

    // Right side: Purpose & Payment info
    doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('CONTRIBUTION PURPOSE:', 330, donorY + 12);
    doc.rect(330, donorY + 28, 195, 22).fillAndStroke('#16a34a', '#15803d');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(`${(donation.donation_type || 'General').toUpperCase()} DONATION`, 330, donorY + 34, { width: 195, align: 'center' });
    
    doc.fillColor('#475569').fontSize(10).font('Helvetica').text(`Mode: ${(donation.payment_method || 'UPI').toUpperCase()}`, 330, donorY + 58);
    doc.text(`Ref/UTR: ${donation.transaction_id || 'N/A'}`, 330, donorY + 74);
    doc.text(`Status: ${(donation.status || 'Verified').toUpperCase()}`, 330, donorY + 90);

    doc.y = donorY + 125;

    // Total Amount Received Box
    const amountY = doc.y;
    doc.rect(50, amountY, 495, 78).fillAndStroke('#f0fdf4', '#22c55e');

    doc.fillColor('#166534').fontSize(10).font('Helvetica-Bold').text('TOTAL AMOUNT RECEIVED', 50, amountY + 10, { width: 495, align: 'center' });
    doc.fillColor('#15803d').fontSize(24).font('Helvetica-Bold').text(`Rs. ${formattedAmount}`, 50, amountY + 26, { width: 495, align: 'center' });
    doc.fillColor('#166534').fontSize(9.5).font('Helvetica-Bold').text(words.toUpperCase(), 50, amountY + 56, { width: 495, align: 'center' });

    doc.y = amountY + 95;

    // Islamic Dua
    const duaY = doc.y;
    doc.rect(50, duaY, 495, 42).fillAndStroke('#f8fafc', '#0F3D63');
    doc.fillColor('#334155').fontSize(9.5).font('Helvetica-Oblique').text('"May Allah (SWT) accept your noble donation, multiply your reward manifold, and grant continuous barakah in your wealth, health, and family. Jazakallahu Khairan."', 65, duaY + 12, { width: 465, align: 'center' });

    doc.y = duaY + 60;

    // Verification & Signatory Row
    const sigY = doc.y;
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, sigY).lineTo(545, sigY).stroke();

    // Seal
    doc.circle(95, sigY + 45, 24).lineWidth(2).strokeColor('#16a34a').stroke();
    doc.fillColor('#16a34a').fontSize(8).font('Helvetica-Bold').text('VERIFIED', 70, sigY + 38, { width: 50, align: 'center' });
    doc.fontSize(7).text('TRUST SEAL', 70, sigY + 48, { width: 50, align: 'center' });
    doc.fillColor('#15803d').fontSize(9).font('Helvetica-Bold').text('OFFICIAL RECORD', 130, sigY + 35);
    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Regd. 04/16/2020 • Pernambut', 130, sigY + 48);

    // Signatory
    doc.fillColor('#0F3D63').fontSize(11).font('Helvetica-Bold').text('Authorized Signatory', 360, sigY + 30, { width: 170, align: 'right' });
    doc.fillColor('#475569').fontSize(9).font('Helvetica').text('Managing Trustee • Pernambut', 360, sigY + 44, { width: 170, align: 'right' });
    doc.fillColor('#64748b').fontSize(8).text('Ar Rahman Trust, Vellore Dist.', 360, sigY + 56, { width: 170, align: 'right' });

    // Footer note
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text('Official Electronic Charity Receipt • Regd. Charity No. 04/16/2020 • Ar Rahman Trust, Pernambut • Helping Needy People', 50, 775, { width: 495, align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Failed to generate receipt PDF' });
  }
};
