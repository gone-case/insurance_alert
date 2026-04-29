const twilio = require('twilio');
const nodemailer = require('nodemailer');
const NotificationLog = require('../models/NotificationLog');

// ── SMS via Twilio (Primary) ───────────────────────────────────────────────────
async function sendSMS(toPhone, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone  = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    return { success: false, error: 'Twilio SMS not configured' };
  }

  // Strip HTML tags for plain SMS text
  const plainText = message.replace(/<[^>]+>/g, '').trim();

  // Auto-prepend +91 for Indian numbers if it's 10 digits
  let formattedTo = toPhone.replace(/\s+/g, '');
  if (formattedTo.length === 10 && !formattedTo.startsWith('+')) {
    formattedTo = `+91${formattedTo}`;
  }

  try {
    const client = twilio(accountSid, authToken);
    const msg = await client.messages.create({
      body: plainText,
      from: fromPhone,
      to: formattedTo,
    });
    return { success: true, sid: msg.sid };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Email (Fallback) ──────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

async function sendEmail(subject, htmlBody) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { success: false, error: 'Email not configured' };
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject,
      html: htmlBody,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Main Notify (SMS first, fallback Email) ───────────────────────────────────
async function notify({ type, referenceId, agentId, customerName, policyNumber, phoneNumber, message, daysUntilDue }) {
  let channel = 'sms';
  let result = { success: false, error: 'No phone number provided' };

  // Attempt SMS to the agent's phone number
  if (phoneNumber) {
    result = await sendSMS(phoneNumber, message);
  }

  // Fallback to email (sent to the agent's configured inbox)
  if (!result.success) {
    const smsError = result.error; // Save SMS error
    channel = 'email';
    const emailHtml = `<div style="font-family:sans-serif;padding:20px;background:#f9fafb">
      <h2 style="color:#4338ca">Insurance Reminder</h2>
      <p style="white-space:pre-line;font-size:14px;color:#374151">${message.replace(/<[^>]+>/g, '')}</p>
      <hr style="margin:16px 0;border-color:#e5e7eb"/>
      <p style="font-size:12px;color:#9ca3af">
        SMS delivery failed: ${smsError || 'No phone provided'} — sent via email fallback.
      </p>
    </div>`;
    result = await sendEmail(`Insurance Reminder – ${customerName}`, emailHtml);
    
    // Combine errors if both fail
    if (!result.success) {
      result.error = `SMS Error: ${smsError} | Email Error: ${result.error}`;
    }
  }

  // Log every attempt
  await NotificationLog.create({
    type,
    referenceId,
    agentId,
    customerName,
    policyNumber,
    channel,
    status: result.success ? 'sent' : 'failed',
    message,
    errorDetails: result.error || undefined,
    twilioSid: result.sid || undefined,
    daysUntilDue,
  });

  return result;
}

module.exports = { notify, sendSMS, sendEmail };
