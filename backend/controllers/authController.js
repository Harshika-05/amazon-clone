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

// Login Step 1: Verify credentials and send OTP
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert into OtpVerification table
    await prisma.otpVerification.upsert({
      where: { email },
      update: { otp, expiresAt },
      create: { email, otp, expiresAt }
    });

    // Send OTP via email
    const result = await sendOtpEmail(email, otp, user.name);
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send OTP email: ' + result.error });
    }

    res.json({ message: 'OTP sent successfully to email' });
  } catch (error) {
    console.error('Login Step 1 error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Login Step 2: Verify OTP and return token
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp, location } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Please provide email and OTP' });
    }

    // Find OTP record
    const record = await prisma.otpVerification.findUnique({ where: { email } });
    if (!record) return res.status(400).json({ error: 'No OTP found for this email' });

    // Check expiry
    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.delete({ where: { email } });
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Check OTP match
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // Clean up the OTP record
    await prisma.otpVerification.delete({ where: { email } });

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
    console.error('Verify Login OTP error:', error);
    res.status(500).json({ error: 'Server error during login verification' });
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

// Ethereal removed, no preview needed

module.exports = {
  register,
  login,
  verifyLoginOtp,
  getMe,
  sendOtp,
  verifyOtp,
  testEmailConfig
};

// ─── Test Email Config ────────────────────────────────────────────────────────
async function testEmailConfig(req, res) {
  try {
    const { sendOtpEmail } = require('../services/emailService');
    
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ 
        error: 'RESEND_API_KEY not set',
        fix: 'Go to https://resend.com, sign up free, get API key, add to Render env vars'
      });
    }

    // Send a test OTP to confirm it works
    const result = await sendOtpEmail('harshikagoyal05@gmail.com', '123456', 'Test User');
    
    if (result.success) {
      res.json({ status: 'Success! Test email sent via Resend.' });
    } else {
      res.status(500).json({ error: 'Email failed', details: result.error });
    }
  } catch (err) {
    res.status(500).json({ 
      error: 'Email test failed', 
      message: err.message
    });
  }
}

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

    // Send OTP via email
    const result = await sendOtpEmail(email, otp, name);
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send OTP email: ' + result.error });
    }

    res.json({ message: 'OTP sent successfully' });
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
