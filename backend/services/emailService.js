const nodemailer = require('nodemailer');

/**
 * Email Service Module
 * 
 * Uses Ethereal (a fake SMTP service by Nodemailer) for testing.
 * Emails are not actually delivered but can be previewed via a URL.
 * 
 * To switch to a real provider (e.g., Gmail), replace the transporter
 * config with real SMTP credentials.
 */

let transporter = null;

/**
 * Initializes the Ethereal transporter.
 * Uses static credentials from env vars (fast) with fallback to createTestAccount (slow).
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  const user = process.env.ETHEREAL_USER;
  const pass = process.env.ETHEREAL_PASS;

  if (user && pass) {
    // Fast path: use pre-created credentials from environment variables
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user, pass },
    });
    console.log(`📧 Ethereal transporter ready (${user})`);
  } else {
    // Slow fallback: create a new test account via API
    const testAccount = await nodemailer.createTestAccount();
    console.log('═══════════════════════════════════════════════');
    console.log('📧 Ethereal Email Test Account Created:');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log('   ⚠️  Set ETHEREAL_USER and ETHEREAL_PASS env vars for faster emails');
    console.log('═══════════════════════════════════════════════');
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  return transporter;
};

/**
 * Formats a number as Indian Rupees.
 */
const formatINR = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

/**
 * Sends an order confirmation email.
 * 
 * @param {Object} options
 * @param {string} options.toEmail - Recipient email address
 * @param {string} options.orderId - The order ID
 * @param {Array}  options.items - Array of order items with product details
 * @param {number} options.totalAmount - Total order amount in INR
 * @param {string} options.shippingAddress - Shipping address string
 * @returns {Object} - { success, previewUrl }
 */
const sendOrderConfirmation = async ({ toEmail, orderId, items, totalAmount, shippingAddress }) => {
  try {
    const transport = await getTransporter();

    // Build items table rows
    const itemRows = items.map((item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${item.product?.name || 'Product'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          ${formatINR(item.priceAtPurchase)}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #eaeded;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          
          <!-- Header -->
          <div style="background-color: #131921; padding: 20px; text-align: center;">
            <span style="color: white; font-size: 28px; font-weight: bold;">
              amazon<span style="color: #ff9900;">.in</span>
            </span>
          </div>

          <!-- Success Banner -->
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-bottom: 3px solid #ddd;">
            <div style="color: #007600; font-size: 24px; margin-bottom: 5px;">✓ Order Confirmed!</div>
            <div style="color: #565959; font-size: 14px;">Thank you for your order.</div>
          </div>

          <!-- Order Details -->
          <div style="padding: 20px 30px;">
            <h2 style="font-size: 18px; color: #0F1111; margin-bottom: 15px;">Order Details</h2>
            
            <table style="width: 100%; margin-bottom: 10px; font-size: 14px; color: #565959;">
              <tr>
                <td style="padding: 4px 0;"><strong>Order ID:</strong></td>
                <td style="padding: 4px 0;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Shipping To:</strong></td>
                <td style="padding: 4px 0;">${shippingAddress}</td>
              </tr>
            </table>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
              <thead>
                <tr style="background-color: #F3F3F3;">
                  <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #0F1111;">Item</th>
                  <th style="padding: 10px 12px; text-align: center; font-weight: 700; color: #0F1111;">Qty</th>
                  <th style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0F1111;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <!-- Total -->
            <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid #131921;">
              <span style="font-size: 18px; font-weight: 700; color: #B12704;">
                Order Total: ${formatINR(totalAmount)}
              </span>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #F3F3F3; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p>This is an automated email from Amazon Clone.</p>
            <p>Please do not reply to this email.</p>
            <p style="margin-top: 10px;">© 2026 Amazon Clone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: '"Amazon Clone" <noreply@amazon-clone.com>',
      to: toEmail,
      subject: `Amazon Clone - Order Confirmation #${orderId.substring(0, 8)}`,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`📧 Order confirmation email sent! Preview: ${previewUrl}`);

    return { success: true, previewUrl };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { success: false, previewUrl: null };
  }
};

module.exports = { sendOrderConfirmation, sendOtpEmail, sendOrderCancellation };

/**
 * Sends an OTP verification email during signup.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} otp     - The 6-digit OTP code
 * @param {string} name    - Recipient's name
 */
async function sendOtpEmail(toEmail, otp, name) {
  try {
    const transport = await getTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#eaeded;">
        <div style="max-width:500px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background-color:#131921;padding:20px;text-align:center;">
            <span style="color:white;font-size:28px;font-weight:bold;">
              amazon<span style="color:#ff9900;">.in</span>
            </span>
          </div>

          <!-- Body -->
          <div style="padding:30px;">
            <h2 style="color:#0f1111;margin-top:0;">Verify your email address</h2>
            <p style="color:#565959;font-size:15px;">Hello <strong>${name}</strong>,</p>
            <p style="color:#565959;font-size:15px;">To complete your Amazon account registration, use the OTP below. It is valid for <strong>10 minutes</strong>.</p>

            <!-- OTP Box -->
            <div style="text-align:center;margin:30px 0;">
              <div style="display:inline-block;background:#f3f3f3;border:2px dashed #ff9900;border-radius:12px;padding:20px 40px;">
                <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#131921;">${otp}</div>
              </div>
            </div>

            <p style="color:#565959;font-size:13px;">If you did not request this, please ignore this email.</p>
          </div>

          <!-- Footer -->
          <div style="background:#f3f3f3;padding:15px;text-align:center;font-size:12px;color:#999;">
            <p>© 2026 Amazon Clone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: '"Amazon Clone" <noreply@amazon-clone.com>',
      to: toEmail,
      subject: `${otp} is your Amazon OTP`,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`📧 OTP email sent! OTP: ${otp} | Preview: ${previewUrl}`);

    return { success: true, previewUrl };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, previewUrl: null };
  }
}

/**
 * Sends an order cancellation confirmation email.
 */
async function sendOrderCancellation({ toEmail, orderId, items, totalAmount, reason }) {
  try {
    const transport = await getTransporter();

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
            <span style="color:white;font-size:28px;font-weight:bold;">
              amazon<span style="color:#ff9900;">.in</span>
            </span>
          </div>

          <div style="background-color:#fff4f4;padding:20px;text-align:center;border-bottom:3px solid #c40000;">
            <div style="color:#c40000;font-size:24px;margin-bottom:5px;">✕ Order Cancelled</div>
            <div style="color:#565959;font-size:14px;">Your order has been successfully cancelled.</div>
          </div>

          <div style="padding:20px 30px;">
            <table style="width:100%;margin-bottom:10px;font-size:14px;color:#565959;">
              <tr>
                <td style="padding:4px 0;"><strong>Order ID:</strong></td>
                <td style="padding:4px 0;">${orderId}</td>
              </tr>
              ${reason ? `<tr>
                <td style="padding:4px 0;"><strong>Reason:</strong></td>
                <td style="padding:4px 0;">${reason}</td>
              </tr>` : ''}
            </table>

            <table style="width:100%;border-collapse:collapse;margin-top:15px;font-size:14px;">
              <thead>
                <tr style="background-color:#F3F3F3;">
                  <th style="padding:10px 12px;text-align:left;font-weight:700;">Item</th>
                  <th style="padding:10px 12px;text-align:center;font-weight:700;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-weight:700;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <div style="text-align:right;margin-top:15px;padding-top:15px;border-top:2px solid #c40000;">
              <span style="font-size:16px;color:#565959;text-decoration:line-through;">
                Refund Amount: ${formatINR(totalAmount)}
              </span>
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
      from: '"Amazon Clone" <noreply@amazon-clone.com>',
      to: toEmail,
      subject: `Amazon Clone - Order #${orderId.substring(0, 8)} Cancelled`,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`📧 Cancellation email sent! Preview: ${previewUrl}`);
    return { success: true, previewUrl };
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
    return { success: false, previewUrl: null };
  }
}
