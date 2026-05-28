const { PrismaClient } = require('@prisma/client'); // destructuring PrismaClient from prisma package
const bcrypt = require('bcryptjs'); // for hashing passwords
const jwt = require('jsonwebtoken'); // for creating auth tokens
const { sendOtpEmail } = require('../services/emailService');

const prisma = new PrismaClient();
// fallback secret for local dev, in production this comes from env vars
const JWT_SECRET = process.env.JWT_SECRET || 'amazon-clone-super-secret-key-2026';

// register — create new account
const register = async (req, res) => {
  try {
    // destructure fields from request body (sent by frontend)
    const { name, email, password, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // check if email is already taken
    // findUnique = prisma method that finds exactly one record by unique field
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 10 salt rounds for secure hashing
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

    // token valid for 7 days
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // 201 = HTTP "Created" status code
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

// login step 1 — check creds and send otp
const login = async (req, res) => {
  try {
    const { email, password, location } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // compare hashed pw
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // always gives 6 digits (100000-999999)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Date.now() = current ms + 10min in ms

    // upsert = update if exists, create if not
    await prisma.otpVerification.upsert({
      where: { email },
      update: { otp, expiresAt },
      create: { email, otp, expiresAt }
    });

    const result = await sendOtpEmail(email, otp, user.name);
    if (!result.success) {
      // fallback — if email fails, show otp on screen
      console.warn(`Email delivery failed for ${email}, returning OTP in response`);
      return res.json({ message: 'OTP generated (check below)', devOtp: otp });
    }

    res.json({ message: 'OTP sent successfully to your email' });
  } catch (error) {
    console.error('Login Step 1 error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// login step 2 — verify otp and issue token
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp, location } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Please provide email and OTP' });
    }

    // look up the otp we stored earlier
    const record = await prisma.otpVerification.findUnique({ where: { email } });
    if (!record) return res.status(400).json({ error: 'No OTP found for this email' });

    // expired? delete it and bail
    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.delete({ where: { email } });
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // wrong otp
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // grab user for the jwt payload
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // otp used, delete it
    await prisma.otpVerification.delete({ where: { email } });

    // token valid for 7 days
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // save location if user allowed it
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

// get logged-in user's profile
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }, // req.user was set by authMiddleware
      select: { // select = only fetch these fields (lighter than include)
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



module.exports = {
  register,
  login,
  verifyLoginOtp,
  getMe,
  sendOtp,
  verifyOtp,
  testEmailConfig
};

// ─── test email config ───────────────────────────────────────────────────────
async function testEmailConfig(req, res) {
  try {
    if (!process.env.BREVO_API_KEY) {
      return res.status(500).json({ 
        error: 'BREVO_API_KEY not set',
        fix: '1) Sign up free at https://app.brevo.com  2) Settings → SMTP & API → API Keys → Generate  3) Add BREVO_API_KEY to Render env vars'
      });
    }

    const { sendOtpEmail } = require('../services/emailService');
    const result = await sendOtpEmail('harshikagoyal05@gmail.com', '999999', 'Test');
    
    if (result.success) {
      res.json({ status: '✅ Email sent successfully via Brevo!' });
    } else {
      res.status(500).json({ error: 'Email failed', details: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Test failed', message: err.message });
  }
}

// ─── send otp (signup step 1) ────────────────────────────────────────────────
async function sendOtp(req, res) {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Name and email are required' });

    // make sure email isn't already taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists' });

    // always gives 6 digits (100000-999999)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // upsert = update if exists, create if not
    await prisma.otpVerification.upsert({
      where: { email },
      update: { otp, expiresAt },
      create: { email, otp, expiresAt }
    });

    const result = await sendOtpEmail(email, otp, name);
    if (!result.success) {
      // fallback — if email fails, show otp on screen
      console.warn(`Email delivery failed for ${email}, returning OTP in response`);
      return res.json({ message: 'OTP generated (check below)', devOtp: otp });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}

// ─── signup step 2 — verify otp and create account ──────────────────────────
async function verifyOtp(req, res) {
  try {
    const { name, email, password, location, otp } = req.body;
    if (!email || !otp || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // look up stored otp
    const record = await prisma.otpVerification.findUnique({ where: { email } });
    if (!record) return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });

    // expired? delete and reject
    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.delete({ where: { email } });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // wrong otp
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    // otp valid — now create the account
    // 10 salt rounds for secure hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, defaultAddress: location || null }
    });

    // otp used, clean up
    await prisma.otpVerification.delete({ where: { email } });

    // token valid for 7 days
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
