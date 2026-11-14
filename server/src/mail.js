const nodemailer = require('nodemailer');

let transporter;

function createConsoleTransport() {
  // A minimal custom transport object nodemailer accepts via createTransport(transport).
  const transport = {
    name: 'console',
    version: '1.0.0',
    send(mail, callback) {
      const to = (mail.data && mail.data.to) || '';
      const from = (mail.data && mail.data.from) || '';
      const subject = (mail.data && mail.data.subject) || '';
      console.log('--------------------------------------------------');
      console.log('[mail] SEND EMAIL (console transport — no real email sent)');
      console.log('To:', to);
      console.log('From:', from);
      console.log('Subject:', subject);
      console.log('HTML body:');
      console.log(mail.html || mail.text || '(no body)');
      console.log('--------------------------------------------------');
      callback(null, { messageId: 'console-' + Date.now(), accepted: [to] });
    },
  };
  return nodemailer.createTransport(transport);
}

function createTransport() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (host && user && pass) {
    // Real SMTP
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user, pass },
    });
    console.log('[mail] Using SMTP transport:', host);
  } else {
    // Dev fallback: console transport (logs emails, sends nothing real)
    transporter = createConsoleTransport();
    console.log('[mail] No SMTP credentials configured. Using console transport (no real email sent).');
    console.log('[mail] Tip: set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env to send real email.');
  }
}

function getTransport() {
  if (!transporter) createTransport();
  return transporter;
}

async function sendMail(options) {
  const transport = getTransport();
  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || 'Newsletter Platform <newsletter@example.com>',
    ...options,
  });
  return info;
}

module.exports = { sendMail, createTransport, getTransport };
