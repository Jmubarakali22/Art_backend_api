const nodemailer = require('nodemailer');

/**
 * Generate formatted responsive HTML template for official donation receipt
 */
function buildReceiptHtml(donation) {
  const receiptNo = donation.receipt_number || `ART-${donation.id}`;
  const formattedAmount = Number(donation.amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const dateStr = donation.created_at
    ? new Date(donation.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
  const donationType = (donation.donation_type || 'General').toUpperCase();
  const paymentMethod = (donation.payment_method || 'UPI').toUpperCase();
  const txnId = donation.transaction_id || 'N/A';
  const status = (donation.status || 'Verified').toUpperCase();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Receipt - ${receiptNo}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Trust Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F3D63 0%, #1e5c8e 100%); padding: 30px 25px; text-align: center; color: #ffffff;" align="center">
              <img src="https://ik.imagekit.io/baaidzoik/assets/header-logo/ar_logo_1.png" alt="Ar Rahman Trust" width="64" height="64" style="margin-bottom: 12px; display: block; border-radius: 50%; background: #ffffff; padding: 4px;">
              <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">AR RAHMAN TRUST</h1>
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #e2e8f0; font-weight: 500;">Helping Needy People &bull; Pernambut &amp; Surrounding Villages</p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">Regd. Charity No. <strong>04/16/2020</strong> &bull; 112, Small Mosque Street, Pernambut, Vellore Dist.</p>
            </td>
          </tr>

          <!-- Receipt Title Ribbon -->
          <tr>
            <td style="background-color: #f8fafc; padding: 14px 25px; border-bottom: 1px solid #e2e8f0; text-align: center;" align="center">
              <span style="display: inline-block; background-color: #e8f5e9; color: #166534; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.5px;">
                Official Donation &amp; Zakat Receipt
              </span>
            </td>
          </tr>

          <!-- Receipt Content Body -->
          <tr>
            <td style="padding: 25px 30px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #334155;">
                Dear <strong>${donation.donor_name}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Assalamu Alaikum wa Rahmatullahi wa Barakatuhu.<br>
                We gratefully acknowledge the receipt of your noble donation. Your contribution directly assists underprivileged families, medical relief patients, and orphan students in Pernambut.
              </p>

              <!-- Meta Table (Receipt No & Date) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b;" width="50%">
                    Receipt Number:<br>
                    <strong style="font-size: 15px; color: #0F3D63; font-family: monospace;">${receiptNo}</strong>
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; text-align: right;" width="50%" align="right">
                    Date Received:<br>
                    <strong style="font-size: 14px; color: #1e293b;">${dateStr}</strong>
                  </td>
                </tr>
              </table>

              <!-- Amount Highlight Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;" align="center">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #15803d; font-weight: 600;">Total Amount Received</span>
                    <div style="font-size: 32px; font-weight: 800; color: #15803d; margin: 4px 0;">₹${formattedAmount}</div>
                    <span style="font-size: 12px; color: #4b5563; font-family: monospace;">Ref / UTR: ${txnId}</span>
                  </td>
                </tr>
              </table>

              <!-- Donor & Contribution Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b;" width="40%">Donor Name:</td>
                  <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${donation.donor_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b;">Phone Number:</td>
                  <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${donation.donor_phone}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b;">Purpose / Category:</td>
                  <td style="padding: 10px 0; font-weight: 700; color: #0F3D63;">${donationType}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b;">Payment Mode:</td>
                  <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${paymentMethod}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b;">Verification Status:</td>
                  <td style="padding: 10px 0;">
                    <span style="display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                      ${status}
                    </span>
                  </td>
                </tr>
                ${donation.notes ? `
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">Notes:</td>
                  <td style="padding: 10px 0; color: #334155; font-style: italic;">${donation.notes}</td>
                </tr>
                ` : ''}
              </table>

              <!-- Du'a / Blessings Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-left: 4px solid #0F3D63; border-radius: 4px; padding: 14px 16px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; line-height: 1.6; color: #334155; font-style: italic;">
                    "May Allah (SWT) accept your noble donation, multiply your reward, and grant barakah in your wealth, health, and family. Jazakallahu Khairan."
                  </td>
                </tr>
              </table>

              <!-- Signatory Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <tr>
                  <td width="60%" style="font-size: 11px; color: #64748b;">
                    Computer generated electronic receipt.<br>
                    Issued on behalf of <strong>Ar Rahman Trust</strong>.
                  </td>
                  <td width="40%" align="right" style="text-align: right;">
                    <div style="font-weight: 700; font-size: 13px; color: #0F3D63;">Authorized Signatory</div>
                    <div style="font-size: 11px; color: #64748b;">Managing Trustee &bull; Pernambut</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Contact Info -->
          <tr>
            <td style="background-color: #0F3D63; padding: 20px; text-align: center; color: #cbd5e1; font-size: 12px; line-height: 1.6;" align="center">
              <strong style="color: #ffffff;">Ar Rahman Trust</strong> &bull; Pernambut, Vellore District, Tamil Nadu, India<br>
              Website: <a href="https://arrahmantrust.netlify.app" style="color: #38bdf8; text-decoration: none;">arrahmantrust.netlify.app</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send donation receipt email
 */
async function sendDonationReceipt(donation, recipientEmail) {
  if (!recipientEmail) {
    throw new Error('Recipient email address is required.');
  }

  const receiptNo = donation.receipt_number || `ART-${donation.id}`;
  const htmlContent = buildReceiptHtml(donation);

  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');

  if (!smtpUser || !smtpPass) {
    const err = new Error('SMTP credentials are not configured in backend/.env. Please set SMTP_USER and SMTP_PASS (Gmail App Password) to deliver receipts to real inboxes.');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  const isGmail = (process.env.SMTP_HOST || '').toLowerCase().includes('gmail') ||
                  smtpUser.toLowerCase().endsWith('@gmail.com');

  const transportOptions = isGmail
    ? {
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      }
    : {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      };

  const transporter = nodemailer.createTransport(transportOptions);

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Ar Rahman Trust" <${smtpUser}>`,
    to: recipientEmail,
    subject: `Official Donation Receipt [${receiptNo}] - Ar Rahman Trust`,
    text: `Dear ${donation.donor_name},\n\nThank you for your generous contribution of ₹${donation.amount} (${donation.donation_type}) to Ar Rahman Trust.\nReceipt Number: ${receiptNo}\nPayment Mode: ${donation.payment_method}\nTransaction Ref / UTR: ${donation.transaction_id || 'N/A'}\n\nMay Allah bless and reward you abundantly.\n\nAr Rahman Trust, Pernambut.`,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email Service] Receipt successfully delivered via SMTP to ${recipientEmail} (ID: ${info.messageId})`);

  return {
    success: true,
    messageId: info.messageId,
    deliveredTo: recipientEmail
  };
}

module.exports = {
  sendDonationReceipt,
  buildReceiptHtml
};
