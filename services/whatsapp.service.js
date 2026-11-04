const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.qrCodeDataUrl = null;
    this.qrString = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
    this.connectedNumber = null;
    this.authFolder = path.join(__dirname, '..', 'whatsapp_auth');
    this.isInitializing = false;
  }

  async init() {
    if (this.isInitializing || this.status === 'connected') return;
    this.isInitializing = true;
    this.status = 'connecting';

    try {
      if (!fs.existsSync(this.authFolder)) {
        fs.mkdirSync(this.authFolder, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

      this.sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Ar Rahman Trust Admin', 'Chrome', '120.0.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrString = qr;
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
          } catch (e) {
            console.error('[WhatsApp] QR generation error:', e);
          }
          this.status = 'connecting';
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          this.status = 'disconnected';
          this.isInitializing = false;
          this.qrCodeDataUrl = null;
          this.connectedNumber = null;

          if (shouldReconnect) {
            setTimeout(() => this.init(), 6000);
          } else {
            try {
              fs.rmSync(this.authFolder, { recursive: true, force: true });
            } catch (err) { }
          }
        } else if (connection === 'open') {
          this.status = 'connected';
          this.isInitializing = false;
          this.qrCodeDataUrl = null;
          this.qrString = null;
          const userJid = this.sock.user?.id || '';
          this.connectedNumber = userJid.split(':')[0] || userJid.split('@')[0];
          console.log(`✅ [WhatsApp] Connected successfully as +${this.connectedNumber}`);
        }
      });
    } catch (err) {
      console.error('[WhatsApp] Initialization error:', err);
      this.status = 'disconnected';
      this.isInitializing = false;
    }
  }

  getStatus() {
    return {
      status: this.status,
      connected: this.status === 'connected',
      connectedNumber: this.connectedNumber,
      qr: this.qrCodeDataUrl
    };
  }

  async sendPdfReceipt(phone, pdfBuffer, fileName, caption) {
    if (this.status !== 'connected' || !this.sock) {
      throw new Error('WhatsApp is not connected on the server. Please scan the QR code to link your WhatsApp account once.');
    }

    let cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) cleanPhone = '91' + cleanPhone.substring(1);

    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Invalid mobile phone number provided for WhatsApp delivery.');
    }

    const jid = `${cleanPhone}@s.whatsapp.net`;

    const result = await this.sock.sendMessage(jid, {
      document: pdfBuffer,
      mimetype: 'application/pdf',
      fileName: fileName,
      caption: caption || 'Ar Rahman Trust Official Donation Receipt'
    });

    return result;
  }

  async logout() {
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch (e) { }
      this.sock = null;
    }
    this.status = 'disconnected';
    this.qrCodeDataUrl = null;
    this.connectedNumber = null;
    this.isInitializing = false;
    try {
      fs.rmSync(this.authFolder, { recursive: true, force: true });
    } catch (err) { }
    // Restart initialization for a new QR code
    this.init();
    return { success: true, message: 'Logged out successfully' };
  }
}

const instance = new WhatsAppService();
// Automatically start checking connection on server load
setTimeout(() => instance.init(), 1000);

module.exports = instance;
