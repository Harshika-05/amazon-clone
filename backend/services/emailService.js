const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER || 'harshikagoyal05@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'tfru etbe mrwh varj';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
  
  console.log(`📧 Gmail transporter ready (${GMAIL_USER})`);
  return transporter;
};

const formatINR = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

async function sendOtpEmail(toEmail, otp, name) {
  try {
    const transport = getTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#eaeded;">
        <div style="max-width:500px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color:#131921;padding:20px;text-align:center;">
            <span style="color:white;font-size:28px;font-weight:bold;">amazon<span style="color:#ff9900;">.in</span></span>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#0f1111;margin-top:0;">Verify your request</h2>
            <p style="color:#565959;font-size:15px;">Hello <strong>${name || 'Customer'}</strong>,</p>
            <p style="color:#565959;font-size:15px;">To complete your Amazon account request, use the OTP below. It is valid for <strong>10 minutes</strong>.</p>
            <div style="text-align:center;margin:30px 0;">
              <div style="display:inline-block;background:#f3f3f3;border:2px dashed #ff9900;border-radius:12px;padding:20px 40px;">
                <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#131921;">${otp}</div>
              </div>
            </div>
            <p style="color:#565959;font-size:13px;">If you did not request this, please ignore this email.</p>
          </div>
          <div style="background:#f3f3f3;padding:15px;text-align:center;font-size:12px;color:#999;">
            <p>© 2026 Amazon Clone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: `"Amazon Clone" <${GMAIL_USER}>`,
      to: toEmail,
      subject: `${otp} is your Amazon OTP`,
      html: htmlContent,
    });

    console.log(`📧 OTP email sent! OTP: ${otp}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error: error.message };
  }
}

const sendOrderConfirmation = async ({ toEmail, orderId, items, totalAmount, shippingAddress }) => {
  try {
    const transport = getTransporter();

    const itemRows = items.map((item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.product?.name || 'Product'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatINR(item.priceAtPurchase)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #eaeded;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background-color: #131921; padding: 20px; text-align: center;">
            <span style="color: white; font-size: 28px; font-weight: bold;">amazon<span style="color: #ff9900;">.in</span></span>
          </div>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-bottom: 3px solid #ddd;">
            <div style="color: #007600; font-size: 24px; margin-bottom: 5px;">✓ Order Confirmed!</div>
            <div style="color: #565959; font-size: 14px;">Thank you for your order.</div>
          </div>
          <div style="padding: 20px 30px;">
            <h2 style="font-size: 18px; color: #0F1111; margin-bottom: 15px;">Order Details</h2>
            <table style="width: 100%; margin-bottom: 10px; font-size: 14px; color: #565959;">
              <tr><td style="padding: 4px 0;"><strong>Order ID:</strong></td><td style="padding: 4px 0;">${orderId}</td></tr>
              <tr><td style="padding: 4px 0;"><strong>Shipping To:</strong></td><td style="padding: 4px 0;">${shippingAddress}</td></tr>
            </table>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
              <thead>
                <tr style="background-color: #F3F3F3;">
                  <th style="padding: 10px 12px; text-align: left; font-weight: 700;">Item</th>
                  <th style="padding: 10px 12px; text-align: center; font-weight: 700;">Qty</th>
                  <th style="padding: 10px 12px; text-align: right; font-weight: 700;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid #131921;">
              <span style="font-size: 18px; font-weight: 700; color: #B12704;">Order Total: ${formatINR(totalAmount)}</span>
            </div>
          </div>
          <div style="background-color: #F3F3F3; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p>This is an automated email from Amazon Clone. Please do not reply.</p>
            <p>© 2026 Amazon Clone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: `"Amazon Clone" <${GMAIL_USER}>`,
      to: toEmail,
      subject: `Amazon Clone - Order Confirmation #${orderId.substring(0, 8)}`,
      html: htmlContent,
    });

    console.log(`📧 Order confirmation email sent!`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

async function sendOrderCancellation({ toEmail, orderId, items, totalAmount, reason }) {
  try {
    const transport = getTransporter();

    const itemRows = items.map((item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;">${item.product?.name || 'Product'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${formatINR(item.priceAtPurchase)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#eaeded;">
        <div style="max-width:600px;margin:0 auto;background-color:white;">
          <div style="background-color:#131921;padding:20px;text-align:center;">
            <span style="color:white;font-size:28px;font-weight:bold;">amazon<span style="color:#ff9900;">.in</span></span>
          </div>
          <div style="background-color:#fff4f4;padding:20px;text-align:center;border-bottom:3px solid #c40000;">
            <div style="color:#c40000;font-size:24px;margin-bottom:5px;">✕ Order Cancelled</div>
            <div style="color:#565959;font-size:14px;">Your order has been successfully cancelled.</div>
          </div>
          <div style="padding:20px 30px;">
            <table style="width:100%;margin-bottom:10px;font-size:14px;color:#565959;">
              <tr><td style="padding:4px 0;"><strong>Order ID:</strong></td><td style="padding:4px 0;">${orderId}</td></tr>
              ${reason ? `<tr><td style="padding:4px 0;"><strong>Reason:</strong></td><td style="padding:4px 0;">${reason}</td></tr>` : ''}
            </table>
            <table style="width:100%;border-collapse:collapse;margin-top:15px;font-size:14px;">
              <thead>
                <tr style="background-color:#F3F3F3;">
                  <th style="padding:10px 12px;text-align:left;">Item</th>
                  <th style="padding:10px 12px;text-align:center;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <div style="text-align:right;margin-top:15px;padding-top:15px;border-top:2px solid #c40000;">
              <span style="font-size:16px;color:#565959;text-decoration:line-through;">Refund Amount: ${formatINR(totalAmount)}</span>
            </div>
            <p style="margin-top:20px;font-size:13px;color:#565959;">If you did not request this cancellation, please contact our support team immediately.</p>
          </div>
          <div style="background-color:#F3F3F3;padding:20px;text-align:center;font-size:12px;color:#999;">
            <p>© 2026 Amazon Clone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: `"Amazon Clone" <${GMAIL_USER}>`,
      to: toEmail,
      subject: `Amazon Clone - Order #${orderId.substring(0, 8)} Cancelled`,
      html: htmlContent,
    });

    console.log(`📧 Cancellation email sent!`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendOrderConfirmation, sendOtpEmail, sendOrderCancellation, getTransporter };
