const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../services/emailService');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'amazon-clone-super-secret-key-2026';

global.emailPreviews = global.emailPreviews || {};

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        defaultAddress: location || null
      }
    });

    // Create JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        defaultAddress: user.defaultAddress
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login existing user
const login = async (req, res) => {
  try {
    const { email, password, location } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Update location if provided
    let updatedAddress = user.defaultAddress;
    if (location) {
      await prisma.user.update({
        where: { id: user.id },
        data: { defaultAddress: location }
      });
      updatedAddress = location;
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        defaultAddress: updatedAddress
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        defaultAddress: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Email Preview Redirect ───────────────────────────────────────────────────
const getOtpPreview = (req, res) => {
  const { email } = req.params;
  const url = global.emailPreviews[`otp_${email}`];

  if (url) {
    return res.redirect(url);
  }

  // If email is still being generated, show a loading page that auto-refreshes
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="2">
        <title>Loading Email Preview...</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f3f3f3; margin: 0; }
          .loader { text-align: center; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #ff9900; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <h2>Generating OTP Email Preview...</h2>
          <p style="color: #666;">This may take a few seconds.</p>
        </div>
      </body>
    </html>
  `);
};

module.exports = {
  register,
  login,
  getMe,
  sendOtp,
  verifyOtp,
  getOtpPreview
};

// ─── Send OTP ────────────────────────────────────────────────────────────────
async function sendOtp(req, res) {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Name and email are required' });

    // Check if email is already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert into OtpVerification table
    await prisma.otpVerification.upsert({
      where: { email },
      update: { otp, expiresAt },
      create: { email, otp, expiresAt }
    });

    // Send OTP via email (non-blocking)
    sendOtpEmail(email, otp, name).then(({ previewUrl }) => {
      if (previewUrl) {
        global.emailPreviews[`otp_${email}`] = previewUrl;
      }
    }).catch(console.error);

    // Return instant redirect URL
    res.json({ 
      message: 'OTP sent successfully',
      previewUrl: `${req.protocol}://${req.get('host')}/api/auth/otp-preview/${email}`
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}

// ─── Verify OTP & Complete Registration ──────────────────────────────────────
async function verifyOtp(req, res) {
  try {
    const { name, email, password, location, otp } = req.body;
    if (!email || !otp || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find OTP record
    const record = await prisma.otpVerification.findUnique({ where: { email } });
    if (!record) return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });

    // Check expiry
    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.delete({ where: { email } });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check OTP match
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    // OTP valid — create the user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, defaultAddress: location || null }
    });

    // Clean up the OTP record
    await prisma.otpVerification.delete({ where: { email } });

    // Issue JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, defaultAddress: user.defaultAddress }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
}
