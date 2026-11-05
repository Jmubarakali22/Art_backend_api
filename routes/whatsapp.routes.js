const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp.service');
const { query } = require('../config/db');
const PDFDocument = require('pdfkit');
const multer = require('multer');

// Memory storage for receiving exact PDF blobs from frontend
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

// Cache logo buffer for backend PDF fallback
let cachedLogoBuffer = null;
fetch('https://ik.imagekit.io/baaidzoik/assets/header-logo/ar_logo_1.png')
  .then(res => res.arrayBuffer())
  .then(buf => { cachedLogoBuffer = Buffer.from(buf); })
  .catch(err => console.error('Logo cache notice:', err.message));

// Helper to generate official PDF buffer (backend fallback)
const generatePdfBuffer = (donation) => {
  return new Promise((resolve, reject) => {
    try {
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
      const words = inWords(Math.floor(donation.amount || 0)) + ' Rupees Only';

      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

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
      reject(err);
    }
  });
};

// Check WhatsApp connection status
router.get('/status', (req, res) => {
  const status = whatsappService.getStatus();
  res.json({ success: true, data: status });
});

// Force restart connection or generate new QR
router.post('/connect', (req, res) => {
  whatsappService.init();
  res.json({ success: true, message: 'WhatsApp connection initiated', data: whatsappService.getStatus() });
});

// Logout WhatsApp
router.post('/logout', async (req, res) => {
  const result = await whatsappService.logout();
  res.json(result);
});

// Send PDF Receipt directly to donor's WhatsApp number
router.post('/send-pdf/:id', upload.single('pdf'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const donations = await query('SELECT * FROM donations WHERE id = ?', [id]);
    if (!donations || donations.length === 0) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const donation = donations[0];
    const targetPhone = req.body.phone || donation.donor_phone;

    if (!targetPhone) {
      return res.status(400).json({ success: false, message: 'Donor mobile number is required' });
    }

    const status = whatsappService.getStatus();
    if (!status.connected) {
      return res.status(400).json({
        success: false,
        requiresAuth: true,
        message: 'WhatsApp is not connected. Please scan the QR code to link WhatsApp first.',
        qr: status.qr
      });
    }

    const receiptNo = donation.receipt_number || `ART-${donation.id}`;
    const fileName = req.file?.originalname || `Ar_Rahman_Trust_Receipt_${receiptNo}.pdf`;
    const caption = `Official Donation Receipt ${receiptNo} - Ar Rahman Trust, Pernambut`;

    // 1. Use the EXACT rendered PDF buffer sent by frontend, or fallback to backend generator
    let pdfBuffer;
    if (req.file && req.file.buffer && req.file.buffer.length > 0) {
      pdfBuffer = req.file.buffer;
    } else {
      pdfBuffer = await generatePdfBuffer(donation);
    }

    // 2. Dispatch actual PDF file via WhatsApp directly to donor's phone number
    await whatsappService.sendPdfReceipt(targetPhone, pdfBuffer, fileName, caption);

    res.json({
      success: true,
      message: `Official PDF receipt (${fileName}) sent directly to ${targetPhone} on WhatsApp!`
    });
  } catch (err) {
    console.error('Send WhatsApp PDF error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to send PDF receipt on WhatsApp'
    });
  }
});

// Default reminder message template
const getDefaultReminderMessage = () => `*AR RAHMAN TRUST - NOBLE CHARITY REMINDER*
_Helping Needy People • Pernambut & Surrounding Villages_
*Regd. Charity No:* 04/16/2020
----------------------------------------
Assalamu Alaikum wa Rahmatullahi wa Barakatuh *{name}*,

We pray this message reaches you and your family in good health and highest iman.

As Allah (SWT) reminds us in the Holy Quran:
_"The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes; in each spike is a hundred grains." (Al-Baqarah 2:261)_

Your noble past contributions have brought direct food, emergency medicine, and educational aid to needy families across Pernambut.

As our charity drives continue for this month, we humbly invite you to renew your noble contribution for:
🤲 *{cause}*

💳 *Trust Official Bank & UPI Details:*
• *Bank:* State Bank of India (Pernambut Branch)
• *Account Name:* Ar Rahman Trust
• *Account No:* 39485710293
• *IFSC Code:* SBIN0001824
• *UPI ID / GPay / PhonePe:* arrahmantrust@sbi
• *Registered Charity No:* 04/16/2020

"May Allah (SWT) accept your charity, grant immense barakah in your livelihood, and safeguard your family. Jazakallahu Khairan."

*Ar Rahman Trust, Pernambut*
📞 Inquiries / Office: +91 96290 88776`;

// Send WhatsApp Donation Reminder (Single or Multiple Bulk Donors)
router.post('/send-reminder', async (req, res) => {
  try {
    const { recipients, messageTemplate } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one donor recipient.' });
    }

    const status = whatsappService.getStatus();
    if (!status.connected) {
      return res.status(400).json({
        success: false,
        requiresAuth: true,
        message: 'WhatsApp is not connected on the server. Please link your WhatsApp device via QR code first.',
        qr: status.qr
      });
    }

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const phone = recipient.donor_phone || recipient.phone;
      const name = recipient.donor_name || recipient.name || 'Noble Donor';
      const cause = (recipient.donation_type || 'General Sadaqah & Welfare').toUpperCase();
      const amount = recipient.amount ? `₹${Number(recipient.amount).toLocaleString('en-IN')}` : '';

      if (!phone) {
        failedCount++;
        results.push({
          id: recipient.id,
          name,
          phone: 'N/A',
          status: 'failed',
          error: 'No phone number provided'
        });
        continue;
      }

      // Customize template placeholders for each donor
      let finalMessage = (messageTemplate && messageTemplate.trim()) || getDefaultReminderMessage();
      finalMessage = finalMessage
        .replace(/\{name\}/gi, name)
        .replace(/\{donor_name\}/gi, name)
        .replace(/\{cause\}/gi, cause)
        .replace(/\{amount\}/gi, amount)
        .replace(/\{phone\}/gi, phone);

      try {
        await whatsappService.sendTextMessage(phone, finalMessage);
        sentCount++;
        results.push({
          id: recipient.id,
          name,
          phone,
          status: 'sent'
        });

        // Delay 1.2s between messages when multiple to avoid WhatsApp rate limits
        if (recipients.length > 1 && i < recipients.length - 1) {
          await new Promise(r => setTimeout(r, 1200));
        }
      } catch (err) {
        console.error(`Failed to send reminder to ${name} (${phone}):`, err.message);
        failedCount++;
        results.push({
          id: recipient.id,
          name,
          phone,
          status: 'failed',
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Donation reminder delivery finished! Sent: ${sentCount}, Failed: ${failedCount}`,
      summary: {
        total: recipients.length,
        sent: sentCount,
        failed: failedCount
      },
      results
    });
  } catch (err) {
    console.error('Send WhatsApp Reminder error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to send WhatsApp reminder'
    });
  }
});

module.exports = router;
