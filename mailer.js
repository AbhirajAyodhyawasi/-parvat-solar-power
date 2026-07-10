const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;   // the Gmail address that sends the notification
const EMAIL_PASS = process.env.EMAIL_PASS;   // the 16-character Gmail App Password
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || EMAIL_USER; // where notifications are delivered

let transporter = null;
if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });
  console.log('Mailer: email notifications enabled (Gmail).');
} else {
  console.log('Mailer: EMAIL_USER/EMAIL_PASS not set - email notifications are disabled (leads still save fine).');
}

async function sendLeadNotification(lead) {
  if (!transporter) return; // silently skip if not configured

  const subject = `New Consultation Request - ${lead.name}`;
  const text = [
    `New consultation request received on Parvat Solar Power website.`,
    ``,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    lead.email ? `Email: ${lead.email}` : null,
    lead.city ? `City: ${lead.city}` : null,
    lead.service ? `Service Interested In: ${lead.service}` : null,
    lead.message ? `Message: ${lead.message}` : null,
    ``,
    `Submitted at: ${new Date(lead.createdAt).toLocaleString('en-IN')}`,
    ``,
    `View and manage all requests in your admin panel under "Consultation Requests".`
  ].filter(Boolean).join('\n');

  try {
    await transporter.sendMail({
      from: `"Parvat Solar Power Website" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject,
      text
    });
    console.log('Mailer: lead notification email sent.');
  } catch (err) {
    // Never let an email failure break the lead submission itself
    console.error('Mailer: failed to send lead notification email:', err.message);
  }
}

module.exports = { sendLeadNotification };
