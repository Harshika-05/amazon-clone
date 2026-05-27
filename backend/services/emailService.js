/**
 * Email Service — Brevo (formerly Sendinblue)
 * 
 * WHY BREVO?
 * ✅ HTTP API over HTTPS (port 443) — works on Render free tier
 * ✅ Can send to ANY email address — no domain verification needed
 * ✅ Free: 300 emails/day
 * ✅ No npm package needed — uses built-in fetch
 * 
 * WHY NOT GMAIL SMTP?  → Render blocks ports 465/587
 * WHY NOT RESEND?      → Free tier only sends to account owner's email
 * 
 * Setup:
 *   1. Sign up at https://app.brevo.com (free, use Google login)
 *   2. Go to Settings → SMTP & API → API Keys → Generate
 *   3. Add BREVO_API_KEY to Render environment variables
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'harshikagoyal05@gmail.com';
const SENDER_NAME = process.env.SENDER_NAME || 'Amazon Clone';

// Log on startup so we know if the key is loaded
if (BREVO_API_KEY) {
  console.log(`✅ BREVO_API_KEY loaded (${BREVO_API_KEY.substring(0, 12)}...)`);
} else {
  console.warn('⚠️ BREVO_API_KEY is NOT set — emails will not be sent, OTP shown on screen instead');
}

// format price in indian rupees
const formatINR = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

// generic email sender via brevo http api
async function sendEmail(to, subject, htmlContent) {
  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not set! Get one at https://app.brevo.com');
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  console.log(`📤 Sending email to ${to} | Subject: ${subject.substring(0, 40)}...`);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo API error:', JSON.stringify(data));
      return { success: false, error: data.message || JSON.stringify(data) };
    }

    console.log(`📧 Email sent to ${to} | messageId: ${data.messageId}`);
    return { success: true };
  } catch (err) {
    console.error('❌ sendEmail exception:', err.message);
    return { success: false, error: err.message };
  }
}

// send 6-digit otp for email verification
async function sendOtpEmail(toEmail, otp, name) {
  return sendEmail(toEmail, `${otp} is your Amazon Clone verification code`, `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#eaeded;">
      <div style="max-width:500px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="background:#131921;padding:20px;text-align:center;">
          <span style="color:white;font-size:28px;font-weight:bold;">amazon<span style="color:#ff9900;">.in</span></span>
        </div>
        <div style="padding:30px;">
          <h2 style="color:#0f1111;margin-top:0;">Verify your email address</h2>
          <p style="color:#565959;font-size:15px;">Hello <strong>${name || 'Customer'}</strong>,</p>
          <p style="color:#565959;font-size:15px;">Use the OTP below to complete your request. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:30px 0;">
            <div style="display:inline-block;background:#f3f3f3;border:2px dashed #ff9900;border-radius:12px;padding:20px 40px;">
              <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#131921;">${otp}</div>
            </div>
          </div>
          <p style="color:#565959;font-size:13px;">If you did not request this, please ignore this email.</p>
        </div>
        <div style="background:#f3f3f3;padding:15px;text-align:center;font-size:12px;color:#999;">
          <p style="margin:0;">© 2026 Amazon Clone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `);
}

// send order confirmed email with item table
async function sendOrderConfirmation({ toEmail, orderId, items, totalAmount, shippingAddress }) {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #eee;">${item.product?.name || 'Product'}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${formatINR(item.priceAtPurchase)}</td>
    </tr>
  `).join('');

  return sendEmail(toEmail, `Order Confirmed #${orderId.substring(0, 8)} — Amazon Clone`, `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#eaeded;">
      <div style="max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#131921;padding:20px;text-align:center;">
          <span style="color:white;font-size:28px;font-weight:bold;">amazon<span style="color:#ff9900;">.in</span></span>
        </div>
        <div style="background:#f0f0f0;padding:20px;text-align:center;border-bottom:3px solid #ddd;">
          <div style="color:#007600;font-size:24px;margin-bottom:5px;">✓ Order Confirmed!</div>
          <div style="color:#565959;font-size:14px;">Thank you for your order.</div>
        </div>
        <div style="padding:20px 30px;">
          <h2 style="font-size:18px;color:#0F1111;">Order Details</h2>
          <table style="width:100%;font-size:14px;color:#565959;margin-bottom:10px;">
            <tr><td style="padding:4px 0;"><strong>Order ID:</strong></td><td>${orderId}</td></tr>
            <tr><td style="padding:4px 0;"><strong>Shipping To:</strong></td><td>${shippingAddress}</td></tr>
          </table>
          <table style="width:100%;border-collapse:collapse;margin-top:15px;font-size:14px;">
            <thead>
              <tr style="background:#F3F3F3;">
                <th style="padding:10px 12px;text-align:left;">Item</th>
                <th style="padding:10px 12px;text-align:center;">Qty</th>
                <th style="padding:10px 12px;text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="text-align:right;margin-top:15px;padding-top:15px;border-top:2px solid #131921;">
            <span style="font-size:18px;font-weight:700;color:#B12704;">Total: ${formatINR(totalAmount)}</span>
          </div>
        </div>
        <div style="background:#F3F3F3;padding:20px;text-align:center;font-size:12px;color:#999;">
          <p style="margin:0;">© 2026 Amazon Clone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `);
}

// send cancellation email with refund info
async function sendOrderCancellation({ toEmail, orderId, items, totalAmount, reason }) {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${item.product?.name || 'Product'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${formatINR(item.priceAtPurchase)}</td>
    </tr>
  `).join('');

  return sendEmail(toEmail, `Order Cancelled #${orderId.substring(0, 8)} — Amazon Clone`, `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#eaeded;">
      <div style="max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#131921;padding:20px;text-align:center;">
          <span style="color:white;font-size:28px;font-weight:bold;">amazon<span style="color:#ff9900;">.in</span></span>
        </div>
        <div style="background:#fff4f4;padding:20px;text-align:center;border-bottom:3px solid #c40000;">
          <div style="color:#c40000;font-size:24px;margin-bottom:5px;">✕ Order Cancelled</div>
          <div style="color:#565959;font-size:14px;">Your order has been cancelled.</div>
        </div>
        <div style="padding:20px 30px;">
          <table style="width:100%;font-size:14px;color:#565959;margin-bottom:10px;">
            <tr><td style="padding:4px 0;"><strong>Order ID:</strong></td><td>${orderId}</td></tr>
            ${reason ? `<tr><td style="padding:4px 0;"><strong>Reason:</strong></td><td>${reason}</td></tr>` : ''}
          </table>
          <table style="width:100%;border-collapse:collapse;margin-top:15px;font-size:14px;">
            <thead>
              <tr style="background:#F3F3F3;">
                <th style="padding:10px 12px;text-align:left;">Item</th>
                <th style="padding:10px 12px;text-align:center;">Qty</th>
                <th style="padding:10px 12px;text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="text-align:right;margin-top:15px;padding-top:15px;border-top:2px solid #c40000;">
            <span style="font-size:16px;color:#565959;text-decoration:line-through;">Refund: ${formatINR(totalAmount)}</span>
          </div>
        </div>
        <div style="background:#F3F3F3;padding:20px;text-align:center;font-size:12px;color:#999;">
          <p style="margin:0;">© 2026 Amazon Clone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `);
}

module.exports = { sendOtpEmail, sendOrderConfirmation, sendOrderCancellation };
